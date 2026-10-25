/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemCategory } from '../types/memory';

export interface FoodExpiryRecord {
  name: string;
  aliases: string[];
  category: ItemCategory;
  shelfLifeDays: number;
  dietaryTags: string[];
  emoji: string;
  storageTip: string;
}

export interface FoodExpiryEstimate {
  matchedName: string;
  category: ItemCategory;
  shelfLifeDays: number;
  dietaryTags: string[];
  emoji: string;
  confidence: 'exact' | 'fuzzy' | 'heuristic' | 'default';
  storageTip: string;
}

/**
 * Memorized Food Shelf Life Knowledge Base
 * Sourced from USDA FoodKeeper guidelines and culinary food preservation standards.
 */
export const FOOD_EXPIRY_KNOWLEDGE_BASE: FoodExpiryRecord[] = [
  // ─── FRUITS & BERRIES ───
  {
    name: 'Strawberries',
    aliases: ['strawberry', 'fresh strawberries', 'organic strawberries'],
    category: 'produce',
    shelfLifeDays: 4,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'perishable'],
    emoji: '🍓',
    storageTip: 'Store unwashed in ventilated container; wash right before eating.'
  },
  {
    name: 'Raspberries',
    aliases: ['raspberry', 'blackberries', 'blackberry'],
    category: 'produce',
    shelfLifeDays: 3,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'perishable'],
    emoji: '🫐',
    storageTip: 'Highly perishable; keep cold and dry in original container.'
  },
  {
    name: 'Blueberries',
    aliases: ['blueberry', 'fresh blueberries'],
    category: 'produce',
    shelfLifeDays: 8,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🫐',
    storageTip: 'Refrigerate in breathable container; discard any crushed berries.'
  },
  {
    name: 'Bananas',
    aliases: ['banana', 'ripe banana', 'ripe bananas'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍌',
    storageTip: 'Store at room temp until ripe, then refrigerate to slow peel darkening.'
  },
  {
    name: 'Avocados',
    aliases: ['avocado', 'hass avocado', 'ripe avocados'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'produce', 'healthy_fat'],
    emoji: '🥑',
    storageTip: 'Ripen at room temp; once yield to gentle pressure, move to fridge.'
  },
  {
    name: 'Apples',
    aliases: ['apple', 'honeycrisp', 'fuji apple', 'gala apple', 'green apple'],
    category: 'produce',
    shelfLifeDays: 28,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍎',
    storageTip: 'Keep in refrigerator crisper drawer away from ethylene-sensitive veggies.'
  },
  {
    name: 'Pears',
    aliases: ['pear', 'bosc pear', 'anjou pear', 'bartlett pear'],
    category: 'produce',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍐',
    storageTip: 'Ripen on counter, then refrigerate once neck softens slightly.'
  },
  {
    name: 'Oranges',
    aliases: ['orange', 'mandarins', 'clementines', 'tangerines', 'navel oranges'],
    category: 'produce',
    shelfLifeDays: 21,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'citrus'],
    emoji: '🍊',
    storageTip: 'Refrigerate in mesh bag for maximum juiciness up to 3-4 weeks.'
  },
  {
    name: 'Lemons & Limes',
    aliases: ['lemon', 'lime', 'lemons', 'limes', 'meyer lemon'],
    category: 'produce',
    shelfLifeDays: 24,
    dietaryTags: ['vegan', 'vegetarian', 'citrus', 'flavoring'],
    emoji: '🍋',
    storageTip: 'Refrigerate in crisper in a sealed zip bag to prevent drying out.'
  },
  {
    name: 'Grapes',
    aliases: ['grape', 'red grapes', 'green grapes', 'cotton candy grapes'],
    category: 'produce',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍇',
    storageTip: 'Keep dry in ventilated bag in the fridge; wash before eating.'
  },
  {
    name: 'Watermelon',
    aliases: ['watermelon', 'sliced watermelon', 'melon'],
    category: 'produce',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍉',
    storageTip: 'Whole lasts 10 days; once cut, wrap tightly and consume in 4 days.'
  },
  {
    name: 'Cantaloupe & Honeydew',
    aliases: ['cantaloupe', 'honeydew', 'muskmelon'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍈',
    storageTip: 'Store cut melon in airtight container in fridge up to 4-5 days.'
  },
  {
    name: 'Peaches & Nectarines',
    aliases: ['peach', 'peaches', 'nectarine', 'nectarines', 'plum', 'plums'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'stone_fruit'],
    emoji: '🍑',
    storageTip: 'Ripen on counter; transfer to fridge crisper when fragrant and tender.'
  },
  {
    name: 'Mangoes',
    aliases: ['mango', 'mangoes', 'ataulfo mango'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'tropical'],
    emoji: '🥭',
    storageTip: 'Refrigerate once soft to the touch.'
  },
  {
    name: 'Pineapple',
    aliases: ['pineapple', 'fresh pineapple', 'sliced pineapple'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'fruit', 'tropical'],
    emoji: '🍍',
    storageTip: 'Store whole in fridge or cut into chunks in airtight container.'
  },
  {
    name: 'Cherries',
    aliases: ['cherry', 'cherries', 'bing cherries', 'rainier cherries'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍒',
    storageTip: 'Keep unwashed with stems attached in a cold fridge zone.'
  },
  {
    name: 'Kiwi',
    aliases: ['kiwi', 'kiwifruit'],
    category: 'produce',
    shelfLifeDays: 10,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🥝',
    storageTip: 'Once ripe, refrigerate to maintain firm texture.'
  },
  {
    name: 'Pomegranate',
    aliases: ['pomegranate', 'pomegranates', 'arils'],
    category: 'produce',
    shelfLifeDays: 28,
    dietaryTags: ['vegan', 'vegetarian', 'fruit'],
    emoji: '🍎',
    storageTip: 'Whole keeps up to 2 months; fresh arils keep 4-5 days in container.'
  },

  // ─── VEGETABLES & GREENS ───
  {
    name: 'Fresh Spinach',
    aliases: ['spinach', 'baby spinach', 'organic spinach'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'leafy_green', 'vegetable'],
    emoji: '🥬',
    storageTip: 'Add paper towel to container to absorb moisture and double shelf life.'
  },
  {
    name: 'Mixed Salad Greens',
    aliases: ['salad', 'mixed greens', 'arugula', 'spring mix', 'mesclun'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'leafy_green', 'vegetable'],
    emoji: '🥗',
    storageTip: 'Keep sealed with dry paper towel in high-humidity crisper drawer.'
  },
  {
    name: 'Romaine & Iceberg Lettuce',
    aliases: ['lettuce', 'romaine', 'iceberg', 'butter lettuce', 'head lettuce'],
    category: 'produce',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'leafy_green', 'vegetable'],
    emoji: '🥬',
    storageTip: 'Keep whole head intact; trim outer leaves as needed.'
  },
  {
    name: 'Kale & Chard',
    aliases: ['kale', 'lacinato kale', 'swiss chard', 'collard greens'],
    category: 'produce',
    shelfLifeDays: 8,
    dietaryTags: ['vegan', 'vegetarian', 'leafy_green', 'vegetable'],
    emoji: '🥬',
    storageTip: 'Hardier green; wrap loosely in damp towel inside produce bag.'
  },
  {
    name: 'Broccoli',
    aliases: ['broccoli', 'broccolini', 'broccoli crowns'],
    category: 'produce',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'cruciferous', 'vegetable'],
    emoji: '🥦',
    storageTip: 'Store unwashed in loose plastic bag; trim base if yellowing.'
  },
  {
    name: 'Cauliflower',
    aliases: ['cauliflower', 'cauliflower head', 'cauli'],
    category: 'produce',
    shelfLifeDays: 8,
    dietaryTags: ['vegan', 'vegetarian', 'cruciferous', 'vegetable'],
    emoji: '🥦',
    storageTip: 'Keep stem-side down to prevent condensation gathering in florets.'
  },
  {
    name: 'Asparagus',
    aliases: ['asparagus', 'asparagus spears'],
    category: 'produce',
    shelfLifeDays: 4,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🎋',
    storageTip: 'Stand upright in a cup with 1 inch of water like cut flowers.'
  },
  {
    name: 'Mushrooms',
    aliases: ['mushrooms', 'mushroom', 'cremini', 'portobello', 'shiitake', 'button mushroom'],
    category: 'produce',
    shelfLifeDays: 5,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable', 'fungi'],
    emoji: '🍄',
    storageTip: 'Store in breathable brown paper bag, never trapped in plastic wrap.'
  },
  {
    name: 'Zucchini & Summer Squash',
    aliases: ['zucchini', 'yellow squash', 'courgette'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🥒',
    storageTip: 'Keep dry in produce drawer; do not wash until cooking.'
  },
  {
    name: 'Cucumbers',
    aliases: ['cucumber', 'english cucumber', 'persian cucumber', 'pickling cucumber'],
    category: 'produce',
    shelfLifeDays: 8,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🥒',
    storageTip: 'Store in front of fridge where temperatures are milder.'
  },
  {
    name: 'Bell Peppers',
    aliases: ['bell pepper', 'peppers', 'red pepper', 'green pepper', 'yellow pepper'],
    category: 'produce',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🫑',
    storageTip: 'Keep in crisper; green peppers last slightly longer than red or yellow.'
  },
  {
    name: 'Vine Tomatoes',
    aliases: ['tomato', 'tomatoes', 'cherry tomatoes', 'roma tomatoes', 'beefsteak tomato'],
    category: 'produce',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'produce'],
    emoji: '🍅',
    storageTip: 'Store stem-side down at cool room temp; chill only once fully ripe.'
  },
  {
    name: 'Carrots',
    aliases: ['carrot', 'carrots', 'baby carrots', 'rainbow carrots'],
    category: 'produce',
    shelfLifeDays: 24,
    dietaryTags: ['vegan', 'vegetarian', 'root_vegetable'],
    emoji: '🥕',
    storageTip: 'Remove green tops; store in crisper or submerged in cold water.'
  },
  {
    name: 'Celery',
    aliases: ['celery', 'celery stalks', 'celery sticks'],
    category: 'produce',
    shelfLifeDays: 18,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🥬',
    storageTip: 'Wrap snugly in aluminum foil to retain crispness for up to 3-4 weeks.'
  },
  {
    name: 'Green Beans',
    aliases: ['green beans', 'string beans', 'snap peas', 'snow peas'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🫛',
    storageTip: 'Refrigerate unwashed in reusable bag with paper towel.'
  },
  {
    name: 'Potatoes',
    aliases: ['potatoes', 'potato', 'russet potato', 'yukon gold', 'red potatoes'],
    category: 'produce',
    shelfLifeDays: 35,
    dietaryTags: ['vegan', 'vegetarian', 'root_vegetable', 'pantry'],
    emoji: '🥔',
    storageTip: 'Store in cool, dark, dry pantry away from onions and direct sunlight.'
  },
  {
    name: 'Sweet Potatoes',
    aliases: ['sweet potato', 'sweet potatoes', 'yams', 'yam'],
    category: 'produce',
    shelfLifeDays: 30,
    dietaryTags: ['vegan', 'vegetarian', 'root_vegetable'],
    emoji: '🍠',
    storageTip: 'Store in dark ventilated bin; avoid refrigerating raw tubers.'
  },
  {
    name: 'Onions & Shallots',
    aliases: ['onion', 'onions', 'yellow onion', 'red onion', 'shallot', 'shallots'],
    category: 'produce',
    shelfLifeDays: 45,
    dietaryTags: ['vegan', 'vegetarian', 'allium'],
    emoji: '🧅',
    storageTip: 'Store in cool, dry, ventilated basket; keep away from moisture.'
  },
  {
    name: 'Garlic',
    aliases: ['garlic', 'garlic bulb', 'garlic cloves'],
    category: 'produce',
    shelfLifeDays: 60,
    dietaryTags: ['vegan', 'vegetarian', 'allium', 'flavoring'],
    emoji: '🧄',
    storageTip: 'Keep whole head in mesh bag at room temp; once broken, use in 2 weeks.'
  },
  {
    name: 'Green Onions',
    aliases: ['scallions', 'scallion', 'green onion', 'spring onion'],
    category: 'produce',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'allium'],
    emoji: '🧅',
    storageTip: 'Store upright with roots submerged in water on windowsill or in fridge.'
  },
  {
    name: 'Fresh Herbs',
    aliases: ['cilantro', 'parsley', 'basil', 'mint', 'dill', 'rosemary', 'thyme', 'herbs'],
    category: 'produce',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'herbs'],
    emoji: '🌿',
    storageTip: 'Treat like flowers in a water jar (basil on counter, parsley in fridge).'
  },
  {
    name: 'Corn on the Cob',
    aliases: ['corn', 'sweet corn', 'corn on cob'],
    category: 'produce',
    shelfLifeDays: 4,
    dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
    emoji: '🌽',
    storageTip: 'Keep husk on in fridge; sugars convert to starch after 3 days.'
  },
  {
    name: 'Cabbage',
    aliases: ['cabbage', 'red cabbage', 'green cabbage', 'napa cabbage'],
    category: 'produce',
    shelfLifeDays: 21,
    dietaryTags: ['vegan', 'vegetarian', 'cruciferous'],
    emoji: '🥬',
    storageTip: 'Very resilient; wrap in plastic wrap in crisper drawer.'
  },
  {
    name: 'Brussels Sprouts',
    aliases: ['brussels sprouts', 'brussels sprout'],
    category: 'produce',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'cruciferous'],
    emoji: '🥬',
    storageTip: 'Keep unwashed in perforated bag in refrigerator.'
  },

  // ─── DAIRY, EGGS & PLANT MILKS ───
  {
    name: 'Whole Milk',
    aliases: ['milk', 'fresh milk', 'whole milk', '2% milk', 'skim milk', 'cow milk'],
    category: 'dairy',
    shelfLifeDays: 7,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy', 'animal_product'],
    emoji: '🥛',
    storageTip: 'Store on inner fridge shelf, never in door where temp fluctuates.'
  },
  {
    name: 'Almond / Oat Milk',
    aliases: ['almond milk', 'oat milk', 'soy milk', 'cashew milk', 'plant milk'],
    category: 'dairy',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'plant_based', 'dairy_free'],
    emoji: '🥛',
    storageTip: 'Consume within 7-10 days after opening cap.'
  },
  {
    name: 'Farm Fresh Eggs',
    aliases: ['eggs', 'egg', 'pasture eggs', 'large eggs', 'brown eggs'],
    category: 'dairy',
    shelfLifeDays: 24,
    dietaryTags: ['non-vegan', 'vegetarian', 'egg', 'animal_product'],
    emoji: '🥚',
    storageTip: 'Keep in original carton on interior fridge shelf for stable temperature.'
  },
  {
    name: 'Greek Yogurt',
    aliases: ['greek yogurt', 'yogurt', 'plain yogurt', 'vanilla yogurt'],
    category: 'dairy',
    shelfLifeDays: 14,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🥣',
    storageTip: 'Keep lid sealed; smooth surface with spoon to avoid watery separation.'
  },
  {
    name: 'Aged Cheddar Cheese',
    aliases: ['cheddar', 'aged cheddar', 'sharp cheddar', 'hard cheese', 'parmesan', 'gouda'],
    category: 'dairy',
    shelfLifeDays: 30,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🧀',
    storageTip: 'Wrap in cheese paper or parchment, then loosely in foil.'
  },
  {
    name: 'Fresh Mozzarella & Soft Cheeses',
    aliases: ['mozzarella', 'fresh mozzarella', 'brie', 'feta', 'ricotta', 'goat cheese'],
    category: 'dairy',
    shelfLifeDays: 8,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🧀',
    storageTip: 'Keep in brine liquid or tightly covered; consume promptly.'
  },
  {
    name: 'Cream Cheese',
    aliases: ['cream cheese', 'philadelphia cream cheese'],
    category: 'dairy',
    shelfLifeDays: 18,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🧀',
    storageTip: 'Keep foil sealed or in airtight container; check for surface mold.'
  },
  {
    name: 'Butter',
    aliases: ['butter', 'salted butter', 'unsalted butter'],
    category: 'dairy',
    shelfLifeDays: 45,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🧈',
    storageTip: 'Refrigerate in butter keeper; freezes well up to 9 months.'
  },
  {
    name: 'Sour Cream & Heavy Cream',
    aliases: ['sour cream', 'heavy cream', 'whipping cream', 'half and half'],
    category: 'dairy',
    shelfLifeDays: 14,
    dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
    emoji: '🥛',
    storageTip: 'Refrigerate at or below 38°F; discard if separated or sour smelling.'
  },

  // ─── POULTRY, MEAT, SEAFOOD & PLANT PROTEINS ───
  {
    name: 'Chicken Breast',
    aliases: ['chicken', 'chicken breast', 'chicken thighs', 'chicken tenders', 'raw chicken'],
    category: 'protein',
    shelfLifeDays: 3,
    dietaryTags: ['non-vegan', 'meat', 'poultry', 'animal_product'],
    emoji: '🍗',
    storageTip: 'Cook within 2-3 days or freeze immediately in freezer wrap.'
  },
  {
    name: 'Ground Beef & Turkey',
    aliases: ['ground beef', 'ground turkey', 'ground chicken', 'ground pork', 'mince'],
    category: 'protein',
    shelfLifeDays: 2,
    dietaryTags: ['non-vegan', 'meat', 'animal_product'],
    emoji: '🥩',
    storageTip: 'Highest spoilage risk; cook within 1-2 days or freeze promptly.'
  },
  {
    name: 'Steak & Beef Cuts',
    aliases: ['steak', 'beef', 'ribeye', 'sirloin', 'beef tenderloin', 'roast beef'],
    category: 'protein',
    shelfLifeDays: 4,
    dietaryTags: ['non-vegan', 'meat', 'animal_product'],
    emoji: '🥩',
    storageTip: 'Store on bottom shelf on plate to catch any juices.'
  },
  {
    name: 'Fresh Salmon Fillet',
    aliases: ['salmon', 'salmon fillet', 'trout', 'fresh fish', 'cod', 'halibut'],
    category: 'protein',
    shelfLifeDays: 2,
    dietaryTags: ['non-vegan', 'seafood', 'fish', 'animal_product'],
    emoji: '🐟',
    storageTip: 'Ultra perishable; keep on bed of ice in fridge and cook within 48h.'
  },
  {
    name: 'Raw Shrimp & Prawns',
    aliases: ['shrimp', 'prawns', 'raw shrimp'],
    category: 'protein',
    shelfLifeDays: 2,
    dietaryTags: ['non-vegan', 'seafood', 'shellfish', 'animal_product'],
    emoji: '🦐',
    storageTip: 'Cook within 1-2 days or keep frozen until ready to thaw.'
  },
  {
    name: 'Bacon',
    aliases: ['bacon', 'turkey bacon', 'pancetta'],
    category: 'protein',
    shelfLifeDays: 10,
    dietaryTags: ['non-vegan', 'meat', 'pork'],
    emoji: '🥓',
    storageTip: 'Cured meat lasts longer; wrap opened packs tightly in foil.'
  },
  {
    name: 'Deli Sliced Meat',
    aliases: ['deli turkey', 'deli ham', 'cold cuts', 'prosciutto', 'salami'],
    category: 'protein',
    shelfLifeDays: 5,
    dietaryTags: ['non-vegan', 'meat'],
    emoji: '🥪',
    storageTip: 'Consume within 3-5 days after butcher opening.'
  },
  {
    name: 'Pork Chops & Tenderloin',
    aliases: ['pork', 'pork chops', 'pork tenderloin', 'pork roast'],
    category: 'protein',
    shelfLifeDays: 4,
    dietaryTags: ['non-vegan', 'meat', 'pork'],
    emoji: '🥩',
    storageTip: 'Keep on coldest bottom fridge rack; cook to internal 145°F.'
  },
  {
    name: 'Firm Tofu',
    aliases: ['tofu', 'firm tofu', 'silken tofu', 'extra firm tofu'],
    category: 'protein',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'plant_based', 'soy'],
    emoji: '🧊',
    storageTip: 'Once opened, submerge in fresh water daily; lasts 5-7 days.'
  },
  {
    name: 'Tempeh & Seitan',
    aliases: ['tempeh', 'seitan', 'plant meat'],
    category: 'protein',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'plant_based'],
    emoji: '🌱',
    storageTip: 'Keep sealed in airtight bag in deli drawer.'
  },

  // ─── BAKERY & GRAINS ───
  {
    name: 'Artisan Sourdough',
    aliases: ['sourdough', 'artisan bread', 'baguette', 'crusty bread'],
    category: 'bakery',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'grain', 'bakery'],
    emoji: '🥖',
    storageTip: 'Store cut-side down on wooden board or in bread box; avoid fridge.'
  },
  {
    name: 'Sliced Sandwich Bread',
    aliases: ['bread', 'sandwich bread', 'white bread', 'whole wheat bread'],
    category: 'bakery',
    shelfLifeDays: 9,
    dietaryTags: ['vegan', 'vegetarian', 'grain', 'bakery'],
    emoji: '🍞',
    storageTip: 'Room temp in sealed bag; slice and freeze to extend for months.'
  },
  {
    name: 'Bagels & English Muffins',
    aliases: ['bagel', 'bagels', 'english muffin', 'english muffins'],
    category: 'bakery',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian', 'bakery'],
    emoji: '🥯',
    storageTip: 'Slice before freezing for instant toaster convenience.'
  },
  {
    name: 'Tortillas & Pita',
    aliases: ['tortillas', 'tortilla', 'pita bread', 'pita', 'flatbread', 'naan'],
    category: 'bakery',
    shelfLifeDays: 14,
    dietaryTags: ['vegan', 'vegetarian', 'grain'],
    emoji: '🫓',
    storageTip: 'Keep zipped in original packaging; refrigerate for longer life.'
  },
  {
    name: 'Fresh Pasta',
    aliases: ['fresh pasta', 'ravioli', 'tortellini', 'gnocchi'],
    category: 'bakery',
    shelfLifeDays: 5,
    dietaryTags: ['vegetarian', 'grain'],
    emoji: '🍝',
    storageTip: 'Keep refrigerated in sealed pouch; cook or freeze within 5 days.'
  },

  // ─── PANTRY, PREPARED & CONDIMENTS ───
  {
    name: 'Hummus',
    aliases: ['hummus', 'garlic hummus', 'red pepper hummus'],
    category: 'pantry',
    shelfLifeDays: 7,
    dietaryTags: ['vegan', 'vegetarian', 'plant_based'],
    emoji: '🧆',
    storageTip: 'Keep tightly sealed; consume within 7 days of opening.'
  },
  {
    name: 'Guacamole',
    aliases: ['guacamole', 'fresh guac'],
    category: 'produce',
    shelfLifeDays: 3,
    dietaryTags: ['vegan', 'vegetarian'],
    emoji: '🥑',
    storageTip: 'Press plastic wrap directly against surface to prevent oxidation.'
  },
  {
    name: 'Fresh Salsa',
    aliases: ['salsa', 'pico de gallo'],
    category: 'pantry',
    shelfLifeDays: 8,
    dietaryTags: ['vegan', 'vegetarian'],
    emoji: '🥣',
    storageTip: 'Refrigerate in airtight glass jar.'
  },
  {
    name: 'Cooked Leftovers',
    aliases: ['leftovers', 'cooked chicken', 'cooked rice', 'soup', 'chili', 'stew'],
    category: 'protein',
    shelfLifeDays: 4,
    dietaryTags: ['perishable'],
    emoji: '🍲',
    storageTip: 'Refrigerate within 2 hours of cooking; eat within 3-4 days.'
  },
  {
    name: 'Open Pasta Sauce',
    aliases: ['pasta sauce', 'marinara', 'tomato sauce'],
    category: 'pantry',
    shelfLifeDays: 6,
    dietaryTags: ['vegan', 'vegetarian'],
    emoji: '🥫',
    storageTip: 'Once opened, transfer canned sauce to glass jar in fridge.'
  }
];

/**
 * Normalizes an item name for search and catalog matching
 */
export function normalizeFoodName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Infers category, shelf life, and dietary tags from food keywords when no direct catalog record is hit
 */
function inferHeuristically(cleanName: string): FoodExpiryEstimate {
  // 1. Seafood / Fish: 2 days (critical)
  if (/\b(fish|salmon|trout|tuna|cod|shrimp|prawn|crab|lobster|oyster|mussel|tilapia|sea\s*bass|halibut)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'protein',
      shelfLifeDays: 2,
      dietaryTags: ['non-vegan', 'seafood', 'animal_product', 'high_perishable'],
      emoji: '🐟',
      confidence: 'heuristic',
      storageTip: 'Ultra perishable raw seafood; cook within 24-48 hours.'
    };
  }

  // 2. Ground meat: 2 days
  if (/\b(ground|mince|minced|sausage|patty|patties)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'protein',
      shelfLifeDays: 2,
      dietaryTags: ['non-vegan', 'meat', 'animal_product'],
      emoji: '🥩',
      confidence: 'heuristic',
      storageTip: 'Ground meats spoil quickly; cook within 1-2 days or freeze.'
    };
  }

  // 3. Raw Poultry / Chicken: 3 days
  if (/\b(chicken|poultry|turkey|duck|wing|thigh|breast|drumstick)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'protein',
      shelfLifeDays: 3,
      dietaryTags: ['non-vegan', 'meat', 'poultry', 'animal_product'],
      emoji: '🍗',
      confidence: 'heuristic',
      storageTip: 'Keep on coldest bottom rack; cook within 3 days.'
    };
  }

  // 4. Red Meat / Pork: 4 days
  if (/\b(beef|steak|pork|lamb|veal|chop|chops|rib|ribs|roast)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'protein',
      shelfLifeDays: 4,
      dietaryTags: ['non-vegan', 'meat', 'animal_product'],
      emoji: '🥩',
      confidence: 'heuristic',
      storageTip: 'Cook fresh cuts within 3-4 days.'
    };
  }

  // 5. Berries: 3-4 days
  if (/\b(berry|berries|blackberry|blackberries|strawberry|strawberries|raspberry|raspberries)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'produce',
      shelfLifeDays: 4,
      dietaryTags: ['vegan', 'vegetarian', 'fruit'],
      emoji: '🍓',
      confidence: 'heuristic',
      storageTip: 'Keep cold and dry; avoid washing until ready to eat.'
    };
  }

  // 6. Delicate leafy greens & herbs: 5 days
  if (/\b(spinach|lettuce|arugula|greens|herb|herbs|cilantro|parsley|basil|mint|dill|sprout|sprouts)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'produce',
      shelfLifeDays: 5,
      dietaryTags: ['vegan', 'vegetarian', 'leafy_green', 'produce'],
      emoji: '🥬',
      confidence: 'heuristic',
      storageTip: 'Line with paper towel to absorb moisture and maintain crispness.'
    };
  }

  // 7. General tender vegetables: 7 days
  if (/\b(broccoli|cauliflower|zucchini|cucumber|pepper|peppers|tomato|tomatoes|bean|beans|squash|mushroom|mushrooms|asparagus)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'produce',
      shelfLifeDays: 7,
      dietaryTags: ['vegan', 'vegetarian', 'vegetable'],
      emoji: '🥦',
      confidence: 'heuristic',
      storageTip: 'Store in high-humidity crisper drawer.'
    };
  }

  // 8. Citrus & Hardy fruits: 18 days
  if (/\b(orange|lemon|lime|grapefruit|apple|pear|citrus)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'produce',
      shelfLifeDays: 18,
      dietaryTags: ['vegan', 'vegetarian', 'fruit'],
      emoji: '🍊',
      confidence: 'heuristic',
      storageTip: 'Crisper drawer preserves sweetness and juice up to 3 weeks.'
  };
  }

  // 9. Root vegetables: 28 days
  if (/\b(carrot|carrots|potato|potatoes|onion|onions|garlic|shallot|beet|beets|sweet\s*potato|yam)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'produce',
      shelfLifeDays: 28,
      dietaryTags: ['vegan', 'vegetarian', 'root_vegetable'],
      emoji: '🥕',
      confidence: 'heuristic',
      storageTip: 'Store in dark, cool, dry pantry with good airflow.'
    };
  }

  // 10. Dairy / Milk / Cream: 7 days
  if (/\b(milk|cream|half\s*and\s*half|dairy)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'dairy',
      shelfLifeDays: 7,
      dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
      emoji: '🥛',
      confidence: 'heuristic',
      storageTip: 'Keep on main middle fridge shelf; avoid door storage.'
    };
  }

  // 11. Cheese: 14-25 days
  if (/\b(cheese|cheddar|parmesan|mozzarella|gouda|swiss|feta|brie)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'dairy',
      shelfLifeDays: 21,
      dietaryTags: ['non-vegan', 'vegetarian', 'dairy'],
      emoji: '🧀',
      confidence: 'heuristic',
      storageTip: 'Keep in cheese compartment or wrapped in wax paper.'
    };
  }

  // 12. Bread & Bakery: 7 days
  if (/\b(bread|sourdough|bagel|bagels|bun|buns|loaf|croissant|pita|roll|rolls|muffin|muffins)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'bakery',
      shelfLifeDays: 7,
      dietaryTags: ['vegan', 'vegetarian', 'grain'],
      emoji: '🍞',
      confidence: 'heuristic',
      storageTip: 'Room temp in sealed bread bag; slice and freeze for longevity.'
    };
  }

  // 13. Plant-based proteins: 7 days
  if (/\b(tofu|tempeh|seitan|plant\s*based|veggie\s*burger)\b/.test(cleanName)) {
    return {
      matchedName: cleanName,
      category: 'protein',
      shelfLifeDays: 7,
      dietaryTags: ['vegan', 'vegetarian', 'plant_based'],
      emoji: '🌱',
      confidence: 'heuristic',
      storageTip: 'Keep submerged in water or sealed in airtight bag.'
    };
  }

  // Fallback generic food item: 7 days
  return {
    matchedName: cleanName,
    category: 'produce',
    shelfLifeDays: 7,
    dietaryTags: ['vegetarian'],
    emoji: '🥗',
    confidence: 'default',
    storageTip: 'Standard refrigerator storage; use within 7 days for peak freshness.'
  };
}

/**
 * Automatically looks up or estimates the expiration time and metadata for any food item.
 */
export function estimateFoodShelfLife(rawInput: string): FoodExpiryEstimate {
  const clean = normalizeFoodName(rawInput);
  if (!clean) {
    return {
      matchedName: 'Custom Food Item',
      category: 'produce',
      shelfLifeDays: 7,
      dietaryTags: ['vegetarian'],
      emoji: '🥗',
      confidence: 'default',
      storageTip: 'Standard refrigerator storage.'
    };
  }

  // 1. Exact Name Match
  for (const record of FOOD_EXPIRY_KNOWLEDGE_BASE) {
    if (normalizeFoodName(record.name) === clean) {
      return {
        matchedName: record.name,
        category: record.category,
        shelfLifeDays: record.shelfLifeDays,
        dietaryTags: record.dietaryTags,
        emoji: record.emoji,
        confidence: 'exact',
        storageTip: record.storageTip
      };
    }
  }

  // 2. Alias Match
  for (const record of FOOD_EXPIRY_KNOWLEDGE_BASE) {
    for (const alias of record.aliases) {
      if (normalizeFoodName(alias) === clean) {
        return {
          matchedName: record.name,
          category: record.category,
          shelfLifeDays: record.shelfLifeDays,
          dietaryTags: record.dietaryTags,
          emoji: record.emoji,
          confidence: 'exact',
          storageTip: record.storageTip
        };
      }
    }
  }

  // 3. Substring / Word Match
  for (const record of FOOD_EXPIRY_KNOWLEDGE_BASE) {
    const recordClean = normalizeFoodName(record.name);
    if (clean.includes(recordClean) || recordClean.includes(clean)) {
      return {
        matchedName: record.name,
        category: record.category,
        shelfLifeDays: record.shelfLifeDays,
        dietaryTags: record.dietaryTags,
        emoji: record.emoji,
        confidence: 'fuzzy',
        storageTip: record.storageTip
      };
    }
    for (const alias of record.aliases) {
      const aliasClean = normalizeFoodName(alias);
      if (clean.includes(aliasClean) || aliasClean.includes(clean)) {
        return {
          matchedName: record.name,
          category: record.category,
          shelfLifeDays: record.shelfLifeDays,
          dietaryTags: record.dietaryTags,
          emoji: record.emoji,
          confidence: 'fuzzy',
          storageTip: record.storageTip
        };
      }
    }
  }

  // 4. Domain Heuristic Inference
  return inferHeuristically(clean);
}

/**
 * Searches the memorized food database to provide live suggestions as the user types.
 */
export function searchFoodSuggestions(query: string, limit: number = 8): FoodExpiryRecord[] {
  const clean = normalizeFoodName(query);
  if (!clean || clean.length < 1) return [];

  const scored: Array<{ record: FoodExpiryRecord; score: number }> = [];

  for (const record of FOOD_EXPIRY_KNOWLEDGE_BASE) {
    const nameClean = normalizeFoodName(record.name);
    let score = 0;

    if (nameClean === clean) {
      score = 100;
    } else if (nameClean.startsWith(clean)) {
      score = 80;
    } else if (nameClean.includes(clean)) {
      score = 60;
    } else {
      for (const alias of record.aliases) {
        const aliasClean = normalizeFoodName(alias);
        if (aliasClean === clean) {
          score = Math.max(score, 90);
        } else if (aliasClean.startsWith(clean)) {
          score = Math.max(score, 70);
        } else if (aliasClean.includes(clean)) {
          score = Math.max(score, 50);
        }
      }
    }

    if (score > 0) {
      scored.push({ record, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.record);
}
