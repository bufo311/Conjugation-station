import React, { useState } from 'react';
import { TenseKey } from '../types';
import { TENSE_GUIDES } from '../data/tenseGuides';
import { TENSE_NAMES } from '../engine/conjugator';
import { BookOpen, Sparkles, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';

interface TensesScreenProps {
  onStartTensePractice: (tense: TenseKey) => void;
}

const TENSE_KEYS: TenseKey[] = [
  'presente',
  'preterito',
  'imperfecto',
  'futuro',
  'condicional',
  'preterito_perfecto',
  'presente_subjuntivo',
  'imperfecto_subjuntivo',
  'imperativo_afirmativo',
  'imperativo_negativo',
];

export const TensesScreen: React.FC<TensesScreenProps> = ({
  onStartTensePractice,
}) => {
  const [expandedTense, setExpandedTense] = useState<TenseKey | null>('presente');

  const toggleExpand = (tense: TenseKey) => {
    setExpandedTense(expandedTense === tense ? null : tense);
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
        <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
          Grammar Masterclass
        </span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          The 10 Spanish Tenses
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Concise, high-yield rules for when to use each tense, textbook formation formulas, and the 3 trickiest irregular verbs.
        </p>
      </div>

      {/* Accordion / List of guides */}
      <div className="space-y-3">
        {TENSE_KEYS.map((key) => {
          const guide = TENSE_GUIDES[key];
          const isExpanded = expandedTense === key;

          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Header toggle */}
              <button
                onClick={() => toggleExpand(key)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {guide.title}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {guide.mood}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {guide.whenToUse[0]}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                  {/* When to use it */}
                  <div className="space-y-1.5 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      When to Use It
                    </h4>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-xs">
                      {guide.whenToUse.map((line, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Formation formula */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Regular Formation Formula
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1 font-mono border border-slate-200 dark:border-slate-700">
                      <div>
                        <strong className="text-blue-600">-ar:</strong> {guide.formula.ar}
                      </div>
                      <div>
                        <strong className="text-emerald-600">-er:</strong> {guide.formula.er}
                      </div>
                      <div>
                        <strong className="text-purple-600">-ir:</strong> {guide.formula.ir}
                      </div>
                    </div>
                  </div>

                  {/* 3 Trickiest Irregulars */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      3 Trickiest Irregulars
                    </h4>
                    <div className="space-y-2">
                      {guide.keyIrregulars.map((irreg, i) => (
                        <div
                          key={i}
                          className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-2.5 text-xs space-y-1"
                        >
                          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span className="text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                              {irreg.verb}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {irreg.note}
                            </span>
                          </div>
                          <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                            {irreg.forms}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick drill button */}
                  <button
                    onClick={() => onStartTensePractice(key)}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Drill {guide.title} Now</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
