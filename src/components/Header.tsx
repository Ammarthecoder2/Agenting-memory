/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Database, 
  Clock, 
  FastForward, 
  RotateCcw, 
  ShieldCheck, 
  Archive, 
  Bell,
  Sparkles,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  simulatedNow: string;
  activeCount: number;
  perishedCount: number;
  restrictedCount: number;
  dietaryRestriction: string;
  expiringCount: number;
  onAdvanceDays: (days: number) => void;
  onResetDemo: () => void;
  currentUser: string;
  onUserChange: (user: string) => void;
  onToggleAlertTray: () => void;
  isAlertTrayOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  simulatedNow,
  activeCount,
  perishedCount,
  restrictedCount,
  dietaryRestriction,
  expiringCount,
  onAdvanceDays,
  onResetDemo,
  currentUser,
  onUserChange,
  onToggleAlertTray,
  isAlertTrayOpen = false
}) => {
  const formattedDate = new Date(simulatedNow).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 text-white px-4 py-2.5 sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur-sm group-hover:opacity-60 transition duration-300"></div>
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-md border border-emerald-400/30">
              <Database className="w-4 h-4 text-emerald-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                PantryMind
              </h1>
              <span className="text-slate-600">/</span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                MongoDB Vector & TTL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous Zero-Waste Memory Agent</p>
          </div>
        </div>

        {/* Time Travel / TTL Controller */}
        <div className="flex items-center bg-slate-950/70 backdrop-blur-md rounded-2xl p-1 border border-slate-800/90 shadow-inner">
          <div className="flex items-center px-3 py-1 space-x-2 text-xs border-r border-slate-800/80">
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            <span className="font-mono font-semibold text-amber-300 text-[11px] sm:text-xs tracking-tight">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center pl-2 pr-1 space-x-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden sm:inline">
              TTL Sim:
            </span>
            <button
              onClick={() => onAdvanceDays(1)}
              className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg transition-all font-medium cursor-pointer active:scale-95 border border-slate-700/50"
              title="Advance simulated clock by 1 day"
            >
              +1d
            </button>
            <button
              onClick={() => onAdvanceDays(5)}
              className="px-2.5 py-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-all font-semibold cursor-pointer active:scale-95 flex items-center space-x-1 shadow-sm shadow-amber-500/10"
              title="Advance 5 days (Triggers urgent expiration warnings!)"
            >
              <FastForward className="w-3 h-3 text-amber-400" />
              <span>+5d (Urgent)</span>
            </button>
            <button
              onClick={() => onAdvanceDays(8)}
              className="px-2.5 py-1 text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 rounded-lg transition-all font-semibold cursor-pointer active:scale-95"
              title="Advance 8 days (Triggers TTL auto-purge to background archive!)"
            >
              +8d (Expire)
            </button>

            {/* Small option to pick date directly beside days option */}
            <div className="hidden md:flex items-center space-x-1 pl-1 border-l border-slate-800 text-[11px]">
              <label 
                className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 cursor-pointer transition-all"
                title="Pick exact target date to advance clock to"
              >
                <Calendar className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-300/90 font-medium">Date:</span>
                <input
                  type="date"
                  min={new Date(simulatedNow).toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const target = new Date(e.target.value).getTime();
                      const now = new Date(simulatedNow).getTime();
                      const days = Math.ceil((target - now) / (24 * 3600 * 1000));
                      if (days > 0) onAdvanceDays(days);
                    }
                  }}
                  className="bg-transparent text-[11px] font-mono text-amber-200 outline-none cursor-pointer [color-scheme:dark] w-24"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Status Counts & Alert Bell */}
        <div className="flex items-center space-x-2">
          {/* Expiration Alert Bell Button */}
          <button
            onClick={onToggleAlertTray}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
              expiringCount > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={expiringCount > 0 ? `${expiringCount} items expiring soon! Click to view` : 'No items expiring soon'}
          >
            <Bell className="w-4 h-4" />
            {expiringCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md shadow-rose-500/50 animate-bounce">
                {expiringCount}
              </span>
            )}
          </button>

          {/* Active Items Indicator */}
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80"></span>
            <span className="text-slate-400 font-medium">Active:</span>
            <span className="font-bold text-emerald-300 font-mono">{activeCount}</span>
          </div>

          {/* Background / Unusable Storage */}
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center space-x-2" title="Items in background unusable storage">
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Archived:</span>
            <span className="font-bold text-amber-300 font-mono">{perishedCount + restrictedCount}</span>
          </div>

          {/* Dietary Restriction Indicator */}
          {dietaryRestriction !== 'none' && (
            <div className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs flex items-center space-x-1.5 text-purple-200 shadow-sm shadow-purple-950/50">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="capitalize font-semibold">{dietaryRestriction}</span>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={onResetDemo}
            className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Reset to Day 0 (Clean Slate)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
