/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Check, 
  Trash2, 
  X, 
  Clock, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { MongoMemoryDocument } from '../types/memory';

interface ExpiryAlertTrayProps {
  isOpen: boolean;
  onClose: () => void;
  expiringItems: {
    doc: MongoMemoryDocument;
    daysLeft: number;
    isCritical: boolean;
  }[];
  onCookRecipe: (itemName: string) => void;
  onCookAllUrgent: () => void;
  onDiscardItem: (id: string, reason: string, status: 'perished' | 'consumed') => Promise<void>;
}

export const ExpiryAlertTray: React.FC<ExpiryAlertTrayProps> = ({
  isOpen,
  onClose,
  expiringItems,
  onCookRecipe,
  onCookAllUrgent,
  onDiscardItem
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900/95 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-sm shadow-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Expiration Alert Center</h3>
              <p className="text-xs text-slate-400">
                {expiringItems.length > 0
                  ? `${expiringItems.length} active inventory item(s) nearing TTL index expiration`
                  : 'All virtual fridge items are fresh'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {expiringItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No Perishable Items at Risk</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                All ingredients currently tracked in your virtual fridge have ample shelf life remaining before MongoDB TTL expiration.
              </p>
            </div>
          ) : (
            expiringItems.map(({ doc, daysLeft, isCritical }) => {
              const totalDays = doc.content.shelf_life_days || 7;
              const percentElapsed = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));

              return (
                <div
                  key={doc._id}
                  className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
                    isCritical
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : 'bg-amber-950/25 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-white tracking-tight">{doc.content.item_name}</h4>
                        <span className="text-xs text-slate-300 font-medium font-mono">({doc.content.quantity || '1 portion'})</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-amber-300'}`}>
                          {daysLeft <= 0 ? 'Expires today!' : `${daysLeft} days remaining`}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-[11px]">Expiry: {new Date(doc.lifecycle.ttl_index_expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isCritical ? 'CRITICAL' : 'URGENT'}
                    </span>
                  </div>

                  {/* Urgency Progress Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Spoilage Risk</span>
                      <span className="font-mono">{percentElapsed.toFixed(0)}% shelf life elapsed</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isCritical ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                        }`}
                        style={{ width: `${percentElapsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        onCookRecipe(doc.content.item_name || 'ingredient');
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95 border border-emerald-400/30"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Cook in Recipe</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onDiscardItem(doc._id, 'Ate before expiration', 'consumed')}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
                        title="Mark as consumed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ate It</span>
                      </button>

                      <button
                        onClick={() => onDiscardItem(doc._id, 'Threw out due to spoilage', 'perished')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
                        title="Mark as discarded / spoiled"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Threw Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {expiringItems.length > 0 && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              MongoDB TTL index auto-archives expired docs.
            </span>
            <button
              onClick={() => {
                onCookAllUrgent();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-950/50 active:scale-95 border border-emerald-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Rescue All Urgent Items</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
