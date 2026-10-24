/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingBag, 
  FastForward, 
  Utensils, 
  Search, 
  Leaf, 
  Archive, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface DemoWalkthroughBarProps {
  currentStep: number;
  onExecuteStep: (stepNumber: number) => void;
  onOpenInspectorTab?: (tabKey: string) => void;
}

export const DemoWalkthroughBar: React.FC<DemoWalkthroughBarProps> = ({
  currentStep,
  onExecuteStep,
  onOpenInspectorTab
}) => {
  const steps = [
    {
      num: 1,
      title: '1. Casual Haul',
      desc: 'Text: "Eggs, spinach, bread, chicken, milk"',
      icon: ShoppingBag,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
      activeColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
    },
    {
      num: 2,
      title: '2. +5 Days Later',
      desc: 'Spinach approaches 7d TTL limit (urgent)',
      icon: FastForward,
      color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400',
      activeColor: 'border-amber-500 bg-amber-500/20 text-amber-300'
    },
    {
      num: 3,
      title: '3. "I\'m Starving"',
      desc: 'Recalls urgent spinach for zero-waste meal',
      icon: Utensils,
      color: 'hover:border-teal-500/50 hover:bg-teal-500/10 text-teal-400',
      activeColor: 'border-teal-500 bg-teal-500/20 text-teal-300'
    },
    {
      num: 4,
      title: '4. Memory Inspector',
      desc: 'Audit Vector Search, TTL index & BSON',
      icon: Search,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400',
      activeColor: 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
    },
    {
      num: 5,
      title: '5. "I Went Vegan"',
      desc: 'Edge Case: Invalidates eggs, milk & chicken',
      icon: Leaf,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
      activeColor: 'border-purple-500 bg-purple-500/20 text-purple-300'
    },
    {
      num: 6,
      title: '6. Background Archive',
      desc: 'Audit perished & unusable meat/eggs memory',
      icon: Archive,
      color: 'hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400',
      activeColor: 'border-rose-500 bg-rose-500/20 text-rose-300'
    }
  ];

  return (
    <div className="bg-slate-900/70 backdrop-blur-md border-b border-slate-800/80 px-4 py-2 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto pb-0.5 scrollbar-none">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 whitespace-nowrap mr-1">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="tracking-tight text-slate-200">Interactive Walkthrough:</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => onExecuteStep(s.num)}
                  className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive 
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30' 
                      : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                  title={s.desc}
                >
                  <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {s.num}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <span className="font-semibold">{s.title.replace(/^\d+\.\s*/, '')}</span>
                </button>
                {idx < steps.length - 1 && (
                  <span className="text-slate-700 text-xs hidden lg:inline select-none">›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
