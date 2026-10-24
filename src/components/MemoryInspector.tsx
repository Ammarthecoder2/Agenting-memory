/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Archive, 
  Search, 
  UserCheck, 
  Activity, 
  Clock, 
  Tag, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertTriangle,
  FileCode,
  Filter,
  Flame
} from 'lucide-react';
import { 
  MongoMemoryDocument, 
  ChangeStreamEvent, 
  VectorSearchResult, 
  MemoryRecallExplanation 
} from '../types/memory';

const QUICK_PRESETS = [
  { name: 'Fresh Spinach', emoji: '🥬', category: 'produce' as const, days: 7, tags: ['vegan', 'vegetarian'] },
  { name: 'Ripe Avocados', emoji: '🥑', category: 'produce' as const, days: 5, tags: ['vegan', 'vegetarian'] },
  { name: 'Pasture Eggs', emoji: '🥚', category: 'dairy' as const, days: 14, tags: ['vegetarian', 'dairy', 'animal_product', 'non-vegan'] },
  { name: 'Artisan Sourdough', emoji: '🥖', category: 'bakery' as const, days: 10, tags: ['vegan', 'vegetarian', 'grain'] },
  { name: 'Chicken Breast', emoji: '🍗', category: 'protein' as const, days: 4, tags: ['meat', 'poultry', 'animal_product', 'non-vegan'] },
  { name: 'Whole Milk', emoji: '🥛', category: 'dairy' as const, days: 7, tags: ['dairy', 'animal_product', 'non-vegan'] },
  { name: 'Vine Tomatoes', emoji: '🍅', category: 'produce' as const, days: 6, tags: ['vegan', 'vegetarian'] },
  { name: 'Aged Cheddar', emoji: '🧀', category: 'dairy' as const, days: 21, tags: ['dairy', 'vegetarian', 'non-vegan'] },
];

const getCategoryEmoji = (name: string, cat?: string) => {
  const n = name.toLowerCase();
  if (n.includes('spinach')) return '🥬';
  if (n.includes('avocado')) return '🥑';
  if (n.includes('egg')) return '🥚';
  if (n.includes('bread') || n.includes('sourdough')) return '🥖';
  if (n.includes('chicken') || n.includes('meat') || n.includes('beef') || n.includes('poultry')) return '🍗';
  if (n.includes('milk') || n.includes('cream')) return '🥛';
  if (n.includes('cheese') || n.includes('cheddar')) return '🧀';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('apple')) return '🍎';
  if (n.includes('mushroom')) return '🍄';
  if (cat === 'produce') return '🥗';
  if (cat === 'dairy') return '🥛';
  if (cat === 'protein') return '🥩';
  if (cat === 'bakery') return '🍞';
  if (cat === 'beverage') return '🧃';
  return '🥫';
};

interface MemoryInspectorProps {
  activeDocuments: MongoMemoryDocument[];
  perishedDocuments: MongoMemoryDocument[];
  restrictedDocuments: MongoMemoryDocument[];
  profileDocument?: MongoMemoryDocument;
  changeStreamEvents: ChangeStreamEvent[];
  simulatedNow: string;
  onRunVectorSearch: (query: string) => Promise<VectorSearchResult[]>;
  onUpdateDietaryPolicy: (policy: 'vegan' | 'vegetarian' | 'dairy_free' | 'none') => void;
  onAddItem: (item: {
    itemName: string;
    quantity: string;
    category: any;
    shelfLifeDays: number;
    dietaryTags: string[];
  }) => Promise<void>;
  onDiscardItem: (id: string, reason: string, status: 'perished' | 'consumed') => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onLoadDemoData: () => Promise<void>;
  selectedRecallAudit?: MemoryRecallExplanation | null;
  activeTabKey?: string;
  onTabChange?: (tabKey: string) => void;
  onCookRecipe?: (itemName: string) => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  activeDocuments,
  perishedDocuments,
  restrictedDocuments,
  profileDocument,
  changeStreamEvents,
  simulatedNow,
  onRunVectorSearch,
  onUpdateDietaryPolicy,
  onAddItem,
  onDiscardItem,
  onDeleteItem,
  onLoadDemoData,
  selectedRecallAudit,
  activeTabKey = 'active',
  onTabChange,
  onCookRecipe
}) => {
  const [currentTab, setCurrentTab] = useState<'active' | 'background' | 'vector' | 'profile' | 'stream'>(
    (activeTabKey as any) || 'active'
  );
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [vectorQuery, setVectorQuery] = useState('');
  const [vectorResults, setVectorResults] = useState<VectorSearchResult[]>([]);
  const [isSearchingVector, setIsSearchingVector] = useState(false);
  const [backgroundFilter, setBackgroundFilter] = useState<'all' | 'perished' | 'restricted'>('all');

  // New item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1 portion');
  const [newItemCategory, setNewItemCategory] = useState<'produce' | 'dairy' | 'protein' | 'bakery' | 'pantry' | 'beverage'>('produce');
  const [newItemShelfLife, setNewItemShelfLife] = useState(7);
  const [isVeganTag, setIsVeganTag] = useState(true);
  const [isVegetarianTag, setIsVegetarianTag] = useState(true);
  const [isDairyTag, setIsDairyTag] = useState(false);
  const [isMeatTag, setIsMeatTag] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isSubmittingItem) return;
    setIsSubmittingItem(true);
    try {
      const tags: string[] = [];
      if (isVeganTag) tags.push('vegan');
      if (isVegetarianTag) tags.push('vegetarian');
      if (isDairyTag) tags.push('dairy', 'non-vegan');
      if (isMeatTag) tags.push('meat', 'poultry', 'non-vegan');
      if (!isMeatTag && !isDairyTag && !isVeganTag) tags.push('vegetarian');

      await onAddItem({
        itemName: newItemName.trim(),
        quantity: newItemQty.trim() || '1 portion',
        category: newItemCategory,
        shelfLifeDays: Number(newItemShelfLife) || 7,
        dietaryTags: tags
      });

      // Reset form
      setNewItemName('');
      setNewItemQty('1 portion');
      setNewItemShelfLife(7);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle external tab change sync
  const setTab = (tab: 'active' | 'background' | 'vector' | 'profile' | 'stream') => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleVectorSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vectorQuery.trim()) return;
    setIsSearchingVector(true);
    try {
      const results = await onRunVectorSearch(vectorQuery);
      setVectorResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingVector(false);
    }
  };

  const calculateDaysRemaining = (ttlDateStr: string) => {
    const ttlTime = new Date(ttlDateStr).getTime();
    const nowTime = new Date(simulatedNow).getTime();
    return Number(((ttlTime - nowTime) / (24 * 3600 * 1000)).toFixed(1));
  };

  const unusableDocs = [
    ...restrictedDocuments.map(d => ({ ...d, unusableType: 'restricted' })),
    ...perishedDocuments.map(d => ({ ...d, unusableType: 'perished' }))
  ].filter(d => {
    if (backgroundFilter === 'perished') return d.lifecycle.status === 'perished';
    if (backgroundFilter === 'restricted') return d.lifecycle.status === 'restricted';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border-l border-slate-800/80 text-slate-100">
      {/* Inspector Tab Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 overflow-x-auto scrollbar-none">
        <div className="flex space-x-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              currentTab === 'active'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Fridge ({activeDocuments.length})</span>
          </button>

          <button
            onClick={() => setTab('background')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              currentTab === 'background'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({restrictedDocuments.length + perishedDocuments.length})</span>
          </button>

          <button
            onClick={() => setTab('vector')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              currentTab === 'vector'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>$vectorSearch</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              currentTab === 'profile'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-md shadow-purple-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Constraints</span>
          </button>

          <button
            onClick={() => setTab('stream')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              currentTab === 'stream'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Change Stream ({changeStreamEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Recall Audit Banner if provided */}
      {selectedRecallAudit && (
        <div className="bg-cyan-950/40 border-b border-cyan-500/30 px-4 py-2.5 flex items-start justify-between gap-3 shadow-inner">
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-300">Agent Memory Recall Reason:</span>
            </div>
            <p className="text-slate-300">
              User Query: &ldquo;<span className="text-white italic">{selectedRecallAudit.query}</span>&rdquo;
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] pt-1">
              <span className="px-2 py-0.5 rounded-md bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                Active evaluated: {selectedRecallAudit.activeItemsEvaluated}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-900/60 text-amber-200 border border-amber-700/50">
                Urgent Picked: {selectedRecallAudit.selectedItems.map(s => `${s.itemName} (${s.daysRemaining}d left)`).join(', ')}
              </span>
              {selectedRecallAudit.dietaryConstraintsApplied.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-200 border border-purple-700/50">
                  Constraint Applied: {selectedRecallAudit.dietaryConstraintsApplied.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Active Fridge */}
      {currentTab === 'active' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-0.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Primary Fridge Storage</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-mono">{activeDocuments.length} active items</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95 border border-emerald-400/30"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Custom Item'}</span>
              </button>
              <span className="hidden sm:flex items-center space-x-1 text-emerald-400/90 text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>TTL Index Active</span>
              </span>
            </div>
          </div>

          {/* Quick-Add Popular Groceries Shelf */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick-Add Groceries (1-Click):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Auto TTL index calculation</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddItem({
                    itemName: p.name,
                    quantity: '1 portion',
                    category: p.category,
                    shelfLifeDays: p.days,
                    dietaryTags: p.tags
                  })}
                  className="group px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 hover:border-emerald-500/60 border border-slate-750 text-xs text-slate-200 transition-all cursor-pointer flex items-center space-x-2 shrink-0 active:scale-95 shadow-sm hover:shadow-emerald-950/30"
                  title={`Add ${p.name} (Shelf life: ${p.days} days)`}
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{p.emoji}</span>
                  <div className="text-left">
                    <span className="font-bold text-slate-100 block group-hover:text-emerald-300 transition-colors">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">TTL: {p.days}d</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Item Form Card */}
          {showAddForm && (
            <form onSubmit={handleCreateItemSubmit} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3.5 shadow-xl shadow-emerald-950/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add New Grocery Item to MongoDB</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Fresh Spinach, Oat Milk, Sourdough"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Quantity</label>
                  <input
                    type="text"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="e.g. 1 bag, 500g, 2 pieces"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="produce">Produce (Veggies & Fruits)</option>
                    <option value="dairy">Dairy & Eggs</option>
                    <option value="protein">Protein (Poultry, Meat, Tofu)</option>
                    <option value="bakery">Bakery & Grains</option>
                    <option value="pantry">Pantry & Canned</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Shelf Life (Days) for TTL Expiry</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newItemShelfLife}
                    onChange={(e) => setNewItemShelfLife(parseInt(e.target.value, 10) || 7)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Dietary Tag Toggles */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-400 block">Dietary Compatibility:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isVeganTag}
                      onChange={(e) => {
                        setIsVeganTag(e.target.checked);
                        if (e.target.checked) {
                          setIsMeatTag(false);
                          setIsDairyTag(false);
                          setIsVegetarianTag(true);
                        }
                      }}
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-emerald-300">Vegan</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isVegetarianTag}
                      onChange={(e) => setIsVegetarianTag(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300">Vegetarian</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isDairyTag}
                      onChange={(e) => {
                        setIsDairyTag(e.target.checked);
                        if (e.target.checked) setIsVeganTag(false);
                      }}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300">Dairy / Eggs</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isMeatTag}
                      onChange={(e) => {
                        setIsMeatTag(e.target.checked);
                        if (e.target.checked) {
                          setIsVeganTag(false);
                          setIsVegetarianTag(false);
                        }
                      }}
                      className="rounded accent-red-500"
                    />
                    <span className="text-slate-300">Meat / Poultry</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim() || isSubmittingItem}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950"
                >
                  {isSubmittingItem ? 'Adding to MongoDB...' : 'Save Item to Fridge'}
                </button>
              </div>
            </form>
          )}

          {activeDocuments.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-3xl bg-slate-950/70 border border-slate-800/90 text-slate-400 space-y-4 shadow-xl shadow-black/40">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-950 border border-slate-750 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Database className="w-7 h-7" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-white text-base tracking-tight">Your Virtual Fridge is Fresh & Clean</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Start fresh! Add what you brought home from the grocery store with 1-click presets above, or let the AI agent log your haul automatically.
                </p>
              </div>
              <div className="flex justify-center items-center gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-950/50 transition-all active:scale-95 border border-emerald-400/30"
                >
                  + Add Custom Grocery
                </button>
                <button
                  onClick={onLoadDemoData}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs cursor-pointer border border-slate-700/80 transition-all active:scale-95 shadow-sm"
                >
                  ⚡ Load Sample Haul
                </button>
              </div>
            </div>
          ) : (
            activeDocuments.map((doc) => {
              const daysLeft = calculateDaysRemaining(doc.lifecycle.ttl_index_expires_at);
              const totalDays = doc.content.shelf_life_days || 7;
              const percentElapsed = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
              const isCritical = daysLeft <= 1.5;
              const isUrgent = daysLeft <= 2.5;
              const isExpanded = expandedDocId === doc._id;
              const emoji = getCategoryEmoji(doc.content.item_name || '', doc.content.category);

              return (
                <div
                  key={doc._id}
                  className={`rounded-2xl border transition-all p-4 shadow-md backdrop-blur-md ${
                    isCritical
                      ? 'bg-rose-950/25 border-rose-500/50 hover:border-rose-400 shadow-rose-950/20'
                      : isUrgent
                      ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400 shadow-amber-950/20'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      {/* Category Emoji Container */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner border ${
                        isCritical
                          ? 'bg-rose-950/60 border-rose-500/40'
                          : isUrgent
                          ? 'bg-amber-950/60 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800'
                      }`}>
                        {emoji}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm tracking-tight">{doc.content.item_name}</h3>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-xs text-slate-300 font-medium">{doc.content.quantity || '1 portion'}</span>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-xs text-slate-400 capitalize">{doc.content.category}</span>
                        </div>

                        {/* Freshness & TTL Progress Bar */}
                        <div className="space-y-1 pt-0.5 max-w-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-bold flex items-center space-x-1.5 ${
                                isCritical ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {(isCritical || isUrgent) && (
                                <AlertTriangle className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400' : 'text-amber-400'} animate-pulse`} />
                              )}
                              <span>{daysLeft <= 0 ? '⚠️ Expired / Expiring Today' : `${daysLeft} days remaining`}</span>
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              Expiry: {new Date(doc.lifecycle.ttl_index_expires_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Visual Freshness Bar */}
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isCritical
                                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                                  : isUrgent
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`}
                              style={{ width: `${percentElapsed}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & BSON trigger */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {isCritical ? (
                        <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-extrabold rounded-lg tracking-wide animate-pulse">
                          CRITICAL EXPIRE
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-extrabold rounded-lg tracking-wide">
                          PRIORITY RECALL
                        </span>
                      ) : null}
                      <button
                        onClick={() => setExpandedDocId(isExpanded ? null : doc._id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                        title="View MongoDB Document BSON"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Dietary Tags & Card Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-800/70">
                    <div className="flex flex-wrap gap-1">
                      {doc.content.dietary_tags?.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Quick Removal Actions: Cook This, Threw Out, Consumed, Delete */}
                    <div className="flex items-center space-x-1.5">
                      {onCookRecipe && (
                        <button
                          onClick={() => onCookRecipe(doc.content.item_name || 'ingredient')}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 border border-emerald-500/50 transition-all cursor-pointer flex items-center space-x-1 shadow-sm active:scale-95"
                          title={`Cook a zero-waste recipe using ${doc.content.item_name}`}
                        >
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cook This</span>
                        </button>
                      )}

                      <button
                        onClick={() => onDiscardItem(doc._id, 'Manually thrown out by user', 'perished')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
                        title="Mark as thrown out (moves to background unusable memory)"
                      >
                        <span>🗑️ Threw Out</span>
                      </button>

                      <button
                        onClick={() => onDiscardItem(doc._id, 'Consumed / eaten by user', 'consumed')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all cursor-pointer active:scale-95"
                        title="Mark as eaten / consumed"
                      >
                        <span>🍴 Ate</span>
                      </button>

                      <button
                        onClick={() => onDeleteItem(doc._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Permanently delete document"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Expanded BSON / Document Explorer */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="flex items-center space-x-1.5 font-semibold text-slate-300">
                          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>MongoDB BSON Document:</span>
                        </span>
                        <span className="font-mono text-emerald-400 text-[10px]">_id: {doc._id}</span>
                      </div>
                      <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto border border-slate-800/90 shadow-inner">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Background & Unusable Archive */}
      {currentTab === 'background' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold">
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Background Unusable Storage Audit</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              These items are preserved in background storage with historical context, but are filtered out of primary recall. 
              This includes items that <strong className="text-slate-200">perished via TTL index</strong> or were <strong className="text-slate-200">restricted by dietary policy</strong> (e.g., animal products when you declared vegan).
            </p>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-slate-500 text-[11px]">Filter:</span>
              <button
                onClick={() => setBackgroundFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                  backgroundFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({restrictedDocuments.length + perishedDocuments.length})
              </button>
              <button
                onClick={() => setBackgroundFilter('perished')}
                className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                  backgroundFilter === 'perished' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Perished TTL ({perishedDocuments.length})
              </button>
              <button
                onClick={() => setBackgroundFilter('restricted')}
                className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                  backgroundFilter === 'restricted' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Restricted Policy ({restrictedDocuments.length})
              </button>
            </div>
          </div>

          {unusableDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p>No unusable or perished items currently recorded.</p>
              <p className="text-xs text-slate-400 mt-1">Try Fast-Forwarding 8 days or click Step 5 ("I Went Vegan").</p>
            </div>
          ) : (
            unusableDocs.map((doc) => {
              const isPerished = doc.lifecycle.status === 'perished';
              const isExpanded = expandedDocId === doc._id;

              return (
                <div
                  key={doc._id}
                  className={`rounded-xl border p-3.5 transition ${
                    isPerished
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-purple-950/20 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-slate-100 text-sm">{doc.content.item_name}</h4>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            isPerished ? 'bg-red-500/20 text-red-300' : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {doc.lifecycle.status}
                        </span>
                        <span className="text-xs text-slate-400">Category: {doc.content.category}</span>
                      </div>

                      {/* Invalidation Reason */}
                      <p className="text-xs text-slate-300 mt-1.5 flex items-start space-x-1.5">
                        <span className="text-amber-400 shrink-0 font-medium">Audit Reason:</span>
                        <span className="text-slate-300">{doc.lifecycle.invalidation_reason || 'Excluded from recall'}</span>
                      </p>

                      <div className="text-[11px] text-slate-400 mt-1 space-x-2">
                        <span>Invalidated: {doc.lifecycle.invalidated_at ? new Date(doc.lifecycle.invalidated_at).toLocaleString() : 'N/A'}</span>
                        <span>•</span>
                        <span>Source: <code className="text-slate-300">{doc.source}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onDeleteItem(doc._id)}
                        className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-red-300 rounded hover:bg-red-500/10 border border-slate-800 transition cursor-pointer"
                        title="Delete from archive permanently"
                      >
                        ✕ Delete
                      </button>
                      <button
                        onClick={() => setExpandedDocId(isExpanded ? null : doc._id)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-purple-300/90 overflow-x-auto border border-slate-800">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: $vectorSearch Explorer */}
      {currentTab === 'vector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>MongoDB Vector Search ($vectorSearch Pipeline Stage)</span>
            </div>
            <p className="text-slate-400">
              Executes semantic similarity queries using cosine distance over embedded memory vectors.
              Filters enforce user ownership and exclude unusable/perished lifecycle statuses.
            </p>
          </div>

          <form onSubmit={handleVectorSearchSubmit} className="flex space-x-2">
            <input
              type="text"
              value={vectorQuery}
              onChange={(e) => setVectorQuery(e.target.value)}
              placeholder="e.g. 'leafy green vegetables for dinner' or 'quick breakfast'..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isSearchingVector || !vectorQuery.trim()}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSearchingVector ? 'Searching...' : 'Run Query'}
            </button>
          </form>

          {/* Preset queries */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] self-center">Try:</span>
            {[
              'leafy green salad for lunch',
              'high protein breakfast',
              'bread and carbs for toast',
              'poultry and meat'
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setVectorQuery(q);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Results list */}
          <div className="space-y-2.5">
            {vectorResults.length > 0 && (
              <span className="text-xs font-semibold text-slate-300 block">
                Top Vector Matches ({vectorResults.length}):
              </span>
            )}

            {vectorResults.map((res, rIdx) => (
              <div key={rIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-sm">
                    {res.document.content.item_name}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400">Score:</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold rounded border border-cyan-500/30">
                      {(res.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{res.relevanceExplanation}</p>
                
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Status: <strong className="text-emerald-400">{res.document.lifecycle.status}</strong></span>
                  <span>Document ID: <code className="text-slate-300 font-mono">{res.document._id}</code></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: User Constraints & Profile */}
      {currentTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-purple-300 font-semibold">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Persistent User Profile & Policy Constraints</span>
            </div>
            <p className="text-slate-400">
              This document stores learned preferences and hard dietary constraints that govern all recipe synthesis and inventory filtering.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Dietary Restriction:</h4>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'none', label: 'None (Standard)', desc: 'All ingredients usable' },
                { key: 'vegan', label: 'Vegan', desc: 'Invalidates eggs, dairy, meat' },
                { key: 'vegetarian', label: 'Vegetarian', desc: 'Invalidates meat and poultry' },
                { key: 'dairy_free', label: 'Dairy-Free', desc: 'Invalidates milk, cheese, butter' },
              ].map((opt) => {
                const isActive = (profileDocument?.content.dietary_restriction || 'none') === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onUpdateDietaryPolicy(opt.key as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200">{opt.label}</span>
                      {isActive && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Document BSON */}
          {profileDocument && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">User Profile Document (MongoDB):</span>
              <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-purple-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(profileDocument, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Change Stream Oplog */}
      {currentTab === 'stream' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center space-x-1.5 text-blue-400">
              <Activity className="w-3.5 h-3.5" />
              <span>collection.watch() Change Stream Events</span>
            </span>
            <span className="font-mono text-[11px]">ns: pantry_mind_db.memories</span>
          </div>

          {changeStreamEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <p>Listening for MongoDB change stream events...</p>
            </div>
          ) : (
            changeStreamEvents.map((ev, eIdx) => {
              let badgeColor = 'bg-slate-800 text-slate-300';
              if (ev.operationType === 'insert') badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
              if (ev.operationType === 'update') badgeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
              if (ev.operationType === 'invalidate') badgeColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';

              return (
                <div key={ev._id || eIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${badgeColor}`}>
                      {ev.operationType}
                    </span>
                    <span className="text-[11px] text-slate-400">{ev.clusterTime}</span>
                  </div>

                  {ev.reason && (
                    <p className="text-slate-300 font-sans text-xs">
                      <strong className="text-amber-400">Event Note:</strong> {ev.reason}
                    </p>
                  )}

                  <div className="pt-1 text-[11px] text-slate-400">
                    <div>docId: <span className="text-emerald-400">{ev.documentKey._id}</span></div>
                    {ev.fullDocument?.content?.item_name && (
                      <div>item: <span className="text-slate-200">{ev.fullDocument.content.item_name}</span></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
