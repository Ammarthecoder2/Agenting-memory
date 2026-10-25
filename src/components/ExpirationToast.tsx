/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Check, 
  X, 
  Clock, 
  Volume2, 
  VolumeX, 
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export interface ExpirationNotification {
  id: string;
  itemId: string;
  itemName: string;
  quantity: string;
  category?: string;
  daysLeft: number;
  expirationDate: string;
  isCritical: boolean;
  createdAt: number;
}

interface ExpirationToastProps {
  notifications: ExpirationNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onCookRecipe: (itemName: string) => void;
  onDiscardItem: (id: string, reason: string, status: 'perished' | 'consumed') => Promise<void>;
  onOpenAlertTray?: () => void;
}

// Gentle 2-tone audio chime using Web Audio API
const playAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1: E5 (659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: A5 (880Hz) after 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch {
    // Audio context may be restricted or blocked before user gesture; gracefully ignore
  }
};

const getCategoryEmoji = (name: string, cat?: string) => {
  const n = name.toLowerCase();
  if (n.includes('spinach')) return '🥬';
  if (n.includes('avocado')) return '🥑';
  if (n.includes('egg')) return '🥚';
  if (n.includes('bread') || n.includes('sourdough')) return '🥖';
  if (n.includes('chicken') || n.includes('meat') || n.includes('poultry')) return '🍗';
  if (n.includes('milk')) return '🥛';
  if (n.includes('cheese') || n.includes('cheddar')) return '🧀';
  if (n.includes('tomato')) return '🍅';
  if (cat === 'produce') return '🥗';
  if (cat === 'dairy') return '🥛';
  if (cat === 'protein') return '🥩';
  if (cat === 'bakery') return '🍞';
  return '🥫';
};

export const ExpirationToast: React.FC<ExpirationToastProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onCookRecipe,
  onDiscardItem,
  onOpenAlertTray
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);

  // Play sound when a new notification pops up
  useEffect(() => {
    if (notifications.length > 0 && soundEnabled) {
      const newest = notifications[0];
      if (newest && newest.id !== lastPlayedId) {
        setLastPlayedId(newest.id);
        playAlertChime();
      }
    }
  }, [notifications, soundEnabled, lastPlayedId]);

  if (notifications.length === 0) return null;

  return (
    <aside 
      aria-label="Food Expiration Alerts"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[92vw] sm:w-[380px] pointer-events-auto select-none"
    >
      {/* Toast Stack Header Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="absolute w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <span className="font-extrabold text-amber-300 tracking-tight text-[11px] uppercase">
            Live Expiration Popups ({notifications.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {notifications.length > 1 && (
            <button
              onClick={onDismissAll}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Floating Notification Popups (showing up to 3) */}
      {notifications.slice(0, 3).map((notif) => {
        const emoji = getCategoryEmoji(notif.itemName, notif.category);
        const formattedExp = new Date(notif.expirationDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        return (
          <div
            key={notif.id}
            className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-3 duration-300 ${
              notif.isCritical
                ? 'bg-gradient-to-br from-rose-950/95 via-slate-900/95 to-slate-950/95 border-rose-500/60 shadow-rose-950/50'
                : 'bg-gradient-to-br from-amber-950/95 via-slate-900/95 to-slate-950/95 border-amber-500/60 shadow-amber-950/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {/* Category Emoji Badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                  notif.isCritical
                    ? 'bg-rose-900/60 border-rose-500/40 text-rose-200'
                    : 'bg-amber-900/60 border-amber-500/40 text-amber-200'
                }`}>
                  {emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                      notif.isCritical
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}>
                      {notif.isCritical ? '⚠️ Expiring Soon' : '🔔 Approaching TTL'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-white tracking-tight truncate mt-0.5">
                    {notif.itemName}
                  </h4>

                  {/* Days remaining + Exact date directly beside it */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mt-1">
                    <span className={`font-bold flex items-center space-x-1 ${
                      notif.isCritical ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{notif.daysLeft <= 0 ? 'Expires today!' : `${notif.daysLeft}d remaining`}</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                      <Calendar className="w-2.5 h-2.5 text-amber-400" />
                      <span>{formattedExp}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Prevent food waste: cook it now before MongoDB TTL purge.
                  </p>
                </div>
              </div>

              {/* Dismiss X button */}
              <button
                onClick={() => onDismiss(notif.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Rescue Buttons */}
            <div className="flex items-center space-x-2 mt-3 pt-2.5 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onCookRecipe(notif.itemName);
                  onDismiss(notif.id);
                }}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95 border border-emerald-400/30"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Cook Recipe Now</span>
              </button>

              <button
                onClick={async () => {
                  await onDiscardItem(notif.itemId, 'Ate before expiration', 'consumed');
                  onDismiss(notif.id);
                }}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-teal-300 font-semibold text-xs flex items-center space-x-1 transition-all cursor-pointer border border-teal-500/30 active:scale-95"
                title="Mark as eaten"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ate It</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Overflow Banner if more than 3 */}
      {notifications.length > 3 && onOpenAlertTray && (
        <button
          onClick={onOpenAlertTray}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-xs text-amber-300 font-semibold flex items-center justify-between cursor-pointer transition-all shadow-md"
        >
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+{notifications.length - 3} more expiring items in Alert Tray</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </aside>
  );
};
