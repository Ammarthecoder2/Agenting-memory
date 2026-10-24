/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryCollection, cosineSimilarity, generateSemanticEmbedding } from './mongo_engine';

test('MongoDB Document Schema & Creation', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  const doc = collection.insertOne({
    owner: { userId: 'u1', userName: 'Alex', workspaceId: 'kitchen_fridge' },
    type: 'inventory_item',
    source: 'chat_sms',
    content: {
      item_name: 'Fresh Spinach',
      quantity: '1 bag',
      category: 'produce',
      shelf_life_days: 7,
      dietary_tags: ['vegan', 'produce']
    },
    timestamps: {
      createdAt: '2026-10-24T08:00:00Z',
      updatedAt: '2026-10-24T08:00:00Z',
      date_added: '2026-10-24T08:00:00Z',
      expires_at: '2026-10-31T08:00:00Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-10-31T08:00:00Z'
    }
  });

  assert.ok(doc._id, 'Document must have a MongoDB ObjectId');
  assert.equal(doc._id.length, 24, 'ObjectId must be 24 hex characters');
  assert.equal(doc.owner.userId, 'u1');
  assert.equal(doc.lifecycle.status, 'active');
  assert.ok(doc.embedding && doc.embedding.length > 0, 'Document must have generated vector embedding');
});

test('MongoDB TTL Index Sweep marks expired items as perished in background memory', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  
  // Add spinach (7 days expiry -> 2026-10-31)
  const spinach = collection.insertOne({
    owner: { userId: 'u1', userName: 'Alex', workspaceId: 'fridge' },
    type: 'inventory_item',
    source: 'chat_sms',
    content: { item_name: 'Spinach', shelf_life_days: 7 },
    timestamps: {
      createdAt: '2026-10-24T08:00:00Z',
      updatedAt: '2026-10-24T08:00:00Z',
      date_added: '2026-10-24T08:00:00Z',
      expires_at: '2026-10-31T08:00:00Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-10-31T08:00:00Z'
    }
  });

  // Add eggs (21 days expiry -> 2026-11-14)
  const eggs = collection.insertOne({
    owner: { userId: 'u1', userName: 'Alex', workspaceId: 'fridge' },
    type: 'inventory_item',
    source: 'chat_sms',
    content: { item_name: 'Eggs', shelf_life_days: 21 },
    timestamps: {
      createdAt: '2026-10-24T08:00:00Z',
      updatedAt: '2026-10-24T08:00:00Z',
      date_added: '2026-10-24T08:00:00Z',
      expires_at: '2026-11-14T08:00:00Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-11-14T08:00:00Z'
    }
  });

  // Fast forward 5 days (2026-10-29): both still active
  collection.advanceSimulatedDays(5);
  assert.equal(collection.findById(spinach._id)?.lifecycle.status, 'active');
  assert.equal(collection.findById(eggs._id)?.lifecycle.status, 'active');

  // Fast forward another 3 days (total 8 days -> 2026-11-01): Spinach expired, Eggs still active!
  const sweep = collection.advanceSimulatedDays(3);
  assert.equal(sweep.expiredCount, 1, 'Spinach must be auto-expired by TTL Index');
  
  const updatedSpinach = collection.findById(spinach._id);
  assert.equal(updatedSpinach?.lifecycle.status, 'perished');
  assert.ok(updatedSpinach?.lifecycle.invalidation_reason?.includes('TTL Index'));

  const updatedEggs = collection.findById(eggs._id);
  assert.equal(updatedEggs?.lifecycle.status, 'active', 'Eggs should remain active (21 days shelf life)');
});

test('MongoDB Vector Search and Scoped Retrieval', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  collection.seedDemoInventory('user_test', 'home_fridge');

  // Vector search for breakfast greens
  const results = collection.vectorSearch({
    queryText: 'green spinach breakfast toast',
    userId: 'user_test',
    workspaceId: 'home_fridge',
    limit: 5
  });

  assert.ok(results.length > 0, 'Vector search should return items');
  // Highest match should be Spinach or Bread
  const topMatch = results[0];
  assert.ok(
    topMatch.document.content.item_name?.includes('Spinach') ||
    topMatch.document.content.item_name?.includes('Bread'),
    'Expected relevant food items to rank highest'
  );
  assert.ok(topMatch.score > 0.3, 'Similarity score should be significant');
});

test('Dietary Policy Invalidation (Going Vegan Edge Case)', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  collection.seedDemoInventory('user_vegan_test', 'home_fridge');

  // Check active items before
  const activeBefore = collection.find({
    'owner.userId': 'user_vegan_test',
    'lifecycle.status': 'active',
    type: 'inventory_item'
  });
  assert.equal(activeBefore.length, 5, 'Should start with 5 active items');

  // User declares "I went vegan"
  const outcome = collection.applyDietaryConstraint({
    userId: 'user_vegan_test',
    workspaceId: 'home_fridge',
    restriction: 'vegan'
  });

  assert.ok(outcome.profileDoc, 'User profile must be updated with vegan preference');
  assert.equal(outcome.profileDoc.content.dietary_restriction, 'vegan');
  
  // Chicken, Milk, Eggs should be invalidated to 'restricted'
  const invalidatedNames = outcome.invalidatedItems.map(i => i.content.item_name);
  assert.ok(invalidatedNames.some(n => n?.includes('Eggs')), 'Eggs must be invalidated');
  assert.ok(invalidatedNames.some(n => n?.includes('Chicken')), 'Chicken must be invalidated');
  assert.ok(invalidatedNames.some(n => n?.includes('Milk')), 'Milk must be invalidated');

  // Check active items remaining: Only Bread and Spinach!
  const activeAfter = collection.find({
    'owner.userId': 'user_vegan_test',
    'lifecycle.status': 'active',
    type: 'inventory_item'
  });
  assert.equal(activeAfter.length, 2, 'Only vegan items (Spinach, Bread) remain active in fridge');
  
  const remainingNames = activeAfter.map(i => i.content.item_name);
  assert.ok(remainingNames.some(n => n?.includes('Spinach')));
  assert.ok(remainingNames.some(n => n?.includes('Bread')));

  // Check background storage: restricted items exist with explanation
  const backgroundItems = collection.find({
    'owner.userId': 'user_vegan_test',
    'lifecycle.status': 'restricted',
    type: 'inventory_item'
  });
  assert.equal(backgroundItems.length, 3, '3 animal products stored in background unusable memory');
  assert.ok(backgroundItems[0].lifecycle.invalidation_reason?.includes('vegan'));
});

test('MongoDB Change Stream Event Emissions', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  const events: any[] = [];

  const unsubscribe = collection.watch((event) => {
    events.push(event);
  });

  collection.insertOne({
    owner: { userId: 'u1', userName: 'Alex', workspaceId: 'fridge' },
    type: 'inventory_item',
    source: 'chat_sms',
    content: { item_name: 'Apples' },
    timestamps: {
      createdAt: '2026-10-24T08:00:00Z',
      updatedAt: '2026-10-24T08:00:00Z',
      date_added: '2026-10-24T08:00:00Z',
      expires_at: '2026-10-31T08:00:00Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-10-31T08:00:00Z'
    }
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].operationType, 'insert');
  assert.equal(events[0].ns.coll, 'memories');
  assert.ok(events[0].clusterTime.startsWith('Timestamp'));

  unsubscribe();
});

test('Item discard (thrown out) moves to background and deleteOne removes completely', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00Z'));
  const doc = collection.insertOne({
    owner: { userId: 'u_discard', userName: 'Alex', workspaceId: 'fridge' },
    type: 'inventory_item',
    source: 'user_override',
    content: { item_name: 'Greek Yogurt', shelf_life_days: 7 },
    timestamps: {
      createdAt: '2026-10-24T08:00:00Z',
      updatedAt: '2026-10-24T08:00:00Z',
      date_added: '2026-10-24T08:00:00Z',
      expires_at: '2026-10-31T08:00:00Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-10-31T08:00:00Z'
    }
  });

  // User threw it out
  const discarded = collection.discardItem(doc._id, 'Tasted sour, threw away', 'perished');
  assert.ok(discarded);
  assert.equal(discarded.lifecycle.status, 'perished');
  assert.equal(discarded.lifecycle.invalidation_reason, 'Tasted sour, threw away');

  // Verify it is no longer in active items
  const active = collection.find({ 'owner.userId': 'u_discard', 'lifecycle.status': 'active' });
  assert.equal(active.length, 0);

  // Permanently delete document
  const deleted = collection.deleteOne(doc._id);
  assert.equal(deleted, true);
  assert.equal(collection.findById(doc._id), null);
});

