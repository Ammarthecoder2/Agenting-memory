/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { globalMongoMemory } from './src/memory/mongo_engine';
import { agentService } from './src/services/agent_service';
import { ChangeStreamEvent } from './src/types/memory';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Clean initial state: Starts empty without default items per user request

  // API Route: Current DB Status & Simulated Clock
  app.get('/api/status', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user_demo_1';
    const active = globalMongoMemory.find({ 'owner.userId': userId, 'lifecycle.status': 'active', type: 'inventory_item' });
    const perished = globalMongoMemory.find({ 'owner.userId': userId, 'lifecycle.status': 'perished', type: 'inventory_item' });
    const restricted = globalMongoMemory.find({ 'owner.userId': userId, 'lifecycle.status': 'restricted', type: 'inventory_item' });
    const profiles = globalMongoMemory.find({ 'owner.userId': userId, type: 'user_profile' });
    const activeRestriction = profiles.find(p => p.lifecycle.status === 'active')?.content.dietary_restriction || 'none';

    res.json({
      dbName: globalMongoMemory.dbName,
      collName: globalMongoMemory.collName,
      simulatedNow: globalMongoMemory.getSimulatedNow().toISOString(),
      counts: {
        active: active.length,
        perished: perished.length,
        restricted: restricted.length,
        total: active.length + perished.length + restricted.length
      },
      activeDietaryRestriction: activeRestriction
    });
  });

  // API Route: List Memories
  app.get('/api/memories', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user_demo_1';
    const workspaceId = req.query.workspaceId as string;
    const status = req.query.status as any;
    const type = req.query.type as string;

    const filter: any = { 'owner.userId': userId };
    if (workspaceId) filter['owner.workspaceId'] = workspaceId;
    if (status) filter['lifecycle.status'] = status;
    if (type) filter.type = type;

    const docs = globalMongoMemory.find(filter);
    res.json({
      success: true,
      count: docs.length,
      simulatedNow: globalMongoMemory.getSimulatedNow().toISOString(),
      documents: docs
    });
  });

  // API Route: MongoDB Vector Search
  app.post('/api/memories/vector-search', (req: Request, res: Response) => {
    const { queryText, userId = 'user_demo_1', workspaceId, type, status, limit, minScore } = req.body;
    if (!queryText) {
      res.status(400).json({ error: 'queryText is required' });
      return;
    }

    const results = globalMongoMemory.vectorSearch({
      queryText,
      userId,
      workspaceId,
      type,
      status,
      limit: limit ? Number(limit) : 10,
      minScore: minScore ? Number(minScore) : 0.1
    });

    res.json({
      success: true,
      queryText,
      resultCount: results.length,
      results
    });
  });

  // API Route: Advance Simulated Time (Triggers TTL Index sweep)
  app.post('/api/memories/advance-time', (req: Request, res: Response) => {
    const { days = 1 } = req.body;
    const outcome = globalMongoMemory.advanceSimulatedDays(Number(days));
    res.json({
      success: true,
      message: `Simulated clock advanced by ${days} days.`,
      newSimulatedNow: outcome.newDate,
      expiredCount: outcome.expiredCount
    });
  });

  // API Route: Add Custom Grocery Item to Active Memory
  app.post('/api/memories/item', (req: Request, res: Response) => {
    const {
      itemName,
      quantity = '1 portion',
      category = 'produce',
      shelfLifeDays = 7,
      dietaryTags = [],
      userId = 'user_demo_1',
      workspaceId = 'home_fridge',
      userName = 'Alex'
    } = req.body;

    if (!itemName || !itemName.trim()) {
      res.status(400).json({ error: 'itemName is required' });
      return;
    }

    const now = globalMongoMemory.getSimulatedNow();
    const expiresDate = new Date(now.getTime() + Number(shelfLifeDays) * 24 * 3600 * 1000);

    const doc = globalMongoMemory.insertOne({
      owner: { userId, userName, workspaceId },
      type: 'inventory_item',
      source: 'user_override',
      content: {
        item_name: itemName.trim(),
        quantity: quantity.trim() || '1 portion',
        category,
        shelf_life_days: Number(shelfLifeDays),
        dietary_tags: dietaryTags,
        is_perishable: true,
        notes: 'Added manually via item entry form'
      },
      timestamps: {
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        date_added: now.toISOString(),
        expires_at: expiresDate.toISOString(),
      },
      lifecycle: {
        status: 'active',
        recall_count: 0,
        ttl_index_expires_at: expiresDate.toISOString(),
      }
    });

    res.json({ success: true, item: doc });
  });

  // API Route: Discard or Mark Item Thrown Out / Consumed
  app.post('/api/memories/item/:id/discard', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason = 'Thrown out by user', status = 'perished' } = req.body;
    const doc = globalMongoMemory.discardItem(id, reason, status as any);
    if (!doc) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json({ success: true, item: doc });
  });

  // API Route: Permanently Delete Item Document
  app.delete('/api/memories/item/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = globalMongoMemory.deleteOne(id);
    if (!success) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json({ success: true, message: 'Item deleted' });
  });

  // API Route: Clear All Memory Items for User (Clean Slate)
  app.post('/api/memories/clear', (req: Request, res: Response) => {
    const { userId = 'user_demo_1' } = req.body;
    const items = globalMongoMemory.find({ 'owner.userId': userId });
    for (const item of items) {
      globalMongoMemory.deleteOne(item._id);
    }
    res.json({ success: true, message: `Cleared ${items.length} items.` });
  });

  // API Route: Seed Demo Data
  app.post('/api/memories/seed', (req: Request, res: Response) => {
    const { userId = 'user_demo_1', workspaceId = 'home_fridge' } = req.body;
    // Reset clock to baseline
    globalMongoMemory.setSimulatedNow(new Date('2026-10-24T08:00:00.000Z'));
    const items = globalMongoMemory.seedDemoInventory(userId, workspaceId);
    res.json({
      success: true,
      message: 'Demo inventory seeded successfully.',
      itemsCount: items.length,
      items
    });
  });

  // API Route: Dietary Policy Update (Edge Case: Going Vegan)
  app.post('/api/dietary-policy', (req: Request, res: Response) => {
    const { userId = 'user_demo_1', workspaceId = 'home_fridge', restriction = 'vegan' } = req.body;
    const result = globalMongoMemory.applyDietaryConstraint({
      userId,
      workspaceId,
      restriction
    });
    res.json({
      success: true,
      restriction,
      profile: result.profileDoc,
      invalidatedCount: result.invalidatedItems.length,
      invalidatedItems: result.invalidatedItems
    });
  });

  // API Route: Chat with Persistent Agent
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messageText, userId = 'user_demo_1', workspaceId = 'home_fridge', userName = 'Alex' } = req.body;
      if (!messageText) {
        res.status(400).json({ error: 'messageText is required' });
        return;
      }

      const response = await agentService.handleUserMessage({
        messageText,
        userId,
        workspaceId,
        userName
      });

      res.json({
        success: true,
        message: response
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // API Route: MongoDB Change Stream Server-Sent Events (SSE)
  app.get('/api/stream/changes', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial handshake
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Subscribed to MongoDB Change Stream (pantry_mind_db.memories)',
      clusterTime: globalMongoMemory.getSimulatedNow().toISOString()
    })}\n\n`);

    const unsubscribe = globalMongoMemory.watch((event: ChangeStreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // Mount Vite development middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PantryMind server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
