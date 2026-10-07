import { VocabEntry, VocabQuestion } from '../types';
import { VOCAB_CORE_500_PART1 } from './vocabCore500Part1';
import { VOCAB_CORE_500_PART2 } from './vocabCore500Part2';
import { VOCAB_CORE_500_PART3 } from './vocabCore500Part3';
import { VOCAB_FRASES } from './vocabFrases';

// Full Core 500 deck (normalized dictionary forms from top Spanish frequency list)
export const VOCAB_CORE_500: VocabEntry[] = [
  ...VOCAB_CORE_500_PART1,
  ...VOCAB_CORE_500_PART2,
  ...VOCAB_CORE_500_PART3,
];

// Empty stubs for future deck expansion:
// Format: { id: 'v-501', es: 'palabra', article: 'la', en: 'word', pos: 'noun',
//           sentence: 'Ejemplo de oración.', sentenceEn: 'Example sentence.', deckId: 'core1000' }
export const VOCAB_CORE_1000: VocabEntry[] = [];
export const VOCAB_CORE_2000: VocabEntry[] = [];

// Curated high-frequency multi-word phrases and idioms
export { VOCAB_FRASES };

export const ALL_VOCAB: VocabEntry[] = [...VOCAB_CORE_500, ...VOCAB_FRASES];

export const VOCAB_BY_ID: Record<string, VocabEntry> = ALL_VOCAB.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, VocabEntry>);

// Generate context fill-in-the-blank question for a vocab entry
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

  // Generate 3 distractors
  const pool = (entry.deckId === 'frases' ? VOCAB_FRASES : VOCAB_CORE_500).filter(
    (item) => item.id !== entry.id && (entry.deckId === 'frases' || item.pos === entry.pos)
  );

  const fallbackPool = (entry.deckId === 'frases' ? VOCAB_FRASES : VOCAB_CORE_500).filter(
    (item) => item.id !== entry.id
  );

  const chosenDistractors: string[] = [];
  const candidatePool = pool.length >= 3 ? pool : fallbackPool;
  const shuffledCandidates = [...candidatePool].sort(() => Math.random() - 0.5);

  for (const c of shuffledCandidates) {
    if (chosenDistractors.length >= 3) break;
    const word = c.es;
    if (word !== targetWord && !chosenDistractors.includes(word)) {
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

  return {
    id: `q-vocab-${entry.id}-${Date.now()}`,
    entry,
    direction,
    prompt: blankSentence,
    contextEn: entry.sentenceEn,
    correctAnswer: targetWord,
    options,
    explanation: `${entry.es}${articleNote}: "${entry.en}" (${posLabel}) — ${entry.sentenceEn}`,
  };
}

// Generate smart distractors for multiple choice vocab
export function getVocabDistractors(target: VocabEntry, count = 3): string[] {
  const deck = target.deckId === 'frases' ? VOCAB_FRASES : VOCAB_CORE_500;
  const filtered = deck.filter((v) => v.id !== target.id && v.pos === target.pos);
  const candidates = filtered.length >= count ? filtered : deck.filter((v) => v.id !== target.id);
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((v) => v.es);
}
