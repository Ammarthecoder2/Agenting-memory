/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Clock, 
  Utensils, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  ChefHat
} from 'lucide-react';
import { AgentChatMessage, MemoryRecallExplanation, RecipeSuggestion } from '../types/memory';

interface ChatInterfaceProps {
  messages: AgentChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onInspectRecall: (audit: MemoryRecallExplanation) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onInspectRecall
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const suggestions = [
    "Bought spinach, eggs, bread",
    "I threw out the milk",
    "I'm starving",
    "I went vegan",
    "What went bad in my background storage?"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-800/80 text-slate-100">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping"></span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Culinary Memory Concierge</span>
            </h2>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-mono">Live MongoDB Oplog Connected</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
          <Sparkles className="w-3 h-3 text-emerald-400 mr-1" />
          <span>Zero-Waste AI</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="mx-auto max-w-[90%] my-2">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs shadow-sm flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-amber-400/70 font-mono block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1.5 px-1">
                {isAgent ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-emerald-400">PantryMind Agent</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-300">You (SMS / Voice)</span>
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </>
                )}
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[10px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${
                  isAgent
                    ? 'bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-tl-sm shadow-md'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                {/* Text Content with clean markdown paragraphs */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('**').map((chunk, cIdx) => 
                        cIdx % 2 === 1 ? <strong key={cIdx} className="font-bold text-white tracking-wide">{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {/* Render Embedded Recipe Card(s) if provided */}
                {((msg.recipes && msg.recipes.length > 0) || msg.recipe) && (
                  <RecipeDisplay
                    recipes={msg.recipes && msg.recipes.length > 0 ? msg.recipes : (msg.recipe ? [msg.recipe] : [])}
                    recallAudit={msg.recallAudit}
                    onInspectRecall={onInspectRecall}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2.5 text-xs text-slate-300 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 w-fit">
            <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="animate-pulse">Synthesizing zero-waste recipes & querying MongoDB vector index...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="px-3.5 py-2.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-400 whitespace-nowrap pl-0.5 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Try:</span>
        </span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(s)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/70 hover:border-emerald-500/50 transition-all whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50 active:scale-95 shadow-sm font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Casual grocery haul or say 'I'm starving'..."
          disabled={isLoading}
          className="flex-1 bg-slate-950/90 border border-slate-700/70 hover:border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-950/50 active:scale-95 border border-emerald-400/30"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

interface RecipeDisplayProps {
  recipes: RecipeSuggestion[];
  recallAudit?: MemoryRecallExplanation;
  onInspectRecall: (audit: MemoryRecallExplanation) => void;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({
  recipes,
  recallAudit,
  onInspectRecall
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  if (!recipes || recipes.length === 0) return null;
  const currentRecipe = recipes[selectedIndex] || recipes[0];

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-800/80 bg-slate-950/90 -mx-1 px-4 py-3.5 rounded-2xl border border-emerald-500/25 shadow-xl shadow-black/30 backdrop-blur-md">
      {/* Recipe Tabs if multiple */}
      {recipes.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          {recipes.map((r, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedIndex(idx);
                setCompletedSteps({});
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95 ${
                selectedIndex === idx
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="truncate">
                {idx === 0 ? '✨ Hero Zero-Waste' : `Option ${idx + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Title & Metadata */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-white text-sm tracking-tight">{currentRecipe.title}</h4>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          {currentRecipe.categoryTag && (
            <span className="px-2 py-0.5 bg-slate-800/90 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-700/60">
              {currentRecipe.categoryTag}
            </span>
          )}
          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span className="font-mono">{currentRecipe.prepTime}</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3 pl-0.5">{currentRecipe.description}</p>

      {/* Urgent Ingredients Rescued Banner */}
      {currentRecipe.ingredientsToUseUrgent && currentRecipe.ingredientsToUseUrgent.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Priority Rescued Ingredients (Expiring Soon):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentRecipe.ingredientsToUseUrgent.map((ing, iIdx) => (
              <span
                key={iIdx}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/30 shadow-xs flex items-center gap-1"
              >
                <span>🔥</span>
                <span>{ing}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other Ingredients Used */}
      {currentRecipe.otherIngredients && currentRecipe.otherIngredients.length > 0 && (
        <div className="mb-3 flex items-center flex-wrap gap-1.5 text-xs text-slate-300">
          <span className="text-slate-400 font-medium">Fridge essentials:</span>
          {currentRecipe.otherIngredients.map((ing, oIdx) => (
            <span
              key={oIdx}
              className="px-2 py-0.5 rounded-lg bg-slate-900/90 text-slate-200 border border-slate-700/70 text-[11px]"
            >
              ✓ {ing}
            </span>
          ))}
        </div>
      )}

      {/* Recipe Steps with Interactive Checklist */}
      <div className="space-y-1.5 text-xs text-slate-300 mb-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-slate-200 text-xs tracking-tight">Step-by-Step Instructions:</span>
          <span className="text-[10px] text-slate-400 font-mono">Tap step to check off</span>
        </div>
        {currentRecipe.instructions.map((step, sIdx) => {
          const isDone = !!completedSteps[sIdx];
          return (
            <button
              key={sIdx}
              onClick={() => setCompletedSteps(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
              className={`w-full text-left flex items-start space-x-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                isDone 
                  ? 'bg-emerald-950/20 text-slate-400 line-through opacity-75' 
                  : 'hover:bg-slate-800/60 text-slate-200 hover:text-white'
              }`}
            >
              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border transition-all ${
                isDone 
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm' 
                  : 'border-slate-700 bg-slate-800/80 text-emerald-400'
              }`}>
                {isDone ? '✓' : sIdx + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </button>
          );
        })}
      </div>

      {/* Zero-Waste Outcome Note */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        <span className="text-emerald-400 flex items-center space-x-1.5 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{currentRecipe.wasteSavedNote}</span>
        </span>

        {recallAudit && (
          <button
            onClick={() => onInspectRecall(recallAudit)}
            className="px-2.5 py-1 text-[11px] bg-slate-800/90 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1 border border-slate-700/60"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>Why this recipe?</span>
          </button>
        )}
      </div>
    </div>
  );
};
