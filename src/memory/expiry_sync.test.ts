import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryCollection } from './mongo_engine';

test('Date and Days synchronization calculations', () => {
  const baseIso = '2026-10-24T08:00:00.000Z';
  const base = new Date(baseIso);

  // 1. Given 5 days, target date must be 2026-10-29
  const target5d = new Date(base.getTime() + 5 * 24 * 3600 * 1000);
  assert.equal(target5d.toISOString().split('T')[0], '2026-10-29');

  // 2. Given a target date '2026-10-31', days diff must be 7
  const targetDateStr = '2026-10-31';
  const targetTime = new Date(targetDateStr).getTime();
  const diffDays = Math.max(1, Math.ceil((targetTime - base.getTime()) / (24 * 3600 * 1000)));
  assert.equal(diffDays, 7);
});

test('TTL Index sweep archives perished items when time advances past expiration', () => {
  const collection = new MongoMemoryCollection(new Date('2026-10-24T08:00:00.000Z'));
  
  // Add item with 4 days shelf life (expires 2026-10-28)
  const item = collection.insertOne({
    owner: { userId: 'u1', userName: 'Alex', workspaceId: 'home_fridge' },
    type: 'inventory_item',
    source: 'user_override',
    content: {
      item_name: 'Fresh Strawberries',
      shelf_life_days: 4,
      is_perishable: true
    },
    timestamps: {
      createdAt: '2026-10-24T08:00:00.000Z',
      updatedAt: '2026-10-24T08:00:00.000Z',
      date_added: '2026-10-24T08:00:00.000Z',
      expires_at: '2026-10-28T08:00:00.000Z'
    },
    lifecycle: {
      status: 'active',
      recall_count: 0,
      ttl_index_expires_at: '2026-10-28T08:00:00.000Z'
    }
  });

  assert.equal(item.lifecycle.status, 'active');

  // Advance time by 2 days -> still active, days left = 2
  const outcome2 = collection.advanceSimulatedDays(2);
  assert.equal(outcome2.expiredCount, 0);
  const activeCheck = collection.findById(item._id);
  assert.equal(activeCheck?.lifecycle.status, 'active');

  // Advance time by another 3 days (total +5 days from start) -> expired!
  const outcome5 = collection.advanceSimulatedDays(3);
  assert.equal(outcome5.expiredCount, 1);
  const perishedCheck = collection.findById(item._id);
  assert.equal(perishedCheck?.lifecycle.status, 'perished');
});
