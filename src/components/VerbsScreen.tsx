import React, { useState } from 'react';
import { Verb, TenseKey, Pronoun, UserStats } from '../types';
import { VERB_LIBRARY, conjugate } from '../data/verbs';
import { TENSE_NAMES, PRONOUN_LABELS } from '../engine/conjugator';
import { speakSpanish } from '../utils/audio';
import {
  Search,
  Star,
  Volume2,
  X,
  ChevronRight,
  BookOpen,
  Filter,
} from 'lucide-react';

interface VerbsScreenProps {
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onPracticeVerb?: (verb: Verb) => void;
}

const ALL_TENSES: TenseKey[] = [
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

const ALL_PRONOUNS: Pronoun[] = [
  'yo',
  'tu',
  'el_ella_ud',
  'nosotros',
  'vosotros',
  'ellos_ellas_uds',
];

export const VerbsScreen: React.FC<VerbsScreenProps> = ({
  stats,
  onUpdateStats,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'regular' | 'irregular' | 'favorites'>('all');
  const [selectedVerb, setSelectedVerb] = useState<Verb | null>(null);

  // Toggle favorite
  const toggleFavorite = (infinitive: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const favs = stats.favorites.includes(infinitive)
      ? stats.favorites.filter((f) => f !== infinitive)
      : [...stats.favorites, infinitive];
    onUpdateStats({ ...stats, favorites: favs });
  };

  // Filtered verbs
  const filteredVerbs = VERB_LIBRARY.filter((verb) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      verb.infinitive.toLowerCase().includes(q) ||
      verb.translation.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterType === 'regular') return !verb.irregular;
    if (filterType === 'irregular') return verb.irregular;
    if (filterType === 'favorites') return stats.favorites.includes(verb.infinitive);
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Verb Reference ({filteredVerbs.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            300 Most Common Verbs
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Spanish or English..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `All (${VERB_LIBRARY.length})` },
            { id: 'irregular', label: 'Irregulars & Patterns' },
            { id: 'regular', label: 'Regulars' },
            { id: 'favorites', label: `Favorites (${stats.favorites.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verbs list */}
      <div className="space-y-2">
        {filteredVerbs.map((verb) => {
          const isFav = stats.favorites.includes(verb.infinitive);
          return (
            <div
              key={verb.infinitive}
              onClick={() => setSelectedVerb(verb)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-4 transition-all cursor-pointer shadow-sm flex items-center justify-between active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => toggleFavorite(verb.infinitive, e)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFav
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                      : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                  }`}
                  aria-label="Toggle favorite"
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {verb.infinitive}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      -{verb.ending}
                    </span>
                    {verb.pattern && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {verb.pattern}
                      </span>
                    )}
                    {verb.irregular ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Irregular
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Regular
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {verb.translation}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakSpanish(verb.infinitive);
                  }}
                  className="p-2 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== VERB CONJUGATION MODAL ==================== */}
      {selectedVerb && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {selectedVerb.infinitive}
                    </h3>
                    <button
                      onClick={() => speakSpanish(selectedVerb.infinitive)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(selectedVerb.infinitive)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        stats.favorites.includes(selectedVerb.infinitive)
                          ? 'text-amber-500'
                          : 'text-slate-300'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {selectedVerb.translation} · {selectedVerb.irregular ? 'Irregular / Stem-changer' : `Regular -${selectedVerb.ending}`}
                    {selectedVerb.pattern ? ` · Pattern ${selectedVerb.pattern}` : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedVerb(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content body */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Example Sentences */}
              {selectedVerb.exampleSentences && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Example in Context
                  </div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>"{selectedVerb.exampleSentences[0]}"</span>
                    <button
                      onClick={() => speakSpanish(selectedVerb.exampleSentences![0])}
                      className="p-1 text-blue-600 shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                    "{selectedVerb.exampleSentences[1]}"
                  </div>
                </div>
              )}

              {/* All 10 Tenses Tables */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Conjugation Tables (All 10 Tenses)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ALL_TENSES.map((t) => (
                    <div
                      key={t}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2"
                    >
                      <div className="font-bold text-xs text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                        <span>{TENSE_NAMES[t]}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        {ALL_PRONOUNS.map((pronoun) => {
                          if (
                            t.startsWith('imperativo') &&
                            pronoun === 'yo'
                          ) {
                            return null; // No yo form in imperative
                          }
                          const form = conjugate(selectedVerb, t, pronoun);
                          return (
                            <div
                              key={pronoun}
                              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            >
                              <span className="text-slate-500 font-medium">
                                {PRONOUN_LABELS[pronoun]}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white font-mono">
                                {form || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
