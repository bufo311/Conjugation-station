import React, { useState, useRef, useMemo } from 'react';
import {
  TenseKey,
  Verb,
  VocabEntry,
  UnifiedQuestion,
  UserStats,
  LeitnerCard,
} from '../types';
import { VERB_LIBRARY } from '../data/verbs';
import { VOCAB_CORE_500, VOCAB_FRASES, VOCAB_ADVANCED } from '../data/vocab';
import { TENSE_NAMES, PRONOUN_LABELS, isAnswerCorrect } from '../engine/conjugator';
import { generateUnifiedQuizRound } from '../engine/questionGenerator';
import {
  recordAnswerInSRS,
  recordVocabAnswerInSRS,
  updateStatsOnAnswer,
  updateVocabStatsOnAnswer,
  generateSyncPayload,
} from '../engine/srs';
import {
  computeVerbsPyramid,
  computeVocabPyramid,
  computeFrasesPyramid,
  computeAdvancedPyramid,
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
  Check,
  ChevronRight,
  Trophy,
  TrendingUp,
  Lock,
  Unlock,
  BookA,
  MessageSquare,
  SlidersHorizontal,
  Zap,
  Shuffle,
  KeyRound,
  Copy,
} from 'lucide-react';

interface PracticeScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  srsCards: LeitnerCard[];
  onUpdateSRS: (newCards: LeitnerCard[]) => void;
  onOpenSettings: () => void;
  onOpenRoadmap?: (type?: PyramidType) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  stats,
  onUpdateStats,
  srsCards,
  onUpdateSRS,
  onOpenRoadmap,
}) => {
  // Session states: 'setup' | 'quiz' | 'summary'
  const [sessionState, setSessionState] = useState<'setup' | 'quiz' | 'summary'>('setup');

  // Streamlined quiz options
  const [roundLength, setRoundLength] = useState<number>(10);
  const [answerMode, setAnswerMode] = useState<'choice' | 'type'>(stats.settings.defaultMode);
  const [difficultyLevel, setDifficultyLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>(
    stats.settings.vocabDifficulty || 'all'
  );

  // Active quiz state
  const [questions, setQuestions] = useState<UnifiedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [roundResults, setRoundResults] = useState<
    Array<{ question: UnifiedQuestion; userAns: string; correct: boolean }>
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const syncCode = useMemo(() => generateSyncPayload(stats, srsCards), [stats, srsCards]);

  const handleCopySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const unlockAll = !!stats.settings.unlockAllLayers;

  // Compute adaptive pyramids from Leitner cards (respecting unlockAll)
  const verbsPyramid = useMemo(() => computeVerbsPyramid(srsCards, unlockAll), [srsCards, unlockAll]);
  const vocabPyramid = useMemo(() => computeVocabPyramid(srsCards, unlockAll), [srsCards, unlockAll]);
  const frasesPyramid = useMemo(() => computeFrasesPyramid(srsCards, unlockAll), [srsCards, unlockAll]);
  const advancedPyramid = useMemo(() => computeAdvancedPyramid(srsCards, unlockAll), [srsCards, unlockAll]);

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

  const handleDifficultyChange = (diff: 'all' | 'beginner' | 'intermediate' | 'advanced') => {
    setDifficultyLevel(diff);
    const updated: UserStats = {
      ...stats,
      settings: {
        ...stats.settings,
        vocabDifficulty: diff,
      },
    };
    onUpdateStats(updated);
  };

  // Launch the Unified Mixed Quiz (Verbs + Vocab + Phrases combined into 1 quiz)
  const startUnifiedRound = () => {
    // 1. Verb Pool
    let vPool: Verb[] = unlockAll ? VERB_LIBRARY : verbsPyramid.unlockedItems;
    if (vPool.length === 0) vPool = VERB_LIBRARY.slice(0, 12);

    // 2. Vocab & Phrases Pools
    let vocPool: VocabEntry[] = unlockAll
      ? [...VOCAB_CORE_500, ...VOCAB_ADVANCED]
      : vocabPyramid.unlockedItems.length > 0
      ? vocabPyramid.unlockedItems
      : VOCAB_CORE_500.slice(0, 25);

    let frPool: VocabEntry[] = unlockAll
      ? [...VOCAB_FRASES, ...VOCAB_ADVANCED.filter((i) => i.pos === 'chunk')]
      : frasesPyramid.unlockedItems.length > 0
      ? frasesPyramid.unlockedItems
      : VOCAB_FRASES.slice(0, 15);

    // Filter by chosen difficulty level if specified
    if (difficultyLevel !== 'all') {
      const filteredVoc = vocPool.filter((i) => i.difficulty === difficultyLevel);
      const filteredFr = frPool.filter((i) => i.difficulty === difficultyLevel);
      if (filteredVoc.length > 0) vocPool = filteredVoc;
      if (filteredFr.length > 0) frPool = filteredFr;
    }

    // Calibrate tenses to match chosen difficulty
    let tensesToUse: TenseKey[] = ['presente', 'preterito', 'imperfecto'];
    if (difficultyLevel === 'beginner') {
      tensesToUse = ['presente', 'preterito'];
    } else if (difficultyLevel === 'intermediate') {
      tensesToUse = ['presente', 'preterito', 'imperfecto', 'futuro', 'condicional'];
    } else if (difficultyLevel === 'advanced') {
      tensesToUse = ['presente_subjuntivo', 'imperfecto_subjuntivo', 'condicional', 'preterito_perfecto', 'futuro'];
    } else {
      tensesToUse = ['presente', 'preterito', 'imperfecto', 'futuro', 'condicional', 'presente_subjuntivo'];
    }

    const newQuestions = generateUnifiedQuizRound({
      count: roundLength,
      verbPool: vPool,
      vocabPool: vocPool,
      frasesPool: frPool,
      selectedTenses: tensesToUse,
      includeTypes: ['verb', 'vocab', 'phrase'], // ALWAYS combines all 3!
      includeVosotros: stats.settings.includeVosotros,
    });

    if (newQuestions.length === 0) return;

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedInput('');
    setHasAnswered(false);
    setIsCorrect(false);
    setRoundResults([]);
    setSessionState('quiz');

    if (answerMode === 'type') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const currentQ = questions[currentIndex];

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

  // Submit and update SRS & Pyramids seamlessly across verbs, vocab, and phrases
  const submitAnswer = (userAns: string, correct: boolean) => {
    if (!currentQ) return;
    setSelectedOption(userAns);
    setHasAnswered(true);
    setIsCorrect(correct);

    if (stats.settings.soundEffects) {
      playChime(correct);
    }

    if (stats.settings.autoSpeak) {
      speakSpanish(currentQ.prompt.replace('___', currentQ.correctAnswer));
    }

    // 1. If Verb Question: update Verb SRS card & Verb stats
    if (currentQ.type === 'verb' && currentQ.verbData) {
      const { verb, tense, pronoun } = currentQ.verbData;
      const updatedCards = recordAnswerInSRS(
        srsCards,
        verb.infinitive,
        tense,
        pronoun,
        currentQ.correctAnswer,
        currentQ.prompt,
        currentQ.englishTranslation,
        correct
      );
      onUpdateSRS(updatedCards);

      const updatedStats = updateStatsOnAnswer(
        stats,
        tense,
        verb.infinitive,
        correct
      );
      onUpdateStats(updatedStats);
    }

    // 2. If Vocab or Phrase Question: update Vocab SRS card & Vocab stats
    if ((currentQ.type === 'vocab' || currentQ.type === 'phrase') && currentQ.vocabData) {
      const { entry } = currentQ.vocabData;
      const updatedCards = recordVocabAnswerInSRS(
        srsCards,
        entry,
        correct,
        false
      );
      onUpdateSRS(updatedCards);

      const updatedStats = updateVocabStatsOnAnswer(
        stats,
        entry.deckId,
        entry.es,
        correct
      );
      onUpdateStats(updatedStats);
    }

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

  // ==============================================================
  // RENDER: SETUP SCREEN (SIMPLIFIED & UNIFIED QUIZ)
  // ==============================================================
  if (sessionState === 'setup') {
    return (
      <div className="space-y-4 animate-in fade-in pb-12">
        {/* HERO CARD: THE ONE UNIFIED QUIZ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Quiz Mixto 3 en 1</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Verbos, Vocabulario y Frases
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Una sola sesión ágil que combina conjugaciones, palabras clave y expresiones idiomáticas.
              ¡Aprende todo junto sin monotonía y avanza en todas las pirámides!
            </p>
          </div>

          {/* Active 3-in-1 Pillars Preview */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-center">
              <Zap className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-[11px] font-black text-amber-900 dark:text-amber-200">Verbos</span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Conjugación</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-center">
              <BookA className="w-4 h-4 text-blue-500 mb-1" />
              <span className="text-[11px] font-black text-blue-900 dark:text-blue-200">Vocabulario</span>
              <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80">Esencial & C1</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-center">
              <MessageSquare className="w-4 h-4 text-emerald-500 mb-1" />
              <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-200">Frases</span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Giros Reales</span>
            </div>
          </div>

          {/* STREAMLINED ESSENTIAL CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 1. Difficulty Tier */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                <span>Nivel</span>
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => handleDifficultyChange('all')}
                  className={`py-1.5 px-1 rounded-lg transition-all ${
                    difficultyLevel === 'all'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Mixto
                </button>
                <button
                  onClick={() => handleDifficultyChange('beginner')}
                  className={`py-1.5 px-1 rounded-lg transition-all ${
                    difficultyLevel === 'beginner'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  A1-A2
                </button>
                <button
                  onClick={() => handleDifficultyChange('intermediate')}
                  className={`py-1.5 px-1 rounded-lg transition-all ${
                    difficultyLevel === 'intermediate'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  B1-B2
                </button>
                <button
                  onClick={() => handleDifficultyChange('advanced')}
                  className={`py-1.5 px-1 rounded-lg transition-all ${
                    difficultyLevel === 'advanced'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  C1 Difícil
                </button>
              </div>
            </div>

            {/* 2. Response Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Respuesta
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold h-[38px] items-center">
                <button
                  onClick={() => setAnswerMode('choice')}
                  className={`h-full rounded-lg transition-all ${
                    answerMode === 'choice'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Opción
                </button>
                <button
                  onClick={() => setAnswerMode('type')}
                  className={`h-full rounded-lg transition-all ${
                    answerMode === 'type'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Escribir
                </button>
              </div>
            </div>

            {/* 3. Question Count */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Preguntas
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold h-[38px] items-center">
                {[10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRoundLength(num)}
                    className={`h-full rounded-lg transition-all ${
                      roundLength === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {num} preguntas
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN BIG ACTION BUTTON */}
          <button
            onClick={startUnifiedRound}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Shuffle className="w-5 h-5" />
            <span>Comenzar Quiz Mixto ({roundLength} preguntas)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* ULTRA-COMPACT PROGRESS CODE BANNER */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  Tu Código de Progreso
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  {syncCode.length} car.
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-mono select-all truncate max-w-[200px] sm:max-w-[260px]">
                {syncCode}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopySyncCode}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer"
            title="Copiar código al portapapeles"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* PROGRESSION & PYRAMIDS MASTERY OVERVIEW */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Progreso en Pirámides
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cada quiz mixto hace avanzar todas tus áreas a la vez
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleUnlockAll}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
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
                  onClick={() => onOpenRoadmap('verbs')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>Roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4-pillar progress snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Verbos</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {verbsPyramid.totalMastered}/{verbsPyramid.totalUnlockedItems}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold">
                Capa {verbsPyramid.currentLayerNumber}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <BookA className="w-3 h-3 text-blue-500" />
                <span>Vocabulario</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {vocabPyramid.totalMastered}/{vocabPyramid.totalUnlockedItems}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold">
                Capa {vocabPyramid.currentLayerNumber}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-500" />
                <span>Frases</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {frasesPyramid.totalMastered}/{frasesPyramid.totalUnlockedItems}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold">
                Capa {frasesPyramid.currentLayerNumber}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Avanzado C1</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {advancedPyramid.totalMastered}/{advancedPyramid.totalUnlockedItems}
              </div>
              <div className="text-[10px] text-purple-600 font-semibold">
                Capa {advancedPyramid.currentLayerNumber}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // RENDER: ACTIVE QUIZ LOOP
  // ==============================================================
  if (sessionState === 'quiz' && currentQ) {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Header badge info depending on question type
    const getBadgeInfo = () => {
      if (currentQ.type === 'verb' && currentQ.verbData) {
        const { verb, tense, pronoun } = currentQ.verbData;
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
          title: `Verbo: ${verb.infinitive}`,
          sub: `${TENSE_NAMES[tense]} · ${PRONOUN_LABELS[pronoun]}`,
          badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        };
      }
      if (currentQ.type === 'vocab' && currentQ.vocabData) {
        const { entry } = currentQ.vocabData;
        return {
          icon: <BookA className="w-3.5 h-3.5 text-blue-500" />,
          title: `Vocabulario`,
          sub: `${entry.category || entry.pos}${entry.difficulty ? ` [${entry.difficulty.toUpperCase()}]` : ''}`,
          badgeClass: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        };
      }
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />,
        title: `Frase / Modismo`,
        sub: currentQ.vocabData?.entry.category || 'Expresión cotidiana',
        badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      };
    };

    const badge = getBadgeInfo();

    return (
      <div className="space-y-4 animate-in fade-in pb-12">
        {/* Progress & Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
          </div>
          <button
            onClick={() => setSessionState('setup')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            Salir de la ronda
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${badge.badgeClass}`}>
              {badge.icon}
              <span>{badge.title}</span>
              <span className="opacity-40">·</span>
              <span className="font-medium">{badge.sub}</span>
            </div>

            <button
              onClick={() => {
                const textToSpeak = currentQ.prompt.replace('___', hasAnswered ? currentQ.correctAnswer : '');
                speakSpanish(textToSpeak || currentQ.correctAnswer);
              }}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Escuchar audio"
              aria-label="Escuchar audio"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Spanish sentence with blank ___ */}
          <div className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-900 dark:text-slate-100 min-h-[72px] flex items-center flex-wrap gap-x-2">
            {(() => {
              const parts = currentQ.prompt.split('___');
              const before = parts[0] || '';
              const after = parts[1] || '';

              return (
                <>
                  {before && <span>{before}</span>}
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
                  {after && <span>{after}</span>}
                </>
              );
            })()}
          </div>

          {/* English translation guide */}
          <div className="text-sm text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
            "{currentQ.englishTranslation}"
          </div>
        </div>

        {/* Answer interactive area */}
        {!hasAnswered ? (
          answerMode === 'choice' ? (
            /* MULTIPLE CHOICE OPTIONS */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  onClick={() => handleSelectOption(opt)}
                  className="min-h-[56px] w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg text-left transition-all active:scale-[0.98] shadow-sm flex items-center justify-between cursor-pointer"
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
                  placeholder="Escribe la respuesta en español..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="flex-1 h-14 px-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500 outline-none text-xl font-bold text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!typedInput.trim()}
                  className="h-14 px-6 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                >
                  Comprobar
                </button>
              </div>

              {/* Accent keys helper */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Tildes rápidas:</span>
                <div className="flex gap-1.5">
                  {['á', 'é', 'í', 'ó', 'ú', 'ñ'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => appendAccent(char)}
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer"
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
                  <div className="text-xs opacity-90 mt-1 pt-1 border-t border-black/10 dark:border-white/10">
                    {currentQ.explanation}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 opacity-90">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {currentQ.type === 'verb'
                        ? '⚡ Chipeando en: Pirámide de Verbos'
                        : currentQ.type === 'phrase'
                        ? '💬 Chipeando en: Pirámide de Frases'
                        : '📖 Chipeando en: Pirámide de Vocabulario'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={handleNextQuestion}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentIndex + 1 < questions.length ? 'Siguiente Pregunta' : 'Finalizar Ronda'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  // RENDER: END OF ROUND SUMMARY
  // ==============================================================
  const correctCount = roundResults.filter((r) => r.correct).length;
  const accuracyPct = Math.round((correctCount / roundResults.length) * 100) || 0;

  // Category breakdown metrics
  const verbResults = roundResults.filter((r) => r.question.type === 'verb');
  const vocabResults = roundResults.filter((r) => r.question.type === 'vocab');
  const phraseResults = roundResults.filter((r) => r.question.type === 'phrase');

  const verbCorrect = verbResults.filter((r) => r.correct).length;
  const vocabCorrect = vocabResults.filter((r) => r.correct).length;
  const phraseCorrect = phraseResults.filter((r) => r.correct).length;

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          ¡Ronda Mixta Completada!
        </h2>
        <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
          {accuracyPct}%
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acertaste <strong className="text-slate-900 dark:text-white">{correctCount}</strong> de{' '}
          {roundResults.length} preguntas.
        </p>

        {/* Category Breakdown pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          {verbResults.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">⚡ Verbos</div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {verbCorrect}/{verbResults.length}
              </div>
            </div>
          )}
          {vocabResults.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">📖 Vocab</div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {vocabCorrect}/{vocabResults.length}
              </div>
            </div>
          )}
          {phraseResults.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">💬 Frases</div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {phraseCorrect}/{phraseResults.length}
              </div>
            </div>
          )}
        </div>

        {/* Simultaneous pyramid progress banner */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Tus respuestas hicieron avanzar las pirámides de Verbos, Vocabulario y Frases simultáneamente.</span>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
          Desglose de la Ronda
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {roundResults.map((res, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between text-sm">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {res.question.type === 'verb'
                      ? '⚡ Verbo'
                      : res.question.type === 'vocab'
                      ? '📖 Vocab'
                      : '💬 Frase'}
                  </span>
                  <span>{res.question.correctAnswer}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {res.question.englishTranslation}
                  {!res.correct && (
                    <span className="text-rose-500 ml-2 line-through">
                      (Escribiste: {res.userAns})
                    </span>
                  )}
                </div>
              </div>
              <div>
                {res.correct ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Repasar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ULTRA-COMPACT PROGRESS CODE BANNER */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                Tu Código de Progreso
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                {syncCode.length} car.
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-mono select-all truncate max-w-[200px] sm:max-w-[260px]">
              {syncCode}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopySyncCode}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer"
          title="Copiar código al portapapeles"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={startUnifiedRound}
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Nueva Ronda Mixta</span>
        </button>
        {onOpenRoadmap && (
          <button
            onClick={() => onOpenRoadmap('verbs')}
            className="px-5 h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Roadmap</span>
          </button>
        )}
      </div>
    </div>
  );
};
