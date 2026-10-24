/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MemoryType = 
  | 'inventory_item' 
  | 'user_profile' 
  | 'preference' 
  | 'interaction' 
  | 'recipe_decision';

export type LifecycleStatus = 
  | 'active' 
  | 'perished' 
  | 'restricted' 
  | 'consumed';

export type ItemCategory = 
  | 'produce' 
  | 'dairy' 
  | 'protein' 
  | 'bakery' 
  | 'pantry' 
  | 'beverage';

export interface MemoryOwner {
  userId: string;
  userName: string;
  workspaceId: string; // e.g. "home_fridge", "pantry_main"
  householdRole?: string;
}

export interface MemoryContent {
  item_name?: string;
  quantity?: string;
  category?: ItemCategory;
  shelf_life_days?: number;
  dietary_tags?: string[]; // e.g. ['animal_product', 'egg', 'dairy', 'poultry', 'gluten', 'vegan']
  is_perishable?: boolean;
  dietary_restriction?: string; // for user_profile, e.g. 'vegan', 'vegetarian', 'keto', 'dairy_free'
  text?: string;
  notes?: string;
  recipe_title?: string;
  recipe_description?: string;
  used_ingredients?: string[];
  urgency_tier?: 'critical' | 'high' | 'moderate' | 'stable';
}

export interface MemoryTimestamps {
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  date_added: string; // ISO string
  expires_at: string; // ISO string calculated from date_added + shelf_life_days
}

export interface MemoryLifecycle {
  status: LifecycleStatus;
  invalidated_at?: string;
  invalidation_reason?: string;
  ttl_index_expires_at: string; // Field indexed by MongoDB TTL index
  last_recalled_at?: string;
  recall_count: number;
}

export interface MongoMemoryDocument {
  _id: string; // MongoDB ObjectId representation (24-hex string)
  owner: MemoryOwner;
  type: MemoryType;
  content: MemoryContent;
  source: 'chat_sms' | 'receipt_scan' | 'user_override' | 'agent_inference' | 'policy_update';
  timestamps: MemoryTimestamps;
  lifecycle: MemoryLifecycle;
  embedding?: number[]; // Vector embedding for MongoDB Vector Search
}

export interface VectorSearchResult {
  document: MongoMemoryDocument;
  score: number; // Cosine similarity score [0..1]
  relevanceExplanation: string;
}

export interface ChangeStreamEvent {
  _id: string;
  operationType: 'insert' | 'update' | 'replace' | 'delete' | 'invalidate';
  clusterTime: string;
  ns: {
    db: string;
    coll: string;
  };
  documentKey: {
    _id: string;
  };
  fullDocument?: MongoMemoryDocument;
  updateDescription?: {
    updatedFields?: Partial<MongoMemoryDocument>;
    removedFields?: string[];
  };
  reason?: string;
}

export interface MemoryRecallExplanation {
  query: string;
  activeItemsEvaluated: number;
  selectedItems: {
    itemId: string;
    itemName: string;
    shelfLifeDays: number;
    daysRemaining: number;
    urgencyTier: string;
    vectorSimilarity: number;
    selectionReason: string;
  }[];
  filteredOutItems: {
    itemId: string;
    itemName: string;
    reason: string;
  }[];
  dietaryConstraintsApplied: string[];
}

export interface RecipeSuggestion {
  id?: string;
  title: string;
  description: string;
  prepTime: string;
  categoryTag?: string;
  ingredientsToUseUrgent: string[];
  otherIngredients: string[];
  instructions: string[];
  wasteSavedNote: string;
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  recipe?: RecipeSuggestion;
  recipes?: RecipeSuggestion[];
  recallAudit?: MemoryRecallExplanation;
}
