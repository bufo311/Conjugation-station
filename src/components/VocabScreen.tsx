import React, { useState, useMemo } from 'react';
import { VocabEntry, UserStats, LeitnerCard } from '../types';
import {
  VOCAB_CORE_500,
  VOCAB_FRASES,
  VOCAB_ADVANCED,
} from '../data/vocab';
import {
  recordVocabAnswerInSRS,
  updateVocabStatsOnAnswer,
} from '../engine/srs';
import {
  computeVocabPyramid,
  computeFrasesPyramid,
  computeAdvancedPyramid,
  PyramidType,
} from '../engine/pyramid';
import { speakSpanish, playChime } from '../utils/audio';
import {
  Layers,
  Sparkles,
  Search,
  Volume2,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Lock,
  Unlock,
  Zap,
  BookA,
} from 'lucide-react';

interface VocabScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  srsCards: LeitnerCard[];
  onUpdateSRS: (newCards: LeitnerCard[]) => void;
  onOpenRoadmap?: (type?: PyramidType) => void;
  onGoToQuiz?: () => void;
}

type VocabTabMode = 'dictionary' | 'flashcards';
type DeckType = 'core500' | 'advanced' | 'frases';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type POSFilter = 'all' | 'noun' | 'verb' | 'adjective' | 'adverb' | 'connector' | 'chunk';

const POS_LABELS: Record<string, string> = {
  noun: 'Sustantivo',
  verb: 'Verbo',
  adjective: 'Adjetivo',
  adverb: 'Adverbio',
  connector: 'Conector',
  chunk: 'Frase',
  pronoun: 'Pronombre',
  preposition: 'Preposición',
};

export const VocabScreen: React.FC<VocabScreenProps> = ({
  stats,
  onUpdateStats,
  srsCards,
  onUpdateSRS,
  onOpenRoadmap,
  onGoToQuiz,
}) => {
  const [activeDeck, setActiveDeck] = useState<DeckType>('core500');
  const [tabMode, setTabMode] = useState<VocabTabMode>('dictionary');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>(
    stats.settings.vocabDifficulty || 'all'
  );

  const unlockAll = !!stats.settings.unlockAllLayers;

  // Compute adaptive vocab, frases & advanced pyramids (supporting unlockAll)
  const vocabPyramid = useMemo(() => computeVocabPyramid(srsCards, unlockAll), [srsCards, unlockAll]);
  const frasesPyramid = useMemo(() => computeFrasesPyramid(srsCards, unlockAll), [srsCards, unlockAll]);
  const advancedPyramid = useMemo(() => computeAdvancedPyramid(srsCards, unlockAll), [srsCards, unlockAll]);

  const activePyramid =
    activeDeck === 'core500'
      ? vocabPyramid
      : activeDeck === 'advanced'
      ? advancedPyramid
      : frasesPyramid;

  const allDeckItems =
    activeDeck === 'core500'
      ? VOCAB_CORE_500
      : activeDeck === 'advanced'
      ? VOCAB_ADVANCED
      : VOCAB_FRASES;

  const handleToggleUnlockAll = () => {
    const updated: UserStats = {
      ...stats,
      settings: {
        ...stats.settings,
        unlockAllLayers: !unlockAll,
      },
    };
    onUpdateStats(updated);
  };

  const handleDifficultyChange = (newDiff: DifficultyFilter) => {
    setDifficultyFilter(newDiff);
    const updated: UserStats = {
      ...stats,
      settings: {
        ...stats.settings,
        vocabDifficulty: newDiff,
      },
    };
    onUpdateStats(updated);
  };

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Dictionary / word list state
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<POSFilter>('all');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Active items for flashcard practice driven by UNLOCKED pyramid items and difficulty filter!
  const activeDeckItems = useMemo(() => {
    let pool =
      activePyramid.unlockedItems.length > 0
        ? activePyramid.unlockedItems
        : allDeckItems.slice(0, activeDeck === 'core500' ? 25 : 15);

    if (difficultyFilter !== 'all') {
      const filtered = allDeckItems.filter((i) => i.difficulty === difficultyFilter);
      if (filtered.length > 0) {
        pool = filtered;
      }
    }

    return pool;
  }, [activePyramid, allDeckItems, activeDeck, difficultyFilter]);

  // Dictionary filtered items (searches entire deck with layer & difficulty tags)
  const filteredDictionaryItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDeckItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.es.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        (item.sentence && item.sentence.toLowerCase().includes(q));

      const matchesPos =
        posFilter === 'all' ||
        (posFilter === 'chunk' && (item.pos === 'chunk' || item.deckId === 'frases')) ||
        item.pos === posFilter;

      const matchesDiff =
        difficultyFilter === 'all' || !item.difficulty || item.difficulty === difficultyFilter;

      return matchesSearch && matchesPos && matchesDiff;
    });
  }, [allDeckItems, searchQuery, posFilter, difficultyFilter]);

  // Lookup Leitner level for a word
  const getCardLevel = (id: string): number => {
    const card = srsCards.find((c) => c.vocabId === id || c.id.includes(id));
    return card ? card.level : 0;
  };

  // Handle flashcard rating
  const currentFlashcard = activeDeckItems[flashcardIndex % activeDeckItems.length];

  const handleFlashcardRating = (gotIt: boolean) => {
    if (!currentFlashcard) return;

    if (stats.settings.soundEffects) {
      playChime(gotIt);
    }

    // Record in SRS queue
    const updatedCards = recordVocabAnswerInSRS(
      srsCards,
      currentFlashcard,
      gotIt,
      true // force add to SRS queue
    );
    onUpdateSRS(updatedCards);

    // Update stats
    const updatedStats = updateVocabStatsOnAnswer(
      stats,
      currentFlashcard.deckId,
      currentFlashcard.es,
      gotIt
    );
    onUpdateStats(updatedStats);

    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % activeDeckItems.length);
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* UNIFIED QUIZ SHORTCUT HERO BANNER */}
      {onGoToQuiz && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Quiz Todo en Uno</span>
            </div>
            <div className="text-base sm:text-lg font-black tracking-tight leading-tight">
              ¿Listo para ponerte a prueba?
            </div>
            <div className="text-xs text-blue-100/90 leading-snug max-w-xs">
              Practica verbos, vocabulario y expresiones cotidianas en un solo quiz combinado.
            </div>
          </div>
          <button
            onClick={onGoToQuiz}
            className="px-4 py-3 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 active:scale-95 font-black text-xs shrink-0 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ir al Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DECK SELECTOR CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <BookA className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Biblioteca & Tarjetas
              </h2>
              <p className="text-[11px] text-slate-500">
                Explora el repertorio léxico o estudia con tarjetas interactivas
              </p>
            </div>
          </div>
        </div>

        {/* 3 Major Decks Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl text-xs font-bold">
          <button
            onClick={() => {
              setActiveDeck('core500');
              setFlashcardIndex(0);
            }}
            className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
              activeDeck === 'core500'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="leading-tight">Core 500</div>
            <div className="text-[10px] font-normal opacity-70">A1-B1</div>
          </button>

          <button
            onClick={() => {
              setActiveDeck('advanced');
              setFlashcardIndex(0);
            }}
            className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
              activeDeck === 'advanced'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="leading-tight">Avanzado C1</div>
            <div className="text-[10px] font-normal opacity-70">B2-C1</div>
          </button>

          <button
            onClick={() => {
              setActiveDeck('frases');
              setFlashcardIndex(0);
            }}
            className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
              activeDeck === 'frases'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="leading-tight">Frases & Giros</div>
            <div className="text-[10px] font-normal opacity-70">150 modismos</div>
          </button>
        </div>

        {/* Difficulty Filter Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-blue-600" />
              <span>Filtrar por Nivel</span>
            </span>
            {difficultyFilter !== 'all' && (
              <span className="text-blue-600 normal-case font-semibold">
                {activeDeckItems.length} palabras activas
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => handleDifficultyChange('all')}
              className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                difficultyFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleDifficultyChange('beginner')}
              className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                difficultyFilter === 'beginner'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              A1-A2
            </button>
            <button
              onClick={() => handleDifficultyChange('intermediate')}
              className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                difficultyFilter === 'intermediate'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              B1-B2
            </button>
            <button
              onClick={() => handleDifficultyChange('advanced')}
              className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                difficultyFilter === 'advanced'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              C1 Avanzado
            </button>
          </div>
        </div>

        {/* Active Pyramid Layer Progression Status */}
        {(() => {
          const curLayer = activePyramid.layers[activePyramid.currentLayerNumber - 1];
          const isCompleted = curLayer ? curLayer.masteredCount >= curLayer.requiredToUnlock : true;
          const nextLayer = activePyramid.layers[activePyramid.currentLayerNumber];

          return (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activePyramid.summaryText}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleUnlockAll}
                    title={unlockAll ? 'Activar progresión gradual' : 'Desbloquear todas las capas'}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                      unlockAll
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {unlockAll ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Bloqueo gradual</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Desbloquear Todo</span>
                      </>
                    )}
                  </button>

                  {onOpenRoadmap && (
                    <button
                      onClick={() =>
                        onOpenRoadmap(
                          activeDeck === 'advanced'
                            ? 'advanced'
                            : activeDeck === 'core500'
                            ? 'vocab'
                            : 'frases'
                        )
                      }
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 text-[11px] cursor-pointer"
                    >
                      <span>Pirámide</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Layer mini progress bar */}
              {curLayer && (
                <>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        unlockAll
                          ? 'bg-purple-600'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${unlockAll ? 100 : curLayer.progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {unlockAll
                        ? '🌟 Modo Libre activo: Todas las capas desbloqueadas'
                        : `Capa ${curLayer.layerNumber}: ${curLayer.masteredCount}/${curLayer.totalCount} dominadas (Meta: ${curLayer.requiredToUnlock} en N3+)`}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {unlockAll ? '100%' : `${curLayer.progressPct}%`}
                    </span>
                  </div>
                </>
              )}

              {/* Locked next layer notice */}
              {!unlockAll && nextLayer && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-[11px] border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Capa {nextLayer.layerNumber}</span>
                  </div>
                  <span>{nextLayer.unlockCondition}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Two Study Modes: Diccionario vs Flashcards */}
      <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl">
        <button
          onClick={() => setTabMode('dictionary')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tabMode === 'dictionary'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Diccionario & Búsqueda ({filteredDictionaryItems.length})
        </button>
        <button
          onClick={() => setTabMode('flashcards')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tabMode === 'flashcards'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tarjetas Flashcards
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. DICCIONARIO & BUSCADOR                                      */}
      {/* ============================================================== */}
      {tabMode === 'dictionary' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en español o inglés..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          {/* POS Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'noun', label: 'Sustantivos' },
              { id: 'verb', label: 'Verbos' },
              { id: 'adjective', label: 'Adjetivos' },
              { id: 'adverb', label: 'Adverbios' },
              { id: 'connector', label: 'Conectores' },
              { id: 'chunk', label: 'Frases' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setPosFilter(chip.id as POSFilter)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  posFilter === chip.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Word List */}
          <div className="space-y-2">
            {filteredDictionaryItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No se encontraron palabras que coincidan con la búsqueda.
              </div>
            ) : (
              filteredDictionaryItems.slice(0, 100).map((item) => {
                const isExpanded = expandedWordId === item.id;
                const level = getCardLevel(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-2xs"
                  >
                    <div
                      onClick={() => setExpandedWordId(isExpanded ? null : item.id)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(item.es);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 active:scale-95 cursor-pointer"
                          title="Escuchar pronunciación"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        <div>
                          <div className="flex items-baseline gap-1.5 font-black text-sm text-slate-900 dark:text-white">
                            {item.article && (
                              <span className="text-xs text-slate-400 font-semibold">
                                {item.article}
                              </span>
                            )}
                            <span>{item.es}</span>
                            <span className="text-xs font-medium text-slate-500">
                              — {item.en}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{item.category || POS_LABELS[item.pos] || item.pos}</span>
                            {item.difficulty && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.difficulty === 'advanced'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                    : item.difficulty === 'intermediate'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {item.difficulty === 'advanced' ? 'C1' : item.difficulty === 'intermediate' ? 'B1-B2' : 'A1'}
                              </span>
                            )}
                            {level > 0 && (
                              <span className="text-emerald-600 font-bold">
                                SRS Nivel {level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>

                    {/* Expanded Example Sentence */}
                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/20 text-xs space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>{item.sentence}</span>
                          <button
                            onClick={() => speakSpanish(item.sentence)}
                            className="text-blue-600 dark:text-blue-400 p-1 cursor-pointer"
                            title="Escuchar frase completa"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-slate-500 text-[11px]">{item.sentenceEn}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {filteredDictionaryItems.length > 100 && (
              <div className="text-center text-xs text-slate-400 py-2">
                Mostrando las primeras 100 de {filteredDictionaryItems.length} palabras. Usa el
                buscador para afinar la lista.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TARJETAS FLASHCARDS                                         */}
      {/* ============================================================== */}
      {tabMode === 'flashcards' && currentFlashcard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Tarjeta {(flashcardIndex % activeDeckItems.length) + 1} de {activeDeckItems.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                Nivel SRS: {getCardLevel(currentFlashcard.id) || 'Nuevo'}
              </span>
            </div>
          </div>

          {/* Flashcard container with flip animation */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[260px] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-400 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all select-none relative"
          >
            {/* Top row badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                  {currentFlashcard.category || POS_LABELS[currentFlashcard.pos] || currentFlashcard.pos}
                </span>
                {currentFlashcard.difficulty && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentFlashcard.difficulty === 'advanced'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : currentFlashcard.difficulty === 'intermediate'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {currentFlashcard.difficulty === 'advanced'
                      ? 'C1 Avanzado'
                      : currentFlashcard.difficulty === 'intermediate'
                      ? 'B1-B2'
                      : 'A1-A2'}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakSpanish(currentFlashcard.es);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                title="Escuchar audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Card Center Content */}
            <div className="text-center py-4 space-y-2">
              {!isFlipped ? (
                <>
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentFlashcard.article && (
                      <span className="text-slate-400 text-xl mr-2 font-semibold">
                        {currentFlashcard.article}
                      </span>
                    )}
                    {currentFlashcard.es}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Toca la tarjeta para ver traducción y frase</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {currentFlashcard.en}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl text-left space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {currentFlashcard.sentence}
                    </div>
                    <div className="text-xs text-slate-500">
                      {currentFlashcard.sentenceEn}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom cue */}
            <div className="text-center text-[11px] text-slate-400 font-medium">
              {isFlipped ? '¿Cómo te fue?' : 'Toca para voltear'}
            </div>
          </div>

          {/* Action buttons (feeds SRS queue) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleFlashcardRating(false)}
              className="py-3.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-amber-300 dark:border-amber-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repasar pronto</span>
            </button>

            <button
              onClick={() => handleFlashcardRating(true)}
              className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>¡La sé! (Avanzar)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
