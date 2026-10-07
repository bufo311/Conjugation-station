import React, { useState, useEffect, useRef } from 'react';
import {
  TenseKey,
  Verb,
  Question,
  UserStats,
  LeitnerCard,
} from '../types';
import { VERB_LIBRARY } from '../data/verbs';
import { TENSE_NAMES, PRONOUN_LABELS, isAnswerCorrect } from '../engine/conjugator';
import { generateQuestion } from '../engine/questionGenerator';
import { recordAnswerInSRS, updateStatsOnAnswer } from '../engine/srs';
import {
  computeVerbsPyramid,
  computeVocabPyramid,
  computeFrasesPyramid,
  buildDailySessionQueue,
  PyramidType,
} from '../engine/pyramid';
import { speakSpanish, playChime } from '../utils/audio';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Settings2,
  Check,
  ChevronRight,
  Trophy,
  TrendingUp,
  Lock,
  Calendar,
  Layers,
  Star,
  BookA,
  MessageSquare,
  Target,
} from 'lucide-react';

interface PracticeScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  srsCards: LeitnerCard[];
  onUpdateSRS: (newCards: LeitnerCard[]) => void;
  onOpenSettings: () => void;
  onOpenRoadmap?: (type?: PyramidType) => void;
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

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  stats,
  onUpdateStats,
  srsCards,
  onUpdateSRS,
  onOpenSettings,
  onOpenRoadmap,
}) => {
  // Session states: 'setup' | 'quiz' | 'summary'
  const [sessionState, setSessionState] = useState<'setup' | 'quiz' | 'summary'>('setup');

  // Setup options
  const [selectedTenses, setSelectedTenses] = useState<TenseKey[]>([
    'presente',
    'preterito',
    'imperfecto',
  ]);
  const [useFavoritesOnly, setUseFavoritesOnly] = useState<boolean>(false);
  const [roundLength, setRoundLength] = useState<number>(10);
  const [answerMode, setAnswerMode] = useState<'choice' | 'type'>(stats.settings.defaultMode);
  const [isDailySession, setIsDailySession] = useState<boolean>(false);

  // Active quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [roundResults, setRoundResults] = useState<
    Array<{ question: Question; userAns: string; correct: boolean }>
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Selected content-type tab for pyramid preview
  const [activePyramidTab, setActivePyramidTab] = useState<PyramidType>('verbs');

  // Compute adaptive pyramids from Leitner cards
  const verbsPyramid = computeVerbsPyramid(srsCards);
  const vocabPyramid = computeVocabPyramid(srsCards);
  const frasesPyramid = computeFrasesPyramid(srsCards);

  // Active verb pool is driven exclusively by the UNLOCKED layers of the pyramid!
  const getActiveVerbPool = (): Verb[] => {
    let pool = verbsPyramid.unlockedItems;
    if (useFavoritesOnly) {
      const favs = pool.filter((v) => stats.favorites.includes(v.infinitive));
      if (favs.length > 0) pool = favs;
    }
    return pool.length > 0 ? pool : VERB_LIBRARY.slice(0, 12);
  };

  // 1. Daily Session: Due reviews first, then new layer items up to cap
  const startDailySession = () => {
    const dailyQueue = buildDailySessionQueue(
      srsCards,
      stats.settings.newWordsPerDay || 10,
      'verbs'
    );
    const sessionCards = dailyQueue.combinedQueue;

    if (sessionCards.length === 0) {
      startCustomRound();
      return;
    }

    const tenses: TenseKey[] = selectedTenses.length > 0 ? selectedTenses : ['presente'];
    const newQuestions: Question[] = [];
    const usedIds: string[] = [];

    for (const card of sessionCards) {
      const verb =
        VERB_LIBRARY.find((v) => v.infinitive === card.infinitive) ||
        verbsPyramid.unlockedItems[0];
      const targetTense = card.tense || tenses[Math.floor(Math.random() * tenses.length)];
      const q = generateQuestion([targetTense], [verb], stats.settings.includeVosotros, usedIds);
      if (q) {
        newQuestions.push(q);
        usedIds.push(q.id);
      }
    }

    if (newQuestions.length === 0) {
      startCustomRound();
      return;
    }

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedInput('');
    setHasAnswered(false);
    setIsCorrect(false);
    setRoundResults([]);
    setIsDailySession(true);
    setSessionState('quiz');

    if (answerMode === 'type') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  // 2. Custom Round: Practice unlocked verbs with selected tenses
  const startCustomRound = () => {
    const pool = getActiveVerbPool();
    const tenses: TenseKey[] = selectedTenses.length > 0 ? selectedTenses : ['presente'];
    const newQuestions: Question[] = [];
    const usedIds: string[] = [];

    for (let i = 0; i < roundLength; i++) {
      const q = generateQuestion(tenses, pool, stats.settings.includeVosotros, usedIds);
      if (q) {
        newQuestions.push(q);
        usedIds.push(q.id);
      }
    }

    if (newQuestions.length === 0) return;

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedInput('');
    setHasAnswered(false);
    setIsCorrect(false);
    setRoundResults([]);
    setIsDailySession(false);
    setSessionState('quiz');

    if (answerMode === 'type') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (sessionState === 'quiz' && currentQ && stats.settings.autoSpeak && !hasAnswered) {
      // Optional auto-pronounce cue
    }
  }, [currentIndex, sessionState]);

  const handleSelectOption = (opt: string) => {
    if (hasAnswered || !currentQ) return;
    const correct = isAnswerCorrect(opt, currentQ.correctAnswer);
    submitAnswer(opt, correct);
  };

  const handleTypeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (hasAnswered || !currentQ || !typedInput.trim()) return;
    const correct = isAnswerCorrect(typedInput, currentQ.correctAnswer);
    submitAnswer(typedInput.trim(), correct);
  };

  const submitAnswer = (userAns: string, correct: boolean) => {
    if (!currentQ) return;
    setSelectedOption(userAns);
    setHasAnswered(true);
    setIsCorrect(correct);

    if (stats.settings.soundEffects) {
      playChime(correct);
    }

    // Audio pronounce full sentence if correct
    if (stats.settings.autoSpeak) {
      const fullSentence = `${currentQ.template.before} ${currentQ.correctAnswer} ${currentQ.template.after}`;
      speakSpanish(fullSentence);
    }

    // Update SRS queue
    const updatedCards = recordAnswerInSRS(
      srsCards,
      currentQ.verb.infinitive,
      currentQ.tense,
      currentQ.pronoun,
      currentQ.correctAnswer,
      `${currentQ.template.before} ___ ${currentQ.template.after}`,
      currentQ.englishFull,
      correct
    );
    onUpdateSRS(updatedCards);

    // Update global stats
    const updatedStats = updateStatsOnAnswer(
      stats,
      currentQ.tense,
      currentQ.verb.infinitive,
      correct
    );
    onUpdateStats(updatedStats);

    setRoundResults((prev) => [
      ...prev,
      { question: currentQ, userAns, correct },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTypedInput('');
      setHasAnswered(false);
      setIsCorrect(false);
      if (answerMode === 'type') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setSessionState('summary');
    }
  };

  const appendAccent = (char: string) => {
    setTypedInput((prev) => prev + char);
    inputRef.current?.focus();
  };

  const toggleTense = (tense: TenseKey) => {
    if (selectedTenses.includes(tense)) {
      if (selectedTenses.length > 1) {
        setSelectedTenses(selectedTenses.filter((t) => t !== tense));
      }
    } else {
      setSelectedTenses([...selectedTenses, tense]);
    }
  };

  // Quick preset buttons
  const applyPreset = (preset: 'all' | 'present' | 'past' | 'subjunctive') => {
    switch (preset) {
      case 'all':
        setSelectedTenses([...ALL_TENSES]);
        break;
      case 'present':
        setSelectedTenses(['presente']);
        break;
      case 'past':
        setSelectedTenses(['preterito', 'imperfecto', 'preterito_perfecto']);
        break;
      case 'subjunctive':
        setSelectedTenses(['presente_subjuntivo', 'imperfecto_subjuntivo']);
        break;
    }
  };

  // ==================== RENDER: SETUP SCREEN ====================
  if (sessionState === 'setup') {
    return (
      <div className="space-y-5 animate-in fade-in pb-12">
        {/* Header card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                Setup Round
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Train in Context
              </h2>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fill the blank in authentic Spanish sentences. Rapid 5-minute drills for muscle memory.
          </p>
        </div>

        {/* Tense selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tenses ({selectedTenses.length})
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => applyPreset('present')}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-blue-50 hover:text-blue-600"
              >
                Present
              </button>
              <button
                onClick={() => applyPreset('past')}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-blue-50 hover:text-blue-600"
              >
                Past
              </button>
              <button
                onClick={() => applyPreset('subjunctive')}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-blue-50 hover:text-blue-600"
              >
                Subjunctive
              </button>
              <button
                onClick={() => applyPreset('all')}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-blue-50 hover:text-blue-600"
              >
                All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {ALL_TENSES.map((t) => {
              const active = selectedTenses.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTense(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {TENSE_NAMES[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pyramid Progression Status Card per Content Type */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pirámides de Progresión
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desbloqueo automático al 80% de dominio (L3+)
                </p>
              </div>
            </div>

            {onOpenRoadmap && (
              <button
                onClick={() => onOpenRoadmap(activePyramidTab)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Ver Roadmap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content Type Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActivePyramidTab('verbs')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activePyramidTab === 'verbs'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Verbos</span>
            </button>
            <button
              onClick={() => setActivePyramidTab('vocab')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activePyramidTab === 'vocab'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookA className="w-3.5 h-3.5" />
              <span>Vocab</span>
            </button>
            <button
              onClick={() => setActivePyramidTab('frases')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activePyramidTab === 'frases'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Frases</span>
            </button>
          </div>

          {/* Status for selected pyramid type */}
          {(() => {
            const currentPyramid =
              activePyramidTab === 'verbs'
                ? verbsPyramid
                : activePyramidTab === 'vocab'
                ? vocabPyramid
                : frasesPyramid;

            const curLayer = currentPyramid.layers[currentPyramid.currentLayerNumber - 1];
            const needed = Math.max(0, curLayer.requiredToUnlock - curLayer.masteredCount);
            const isCompleted = curLayer.masteredCount >= curLayer.requiredToUnlock;
            const nextLayer = currentPyramid.layers[currentPyramid.currentLayerNumber];

            return (
              <div className="space-y-2.5">
                {/* Summary Headline as specified: e.g. "Verbs — Layer 3: 30/36 mastered · 6 to go" */}
                <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                  <span>{currentPyramid.summaryText}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                    {curLayer.progressPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${curLayer.progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Capa {curLayer.layerNumber}: {curLayer.masteredCount}/{curLayer.totalCount} dominados (Meta: {curLayer.requiredToUnlock} en Nivel 3+)
                  </span>
                  <span>
                    {currentPyramid.totalUnlockedItems} en rotación
                  </span>
                </div>

                {/* Locked Next Layer Preview (greyed out with unlock condition) */}
                {nextLayer && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs border border-slate-200/60 dark:border-slate-800/60">
                    <Lock className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-500 dark:text-slate-400">
                        Capa {nextLayer.layerNumber} (Bloqueada)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {nextLayer.unlockCondition}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Action Buttons: Daily Session & Custom Round */}
        <div className="space-y-3">
          {/* Start Daily Session (Reviews First, then New Items) */}
          {(() => {
            const daily = buildDailySessionQueue(srsCards, stats.settings.newWordsPerDay || 10, 'verbs');
            const dueCount = daily.dueReviews.length;
            const newCount = daily.newItems.length;

            return (
              <button
                onClick={startDailySession}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white rounded-2xl shadow-md shadow-blue-500/20 text-left transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-200" />
                    <span className="font-extrabold text-base">
                      Comenzar Sesión de Hoy
                    </span>
                  </div>
                  <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {dueCount > 0 ? `${dueCount} repasos` : 'Al día'}
                  </span>
                </div>
                <div className="text-xs text-blue-100/90 pl-7">
                  {dueCount > 0
                    ? `Primero ${dueCount} repasos pendientes, luego ${newCount} verbos nuevos de la capa.`
                    : `Repasos al día. Aprendiendo hasta ${newCount} verbos de la Capa ${verbsPyramid.currentLayerNumber}.`}
                </div>
              </button>
            );
          })()}

          {/* Favorites Filter & Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Favorites Toggle */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Filtro Favoritos
                </span>
                <div className="text-xs text-slate-400 mt-0.5">
                  {stats.favorites.length} verbos marcados
                </div>
              </div>
              <button
                onClick={() => setUseFavoritesOnly(!useFavoritesOnly)}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                  useFavoritesOnly
                    ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Star
                  className={`w-4 h-4 ${useFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`}
                />
                <span>{useFavoritesOnly ? 'Solo Favoritos' : 'Todos'}</span>
              </button>
            </div>

            {/* Answer Mode & Length */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Modo de Respuesta
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setAnswerMode('choice')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      answerMode === 'choice'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Opción
                  </button>
                  <button
                    onClick={() => setAnswerMode('type')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      answerMode === 'type'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Escribir
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Preguntas / ronda:</span>
                <div className="flex gap-1">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRoundLength(num)}
                      className={`w-8 h-7 rounded-lg font-bold transition-all ${
                        roundLength === num
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
          </div>

          {/* Custom round button */}
          <button
            onClick={startCustomRound}
            className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <span>Práctica Personalizada ({roundLength} preguntas)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==================== RENDER: ACTIVE QUIZ LOOP ====================
  if (sessionState === 'quiz' && currentQ) {
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const pronounLabel = PRONOUN_LABELS[currentQ.pronoun];
    const tenseLabel = TENSE_NAMES[currentQ.tense];

    return (
      <div className="space-y-4 animate-in fade-in pb-12">
        {/* Progress & Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <button
            onClick={() => setSessionState('setup')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Quit Round
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* The Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          {/* Metadata banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">
                {tenseLabel}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sujeto: <strong className="text-slate-800 dark:text-slate-200">{pronounLabel}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                const sentence = `${currentQ.template.before} ${hasAnswered ? currentQ.correctAnswer : currentQ.verb.infinitive} ${currentQ.template.after}`;
                speakSpanish(sentence);
              }}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Hear sentence"
              aria-label="Hear sentence"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Infinitive cue chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
            <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
              {currentQ.verb.infinitive}
            </span>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70">
              ({currentQ.verb.translation})
            </span>
            {currentQ.verb.irregular && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Irreg
              </span>
            )}
          </div>

          {/* Spanish sentence with blank */}
          <div className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-900 dark:text-slate-100 min-h-[72px] flex items-center flex-wrap gap-x-1.5">
            {currentQ.template.before && <span>{currentQ.template.before}</span>}
            <span
              className={`inline-block px-3 py-1 rounded-xl font-bold border transition-all ${
                !hasAnswered
                  ? 'bg-slate-100 dark:bg-slate-800 border-dashed border-blue-500 text-blue-600 dark:text-blue-400 min-w-[90px] text-center'
                  : isCorrect
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-500 dark:bg-rose-950/70 dark:text-rose-300'
              }`}
            >
              {hasAnswered ? currentQ.correctAnswer : '______'}
            </span>
            {currentQ.template.after && <span>{currentQ.template.after}</span>}
          </div>

          {/* English translation hint shown after answering */}
          {hasAnswered && (
            <div className="text-sm text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
              "{currentQ.englishFull}"
            </div>
          )}
        </div>

        {/* Answer interactive area */}
        {!hasAnswered ? (
          answerMode === 'choice' ? (
            /* MULTIPLE CHOICE OPTIONS (4 options) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  onClick={() => handleSelectOption(opt)}
                  className="min-h-[56px] w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold text-lg text-left transition-all active:scale-[0.98] shadow-sm flex items-center justify-between"
                >
                  <span>{opt}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {String.fromCharCode(65 + i)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* TYPE-IN MODE */
            <form onSubmit={handleTypeSubmit} className="space-y-3 pt-1">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Type conjugated verb..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="flex-1 h-14 px-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500 outline-none text-xl font-bold text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!typedInput.trim()}
                  className="h-14 px-6 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  Check
                </button>
              </div>

              {/* Accent keys helper */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Quick accents:</span>
                <div className="flex gap-1.5">
                  {['á', 'é', 'í', 'ó', 'ú', 'ñ'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => appendAccent(char)}
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )
        ) : (
          /* FEEDBACK DRAWER */
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div
              className={`p-5 rounded-2xl border ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-base">
                    {isCorrect ? '¡Excelente!' : 'Respuesta correcta:'}
                  </div>
                  {!isCorrect && (
                    <div className="text-xl font-black text-rose-700 dark:text-rose-300">
                      {currentQ.correctAnswer}
                    </div>
                  )}
                  {/* One-line explanation */}
                  <div className="text-xs opacity-90 font-mono mt-1 pt-1 border-t border-black/10 dark:border-white/10">
                    {currentQ.explanation}
                  </div>
                </div>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={handleNextQuestion}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>{currentIndex + 1 < questions.length ? 'Continue' : 'Finish Round'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================== RENDER: END OF ROUND SUMMARY ====================
  const correctCount = roundResults.filter((r) => r.correct).length;
  const accuracyPct = Math.round((correctCount / roundResults.length) * 100) || 0;

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Round Completed!
        </h2>
        <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
          {accuracyPct}%
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You got <strong className="text-slate-900 dark:text-white">{correctCount}</strong> out of{' '}
          {roundResults.length} correct.
        </p>
      </div>

      {/* Breakdown list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
          Round Breakdown
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {roundResults.map((res, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between text-sm">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{res.question.verb.infinitive}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({TENSE_NAMES[res.question.tense]})
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{res.question.correctAnswer}</span>
                  {!res.correct && (
                    <span className="text-rose-500 ml-2 line-through">{res.userAns}</span>
                  )}
                </div>
              </div>
              <div>
                {res.correct ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Needs SRS
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={isDailySession ? startDailySession : startCustomRound}
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{isDailySession ? 'Continue Session' : 'New Round'}</span>
        </button>
        <button
          onClick={() => setSessionState('setup')}
          className="px-5 h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
        >
          Setup
        </button>
      </div>
    </div>
  );
};
