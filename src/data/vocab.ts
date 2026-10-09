import { VocabEntry, VocabQuestion } from '../types';
import { VOCAB_CORE_500_PART1 } from './vocabCore500Part1';
import { VOCAB_CORE_500_PART2 } from './vocabCore500Part2';
import { VOCAB_CORE_500_PART3 } from './vocabCore500Part3';
import { VOCAB_FRASES } from './vocabFrases';
import { VOCAB_ADVANCED } from './vocabAdvanced';

// Helper to assign difficulty tiers to existing Core 500 & Frases items if not explicitly set
const assignDifficulty = (item: VocabEntry, index: number, total: number): VocabEntry => {
  if (item.difficulty) return item;
  if (item.deckId === 'advanced') {
    return { ...item, difficulty: 'advanced' };
  }
  if (item.deckId === 'frases') {
    return {
      ...item,
      difficulty: index < 25 ? 'beginner' : index < 75 ? 'intermediate' : 'advanced',
    };
  }
  // Core 500: Layer 1-4 (first 100) are Beginner (A1-A2)
  // Layer 5-12 (101-300) are Intermediate (B1-B2)
  // Layer 13-20 (301-500) are Upper-Intermediate / Advanced
  const diff: 'beginner' | 'intermediate' | 'advanced' =
    index < 100 ? 'beginner' : index < 300 ? 'intermediate' : 'advanced';
  return { ...item, difficulty: diff };
};

// Full Core 500 deck with difficulty tags
export const VOCAB_CORE_500: VocabEntry[] = [
  ...VOCAB_CORE_500_PART1,
  ...VOCAB_CORE_500_PART2,
  ...VOCAB_CORE_500_PART3,
].map((item, idx) => assignDifficulty(item, idx, 500));

// Curated high-frequency multi-word phrases and idioms with difficulty tags
export const VOCAB_FRASES_ENRICHED: VocabEntry[] = VOCAB_FRASES.map((item, idx) =>
  assignDifficulty(item, idx, VOCAB_FRASES.length)
);

export { VOCAB_FRASES };
export { VOCAB_ADVANCED };

export const ALL_VOCAB: VocabEntry[] = [
  ...VOCAB_CORE_500,
  ...VOCAB_FRASES_ENRICHED,
  ...VOCAB_ADVANCED,
];

export const VOCAB_BY_ID: Record<string, VocabEntry> = ALL_VOCAB.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, VocabEntry>);

// Filter vocabulary by proficiency difficulty
export function getVocabByDifficulty(
  items: VocabEntry[],
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced'
): VocabEntry[] {
  if (!difficulty || difficulty === 'all') return items;
  return items.filter((item) => item.difficulty === difficulty);
}

// Generate context fill-in-the-blank question for a vocab entry with challenging distractors
export function createVocabQuestion(
  entry: VocabEntry,
  direction: 'production' | 'recognition' = 'production'
): VocabQuestion {
  const targetWord = entry.es;
  const sentence = entry.sentence;

  // Replace target word in sentence with blank ___
  // Match case-insensitively with word boundary if possible
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  let blankSentence = sentence.replace(regex, '___');

  if (blankSentence === sentence) {
    // Fallback if boundary match fails (e.g. multi-word or accent nuances)
    blankSentence = sentence.replace(targetWord, '___');
  }

  // Determine smart distractor pool:
  // 1. Same deck if possible, or ALL_VOCAB
  // 2. Same part of speech (pos)
  // 3. Same difficulty level so options are challenging and plausible
  const pool = ALL_VOCAB.filter(
    (item) =>
      item.id !== entry.id &&
      item.es.toLowerCase() !== targetWord.toLowerCase() &&
      item.pos === entry.pos &&
      (!entry.difficulty || item.difficulty === entry.difficulty)
  );

  const fallbackPosPool = ALL_VOCAB.filter(
    (item) =>
      item.id !== entry.id &&
      item.es.toLowerCase() !== targetWord.toLowerCase() &&
      item.pos === entry.pos
  );

  const fallbackDeckPool = (
    entry.deckId === 'advanced'
      ? VOCAB_ADVANCED
      : entry.deckId === 'frases'
      ? VOCAB_FRASES
      : VOCAB_CORE_500
  ).filter((item) => item.id !== entry.id && item.es.toLowerCase() !== targetWord.toLowerCase());

  const chosenDistractors: string[] = [];
  const candidatePool =
    pool.length >= 3
      ? pool
      : fallbackPosPool.length >= 3
      ? fallbackPosPool
      : fallbackDeckPool.length >= 3
      ? fallbackDeckPool
      : ALL_VOCAB.filter((item) => item.id !== entry.id);

  const shuffledCandidates = [...candidatePool].sort(() => Math.random() - 0.5);

  for (const c of shuffledCandidates) {
    if (chosenDistractors.length >= 3) break;
    const word = c.es;
    if (
      word.toLowerCase() !== targetWord.toLowerCase() &&
      !chosenDistractors.includes(word)
    ) {
      chosenDistractors.push(word);
    }
  }

  // Fallback if needed
  while (chosenDistractors.length < 3) {
    chosenDistractors.push(`opción ${chosenDistractors.length + 1}`);
  }

  const options = [targetWord, ...chosenDistractors].sort(() => Math.random() - 0.5);

  const articleNote = entry.article ? ` (${entry.article})` : '';
  const posLabel = entry.pos.charAt(0).toUpperCase() + entry.pos.slice(1);
  const diffBadge = entry.difficulty ? ` [${entry.difficulty.toUpperCase()}]` : '';

  return {
    id: `q-vocab-${entry.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entry,
    direction,
    prompt: blankSentence,
    contextEn: entry.sentenceEn,
    correctAnswer: targetWord,
    options,
    explanation: `${entry.es}${articleNote}: "${entry.en}" (${posLabel}${diffBadge}) — ${entry.sentenceEn}`,
  };
}

// Generate smart distractors for multiple choice vocab
export function getVocabDistractors(target: VocabEntry, count = 3): string[] {
  const pool = ALL_VOCAB.filter(
    (v) => v.id !== target.id && v.pos === target.pos && v.difficulty === target.difficulty
  );
  const candidates = pool.length >= count ? pool : ALL_VOCAB.filter((v) => v.id !== target.id);
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((v) => v.es);
}
