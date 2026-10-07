import React, { useState, useMemo } from 'react';
import { LeitnerCard, UserStats } from '../types';
import {
  getDueCards,
  updateCardInSRS,
  updateStatsOnAnswer,
  updateVocabStatsOnAnswer,
  saveSRSQueue,
} from '../engine/srs';
import { TENSE_NAMES, PRONOUN_LABELS, isAnswerCorrect } from '../engine/conjugator';
import { speakSpanish, playChime } from '../utils/audio';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Layers,
  Volume2,
  Clock,
  Trash2,
  BookA,
  Target,
} from 'lucide-react';

interface ReviewScreenProps {
  srsCards: LeitnerCard[];
  onUpdateSRS: (cards: LeitnerCard[]) => void;
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
}

const LEVEL_COLORS = [
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
];

const LEVEL_INTERVALS = ['1 day', '3 days', '7 days', '14 days', '30 days'];

type CardFilterType = 'all' | 'verbs' | 'vocab';

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  srsCards,
  onUpdateSRS,
  stats,
  onUpdateStats,
}) => {
  const [filterType, setFilterType] = useState<CardFilterType>('all');
  const [drillMode, setDrillMode] = useState<boolean>(false);
  const [drillCards, setDrillCards] = useState<LeitnerCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Filter cards by type
  const filteredCards = useMemo(() => {
    return srsCards.filter((c) => {
      if (filterType === 'all') return true;
      if (filterType === 'verbs') return c.itemType !== 'vocab';
      if (filterType === 'vocab') return c.itemType === 'vocab';
      return true;
    });
  }, [srsCards, filterType]);

  const dueCards = useMemo(() => {
    return getDueCards(filteredCards);
  }, [filteredCards]);

  // Group cards by level
  const levelCounts = [1, 2, 3, 4, 5].map(
    (lvl) => filteredCards.filter((c) => c.level === lvl).length
  );

  const startReviewSession = (onlyDue: boolean) => {
    const list = onlyDue ? dueCards : filteredCards;
    if (list.length === 0) return;
    setDrillCards([...list].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setTypedInput('');
    setHasChecked(false);
    setIsCorrect(false);
    setDrillMode(true);
  };

  const currentCard = drillCards[currentIndex];

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentCard || !typedInput.trim() || hasChecked) return;

    const correct = isAnswerCorrect(typedInput, currentCard.correctAnswer);
    setIsCorrect(correct);
    setHasChecked(true);

    if (stats.settings.soundEffects) {
      playChime(correct);
    }

    if (stats.settings.autoSpeak) {
      speakSpanish(currentCard.correctAnswer);
    }

    // Update Leitner level in storage
    const updatedCards = updateCardInSRS(srsCards, currentCard.id, correct);
    onUpdateSRS(updatedCards);

    // Update stats
    if (currentCard.itemType === 'vocab') {
      const updatedStats = updateVocabStatsOnAnswer(
        stats,
        currentCard.deckId || 'core500',
        currentCard.correctAnswer,
        correct
      );
      onUpdateStats(updatedStats);
    } else if (currentCard.tense && currentCard.infinitive) {
      const updatedStats = updateStatsOnAnswer(
        stats,
        currentCard.tense,
        currentCard.infinitive,
        correct
      );
      onUpdateStats(updatedStats);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < drillCards.length) {
      setCurrentIndex((prev) => prev + 1);
      setTypedInput('');
      setHasChecked(false);
      setIsCorrect(false);
    } else {
      setDrillMode(false);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const remaining = srsCards.filter((c) => c.id !== cardId);
    onUpdateSRS(remaining);
  };

  // ==================== RENDER: DRILL SESSION ====================
  if (drillMode && currentCard) {
    const progress = ((currentIndex + 1) / drillCards.length) * 100;
    const isVocab = currentCard.itemType === 'vocab';
    const pronounLabel = currentCard.pronoun ? PRONOUN_LABELS[currentCard.pronoun] : '';
    const tenseLabel = currentCard.tense ? TENSE_NAMES[currentCard.tense] : '';

    return (
      <div className="space-y-4 animate-in fade-in pb-12">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Card {currentIndex + 1} of {drillCards.length}
          </span>
          <button
            onClick={() => setDrillMode(false)}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Exit Review
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Flashcard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                {isVocab ? (currentCard.deckId === 'frases' ? 'Frases' : 'Vocabulario') : tenseLabel}
              </span>
              {!isVocab && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs font-medium text-slate-500">
                    {pronounLabel}
                  </span>
                </>
              )}
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                LEVEL_COLORS[currentCard.level - 1]
              }`}
            >
              Level {currentCard.level} (Next: {LEVEL_INTERVALS[currentCard.level - 1]})
            </span>
          </div>

          <div className="inline-block px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold text-base">
            {isVocab ? (currentCard.englishFull || 'Vocabulary') : currentCard.infinitive}
          </div>

          <div className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-900 dark:text-slate-100">
            {currentCard.sentenceContext}
          </div>

          {currentCard.englishFull && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">
              "{currentCard.englishFull}"
            </div>
          )}
        </div>

        {/* Answer section */}
        {!hasChecked ? (
          <form onSubmit={handleCheckAnswer} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Type the Spanish form..."
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="flex-1 h-14 px-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-600 text-xl font-bold text-slate-900 dark:text-white outline-none"
              />
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="h-14 px-6 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-50 active:scale-95 transition-all"
              >
                Submit
              </button>
            </div>

            {/* Quick accents */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick accents:</span>
              <div className="flex gap-1.5">
                {['á', 'é', 'í', 'ó', 'ú', 'ñ'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setTypedInput((prev) => prev + char)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            <div
              className={`p-5 rounded-2xl border ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-base">
                    {isCorrect
                      ? `Promoted to Level ${Math.min(5, currentCard.level + 1)}! 🎉`
                      : 'Reset to Level 1'}
                  </div>
                  <div className="text-lg font-black mt-1">
                    Correct: {currentCard.correctAnswer}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    Next review in {isCorrect ? LEVEL_INTERVALS[Math.min(4, currentCard.level)] : '1 day'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>{currentIndex + 1 < drillCards.length ? 'Next Card' : 'Finish Session'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================== RENDER: DASHBOARD VIEW ====================
  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
              Spaced Repetition
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Leitner Memory Queue
            </h2>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Missed verbs and vocabulary enter your spaced repetition queue. Drill them at 1, 3, 7, 14, and 30-day intervals for permanent recall.
        </p>

        {/* Filter Toggle: All / Conjugation / Vocab */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Todos ({srsCards.length})
          </button>
          <button
            onClick={() => setFilterType('verbs')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'verbs'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Verbos ({srsCards.filter((c) => c.itemType !== 'vocab').length})
          </button>
          <button
            onClick={() => setFilterType('vocab')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'vocab'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Vocab ({srsCards.filter((c) => c.itemType === 'vocab').length})
          </button>
        </div>

        {/* Due items banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
              {dueCards.length}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Cards Due for Review
              </div>
              <div className="text-xs text-slate-500">
                {filteredCards.length} cards matching filter
              </div>
            </div>
          </div>

          <button
            onClick={() => startReviewSession(true)}
            disabled={dueCards.length === 0}
            className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Review Due</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leitner levels grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Leitner Mastery Levels (1 - 5)
        </h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[1, 2, 3, 4, 5].map((lvl, idx) => (
            <div
              key={lvl}
              className={`p-3 rounded-2xl border ${LEVEL_COLORS[idx]} space-y-1`}
            >
              <div className="text-xs font-bold opacity-80">L{lvl}</div>
              <div className="text-xl font-black">{levelCounts[idx]}</div>
              <div className="text-[10px] font-medium opacity-70">
                {LEVEL_INTERVALS[idx]}
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => startReviewSession(false)}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Drill All {filteredCards.length} Filtered Cards in Queue (Extra Practice)
            </button>
          </div>
        )}
      </div>

      {/* List of cards */}
      {filteredCards.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Cards ({filteredCards.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Sorted by urgency
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {filteredCards.map((card) => {
              const isDue = card.nextReviewDate <= Date.now();
              const isVocab = card.itemType === 'vocab';
              return (
                <div key={card.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isVocab ? card.correctAnswer : card.infinitive}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {isVocab
                          ? `(${card.englishFull || 'vocab'})`
                          : `(${card.tense ? TENSE_NAMES[card.tense] : ''} · ${card.pronoun ? PRONOUN_LABELS[card.pronoun] : ''})`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Target: <span className="font-bold text-blue-600 dark:text-blue-400">{card.correctAnswer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        LEVEL_COLORS[card.level - 1]
                      }`}
                    >
                      L{card.level}
                    </span>
                    {isDue && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Due
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

