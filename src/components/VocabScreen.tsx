import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VocabEntry, VocabQuestion, UserStats, LeitnerCard } from '../types';
import {
  VOCAB_CORE_500,
  VOCAB_FRASES,
  ALL_VOCAB,
  createVocabQuestion,
} from '../data/vocab';
import { isAnswerCorrect } from '../engine/conjugator';
import {
  recordVocabAnswerInSRS,
  updateVocabStatsOnAnswer,
  saveSRSQueue,
  saveUserStats,
} from '../engine/srs';
import {
  computeVocabPyramid,
  computeFrasesPyramid,
  PyramidType,
} from '../engine/pyramid';
import { speakSpanish, playChime } from '../utils/audio';
import {
  Layers,
  Sparkles,
  BookA,
  Search,
  Filter,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Flame,
  ChevronRight,
  Clock,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  Lock,
} from 'lucide-react';

interface VocabScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  srsCards: LeitnerCard[];
  onUpdateSRS: (newCards: LeitnerCard[]) => void;
  onOpenRoadmap?: (type?: PyramidType) => void;
}

type VocabTabMode = 'drill_context' | 'flashcards' | 'dictionary';
type DeckType = 'core500' | 'frases';
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

const ACCENT_KEYS = ['á', 'é', 'í', 'ó', 'ú', 'ñ'];

export const VocabScreen: React.FC<VocabScreenProps> = ({
  stats,
  onUpdateStats,
  srsCards,
  onUpdateSRS,
  onOpenRoadmap,
}) => {
  const [activeDeck, setActiveDeck] = useState<DeckType>('core500');
  const [tabMode, setTabMode] = useState<VocabTabMode>('drill_context');

  // Compute adaptive vocab & frases pyramids
  const vocabPyramid = computeVocabPyramid(srsCards);
  const frasesPyramid = computeFrasesPyramid(srsCards);

  const activePyramid = activeDeck === 'core500' ? vocabPyramid : frasesPyramid;
  const allDeckItems = activeDeck === 'core500' ? VOCAB_CORE_500 : VOCAB_FRASES;

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Context drill state
  const [isDrillActive, setIsDrillActive] = useState(false);
  const [questions, setQuestions] = useState<VocabQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [drillAnswerMode, setDrillAnswerMode] = useState<'choice' | 'type'>('choice');
  const [questionCountSetting, setQuestionCountSetting] = useState<number>(10);

  // Dictionary / word list state
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<POSFilter>('all');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Settings
  const [newWordsPacing, setNewWordsPacing] = useState<number>(
    stats.settings.newWordsPerDay || 10
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Active items for drill and flashcard practice are strictly driven by the UNLOCKED layers of the pyramid!
  const activeDeckItems = useMemo(() => {
    return activePyramid.unlockedItems.length > 0
      ? activePyramid.unlockedItems
      : allDeckItems.slice(0, activeDeck === 'core500' ? 25 : 15);
  }, [activePyramid, allDeckItems, activeDeck]);

  // Dictionary filtered items (searches entire deck with layer tags)
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

      return matchesSearch && matchesPos;
    });
  }, [allDeckItems, searchQuery, posFilter]);

  // Helper: which layer does an item belong to?
  const getItemLayerNumber = (item: VocabEntry): number => {
    const layerSize = activeDeck === 'core500' ? 25 : 15;
    const idx = allDeckItems.findIndex((it) => it.id === item.id);
    return idx >= 0 ? Math.floor(idx / layerSize) + 1 : 1;
  };

  const isItemUnlocked = (item: VocabEntry): boolean => {
    const itemLayer = getItemLayerNumber(item);
    return itemLayer <= activePyramid.currentLayerNumber;
  };

  // Handle flashcard next
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

  // Start a context drill round
  const startContextDrill = (count = questionCountSetting) => {
    const pool = [...activeDeckItems].sort(() => Math.random() - 0.5);
    const chosen = pool.slice(0, Math.min(count, pool.length));
    const generated = chosen.map((item) => createVocabQuestion(item, 'production'));

    setQuestions(generated);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setTypedAnswer('');
    setHasSubmitted(false);
    setScore({ correct: 0, total: 0 });
    setIsRoundFinished(false);
    setIsDrillActive(true);
  };

  const currentQ = questions[currentQIndex];

  // Auto focus input when switching question in type-in mode
  useEffect(() => {
    if (isDrillActive && drillAnswerMode === 'type' && !hasSubmitted) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isDrillActive, currentQIndex, drillAnswerMode, hasSubmitted]);

  // Check context question answer
  const handleCheckAnswer = (answerProvided: string) => {
    if (hasSubmitted || !currentQ) return;

    const isCorrect = isAnswerCorrect(answerProvided, currentQ.correctAnswer);
    setSelectedOption(answerProvided);
    setHasSubmitted(true);

    if (stats.settings.soundEffects) {
      playChime(isCorrect);
    }

    if (stats.settings.autoSpeak) {
      speakSpanish(currentQ.correctAnswer);
    }

    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Update SRS queue
    const updatedCards = recordVocabAnswerInSRS(
      srsCards,
      currentQ.entry,
      isCorrect,
      false
    );
    onUpdateSRS(updatedCards);

    // Update stats
    const updatedStats = updateVocabStatsOnAnswer(
      stats,
      currentQ.entry.deckId,
      currentQ.entry.es,
      isCorrect
    );
    onUpdateStats(updatedStats);
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTypedAnswer('');
      setHasSubmitted(false);
    } else {
      setIsRoundFinished(true);
    }
  };

  const insertAccent = (char: string) => {
    setTypedAnswer((prev) => prev + char);
    inputRef.current?.focus();
  };

  // Get SRS level of a vocab item
  const getCardLevel = (vocabId: string) => {
    const card = srsCards.find((c) => c.id === `vocab:${vocabId}` || c.vocabId === vocabId);
    return card ? card.level : 0;
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Deck Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Mazo de Vocabulario
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {activeDeck === 'core500' ? '500 palabras' : '150 frases clave'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setActiveDeck('core500');
              setFlashcardIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
              activeDeck === 'core500'
                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm">Core 500</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Frecuencia alta (con artículos)
              </div>
            </div>
            {activeDeck === 'core500' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveDeck('frases');
              setFlashcardIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
              activeDeck === 'frases'
                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm">Frases & Giros</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Expresiones naturales
              </div>
            </div>
            {activeDeck === 'frases' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
          </button>
        </div>

        {/* Active Pyramid Layer Progression Status */}
        {(() => {
          const curLayer = activePyramid.layers[activePyramid.currentLayerNumber - 1];
          const needed = Math.max(0, curLayer.requiredToUnlock - curLayer.masteredCount);
          const isCompleted = curLayer.masteredCount >= curLayer.requiredToUnlock;
          const nextLayer = activePyramid.layers[activePyramid.currentLayerNumber];

          return (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activePyramid.summaryText}
                </span>
                {onOpenRoadmap && (
                  <button
                    onClick={() => onOpenRoadmap(activeDeck === 'core500' ? 'vocab' : 'frases')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <span>Ver Pirámide</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Layer mini progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${curLayer.progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Capa {curLayer.layerNumber}: {curLayer.masteredCount}/{curLayer.totalCount} dominadas (Meta: {curLayer.requiredToUnlock} en N3+)
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {curLayer.progressPct}%
                </span>
              </div>

              {/* Locked next layer notice */}
              {nextLayer && (
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

      {/* Mode Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
        <button
          onClick={() => {
            setTabMode('drill_context');
            setIsDrillActive(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tabMode === 'drill_context'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Práctica en Contexto
        </button>
        <button
          onClick={() => {
            setTabMode('flashcards');
            setIsDrillActive(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tabMode === 'flashcards'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tarjetas (SRS)
        </button>
        <button
          onClick={() => {
            setTabMode('dictionary');
            setIsDrillActive(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tabMode === 'dictionary'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Diccionario ({activeDeckItems.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. DRILL EN CONTEXTO (FILL IN THE BLANK)                      */}
      {/* ============================================================== */}
      {tabMode === 'drill_context' && (
        <>
          {!isDrillActive ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Entrenamiento en Frases Reales
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aprende el vocabulario dentro de oraciones naturales completas con huecos y
                  traducciones de apoyo.
                </p>
              </div>

              {/* Mode & count selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Modo de respuesta:</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setDrillAnswerMode('choice')}
                      className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                        drillAnswerMode === 'choice'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Opción Múltiple
                    </button>
                    <button
                      onClick={() => setDrillAnswerMode('type')}
                      className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                        drillAnswerMode === 'type'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Escribir
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Preguntas por ronda:</span>
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuestionCountSetting(num)}
                        className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                          questionCountSetting === num
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => startContextDrill(questionCountSetting)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
              >
                <span>Comenzar Ronda ({questionCountSetting} preguntas)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : isRoundFinished ? (
            /* Round Score Summary */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  ¡Ronda Completada!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tu progreso se ha registrado en el sistema de repetición espaciada.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl flex justify-around">
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {score.correct} / {score.total}
                  </div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Aciertos
                  </div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                  </div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Precisión
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startContextDrill(questionCountSetting)}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm"
                >
                  Otra Ronda
                </button>
                <button
                  onClick={() => setIsDrillActive(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
                >
                  Salir
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Card */
            <div className="space-y-3">
              {/* Progress Bar & Header */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  Pregunta {currentQIndex + 1} de {questions.length}
                </span>
                <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[11px]">
                  {POS_LABELS[currentQ.entry.pos] || currentQ.entry.pos}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{
                    width: `${((currentQIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Main Question Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                {/* Spanish Sentence with blank */}
                <div className="text-center space-y-2">
                  <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.prompt.split('___').map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span
                            className={`inline-block mx-1.5 px-3 py-0.5 rounded-lg border font-black transition-all ${
                              hasSubmitted
                                ? isAnswerCorrect(
                                    selectedOption || typedAnswer,
                                    currentQ.correctAnswer
                                  )
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300 min-w-[70px]'
                            }`}
                          >
                            {hasSubmitted
                              ? currentQ.correctAnswer
                              : typedAnswer || '_______'}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* English Cue */}
                  <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span>Traducción a completar:</span>
                    <strong className="text-slate-900 dark:text-white">
                      "{currentQ.entry.en}"
                    </strong>
                    {currentQ.entry.article && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded font-bold">
                        {currentQ.entry.article}
                      </span>
                    )}
                  </div>
                </div>

                {/* Answer Mode A: Multiple Choice */}
                {drillAnswerMode === 'choice' && !hasSubmitted && (
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {currentQ.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleCheckAnswer(opt)}
                        className="p-3 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Answer Mode B: Type-In */}
                {drillAnswerMode === 'type' && !hasSubmitted && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (typedAnswer.trim()) handleCheckAnswer(typedAnswer.trim());
                    }}
                    className="space-y-3 pt-2"
                  >
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Escribe la palabra en español..."
                        className="w-full p-3.5 text-base font-bold text-center bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>

                    {/* Virtual Accent Keyboard */}
                    <div className="flex justify-center gap-1.5">
                      {ACCENT_KEYS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => insertAccent(k)}
                          className="w-9 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-95"
                        >
                          {k}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!typedAnswer.trim()}
                      className="w-full py-3 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      Comprobar
                    </button>
                  </form>
                )}

                {/* Feedback & Explanation Card */}
                {hasSubmitted && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        isAnswerCorrect(selectedOption || typedAnswer, currentQ.correctAnswer)
                          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                      }`}
                    >
                      {isAnswerCorrect(
                        selectedOption || typedAnswer,
                        currentQ.correctAnswer
                      ) ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-1 text-xs">
                        <div className="font-extrabold text-sm">
                          {isAnswerCorrect(
                            selectedOption || typedAnswer,
                            currentQ.correctAnswer
                          )
                            ? '¡Correcto!'
                            : `Respuesta correcta: ${currentQ.correctAnswer}`}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {currentQ.explanation}
                        </div>
                      </div>
                    </div>

                    {/* Sentence translation & Audio */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {currentQ.contextEn}
                        </div>
                      </div>
                      <button
                        onClick={() => speakSpanish(currentQ.entry.sentence)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:scale-105 transition-all"
                        title="Escuchar pronunciación"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>
                        {currentQIndex + 1 < questions.length
                          ? 'Siguiente Pregunta'
                          : 'Ver Resultados'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ============================================================== */}
      {/* 2. TARJETAS FLASHCARDS (LEITNER SRS)                           */}
      {/* ============================================================== */}
      {tabMode === 'flashcards' && currentFlashcard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Tarjeta {(flashcardIndex % activeDeckItems.length) + 1} de {activeDeckItems.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
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
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                {currentFlashcard.category || POS_LABELS[currentFlashcard.pos] || currentFlashcard.pos}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakSpanish(currentFlashcard.es);
                }}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
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

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl text-left space-y-1 border border-slate-100 dark:border-slate-800">
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
              className="py-3.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-amber-300 dark:border-amber-800"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repasar pronto</span>
            </button>

            <button
              onClick={() => handleFlashcardRating(true)}
              className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>¡La sé! (Avanzar)</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DICCIONARIO / LISTA COMPLETA DE PALABRAS                     */}
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
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
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
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
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
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 active:scale-95"
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
                            className="text-blue-600 dark:text-blue-400 p-1"
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
    </div>
  );
};
