/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DemoWalkthroughBar } from './components/DemoWalkthroughBar';
import { ChatInterface } from './components/ChatInterface';
import { MemoryInspector } from './components/MemoryInspector';
import { ExpirationAlertBanner } from './components/ExpirationAlertBanner';
import { ExpiryAlertTray } from './components/ExpiryAlertTray';
import { 
  MongoMemoryDocument, 
  AgentChatMessage, 
  ChangeStreamEvent, 
  MemoryRecallExplanation,
  VectorSearchResult
} from './types/memory';

export default function App() {
  const [userId, setUserId] = useState('user_demo_1');
  const [workspaceId, setWorkspaceId] = useState('home_fridge');
  const [simulatedNow, setSimulatedNow] = useState('2026-10-24T08:00:00.000Z');
  const [activeDocs, setActiveDocs] = useState<MongoMemoryDocument[]>([]);
  const [perishedDocs, setPerishedDocs] = useState<MongoMemoryDocument[]>([]);
  const [restrictedDocs, setRestrictedDocs] = useState<MongoMemoryDocument[]>([]);
  const [profileDoc, setProfileDoc] = useState<MongoMemoryDocument | undefined>();
  const [changeEvents, setChangeEvents] = useState<ChangeStreamEvent[]>([]);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'init_welcome',
      sender: 'agent',
      text: `👋 **Welcome to PantryMind!** I'm your persistent grocery memory agent.\n\n` +
            `• **Clean Empty Start:** Add what you actually have with the **+ Add Item** button or text me (e.g. *"I bought spinach, sourdough bread, eggs"*).\n` +
            `• **Threw Something Out?** Click **🗑️ Threw Out** on any card or tell me *"I threw out the milk"* to log it in background memory.\n` +
            `• **Zero-Waste Meals:** When hungry, text *"I'm starving"* to prioritize ingredients before their TTL expiration!\n` +
            `• **Dietary Shifts:** Say *"I went vegan"* to immediately invalidate animal products and adapt your profile.`,
      timestamp: '2026-10-24T08:00:00.000Z'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecallAudit, setSelectedRecallAudit] = useState<MemoryRecallExplanation | null>(null);
  const [inspectorTab, setInspectorTab] = useState<string>('active');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAlertTrayOpen, setIsAlertTrayOpen] = useState(false);

  // Compute days remaining until TTL index expiration
  const calculateDaysRemaining = (ttlDateStr: string) => {
    const ttlTime = new Date(ttlDateStr).getTime();
    const nowTime = new Date(simulatedNow).getTime();
    return Number(((ttlTime - nowTime) / (24 * 3600 * 1000)).toFixed(1));
  };

  // Find all active inventory items approaching expiration
  const expiringItems = activeDocs
    .map((doc) => {
      const daysLeft = calculateDaysRemaining(doc.lifecycle.ttl_index_expires_at);
      return {
        doc,
        daysLeft,
        isCritical: daysLeft <= 1.5,
        isUrgent: daysLeft <= 3.0
      };
    })
    .filter((i) => i.isUrgent)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Fetch all documents and system status
  const refreshMemoryState = useCallback(async () => {
    try {
      const [statusRes, docsRes] = await Promise.all([
        fetch(`/api/status?userId=${userId}`),
        fetch(`/api/memories?userId=${userId}&workspaceId=${workspaceId}`)
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSimulatedNow(statusData.simulatedNow);
      }

      if (docsRes.ok) {
        const data = await docsRes.json();
        const all: MongoMemoryDocument[] = data.documents || [];
        
        setActiveDocs(all.filter(d => d.type === 'inventory_item' && d.lifecycle.status === 'active'));
        setPerishedDocs(all.filter(d => d.type === 'inventory_item' && d.lifecycle.status === 'perished'));
        setRestrictedDocs(all.filter(d => d.type === 'inventory_item' && d.lifecycle.status === 'restricted'));
        
        const profile = all.find(d => d.type === 'user_profile' && d.owner.userId === userId);
        setProfileDoc(profile);
      }
    } catch (err) {
      console.error('Error refreshing memory state:', err);
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    refreshMemoryState();
  }, [refreshMemoryState]);

  // Connect to MongoDB Change Stream Server-Sent Events (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/stream/changes');

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.operationType) {
          setChangeEvents((prev) => [parsed, ...prev.slice(0, 49)]);
          // Refresh documents whenever a MongoDB change event occurs
          refreshMemoryState();
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [refreshMemoryState]);

  // Send message to agent
  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    const userMsg: AgentChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: simulatedNow
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: text,
          userId,
          workspaceId,
          userName: 'Alex'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          if (data.message.recallAudit) {
            setSelectedRecallAudit(data.message.recallAudit);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      refreshMemoryState();
    }
  };

  // Advance time by X days (simulating TTL)
  const handleAdvanceDays = async (days: number) => {
    try {
      const res = await fetch('/api/memories/advance-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulatedNow(data.newSimulatedNow);
        refreshMemoryState();

        if (data.expiredCount > 0) {
          // Notify user in chat
          setMessages((prev) => [
            ...prev,
            {
              id: `sys_${Date.now()}`,
              sender: 'system',
              text: `🔔 **MongoDB TTL Index Triggered:** ${data.expiredCount} item(s) exceeded shelf life and were automatically archived in **Background Unusable Memory** (status: \`perished\`).`,
              timestamp: data.newSimulatedNow
            }
          ]);
        } else {
          // Check if any active items are now urgent (< 2.5 days left)
          const newNowTime = new Date(data.newSimulatedNow).getTime();
          const newlyUrgent = activeDocs.filter(d => {
            const ttlTime = new Date(d.lifecycle.ttl_index_expires_at).getTime();
            const daysLeft = (ttlTime - newNowTime) / (24 * 3600 * 1000);
            return daysLeft > 0 && daysLeft <= 2.5;
          });

          if (newlyUrgent.length > 0) {
            const names = newlyUrgent.map(d => d.content.item_name).join(', ');
            setMessages((prev) => [
              ...prev,
              {
                id: `sys_alert_${Date.now()}`,
                sender: 'system',
                text: `⚠️ **Expiration Warning:** ${names} is nearing its TTL expiration limit (< 2.5 days left)! Say *"I'm starving"* or click **Cook This** to rescue it before it perishes.`,
                timestamp: data.newSimulatedNow
              }
            ]);
          }
        }
      }
    } catch (err) {
      console.error('Error advancing time:', err);
    }
  };

  // Cook recipe specifically highlighting a rescued item
  const handleCookRecipe = async (itemName: string) => {
    await handleSendMessage(`I want to cook a meal using my ${itemName} before it spoils. What recipe do you suggest?`);
  };

  // Cook zero-waste recipe using all urgent items
  const handleCookAllUrgent = async () => {
    await handleSendMessage("I'm starving! Please suggest a zero-waste recipe to rescue my soon-to-expire ingredients.");
  };

  // Reset state to clean empty start
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/memories/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setCurrentStep(1);
        setSelectedRecallAudit(null);
        setInspectorTab('active');
        refreshMemoryState();
        setMessages([
          {
            id: 'reset_init',
            sender: 'agent',
            text: `🔄 **Clean Slate!** Cleared all items from your MongoDB collection. Your fridge is now completely empty. Add what you have in your kitchen or click **+ Add Item** to get started!`,
            timestamp: '2026-10-24T08:00:00.000Z'
          }
        ]);
      }
    } catch (err) {
      console.error('Error resetting demo:', err);
    }
  };

  // Add custom item
  const handleAddItem = async (item: {
    itemName: string;
    quantity: string;
    category: any;
    shelfLifeDays: number;
    dietaryTags: string[];
  }) => {
    try {
      const res = await fetch('/api/memories/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          userId,
          workspaceId
        })
      });
      if (res.ok) {
        refreshMemoryState();
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  // Discard item (threw out or consumed)
  const handleDiscardItem = async (id: string, reason: string, status: 'perished' | 'consumed') => {
    try {
      const res = await fetch(`/api/memories/item/${id}/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, status })
      });
      if (res.ok) {
        refreshMemoryState();
      }
    } catch (err) {
      console.error('Error discarding item:', err);
    }
  };

  // Permanently delete item
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/item/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshMemoryState();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Load demo groceries
  const handleLoadDemoData = async () => {
    try {
      const res = await fetch('/api/memories/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId })
      });
      if (res.ok) {
        refreshMemoryState();
      }
    } catch (err) {
      console.error('Error loading demo data:', err);
    }
  };

  // Vector Search callback
  const handleRunVectorSearch = async (queryText: string): Promise<VectorSearchResult[]> => {
    const res = await fetch('/api/memories/vector-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryText,
        userId,
        workspaceId,
        minScore: 0.05,
        limit: 10
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
    return [];
  };

  // Dietary policy update callback
  const handleUpdateDietaryPolicy = async (policy: 'vegan' | 'vegetarian' | 'dairy_free' | 'none') => {
    try {
      const res = await fetch('/api/dietary-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId, restriction: policy })
      });
      if (res.ok) {
        refreshMemoryState();
      }
    } catch (err) {
      console.error('Dietary update error:', err);
    }
  };

  // Execute guided Hackathon steps
  const handleExecuteStep = async (stepNumber: number) => {
    setCurrentStep(stepNumber);

    if (stepNumber === 1) {
      // Step 1: Casual Haul
      setInspectorTab('active');
      await handleSendMessage("Bought eggs, spinach, bread, chicken breast, fresh milk");
    } else if (stepNumber === 2) {
      // Step 2: +5 Days Later
      setInspectorTab('active');
      await handleAdvanceDays(5);
    } else if (stepNumber === 3) {
      // Step 3: "I'm starving"
      setInspectorTab('active');
      await handleSendMessage("I'm starving");
    } else if (stepNumber === 4) {
      // Step 4: Memory Inspector
      setInspectorTab('vector');
    } else if (stepNumber === 5) {
      // Step 5: "I went vegan" (Edge case invalidation)
      setInspectorTab('profile');
      await handleSendMessage("I went vegan");
    } else if (stepNumber === 6) {
      // Step 6: Background Unusable Memory
      setInspectorTab('background');
      await handleSendMessage("What meat or unusable items do I have in background memory?");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(2,6,23,1))] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        simulatedNow={simulatedNow}
        activeCount={activeDocs.length}
        perishedCount={perishedDocs.length}
        restrictedCount={restrictedDocs.length}
        dietaryRestriction={profileDoc?.content.dietary_restriction || 'none'}
        expiringCount={expiringItems.length}
        onAdvanceDays={handleAdvanceDays}
        onResetDemo={handleResetDemo}
        currentUser={userId}
        onUserChange={setUserId}
        onToggleAlertTray={() => setIsAlertTrayOpen(prev => !prev)}
        isAlertTrayOpen={isAlertTrayOpen}
      />

      {/* Guided Walkthrough Bar */}
      <DemoWalkthroughBar
        currentStep={currentStep}
        onExecuteStep={handleExecuteStep}
        onOpenInspectorTab={setInspectorTab}
      />

      {/* Proactive Expiration Alert Banner */}
      <ExpirationAlertBanner
        expiringItems={expiringItems}
        onCookRecipe={handleCookRecipe}
        onCookAllUrgent={handleCookAllUrgent}
        onDiscardItem={handleDiscardItem}
      />

      {/* Expiry Alert Center Tray Modal */}
      <ExpiryAlertTray
        isOpen={isAlertTrayOpen}
        onClose={() => setIsAlertTrayOpen(false)}
        expiringItems={expiringItems}
        onCookRecipe={handleCookRecipe}
        onCookAllUrgent={handleCookAllUrgent}
        onDiscardItem={handleDiscardItem}
      />

      {/* Main 2-Column Split Workspace */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Natural Conversational Agent (5 cols) */}
        <div className="md:col-span-5 h-full overflow-hidden flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onInspectRecall={(audit) => {
              setSelectedRecallAudit(audit);
              setInspectorTab('active');
            }}
          />
        </div>

        {/* Right Column: MongoDB Memory & Vector Inspector (7 cols) */}
        <div className="md:col-span-7 h-full overflow-hidden flex flex-col">
          <MemoryInspector
            activeDocuments={activeDocs}
            perishedDocuments={perishedDocs}
            restrictedDocuments={restrictedDocs}
            profileDocument={profileDoc}
            changeStreamEvents={changeEvents}
            simulatedNow={simulatedNow}
            onRunVectorSearch={handleRunVectorSearch}
            onUpdateDietaryPolicy={handleUpdateDietaryPolicy}
            onAddItem={handleAddItem}
            onDiscardItem={handleDiscardItem}
            onDeleteItem={handleDeleteItem}
            onLoadDemoData={handleLoadDemoData}
            selectedRecallAudit={selectedRecallAudit}
            activeTabKey={inspectorTab}
            onTabChange={setInspectorTab}
            onCookRecipe={handleCookRecipe}
          />
        </div>
      </main>
    </div>
  );
}
