import { LeitnerCard, UserStats, TenseKey, Pronoun, VocabEntry } from '../types';
import LZString from 'lz-string';
import { VERB_LIBRARY, VERBS_BY_INFINITIVE, conjugate } from '../data/verbs';
import { ALL_VOCAB } from '../data/vocab';
import { SENTENCE_TEMPLATES } from '../data/templates';
import { formatEnglishSentence } from './englishConjugator';

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

const TENSE_KEYS_INDEX: TenseKey[] = [
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

const PRONOUNS_INDEX: Pronoun[] = [
  'yo',
  'tu',
  'el_ella_ud',
  'nosotros',
  'vosotros',
  'ellos_ellas_uds',
];

const B64_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function packInt24(n: number): string {
  return (
    B64_ALPHABET[(n >> 18) & 63] +
    B64_ALPHABET[(n >> 12) & 63] +
    B64_ALPHABET[(n >> 6) & 63] +
    B64_ALPHABET[n & 63]
  );
}

function unpackInt24(s: string): number {
  return (
    (B64_ALPHABET.indexOf(s[0]) << 18) |
    (B64_ALPHABET.indexOf(s[1]) << 12) |
    (B64_ALPHABET.indexOf(s[2]) << 6) |
    B64_ALPHABET.indexOf(s[3])
  );
}

/**
 * Generates an ultra-compact progress sync code (as short as mathematically possible).
 * Encodes streak, total answers, correct count, and settings in base-36,
 * and bit-packs SRS cards into 24-bit words (4 characters each).
 * Yields ~11 characters for new users and ~30-50 characters for active users.
 */
export function generateSyncPayload(stats: UserStats, srsCards: LeitnerCard[]): string {
  // Settings bitmask (5 bits)
  let settingsMask = 0;
  if (stats.settings?.unlockAllLayers) settingsMask |= 1;
  if (stats.settings?.defaultMode === 'type') settingsMask |= 2;
  const diff = stats.settings?.vocabDifficulty || 'all';
  const diffVal = diff === 'beginner' ? 1 : diff === 'intermediate' ? 2 : diff === 'advanced' ? 3 : 0;
  settingsMask |= (diffVal & 3) << 2;
  if (stats.settings?.includeVosotros) settingsMask |= 16;

  const streakStr = Math.max(0, stats.streak || 0).toString(36);
  const ansStr = Math.max(0, stats.totalAnswered || 0).toString(36);
  const corStr = Math.max(0, stats.totalCorrect || 0).toString(36);
  const setStr = settingsMask.toString(36);

  const header = `CS1-${streakStr}-${ansStr}-${corStr}-${setStr}`;

  if (!srsCards || srsCards.length === 0) {
    return header;
  }

  // Pack cards: 4 chars per card (24 bits)
  let packedCards = '';
  for (const c of srsCards) {
    const levelVal = Math.max(0, Math.min(4, (c.level || 1) - 1));

    if (c.itemType === 'vocab' || c.vocabId) {
      const vid = c.vocabId || c.id.replace(/^vocab:[^:]*:/, '');
      const wIdx = Math.max(0, ALL_VOCAB.findIndex((v) => v.id === vid));
      // Vocab: bit 23 = 1, vocabIndex in bits 12..22, level in bits 3..5
      const int24 = (1 << 23) | ((wIdx & 0x7ff) << 12) | ((levelVal & 0x7) << 3);
      packedCards += packInt24(int24);
    } else {
      // Verb: bit 23 = 0, verbIndex in bits 12..22, form in bits 6..11, level in bits 3..5
      const vInf = c.infinitive || 'hablar';
      let vIdx = VERB_LIBRARY.findIndex((v) => v.infinitive === vInf);
      if (vIdx < 0) vIdx = 0;

      const tIdx = c.tense ? TENSE_KEYS_INDEX.indexOf(c.tense) : 0;
      const pIdx = c.pronoun ? PRONOUNS_INDEX.indexOf(c.pronoun) : 0;
      const formIdx = (Math.max(0, tIdx) * 6 + Math.max(0, pIdx)) & 0x3f;

      const int24 = (0 << 23) | ((vIdx & 0x7ff) << 12) | (formIdx << 6) | ((levelVal & 0x7) << 3);
      packedCards += packInt24(int24);
    }
  }

  return `${header}_${packedCards}`;
}

function reconstructCompactData(parsed: any): { stats: UserStats; srsCards: LeitnerCard[] } {
  const dayMs = 24 * 60 * 60 * 1000;

  const restoredStats: UserStats = {
    ...INITIAL_STATS,
    streak: Number(parsed.k) || 0,
    totalAnswered: Number(parsed.a) || 0,
    totalCorrect: Number(parsed.c) || 0,
    lastActiveDay: parsed.d || '',
    settings: {
      ...INITIAL_STATS.settings,
      unlockAllLayers: parsed.s?.u === 1,
      defaultMode: parsed.s?.m === 't' ? 'type' : 'choice',
      vocabDifficulty: parsed.s?.l || 'all',
      includeVosotros: parsed.s?.o === 1,
    },
  };

  const rawCards = Array.isArray(parsed.v) ? parsed.v : [];
  const restoredCards: LeitnerCard[] = [];

  for (const item of rawCards) {
    if (!Array.isArray(item)) continue;
    const type = item[0];
    if (type === 'v') {
      const inf = item[1];
      const tense = TENSE_KEYS_INDEX[item[2]] || 'presente';
      const pronoun = PRONOUNS_INDEX[item[3]] || 'yo';
      const level = Math.max(1, Math.min(5, Number(item[4]) || 1));
      const timesReviewed = Number(item[5]) || 0;
      const timesCorrect = Number(item[6]) || 0;

      const verb = VERBS_BY_INFINITIVE.get(inf) || VERB_LIBRARY[0];
      const correctAnswer = conjugate(verb, tense, pronoun);
      const tpl =
        SENTENCE_TEMPLATES.find(
          (t) =>
            t.tense === tense &&
            t.pronoun === pronoun &&
            t.compatibleVerbs &&
            t.compatibleVerbs.includes(verb.infinitive)
        ) ||
        SENTENCE_TEMPLATES.find((t) => t.tense === tense && t.pronoun === pronoun);

      const sentenceContext = tpl
        ? `${tpl.before} ${correctAnswer} ${tpl.after}`.trim()
        : `(${inf}) ${correctAnswer}`;
      const englishFull = tpl
        ? formatEnglishSentence(tpl, verb)
        : `${verb.translation} (${tense})`;

      const intervalDays = LEITNER_INTERVALS_DAYS[level - 1] || 1;

      restoredCards.push({
        id: `${inf}:${tense}:${pronoun}`,
        itemType: 'verb',
        infinitive: inf,
        tense,
        pronoun,
        correctAnswer,
        sentenceContext,
        englishFull,
        level,
        nextReviewDate: Date.now() + intervalDays * dayMs,
        timesReviewed,
        timesCorrect,
      });
    } else if (type === 'w') {
      const vocabId = item[1];
      const level = Math.max(1, Math.min(5, Number(item[2]) || 1));
      const timesReviewed = Number(item[3]) || 0;
      const timesCorrect = Number(item[4]) || 0;

      const entry = ALL_VOCAB.find((v) => v.id === vocabId) || {
        id: vocabId,
        es: vocabId,
        en: '',
        pos: 'noun' as const,
        sentence: vocabId,
        sentenceEn: '',
        deckId: 'core500' as const,
      };

      const intervalDays = LEITNER_INTERVALS_DAYS[level - 1] || 1;

      restoredCards.push({
        id: `vocab:${entry.deckId}:${entry.id}`,
        itemType: 'vocab',
        vocabId: entry.id,
        deckId: entry.deckId,
        correctAnswer: entry.es,
        sentenceContext: entry.sentence || entry.es,
        englishFull: entry.sentenceEn || entry.en,
        level,
        nextReviewDate: Date.now() + intervalDays * dayMs,
        timesReviewed,
        timesCorrect,
      });
    }
  }

  return { stats: restoredStats, srsCards: restoredCards };
}

function parseLegacyJson(parsed: any): { stats: UserStats; srsCards: LeitnerCard[] } {
  const pStats = parsed.stats || parsed.s || {};
  const restoredStats: UserStats = {
    streak: pStats.st ?? pStats.streak ?? 0,
    lastActiveDay: pStats.ld ?? pStats.lastActiveDay ?? '',
    totalAnswered: pStats.ta ?? pStats.totalAnswered ?? 0,
    totalCorrect: pStats.tc ?? pStats.totalCorrect ?? 0,
    tenseStats: pStats.ts ?? pStats.tenseStats ?? INITIAL_STATS.tenseStats,
    verbErrors: pStats.ve ?? pStats.verbErrors ?? {},
    vocabStats: pStats.vs ?? pStats.vocabStats ?? INITIAL_STATS.vocabStats,
    vocabErrors: pStats.vErr ?? pStats.vocabErrors ?? {},
    favorites: pStats.fav ?? pStats.favorites ?? INITIAL_STATS.favorites,
    settings: pStats.set ?? pStats.settings ?? INITIAL_STATS.settings,
  };

  const rawCards = parsed.srsCards || parsed.c || [];
  const restoredCards: LeitnerCard[] = Array.isArray(rawCards)
    ? rawCards.map((item: any) => ({
        id: item.id || (item.vid ? `vocab:${item.vid}` : `${item.i}:${item.t}:${item.p}`),
        itemType: item.it || (item.vid ? 'vocab' : 'verb'),
        infinitive: item.i || item.infinitive,
        tense: item.t || item.tense,
        pronoun: item.p || item.pronoun,
        vocabId: item.vid || item.vocabId,
        deckId: item.did || item.deckId,
        correctAnswer: item.a || item.correctAnswer,
        sentenceContext: item.sc || item.sentenceContext,
        englishFull: item.ef || item.englishFull,
        level: item.l ?? item.level ?? 1,
        nextReviewDate: item.nr ?? item.nextReviewDate ?? Date.now(),
        timesReviewed: item.tr ?? item.timesReviewed ?? 0,
        timesCorrect: item.tc ?? item.timesCorrect ?? 0,
      }))
    : [];

  return { stats: restoredStats, srsCards: restoredCards };
}

export function parseSyncPayload(
  encoded: string
): { stats: UserStats; srsCards: LeitnerCard[] } | null {
  try {
    let clean = encoded.trim();
    if (clean.includes('#sync=')) clean = clean.split('#sync=')[1].split('&')[0];
    if (clean.includes('?sync=')) clean = clean.split('?sync=')[1].split('&')[0];

    // Format 0: Ultra-compact mathematical packed code (starts with CS1-)
    if (clean.startsWith('CS1-')) {
      const parts = clean.slice(4).split('_');
      const headerParts = parts[0].split('-');
      if (headerParts.length >= 4) {
        const streak = parseInt(headerParts[0], 36) || 0;
        const totalAnswered = parseInt(headerParts[1], 36) || 0;
        const totalCorrect = parseInt(headerParts[2], 36) || 0;
        const settingsMask = parseInt(headerParts[3], 36) || 0;

        const diffVals: ('all' | 'beginner' | 'intermediate' | 'advanced')[] = [
          'all',
          'beginner',
          'intermediate',
          'advanced',
        ];

        const restoredStats: UserStats = {
          ...INITIAL_STATS,
          streak,
          totalAnswered,
          totalCorrect,
          settings: {
            ...INITIAL_STATS.settings,
            unlockAllLayers: (settingsMask & 1) !== 0,
            defaultMode: (settingsMask & 2) !== 0 ? 'type' : 'choice',
            vocabDifficulty: diffVals[(settingsMask >> 2) & 3] || 'all',
            includeVosotros: (settingsMask & 16) !== 0,
          },
        };

        const dayMs = 24 * 60 * 60 * 1000;
        const restoredCards: LeitnerCard[] = [];
        const cardChunk = parts[1] || '';

        for (let i = 0; i + 4 <= cardChunk.length; i += 4) {
          const chunk = cardChunk.slice(i, i + 4);
          const int24 = unpackInt24(chunk);
          const isVocab = ((int24 >> 23) & 1) === 1;
          const level = Math.max(1, Math.min(5, ((int24 >> 3) & 0x7) + 1));
          const intervalDays = LEITNER_INTERVALS_DAYS[level - 1] || 1;

          if (isVocab) {
            const wIdx = (int24 >> 12) & 0x7ff;
            const entry = ALL_VOCAB[wIdx] || ALL_VOCAB[0];
            if (entry) {
              restoredCards.push({
                id: `vocab:${entry.deckId}:${entry.id}`,
                itemType: 'vocab',
                vocabId: entry.id,
                deckId: entry.deckId,
                correctAnswer: entry.es,
                sentenceContext: entry.sentence || entry.es,
                englishFull: entry.sentenceEn || entry.en,
                level,
                nextReviewDate: Date.now() + intervalDays * dayMs,
                timesReviewed: level,
                timesCorrect: level,
              });
            }
          } else {
            const vIdx = (int24 >> 12) & 0x7ff;
            const formIdx = (int24 >> 6) & 0x3f;
            const tIdx = Math.floor(formIdx / 6);
            const pIdx = formIdx % 6;
            const tense = TENSE_KEYS_INDEX[tIdx] || 'presente';
            const pronoun = PRONOUNS_INDEX[pIdx] || 'yo';
            const verb = VERB_LIBRARY[vIdx] || VERB_LIBRARY[0];
            const correctAnswer = conjugate(verb, tense, pronoun);

            const tpl =
              SENTENCE_TEMPLATES.find(
                (t) =>
                  t.tense === tense &&
                  t.pronoun === pronoun &&
                  t.compatibleVerbs &&
                  t.compatibleVerbs.includes(verb.infinitive)
              ) ||
              SENTENCE_TEMPLATES.find(
                (t) => t.tense === tense && t.pronoun === pronoun
              );

            const sentenceContext = tpl
              ? `${tpl.before} ${correctAnswer} ${tpl.after}`.trim()
              : `(${verb.infinitive}) ${correctAnswer}`;

            const englishFull = tpl
              ? formatEnglishSentence(tpl, verb)
              : `${verb.translation} (${tense})`;

            restoredCards.push({
              id: `${verb.infinitive}:${tense}:${pronoun}`,
              itemType: 'verb',
              infinitive: verb.infinitive,
              tense,
              pronoun,
              correctAnswer,
              sentenceContext,
              englishFull,
              level,
              nextReviewDate: Date.now() + intervalDays * dayMs,
              timesReviewed: level,
              timesCorrect: level,
            });
          }
        }

        return { stats: restoredStats, srsCards: restoredCards };
      }
    }

    // Format 1: Ultra-compact LZ string (starts with CS- or CS3- or CS2-)
    if (clean.startsWith('CS-') || clean.startsWith('CS3-') || clean.startsWith('CS2-')) {
      const payload = clean.replace(/^CS[0-9]*-/, '');
      const decompressed = LZString.decompressFromEncodedURIComponent(payload);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        return reconstructCompactData(parsed);
      }
    }

    // Format 2: Direct LZ decompression attempt without prefix
    const tryDecompressed = LZString.decompressFromEncodedURIComponent(clean);
    if (tryDecompressed) {
      try {
        const parsed = JSON.parse(tryDecompressed);
        if (parsed.k !== undefined || parsed.s !== undefined) {
          return reconstructCompactData(parsed);
        }
      } catch (e) {
        // ignore
      }
    }

    // Format 3: Legacy base64 / encodeURIComponent JSON
    try {
      const json = decodeURIComponent(atob(clean));
      const parsed = JSON.parse(json);
      if (parsed && (parsed.s || parsed.stats)) {
        return parseLegacyJson(parsed);
      }
    } catch (e) {
      // ignore
    }

    // Format 4: Raw JSON string
    try {
      const parsed = JSON.parse(clean);
      if (parsed && (parsed.stats || parsed.s)) {
        return parseLegacyJson(parsed);
      }
    } catch (e) {
      // ignore
    }

    return null;
  } catch (e) {
    console.error('Failed to parse sync payload:', e);
    return null;
  }
}


