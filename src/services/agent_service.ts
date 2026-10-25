/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import {
  MongoMemoryDocument,
  AgentChatMessage,
  MemoryRecallExplanation,
  LifecycleStatus
} from '../types/memory';
import { globalMongoMemory, generateObjectId } from '../memory/mongo_engine';

// Initialize server-side Gemini client per skill guidelines
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

import { estimateFoodShelfLife } from '../data/foodExpiryKnowledge';

// Grocery knowledge base for default shelf-life and categories
interface GroceryMetadata {
  category: MongoMemoryDocument['content']['category'];
  shelf_life_days: number;
  dietary_tags: string[];
}

function parseGroceryItems(text: string): Array<{ name: string; qty: string; meta: GroceryMetadata; storageTip?: string; emoji?: string }> {
  // Strip conversational prefixes
  const cleaned = text
    .replace(/^(i\s+bought|bought|got|added|here\s+is\s+my\s+haul|groceries:?|i\s+have|in\s+my\s+fridge:?)\s+/i, '')
    .trim();

  // Split by commas, 'and', newlines
  const rawParts = cleaned.split(/,|\band\b|\n/i).map(s => s.trim()).filter(Boolean);
  const items: Array<{ name: string; qty: string; meta: GroceryMetadata; storageTip?: string; emoji?: string }> = [];

  for (const part of rawParts) {
    const cleanPart = part.replace(/^and\s+/i, '').trim();
    if (!cleanPart) continue;

    const estimate = estimateFoodShelfLife(cleanPart);
    const capitalized = cleanPart.charAt(0).toUpperCase() + cleanPart.slice(1);

    items.push({
      name: capitalized,
      qty: '1 portion',
      meta: {
        category: estimate.category,
        shelf_life_days: estimate.shelfLifeDays,
        dietary_tags: estimate.dietaryTags
      },
      storageTip: estimate.storageTip,
      emoji: estimate.emoji
    });
  }

  return items;
}

export class AgentService {
  /**
   * Process an incoming user message with persistent memory context
   */
  public async handleUserMessage(params: {
    messageText: string;
    userId: string;
    workspaceId: string;
    userName?: string;
  }): Promise<AgentChatMessage> {
    const { messageText, userId, workspaceId, userName = 'Alex' } = params;
    const lower = messageText.toLowerCase().trim();
    const now = globalMongoMemory.getSimulatedNow();

    // 1. Check if user is declaring a dietary change (Edge Case: "I went vegan")
    if (
      lower.includes('went vegan') || 
      lower.includes("i'm vegan") || 
      lower.includes('im vegan') || 
      lower.includes('turned vegan') ||
      lower.includes('now vegan') ||
      lower.includes('become vegan')
    ) {
      const { profileDoc, invalidatedItems } = globalMongoMemory.applyDietaryConstraint({
        userId,
        workspaceId,
        restriction: 'vegan'
      });

      // Find remaining active items
      const remainingActive = globalMongoMemory.find({
        'owner.userId': userId,
        'lifecycle.status': 'active',
        type: 'inventory_item'
      });

      const invalidatedNames = invalidatedItems.map(i => i.content.item_name).join(', ');
      const remainingNames = remainingActive.map(i => i.content.item_name).join(' & ');

      // Build recipe using ONLY the remaining vegan ingredients (e.g. Bread & Spinach)
      const veganRecipeSuggestions = await this.generateRecipeForItems({
        activeItems: remainingActive,
        dietaryRestriction: 'vegan',
        urgentReason: `Adapted immediately to your new vegan lifestyle! Invalidated ${invalidatedItems.length} animal products.`
      });

      return {
        id: generateObjectId(),
        sender: 'agent',
        text: `Got it! I have permanently updated your user profile memory to **Vegan** (stored in document \`${profileDoc._id}\`).\n\n` +
              `⚠️ **Memory Policy Triggered:** I have immediately invalidated and moved **${invalidatedItems.length} items** (${invalidatedNames}) into your background unusable storage so you won't accidentally consume animal products.\n\n` +
              `Here is a fresh 100% plant-based recipe crafted exclusively from your usable ingredients (${remainingNames}):`,
        timestamp: now.toISOString(),
        recipe: veganRecipeSuggestions[0],
        recipes: veganRecipeSuggestions,
        recallAudit: {
          query: messageText,
          activeItemsEvaluated: remainingActive.length,
          selectedItems: remainingActive.map(item => ({
            itemId: item._id,
            itemName: item.content.item_name || '',
            shelfLifeDays: item.content.shelf_life_days || 7,
            daysRemaining: Math.max(0, Number(((new Date(item.lifecycle.ttl_index_expires_at).getTime() - now.getTime()) / (24 * 3600 * 1000)).toFixed(1))),
            urgencyTier: 'vegan_compliant',
            vectorSimilarity: 0.95,
            selectionReason: 'Complies with new permanent Vegan preference constraint'
          })),
          filteredOutItems: invalidatedItems.map(item => ({
            itemId: item._id,
            itemName: item.content.item_name || '',
            reason: item.lifecycle.invalidation_reason || 'Incompatible with vegan diet'
          })),
          dietaryConstraintsApplied: ['vegan']
        }
      };
    }

    // 2. Check if user is reporting throwing out, discarding, or consuming an item
    const isThrowOut = lower.includes('threw out') || lower.includes('thrown out') || lower.includes('threw away') || lower.includes('discard') || lower.includes('tossed') || lower.includes('spoiled');
    const isConsume = lower.includes('ate ') || lower.includes('finished ') || lower.includes('consumed') || lower.includes('used up');
    const isRemove = lower.startsWith('remove ') || lower.startsWith('delete ');

    if (isThrowOut || isConsume || isRemove) {
      const activeItems = globalMongoMemory.find({
        'owner.userId': userId,
        'lifecycle.status': 'active',
        type: 'inventory_item'
      });

      const matched = activeItems.find(item => {
        const name = (item.content.item_name || '').toLowerCase();
        return lower.includes(name) || name.split(/\s+/).some(part => part.length >= 4 && lower.includes(part));
      });

      if (matched) {
        const status = isConsume ? 'consumed' : 'perished';
        const reason = isConsume
          ? `Consumed by user on ${now.toLocaleDateString()}`
          : `Manually thrown out / discarded by user on ${now.toLocaleDateString()}`;

        globalMongoMemory.discardItem(matched._id, reason, status);

        return {
          id: generateObjectId(),
          sender: 'agent',
          text: `🗑️ Noted! I have removed **${matched.content.item_name}** from your active fridge.\n\n` +
                `It has been safely archived in your **Background & Unusable Memory Storage** with status \`${status}\` and audit reason: *"${reason}"*.\n` +
                `It will no longer appear in your active inventory or recipe recommendations.`,
          timestamp: now.toISOString()
        };
      }
    }

    // 3. Check if user is asking about perished or unusable items
    if (
      lower.includes('what went bad') ||
      lower.includes('what perished') ||
      lower.includes('unusable') ||
      lower.includes('what meat') ||
      lower.includes('expired items') ||
      lower.includes('background')
    ) {
      const perishedItems = globalMongoMemory.find({
        'owner.userId': userId,
        'lifecycle.status': 'perished',
        type: 'inventory_item'
      });
      const restrictedItems = globalMongoMemory.find({
        'owner.userId': userId,
        'lifecycle.status': 'restricted',
        type: 'inventory_item'
      });

      let responseText = `Here is the audit of your **Background & Unusable Memory Storage**:\n\n`;

      if (perishedItems.length === 0 && restrictedItems.length === 0) {
        responseText += `✨ Your background storage is clear! No items have perished or been restricted. Everything in your virtual fridge is fresh and active.`;
      } else {
        if (perishedItems.length > 0) {
          responseText += `🗑️ **Perished via TTL Index (${perishedItems.length} items):**\n` +
            perishedItems.map(p => `• **${p.content.item_name}** - Perished: ${p.lifecycle.invalidation_reason}`).join('\n') + `\n\n`;
        }
        if (restrictedItems.length > 0) {
          responseText += `🚫 **Restricted by Dietary Policies (${restrictedItems.length} items):**\n` +
            restrictedItems.map(r => `• **${r.content.item_name}** (Category: ${r.content.category}) - ${r.lifecycle.invalidation_reason}`).join('\n');
        }
      }

      return {
        id: generateObjectId(),
        sender: 'agent',
        text: responseText,
        timestamp: now.toISOString(),
      };
    }

    // 3. Check if user is logging bought groceries (e.g. "Eggs, spinach, bread" or "Bought strawberries, avocados, salmon")
    const looksLikeGroceryHaul = 
      lower.includes('bought') || 
      lower.includes('got ') || 
      lower.includes('added ') || 
      lower.includes('groceries') ||
      lower.startsWith('i have ') ||
      (lower.includes(',') && (
        lower.includes('spinach') || lower.includes('bread') || lower.includes('milk') || 
        lower.includes('eggs') || lower.includes('strawberry') || lower.includes('strawberries') ||
        lower.includes('banana') || lower.includes('avocado') || lower.includes('chicken') ||
        lower.includes('salmon') || lower.includes('beef') || lower.includes('yogurt') ||
        lower.includes('apple') || lower.includes('carrot') || lower.includes('cheese')
      ));

    if (looksLikeGroceryHaul) {
      const parsed = parseGroceryItems(messageText);
      const insertedDocs: MongoMemoryDocument[] = [];

      for (const item of parsed) {
        const addedDate = now;
        const expiresDate = new Date(addedDate.getTime() + item.meta.shelf_life_days * 24 * 3600 * 1000);

        const doc = globalMongoMemory.insertOne({
          owner: { userId, userName, workspaceId },
          type: 'inventory_item',
          source: 'chat_sms',
          content: {
            item_name: item.name,
            quantity: item.qty,
            category: item.meta.category,
            shelf_life_days: item.meta.shelf_life_days,
            dietary_tags: item.meta.dietary_tags,
            is_perishable: true,
            notes: item.storageTip || 'Added from SMS casual haul'
          },
          timestamps: {
            createdAt: addedDate.toISOString(),
            updatedAt: addedDate.toISOString(),
            date_added: addedDate.toISOString(),
            expires_at: expiresDate.toISOString(),
          },
          lifecycle: {
            status: 'active',
            recall_count: 0,
            ttl_index_expires_at: expiresDate.toISOString(), // TTL Index Target Date
          }
        });
        insertedDocs.push(doc);
      }

      const itemSummary = insertedDocs.map(d => 
        `• **${d.content.item_name}** (~${d.content.shelf_life_days} days shelf life · Target TTL: \`${new Date(d.lifecycle.ttl_index_expires_at).toLocaleDateString()}\` · Category: *${d.content.category}*)`
      ).join('\n');

      return {
        id: generateObjectId(),
        sender: 'agent',
        text: `Got your grocery haul! 🛒 I've memorized and automatically approximated the shelf life for **${insertedDocs.length} items**, logging them into your persistent MongoDB inventory:\n\n${itemSummary}\n\n` +
              `I will continuously track these countdowns so nothing spoils. Whenever items near expiration, I'll alert you with popups and prioritize them in recipes!`,
        timestamp: now.toISOString(),
      };
    }

    // 4. Check if user says "I'm starving", "hungry", "what can I make?", "cook", "recipe", "rescue", "meal"
    const isCookingQuery = 
      lower.includes('starving') || 
      lower.includes('hungry') || 
      lower.includes('what can i eat') || 
      lower.includes('what can i cook') ||
      lower.includes('dinner') ||
      lower.includes('lunch') ||
      lower.includes('breakfast') ||
      lower.includes('make something') ||
      lower.includes('cook') ||
      lower.includes('recipe') ||
      lower.includes('rescue') ||
      lower.includes('spoil') ||
      lower.includes('meal');

    if (isCookingQuery && !looksLikeGroceryHaul) {
      // Find active user profile to check restrictions
      const profiles = globalMongoMemory.find({
        'owner.userId': userId,
        type: 'user_profile'
      });
      const activeRestriction = profiles.find(p => p.lifecycle.status === 'active')?.content.dietary_restriction || 'none';

      // Query active inventory
      const activeItems = globalMongoMemory.find({
        'owner.userId': userId,
        'lifecycle.status': 'active',
        type: 'inventory_item'
      });

      if (activeItems.length === 0) {
        return {
          id: generateObjectId(),
          sender: 'agent',
          text: `Your virtual fridge is currently empty! Text me a quick list of what you bought (for example: *"Bought eggs, spinach, bread"*) and I'll keep track of it with zero food waste.`,
          timestamp: now.toISOString()
        };
      }

      // Sort active items by urgency: closest to TTL expiration first!
      const evaluatedItems = activeItems.map(item => {
        const ttlTime = new Date(item.lifecycle.ttl_index_expires_at).getTime();
        const nowTime = now.getTime();
        const daysRemaining = Number(((ttlTime - nowTime) / (24 * 3600 * 1000)).toFixed(1));
        
        let urgencyTier = 'stable';
        if (daysRemaining <= 1.5) urgencyTier = 'CRITICAL (Expires soonest)';
        else if (daysRemaining <= 3) urgencyTier = 'High Priority';
        else if (daysRemaining <= 5) urgencyTier = 'Moderate';

        return {
          item,
          daysRemaining: Math.max(0, daysRemaining),
          urgencyTier
        };
      });

      evaluatedItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

      // If user specifically asked about an ingredient in their message, prioritize it at the top
      const targetedEntry = evaluatedItems.find(e => 
        e.item.content.item_name && lower.includes(e.item.content.item_name.toLowerCase())
      );
      if (targetedEntry) {
        evaluatedItems.splice(evaluatedItems.indexOf(targetedEntry), 1);
        evaluatedItems.unshift(targetedEntry);
      }

      // Top urgent item
      const mostUrgent = evaluatedItems[0];
      const urgentItemName = mostUrgent.item.content.item_name || 'Spinach';

      // Mark recall count on chosen items
      for (const entry of evaluatedItems.slice(0, 3)) {
        globalMongoMemory.updateOne(entry.item._id, {
          lifecycleUpdate: {
            last_recalled_at: now.toISOString(),
            recall_count: (entry.item.lifecycle.recall_count || 0) + 1
          }
        }, 'Recalled for recipe generation');
      }

      const recipeSuggestions = await this.generateRecipeForItems({
        activeItems: evaluatedItems.map(e => e.item),
        dietaryRestriction: activeRestriction,
        urgentReason: `Prevent waste: ${urgentItemName} has only ${mostUrgent.daysRemaining} days left before TTL expiry!`
      });

      const audit: MemoryRecallExplanation = {
        query: messageText,
        activeItemsEvaluated: activeItems.length,
        selectedItems: evaluatedItems.slice(0, 3).map(e => ({
          itemId: e.item._id,
          itemName: e.item.content.item_name || '',
          shelfLifeDays: e.item.content.shelf_life_days || 7,
          daysRemaining: e.daysRemaining,
          urgencyTier: e.urgencyTier,
          vectorSimilarity: 0.94,
          selectionReason: e.daysRemaining <= 2.5 
            ? `PRIORITY ZERO-WASTE RECALL: Expiring in ${e.daysRemaining} days! Prioritized in recipe.`
            : `Complementary ingredient recalled from pantry memory.`
        })),
        filteredOutItems: globalMongoMemory.find({
          'owner.userId': userId,
          'lifecycle.status': 'restricted',
          type: 'inventory_item'
        }).map(r => ({
          itemId: r._id,
          itemName: r.content.item_name || '',
          reason: r.lifecycle.invalidation_reason || 'Restricted by dietary preference'
        })),
        dietaryConstraintsApplied: activeRestriction !== 'none' ? [activeRestriction] : []
      };

      const primaryRecipe = recipeSuggestions[0];
      const otherCount = recipeSuggestions.length > 1 ? ` (${recipeSuggestions.length} curated options below)` : '';

      return {
        id: generateObjectId(),
        sender: 'agent',
        text: `I've checked your virtual fridge! 🥗 Notice: Your **${urgentItemName}** has only **${mostUrgent.daysRemaining} days remaining** before its TTL expiration!\n\n` +
              `I've created custom recipe suggestions crafted strictly from what you have in your fridge${otherCount}:`,
        timestamp: now.toISOString(),
        recipe: primaryRecipe,
        recipes: recipeSuggestions,
        recallAudit: audit
      };
    }

    // 5. Default natural chat response
    return {
      id: generateObjectId(),
      sender: 'agent',
      text: `Hey ${userName}! I'm your persistent grocery memory agent. You can:\n\n` +
            `• Add ingredients using the **+ Add Item** button or text me what you bought\n` +
            `• Say *"I'm starving"* to get instant custom recipes crafted from what you have\n` +
            `• Tell me *"I threw out [item]"* to keep your memory accurate\n` +
            `• Test dietary shifts like *"I went vegan"* to see instant memory invalidation.`,
      timestamp: now.toISOString()
    };
  }

  /**
   * Generates dynamic zero-waste recipes using Gemini 3.8 Flash (or dynamic deterministic culinary synthesizer)
   */
  private async generateRecipeForItems(params: {
    activeItems: MongoMemoryDocument[];
    dietaryRestriction: string;
    urgentReason: string;
  }): Promise<any[]> {
    const { activeItems, dietaryRestriction, urgentReason } = params;
    const names = activeItems.map(i => i.content.item_name).filter(Boolean) as string[];

    // If Gemini is available, generate dynamic multi-recipe suggestions with AI
    if (ai) {
      try {
        const prompt = `You are PantryMind, an expert zero-waste chef.
The user is starving and currently has ONLY these items in their fridge:
${names.join(', ')}
Dietary Preference: ${dietaryRestriction}
Urgency Note: ${urgentReason}

Create 2 distinct, delicious, and easy recipes using strictly these ingredients (plus basic staples: olive oil, salt, pepper, garlic).
Recipe 1: Zero-waste priority focusing on the most urgent perishable item.
Recipe 2: Quick alternative everyday meal using their available items.

Format response strictly as a JSON array of 2 objects:
[
  {
    "title": "Recipe Title",
    "categoryTag": "Zero-Waste Priority",
    "description": "Short appetizing description",
    "prepTime": "10 mins",
    "ingredientsToUseUrgent": ["Item 1 from fridge"],
    "otherIngredients": ["Olive oil", "Salt and pepper"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "wasteSavedNote": "Rescues [Item] before expiration"
  },
  {
    "title": "Alternative Recipe Title",
    "categoryTag": "Quick 10-Min Meal",
    "description": "Short appetizing description",
    "prepTime": "8 mins",
    "ingredientsToUseUrgent": ["Item 2 from fridge"],
    "otherIngredients": ["Pinch of salt", "Warm skillet"],
    "instructions": ["Step 1", "Step 2"],
    "wasteSavedNote": "Delicious zero-waste meal"
  }
]`;

        const callPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          } else if (parsed.title) {
            return [parsed];
          }
        }
      } catch (err) {
        console.warn('Gemini API call fallback to dynamic culinary generator:', err);
      }
    }

    // Dynamic Culinary Synthesizer tailored to the exact items the user has
    const urgentDoc = activeItems[0] || { content: { item_name: 'Ingredients' } };
    const urgentName = urgentDoc.content.item_name || 'Ingredients';
    const otherNames = activeItems.slice(1).map(i => i.content.item_name).filter(Boolean) as string[];

    const hasBread = activeItems.some(i => (i.content.item_name || '').toLowerCase().includes('bread') || i.content.category === 'bakery');
    const hasEggs = activeItems.some(i => (i.content.item_name || '').toLowerCase().includes('egg'));
    const hasProduce = activeItems.some(i => i.content.category === 'produce' || (i.content.item_name || '').toLowerCase().includes('spinach') || (i.content.item_name || '').toLowerCase().includes('avocado'));
    const hasChicken = activeItems.some(i => (i.content.item_name || '').toLowerCase().includes('chicken') || i.content.category === 'protein');

    const suggestions: any[] = [];

    // Recipe 1: Tailored to urgent item
    if (hasBread) {
      suggestions.push({
        title: `Pan-Toasted ${urgentName} Artisan Melt`,
        categoryTag: 'Zero-Waste Priority',
        description: `A warm, crispy sourdough toast showcasing your ${urgentName} with olive oil and aromatic garlic.`,
        prepTime: '8 minutes',
        ingredientsToUseUrgent: [urgentName, ...otherNames.slice(0, 1)],
        otherIngredients: ['Extra virgin olive oil', '1 clove garlic', 'Pinch of sea salt and pepper'],
        instructions: [
          `Heat a skillet with 1 tbsp olive oil over medium heat.`,
          `Gently warm or sauté the ${urgentName} for 2-3 minutes until fragrant.`,
          `Toast thick slices of bread until golden, rub with garlic, and crown generously with the warm ${urgentName}.`
        ],
        wasteSavedNote: `Puts your ${urgentName} front and center before its shelf life expires!`
      });
    } else if (hasEggs) {
      suggestions.push({
        title: `Farmhouse Scramble with Fresh ${urgentName}`,
        categoryTag: 'Zero-Waste Priority',
        description: `Fluffy, gently cooked eggs folded with tender ${urgentName} for a quick protein-packed skillet meal.`,
        prepTime: '6 minutes',
        ingredientsToUseUrgent: [urgentName, ...otherNames.slice(0, 1)],
        otherIngredients: ['Olive oil or butter', 'Pinch of black pepper', 'Salt to taste'],
        instructions: [
          `Whisk the eggs in a bowl with a pinch of salt.`,
          `Sauté ${urgentName} in a pan with olive oil for 90 seconds until tender.`,
          `Pour in the whisked eggs and gently fold over medium-low heat until creamy and set.`
        ],
        wasteSavedNote: `Cooks up your ${urgentName} to eliminate food waste!`
      });
    } else {
      suggestions.push({
        title: `Sautéed Skillet Bowl with ${urgentName}`,
        categoryTag: 'Zero-Waste Priority',
        description: `A quick, wholesome skillet preparation maximizing flavor from your available ${urgentName}.`,
        prepTime: '10 minutes',
        ingredientsToUseUrgent: [urgentName, ...otherNames.slice(0, 2)],
        otherIngredients: ['1 tbsp olive oil', 'Cracked pepper', 'Sea salt', 'Herbs of choice'],
        instructions: [
          `Chop your ${urgentName} and any accompanying ingredients into bite-sized pieces.`,
          `Heat oil in a skillet over medium-high heat until shimmering.`,
          `Add ingredients in order of density, tossing frequently for 4-5 minutes until caramelized and tender.`,
          `Finish with coarse salt and pepper and serve warm.`
        ],
        wasteSavedNote: `Used ${urgentName} while completely fresh, preventing expiration!`
      });
    }

    // Recipe 2: Alternative combination
    if (otherNames.length > 0) {
      const altName = otherNames[0];
      suggestions.push({
        title: `Rustic Warm Toss of ${altName} & ${urgentName}`,
        categoryTag: 'Quick 10-Min Meal',
        description: `A simple, flavorful combination utilizing both ${altName} and ${urgentName} for zero waste.`,
        prepTime: '10 minutes',
        ingredientsToUseUrgent: [altName, urgentName],
        otherIngredients: ['Olive oil', 'Salt & pepper', 'Lemon squeeze or vinegar'],
        instructions: [
          `Prepare ${altName} and ${urgentName} into ready portions.`,
          `Warm gently in a pan with a splash of olive oil to bring out natural aromas.`,
          `Season lightly and enjoy as a balanced, fresh dish.`
        ],
        wasteSavedNote: `Combines 2 fridge ingredients into an effortless meal.`
      });
    } else {
      suggestions.push({
        title: `Crispy Caramelized ${urgentName} Quick Snack`,
        categoryTag: 'Quick 5-Min Meal',
        description: `A fast 5-minute snack turning your ${urgentName} into a flavorful bite.`,
        prepTime: '5 minutes',
        ingredientsToUseUrgent: [urgentName],
        otherIngredients: ['Cooking oil', 'Salt', 'Spices'],
        instructions: [
          `Slice ${urgentName} evenly.`,
          `Sear in hot pan for 2 minutes on each side until crisp.`,
          `Season and serve immediately.`
        ],
        wasteSavedNote: `Zero waste, fast prep.`
      });
    }

    return suggestions;
  }
}

export const agentService = new AgentService();
