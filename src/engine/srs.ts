import { LeitnerCard, UserStats, TenseKey, Pronoun, VocabEntry } from '../types';

const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30]; // Level 1 through 5
const STORAGE_KEY_SRS = 'cs_leitner_cards_v1';
const STORAGE_KEY_STATS = 'cs_user_stats_v1';

export const INITIAL_STATS: UserStats = {
  streak: 0,
  lastActiveDay: '',
  totalAnswered: 0,
  totalCorrect: 0,
  tenseStats: {
    presente: { answered: 0, correct: 0 },
    preterito: { answered: 0, correct: 0 },
    imperfecto: { answered: 0, correct: 0 },
    futuro: { answered: 0, correct: 0 },
    condicional: { answered: 0, correct: 0 },
    preterito_perfecto: { answered: 0, correct: 0 },
    presente_subjuntivo: { answered: 0, correct: 0 },
    imperfecto_subjuntivo: { answered: 0, correct: 0 },
    imperativo_afirmativo: { answered: 0, correct: 0 },
    imperativo_negativo: { answered: 0, correct: 0 },
  },
  verbErrors: {},
  vocabStats: {
    core500: { answered: 0, correct: 0 },
    frases: { answered: 0, correct: 0 },
  },
  vocabErrors: {},
  favorites: ['hablar', 'ser', 'estar', 'ir', 'tener', 'hacer'],
  settings: {
    includeVosotros: false,
    defaultMode: 'choice',
    soundEffects: true,
    autoSpeak: true,
    newWordsPerDay: 10,
  },
};

export function loadSRSQueue(): LeitnerCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SRS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load SRS cards:', e);
    return [];
  }
}

export function saveSRSQueue(cards: LeitnerCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save SRS cards:', e);
  }
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return INITIAL_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATS,
      ...parsed,
      settings: {
        ...INITIAL_STATS.settings,
        ...(parsed.settings || {}),
      },
      tenseStats: {
        ...INITIAL_STATS.tenseStats,
        ...(parsed.tenseStats || {}),
      },
      vocabStats: {
        ...INITIAL_STATS.vocabStats,
        ...(parsed.vocabStats || {}),
      },
      vocabErrors: {
        ...(parsed.vocabErrors || {}),
      },
    };
  } catch (e) {
    console.error('Failed to load user stats:', e);
    return INITIAL_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats:', e);
  }
}

// Add or update a card in Leitner queue when answered (Conjugation)
export function recordAnswerInSRS(
  cards: LeitnerCard[],
  infinitive: string,
  tense: TenseKey,
  pronoun: Pronoun,
  correctAnswer: string,
  sentenceContext: string,
  englishFull: string,
  wasCorrect: boolean
): LeitnerCard[] {
  const cardId = `${infinitive}:${tense}:${pronoun}`;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const existingIndex = cards.findIndex((c) => c.id === cardId);

  if (existingIndex >= 0) {
    const current = cards[existingIndex];
    let newLevel = current.level;

    if (wasCorrect) {
      newLevel = Math.min(5, current.level + 1);
    } else {
      newLevel = 1; // Reset to level 1 on error
    }

    const intervalDays = LEITNER_INTERVALS_DAYS[newLevel - 1];
    const updated: LeitnerCard = {
      ...current,
      itemType: 'verb',
      level: newLevel,
      nextReviewDate: now + intervalDays * dayMs,
      timesReviewed: current.timesReviewed + 1,
      timesCorrect: current.timesCorrect + (wasCorrect ? 1 : 0),
      lastReviewedDate: now,
      sentenceContext,
      englishFull,
      correctAnswer,
    };

    const newCards = [...cards];
    newCards[existingIndex] = updated;
    saveSRSQueue(newCards);
    return newCards;
  } else if (!wasCorrect) {
    const newCard: LeitnerCard = {
      id: cardId,
      itemType: 'verb',
      infinitive,
      tense,
      pronoun,
      correctAnswer,
      sentenceContext,
      englishFull,
      level: 1,
      nextReviewDate: now + 1 * dayMs,
      timesReviewed: 1,
      timesCorrect: 0,
      lastReviewedDate: now,
    };
    const newCards = [newCard, ...cards];
    saveSRSQueue(newCards);
    return newCards;
  }

  return cards;
}

// Add or update a vocabulary card in Leitner queue
export function recordVocabAnswerInSRS(
  cards: LeitnerCard[],
  entry: VocabEntry,
  wasCorrect: boolean,
  forceAdd = false
): LeitnerCard[] {
  const cardId = `vocab:${entry.id}`;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const existingIndex = cards.findIndex((c) => c.id === cardId);

  if (existingIndex >= 0) {
    const current = cards[existingIndex];
    let newLevel = current.level;

    if (wasCorrect) {
      newLevel = Math.min(5, current.level + 1);
    } else {
      newLevel = 1;
    }

    const intervalDays = LEITNER_INTERVALS_DAYS[newLevel - 1];
    const updated: LeitnerCard = {
      ...current,
      level: newLevel,
      nextReviewDate: now + intervalDays * dayMs,
      timesReviewed: current.timesReviewed + 1,
      timesCorrect: current.timesCorrect + (wasCorrect ? 1 : 0),
      lastReviewedDate: now,
      sentenceContext: entry.sentence,
      englishFull: entry.sentenceEn,
      correctAnswer: entry.es,
    };

    const newCards = [...cards];
    newCards[existingIndex] = updated;
    saveSRSQueue(newCards);
    return newCards;
  } else if (!wasCorrect || forceAdd) {
    const startLevel = wasCorrect ? 2 : 1;
    const intervalDays = LEITNER_INTERVALS_DAYS[startLevel - 1];
    const newCard: LeitnerCard = {
      id: cardId,
      itemType: 'vocab',
      vocabId: entry.id,
      deckId: entry.deckId,
      correctAnswer: entry.es,
      sentenceContext: entry.sentence,
      englishFull: entry.sentenceEn,
      level: startLevel,
      nextReviewDate: now + intervalDays * dayMs,
      timesReviewed: 1,
      timesCorrect: wasCorrect ? 1 : 0,
      lastReviewedDate: now,
    };
    const newCards = [newCard, ...cards];
    saveSRSQueue(newCards);
    return newCards;
  }

  return cards;
}

// Generic updater for reviewing any card in the SRS review screen
export function updateCardInSRS(
  cards: LeitnerCard[],
  cardId: string,
  wasCorrect: boolean
): LeitnerCard[] {
  const existingIndex = cards.findIndex((c) => c.id === cardId);
  if (existingIndex < 0) return cards;

  const current = cards[existingIndex];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const newLevel = wasCorrect ? Math.min(5, current.level + 1) : 1;
  const intervalDays = LEITNER_INTERVALS_DAYS[newLevel - 1];

  const updated: LeitnerCard = {
    ...current,
    level: newLevel,
    nextReviewDate: now + intervalDays * dayMs,
    timesReviewed: current.timesReviewed + 1,
    timesCorrect: current.timesCorrect + (wasCorrect ? 1 : 0),
    lastReviewedDate: now,
  };

  const newCards = [...cards];
  newCards[existingIndex] = updated;
  saveSRSQueue(newCards);
  return newCards;
}

export function getDueCards(cards: LeitnerCard[]): LeitnerCard[] {
  const now = Date.now();
  return cards.filter((c) => c.nextReviewDate <= now);
}

export function updateStatsOnAnswer(
  currentStats: UserStats,
  tense: TenseKey,
  infinitive: string,
  isCorrect: boolean
): UserStats {
  const todayStr = new Date().toISOString().split('T')[0];
  let newStreak = currentStats.streak;

  if (currentStats.lastActiveDay !== todayStr) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (currentStats.lastActiveDay === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  const prevTense = currentStats.tenseStats[tense] || { answered: 0, correct: 0 };
  const updatedTense = {
    answered: prevTense.answered + 1,
    correct: prevTense.correct + (isCorrect ? 1 : 0),
  };

  const verbErrors = { ...currentStats.verbErrors };
  if (!isCorrect) {
    verbErrors[infinitive] = (verbErrors[infinitive] || 0) + 1;
  }

  const updated: UserStats = {
    ...currentStats,
    streak: newStreak,
    lastActiveDay: todayStr,
    totalAnswered: currentStats.totalAnswered + 1,
    totalCorrect: currentStats.totalCorrect + (isCorrect ? 1 : 0),
    tenseStats: {
      ...currentStats.tenseStats,
      [tense]: updatedTense,
    },
    verbErrors,
  };

  saveUserStats(updated);
  return updated;
}

export function updateVocabStatsOnAnswer(
  currentStats: UserStats,
  deckId: string,
  word: string,
  isCorrect: boolean
): UserStats {
  const todayStr = new Date().toISOString().split('T')[0];
  let newStreak = currentStats.streak;

  if (currentStats.lastActiveDay !== todayStr) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (currentStats.lastActiveDay === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  const prevDeckStats = currentStats.vocabStats?.[deckId] || { answered: 0, correct: 0 };
  const updatedDeckStats = {
    answered: prevDeckStats.answered + 1,
    correct: prevDeckStats.correct + (isCorrect ? 1 : 0),
  };

  const vocabErrors = { ...(currentStats.vocabErrors || {}) };
  if (!isCorrect) {
    vocabErrors[word] = (vocabErrors[word] || 0) + 1;
  }

  const updated: UserStats = {
    ...currentStats,
    streak: newStreak,
    lastActiveDay: todayStr,
    totalAnswered: currentStats.totalAnswered + 1,
    totalCorrect: currentStats.totalCorrect + (isCorrect ? 1 : 0),
    vocabStats: {
      ...(currentStats.vocabStats || {}),
      [deckId]: updatedDeckStats,
    },
    vocabErrors,
  };

  saveUserStats(updated);
  return updated;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  stats: UserStats;
  srsCards: LeitnerCard[];
}

export function exportAllDataAsJson(stats: UserStats, srsCards: LeitnerCard[]): string {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stats,
    srsCards,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJsonBackup(stats: UserStats, srsCards: LeitnerCard[]): void {
  const jsonStr = exportAllDataAsJson(stats, srsCards);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conjugation-station-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateSyncPayload(stats: UserStats, srsCards: LeitnerCard[]): string {
  const minimal = {
    s: {
      st: stats.streak,
      ld: stats.lastActiveDay,
      ta: stats.totalAnswered,
      tc: stats.totalCorrect,
      ts: stats.tenseStats,
      ve: stats.verbErrors,
      vs: stats.vocabStats,
      vErr: stats.vocabErrors,
      fav: stats.favorites,
      set: stats.settings,
    },
    c: srsCards.map((c) => ({
      id: c.id,
      it: c.itemType,
      i: c.infinitive,
      t: c.tense,
      p: c.pronoun,
      vid: c.vocabId,
      did: c.deckId,
      a: c.correctAnswer,
      sc: c.sentenceContext,
      ef: c.englishFull,
      l: c.level,
      nr: c.nextReviewDate,
      tr: c.timesReviewed,
      tc: c.timesCorrect,
    })),
  };
  const json = JSON.stringify(minimal);
  return btoa(encodeURIComponent(json));
}

export function parseSyncPayload(
  encoded: string
): { stats: UserStats; srsCards: LeitnerCard[] } | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.s) return null;

    const restoredStats: UserStats = {
      streak: parsed.s.st || 0,
      lastActiveDay: parsed.s.ld || '',
      totalAnswered: parsed.s.ta || 0,
      totalCorrect: parsed.s.tc || 0,
      tenseStats: parsed.s.ts || INITIAL_STATS.tenseStats,
      verbErrors: parsed.s.ve || {},
      vocabStats: parsed.s.vs || INITIAL_STATS.vocabStats,
      vocabErrors: parsed.s.vErr || {},
      favorites: parsed.s.fav || INITIAL_STATS.favorites,
      settings: parsed.s.set || INITIAL_STATS.settings,
    };

    const restoredCards: LeitnerCard[] = Array.isArray(parsed.c)
      ? parsed.c.map((item: any) => ({
          id: item.id || (item.vid ? `vocab:${item.vid}` : `${item.i}:${item.t}:${item.p}`),
          itemType: item.it || (item.vid ? 'vocab' : 'verb'),
          infinitive: item.i,
          tense: item.t,
          pronoun: item.p,
          vocabId: item.vid,
          deckId: item.did,
          correctAnswer: item.a,
          sentenceContext: item.sc,
          englishFull: item.ef,
          level: item.l,
          nextReviewDate: item.nr,
          timesReviewed: item.tr,
          timesCorrect: item.tc,
        }))
      : [];

    return { stats: restoredStats, srsCards: restoredCards };
  } catch (e) {
    console.error('Failed to parse sync payload:', e);
    return null;
  }
}


