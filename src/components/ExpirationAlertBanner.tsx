/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Sparkles,
  Bell
} from 'lucide-react';
import { MongoMemoryDocument } from '../types/memory';

interface ExpirationAlertBannerProps {
  expiringItems: {
    doc: MongoMemoryDocument;
    daysLeft: number;
    isCritical: boolean;
  }[];
  onCookRecipe: (itemName: string) => void;
  onCookAllUrgent: () => void;
  onDiscardItem: (id: string, reason: string, status: 'perished' | 'consumed') => Promise<void>;
  onDismiss?: () => void;
  onTriggerToasts?: () => void;
}

export const ExpirationAlertBanner: React.FC<ExpirationAlertBannerProps> = ({
  expiringItems,
  onCookRecipe,
  onCookAllUrgent,
  onDiscardItem,
  onDismiss,
  onTriggerToasts
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (expiringItems.length === 0) return null;

  const criticalCount = expiringItems.filter(i => i.isCritical).length;

  return (
    <div className="bg-gradient-to-r from-amber-950/70 via-slate-900/95 to-rose-950/70 border-b border-amber-500/30 px-4 py-2.5 shadow-lg backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Alert Icon & Summary */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-xl bg-amber-500/20 animate-pulse"></span>
            <div className="relative w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-sm shadow-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Expiration Warning</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold shadow-sm">
                  {expiringItems.length} {expiringItems.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
              {criticalCount > 0 && (
                <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  · {criticalCount} critical (spoilage within 36h)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              MongoDB TTL index countdown active. Use these ingredients before automatic expiry!
            </p>
          </div>
        </div>

        {/* Center: Expiring Item Badges with Quick Rescue Button */}
        {!isMinimized && (
          <div className="flex flex-wrap items-center gap-2 my-1 sm:my-0">
            {expiringItems.slice(0, 3).map(({ doc, daysLeft, isCritical }) => (
              <div
                key={doc._id}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs shadow-sm transition-all ${
                  isCritical
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                    : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                }`}
              >
                <span className="font-bold text-white">{doc.content.item_name}</span>
                <span className="text-[11px] opacity-80 font-mono">
                  ({daysLeft <= 0 ? 'Expiring now' : `${daysLeft}d left`})
                </span>
                <button
                  onClick={() => onCookRecipe(doc.content.item_name || 'ingredient')}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all cursor-pointer flex items-center space-x-1 shadow-sm active:scale-95"
                  title={`Cook recipe with ${doc.content.item_name}`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Cook</span>
                </button>
              </div>
            ))}

            {expiringItems.length > 3 && (
              <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                +{expiringItems.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Right: Master Rescue Action, Trigger Popups & Toggle */}
        <div className="flex items-center space-x-2">
          {onTriggerToasts && (
            <button
              onClick={onTriggerToasts}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow-sm"
              title="Show live floating pop-up notifications for expiring food"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Pop-ups</span>
            </button>
          )}

          <button
            onClick={onCookAllUrgent}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 border border-emerald-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Generate Rescue Meal</span>
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            title={isMinimized ? 'Expand alert details' : 'Minimize alert'}
          >
            {isMinimized ? 'Expand' : 'Hide'}
          </button>
        </div>
      </div>
    </div>
  );
};
