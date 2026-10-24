/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MongoMemoryDocument,
  ChangeStreamEvent,
  VectorSearchResult,
  MemoryRecallExplanation,
  LifecycleStatus
} from '../types/memory';

// Helper to generate 24-character hexadecimal MongoDB ObjectId
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomChars = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + randomChars).toLowerCase();
}

// Semantic concept dimensions with synonymous clusters
const CONCEPT_CLUSTERS: Record<string, string[]> = {
  produce: ['produce', 'vegetable', 'vegetables', 'plant', 'raw', 'fresh', 'farm'],
  green_leafy: ['spinach', 'kale', 'lettuce', 'leafy', 'green', 'greens', 'salad', 'herb', 'arugula'],
  dairy: ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream'],
  egg: ['egg', 'eggs', 'omelet', 'scramble', 'poached'],
  protein_meat: ['protein', 'meat', 'chicken', 'poultry', 'beef', 'steak', 'pork', 'fish', 'salmon', 'tuna'],
  plant_protein: ['tofu', 'beans', 'lentils', 'chickpeas', 'edamame', 'soy'],
  bakery_grains: ['bread', 'toast', 'sourdough', 'loaf', 'bakery', 'grain', 'flour', 'sandwich', 'carb', 'carbs', 'pasta'],
  fruits: ['fruit', 'apple', 'banana', 'berry', 'berries', 'citrus', 'lemon', 'orange'],
  pantry_spices: ['pantry', 'canned', 'dry', 'oil', 'olive', 'garlic', 'onion', 'salt', 'pepper'],
  meal_timing: ['breakfast', 'lunch', 'dinner', 'snack', 'starving', 'hungry', 'meal', 'quick'],
  perishable_urgent: ['perishable', 'urgent', 'spoils', 'rot', 'expiring', 'fresh', 'raw']
};

const CONCEPT_KEYS = Object.keys(CONCEPT_CLUSTERS);

export function generateSemanticEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  
  const vector = new Array(CONCEPT_KEYS.length).fill(0.01); // minimal epsilon

  for (let i = 0; i < CONCEPT_KEYS.length; i++) {
    const key = CONCEPT_KEYS[i];
    const keywords = CONCEPT_CLUSTERS[key];

    for (const kw of keywords) {
      if (words.includes(kw) || normalized.includes(kw)) {
        vector[i] += 1.5;
      } else {
        for (const w of words) {
          if (w.length >= 4 && (kw.includes(w) || w.includes(kw))) {
            vector[i] += 0.8;
          }
        }
      }
    }
  }

  // Normalize to unit vector for cosine distance
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => Number((v / magnitude).toFixed(4))) : vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

export type ChangeStreamListener = (event: ChangeStreamEvent) => void;

/**
 * High-fidelity MongoDB Memory Collection supporting:
 * - TTL Index expiration ({ "lifecycle.ttl_index_expires_at": 1 })
 * - $vectorSearch aggregation stage with filters (user, workspace, status, recency)
 * - collection.watch() Change Streams
 * - Dietary invalidation lifecycle workflows
 */
export class MongoMemoryCollection {
  private documents: Map<string, MongoMemoryDocument> = new Map();
  private listeners: Set<ChangeStreamListener> = new Set();
  private simulatedNow: Date;
  public readonly dbName: string = 'pantry_mind_db';
  public readonly collName: string = 'memories';

  constructor(initialDate: Date = new Date('2026-10-24T08:00:00.000Z')) {
    this.simulatedNow = new Date(initialDate);
  }

  public getSimulatedNow(): Date {
    return new Date(this.simulatedNow);
  }

  public setSimulatedNow(date: Date): { expiredCount: number } {
    this.simulatedNow = new Date(date);
    return this.runTTLIndexSweep();
  }

  public advanceSimulatedDays(days: number): { newDate: string; expiredCount: number } {
    this.simulatedNow = new Date(this.simulatedNow.getTime() + days * 24 * 60 * 60 * 1000);
    const { expiredCount } = this.runTTLIndexSweep();
    return {
      newDate: this.simulatedNow.toISOString(),
      expiredCount,
    };
  }

  /**
   * MongoDB Change Stream subscription
   */
  public watch(listener: ChangeStreamListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChangeStreamEvent(event: Omit<ChangeStreamEvent, 'clusterTime' | 'ns'>) {
    const fullEvent: ChangeStreamEvent = {
      ...event,
      clusterTime: `Timestamp(${Math.floor(this.simulatedNow.getTime() / 1000)}, 1)`,
      ns: { db: this.dbName, coll: this.collName }
    };
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error('Error in change stream listener:', err);
      }
    }
  }

  /**
   * MongoDB insertOne
   */
  public insertOne(doc: Omit<MongoMemoryDocument, '_id'> & { _id?: string }): MongoMemoryDocument {
    const _id = doc._id || generateObjectId();
    const fullDoc: MongoMemoryDocument = {
      ...doc,
      _id,
      timestamps: {
        ...doc.timestamps,
        createdAt: doc.timestamps.createdAt || this.simulatedNow.toISOString(),
        updatedAt: doc.timestamps.updatedAt || this.simulatedNow.toISOString(),
      },
      embedding: doc.embedding || generateSemanticEmbedding(
        `${doc.content.item_name || ''} ${doc.content.category || ''} ${doc.content.notes || ''} ${doc.content.text || ''}`
      )
    };

    this.documents.set(_id, fullDoc);

    this.emitChangeStreamEvent({
      _id: generateObjectId(),
      operationType: 'insert',
      documentKey: { _id },
      fullDocument: fullDoc
    });

    return fullDoc;
  }

  /**
   * MongoDB find
   */
  public find(filter?: {
    'owner.userId'?: string;
    'owner.workspaceId'?: string;
    type?: string;
    'lifecycle.status'?: LifecycleStatus;
  }): MongoMemoryDocument[] {
    const results: MongoMemoryDocument[] = [];
    for (const doc of this.documents.values()) {
      if (filter) {
        if (filter['owner.userId'] && doc.owner.userId !== filter['owner.userId']) continue;
        if (filter['owner.workspaceId'] && doc.owner.workspaceId !== filter['owner.workspaceId']) continue;
        if (filter.type && doc.type !== filter.type) continue;
        if (filter['lifecycle.status'] && doc.lifecycle.status !== filter['lifecycle.status']) continue;
      }
      results.push(JSON.parse(JSON.stringify(doc)));
    }
    return results;
  }

  public findById(id: string): MongoMemoryDocument | null {
    const doc = this.documents.get(id);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  /**
   * MongoDB updateOne
   */
  public updateOne(
    id: string,
    update: {
      $set?: Partial<MongoMemoryDocument>;
      lifecycleUpdate?: Partial<MongoMemoryDocument['lifecycle']>;
      contentUpdate?: Partial<MongoMemoryDocument['content']>;
    },
    reason?: string
  ): MongoMemoryDocument | null {
    const existing = this.documents.get(id);
    if (!existing) return null;

    const updated: MongoMemoryDocument = {
      ...existing,
      ...(update.$set || {}),
      timestamps: {
        ...existing.timestamps,
        updatedAt: this.simulatedNow.toISOString()
      },
      lifecycle: {
        ...existing.lifecycle,
        ...(update.lifecycleUpdate || {})
      },
      content: {
        ...existing.content,
        ...(update.contentUpdate || {})
      }
    };

    this.documents.set(id, updated);

    this.emitChangeStreamEvent({
      _id: generateObjectId(),
      operationType: 'update',
      documentKey: { _id: id },
      fullDocument: updated,
      updateDescription: {
        updatedFields: update.$set || {}
      },
      reason
    });

    return updated;
  }

  /**
   * Discards an item (e.g. user threw it out or consumed it).
   * Moves it to 'perished' or 'consumed' in background memory with an audit note.
   */
  public discardItem(
    id: string,
    reason: string = 'Thrown out by user',
    status: 'perished' | 'consumed' = 'perished'
  ): MongoMemoryDocument | null {
    const existing = this.documents.get(id);
    if (!existing) return null;

    existing.lifecycle.status = status;
    existing.lifecycle.invalidated_at = this.simulatedNow.toISOString();
    existing.lifecycle.invalidation_reason = reason;
    existing.timestamps.updatedAt = this.simulatedNow.toISOString();

    this.documents.set(id, existing);

    this.emitChangeStreamEvent({
      _id: generateObjectId(),
      operationType: 'invalidate',
      documentKey: { _id: id },
      fullDocument: existing,
      reason
    });

    return existing;
  }

  /**
   * MongoDB deleteOne: completely removes the document from the collection
   */
  public deleteOne(id: string): boolean {
    const existing = this.documents.get(id);
    if (!existing) return false;

    this.documents.delete(id);

    this.emitChangeStreamEvent({
      _id: generateObjectId(),
      operationType: 'delete',
      documentKey: { _id: id },
      reason: `Permanently removed item (${existing.content.item_name || id})`
    });

    return true;
  }

  /**
   * MongoDB TTL Index simulation:
   * collection.createIndex({ "lifecycle.ttl_index_expires_at": 1 }, { expireAfterSeconds: 0 })
   * Automatically sweeps documents where ttl_index_expires_at <= simulatedNow
   * Moves them from 'active' to 'perished' (unusable background archive).
   */
  public runTTLIndexSweep(): { expiredCount: number } {
    let expiredCount = 0;
    const nowTime = this.simulatedNow.getTime();

    for (const doc of this.documents.values()) {
      if (doc.type === 'inventory_item' && doc.lifecycle.status === 'active') {
        const ttlExpiry = new Date(doc.lifecycle.ttl_index_expires_at).getTime();
        if (ttlExpiry <= nowTime) {
          // Expire via TTL index!
          const shelfLife = doc.content.shelf_life_days || 7;
          doc.lifecycle.status = 'perished';
          doc.lifecycle.invalidated_at = this.simulatedNow.toISOString();
          doc.lifecycle.invalidation_reason = `Auto-expired by MongoDB TTL Index: Perished after ${shelfLife} days shelf-life limit`;
          doc.timestamps.updatedAt = this.simulatedNow.toISOString();

          this.documents.set(doc._id, doc);
          expiredCount++;

          this.emitChangeStreamEvent({
            _id: generateObjectId(),
            operationType: 'invalidate',
            documentKey: { _id: doc._id },
            fullDocument: doc,
            reason: `TTL Index Expired (${doc.content.item_name})`
          });
        }
      }
    }

    return { expiredCount };
  }

  /**
   * Demonstrates MongoDB Vector Search ($vectorSearch aggregation)
   * Scoped by owner (user, workspace), memory type, and lifecycle status.
   */
  public vectorSearch(params: {
    queryText: string;
    userId: string;
    workspaceId?: string;
    type?: string;
    status?: LifecycleStatus;
    limit?: number;
    minScore?: number;
  }): VectorSearchResult[] {
    const {
      queryText,
      userId,
      workspaceId,
      type = 'inventory_item',
      status,
      limit = 10,
      minScore = 0.05
    } = params;

    const queryEmbedding = generateSemanticEmbedding(queryText);
    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Apply MongoDB filter stages:
      if (doc.owner.userId !== userId) continue;
      if (workspaceId && doc.owner.workspaceId !== workspaceId) continue;
      if (type && type !== 'all' && doc.type !== type) continue;
      if (status && status !== ('all' as any) && doc.lifecycle.status !== status) continue;

      const docEmbedding = doc.embedding || generateSemanticEmbedding(
        `${doc.content.item_name} ${doc.content.category} ${doc.content.dietary_tags?.join(' ') || ''} ${doc.content.notes || ''}`
      );

      const score = Number(cosineSimilarity(queryEmbedding, docEmbedding).toFixed(4));
      
      if (score >= minScore) {
        // Calculate days remaining until TTL expiration
        const ttlTime = new Date(doc.lifecycle.ttl_index_expires_at).getTime();
        const nowTime = this.simulatedNow.getTime();
        const daysRemaining = Math.max(0, Number(((ttlTime - nowTime) / (24 * 3600 * 1000)).toFixed(1)));
        
        let urgency = 'stable';
        if (daysRemaining <= 1.5) urgency = 'CRITICAL URGENT (Spoils Soon)';
        else if (daysRemaining <= 3) urgency = 'High Priority (Use within 3 days)';
        else urgency = 'Moderate';

        results.push({
          document: JSON.parse(JSON.stringify(doc)),
          score,
          relevanceExplanation: `Matched query concepts with similarity ${score}. Status: ${doc.lifecycle.status}. Days left: ${daysRemaining}d [${urgency}].`
        });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Dietary Policy Invalidation (Edge Case: "I went vegan"):
   * 1. Permanently stores user profile constraint
   * 2. Scans active inventory
   * 3. Marks conflicting items as 'restricted' (unusable) with clear reason
   * 4. Emits MongoDB change stream invalidate/update events
   */
  public applyDietaryConstraint(params: {
    userId: string;
    workspaceId: string;
    restriction: 'vegan' | 'vegetarian' | 'dairy_free' | 'gluten_free' | 'none';
  }): {
    profileDoc: MongoMemoryDocument;
    invalidatedItems: MongoMemoryDocument[];
  } {
    const { userId, workspaceId, restriction } = params;

    // 1. Upsert User Profile document
    let profileDoc: MongoMemoryDocument | null = null;
    for (const doc of this.documents.values()) {
      if (doc.owner.userId === userId && doc.type === 'user_profile') {
        profileDoc = doc;
        break;
      }
    }

    if (profileDoc) {
      profileDoc.content.dietary_restriction = restriction;
      profileDoc.content.notes = `Updated preference: ${restriction}`;
      profileDoc.timestamps.updatedAt = this.simulatedNow.toISOString();
      this.documents.set(profileDoc._id, profileDoc);
      this.emitChangeStreamEvent({
        _id: generateObjectId(),
        operationType: 'update',
        documentKey: { _id: profileDoc._id },
        fullDocument: profileDoc,
        reason: `Dietary restriction updated to ${restriction}`
      });
    } else {
      profileDoc = this.insertOne({
        owner: { userId, userName: 'User', workspaceId },
        type: 'user_profile',
        source: 'user_override',
        content: {
          dietary_restriction: restriction,
          notes: `User stated dietary preference: ${restriction}`
        },
        timestamps: {
          createdAt: this.simulatedNow.toISOString(),
          updatedAt: this.simulatedNow.toISOString(),
          date_added: this.simulatedNow.toISOString(),
          expires_at: new Date(this.simulatedNow.getTime() + 365 * 24 * 3600 * 1000).toISOString()
        },
        lifecycle: {
          status: 'active',
          recall_count: 1,
          ttl_index_expires_at: new Date(this.simulatedNow.getTime() + 365 * 24 * 3600 * 1000).toISOString()
        }
      });
    }

    // 2. Scan and invalidate conflicting active items
    const invalidatedItems: MongoMemoryDocument[] = [];

    if (restriction !== 'none') {
      const activeItems = this.find({
        'owner.userId': userId,
        'lifecycle.status': 'active',
        type: 'inventory_item'
      });

      for (const item of activeItems) {
        let isConflicting = false;
        let conflictReason = '';

        const tags = item.content.dietary_tags || [];
        const itemName = (item.content.item_name || '').toLowerCase();

        if (restriction === 'vegan') {
          if (
            tags.includes('non-vegan') || 
            tags.includes('egg') || 
            tags.includes('dairy') || 
            tags.includes('poultry') || 
            tags.includes('meat') ||
            itemName.includes('egg') || 
            itemName.includes('chicken') || 
            itemName.includes('milk') || 
            itemName.includes('beef') || 
            itemName.includes('butter')
          ) {
            isConflicting = true;
            conflictReason = `Violates '${restriction}' policy. Animal-derived item (${item.content.item_name}). Preserved in background unusable memory.`;
          }
        } else if (restriction === 'dairy_free') {
          if (tags.includes('dairy') || itemName.includes('milk') || itemName.includes('cheese') || itemName.includes('butter')) {
            isConflicting = true;
            conflictReason = `Violates 'dairy-free' policy (${item.content.item_name}). Kept in background storage.`;
          }
        }

        if (isConflicting) {
          const doc = this.documents.get(item._id);
          if (doc) {
            doc.lifecycle.status = 'restricted';
            doc.lifecycle.invalidated_at = this.simulatedNow.toISOString();
            doc.lifecycle.invalidation_reason = conflictReason;
            doc.timestamps.updatedAt = this.simulatedNow.toISOString();
            this.documents.set(doc._id, doc);
            invalidatedItems.push(JSON.parse(JSON.stringify(doc)));

            this.emitChangeStreamEvent({
              _id: generateObjectId(),
              operationType: 'invalidate',
              documentKey: { _id: doc._id },
              fullDocument: doc,
              reason: `Invalidated: Incompatible with ${restriction} diet`
            });
          }
        }
      }
    }

    return { profileDoc, invalidatedItems };
  }

  /**
   * Seed authentic Hackathon demonstration items:
   * Eggs (shelf life 21d), Spinach (shelf life 7d), Bread (shelf life 10d), Chicken breast (shelf life 3d), Fresh milk (shelf life 7d)
   */
  public seedDemoInventory(userId: string = 'user_demo_1', workspaceId: string = 'home_fridge'): MongoMemoryDocument[] {
    this.documents.clear();
    const now = this.simulatedNow;

    const sampleItems: Array<{
      name: string;
      qty: string;
      category: MongoMemoryDocument['content']['category'];
      shelf_life_days: number;
      tags: string[];
    }> = [
      { name: 'Fresh Spinach', qty: '1 bag (200g)', category: 'produce', shelf_life_days: 7, tags: ['vegan', 'vegetable', 'leafy_green', 'highly_perishable'] },
      { name: 'Farm Eggs', qty: '6 large', category: 'dairy', shelf_life_days: 21, tags: ['non-vegan', 'vegetarian', 'egg', 'protein'] },
      { name: 'Artisan Sourdough Bread', qty: '1 loaf', category: 'bakery', shelf_life_days: 10, tags: ['vegan', 'bakery', 'grain'] },
      { name: 'Organic Chicken Breast', qty: '400g', category: 'protein', shelf_life_days: 4, tags: ['non-vegan', 'poultry', 'meat', 'perishable'] },
      { name: 'Whole Fresh Milk', qty: '1 liter', category: 'dairy', shelf_life_days: 7, tags: ['non-vegan', 'vegetarian', 'dairy', 'perishable'] },
    ];

    const created: MongoMemoryDocument[] = [];

    for (const item of sampleItems) {
      const addedDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const expiresDate = new Date(addedDate.getTime() + item.shelf_life_days * 24 * 3600 * 1000);

      const doc = this.insertOne({
        owner: {
          userId,
          userName: 'Alex Miller',
          workspaceId,
          householdRole: 'Cook'
        },
        type: 'inventory_item',
        source: 'chat_sms',
        content: {
          item_name: item.name,
          quantity: item.qty,
          category: item.category,
          shelf_life_days: item.shelf_life_days,
          dietary_tags: item.tags,
          is_perishable: true,
          notes: `Casual grocery entry from chat list.`
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
      created.push(doc);
    }

    return created;
  }
}

// Global Singleton Instance
export const globalMongoMemory = new MongoMemoryCollection();
