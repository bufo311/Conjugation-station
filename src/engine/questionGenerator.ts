import {
  Question,
  SentenceTemplate,
  TenseKey,
  Pronoun,
  Verb,
  VocabEntry,
  UnifiedQuestion,
  QuizQuestionType,
} from '../types';
import { conjugate, VERB_LIBRARY, VERBS_BY_INFINITIVE } from '../data/verbs';
import { SENTENCE_TEMPLATES } from '../data/templates';
import { PRONOUN_LABELS, TENSE_NAMES } from './conjugator';
import { createVocabQuestion } from '../data/vocab';

const ALL_PRONOUNS: Pronoun[] = ['yo', 'tu', 'el_ella_ud', 'nosotros', 'vosotros', 'ellos_ellas_uds'];

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

import { formatEnglishSentence } from './englishConjugator';

export function generateQuestion(
  selectedTenses: TenseKey[],
  verbPool: Verb[],
  includeVosotros: boolean = false,
  excludeQuestionIds: string[] = []
): Question | null {
  // Filter templates matching selected tenses
  let eligibleTemplates = SENTENCE_TEMPLATES.filter((t) =>
    selectedTenses.includes(t.tense) && (includeVosotros || t.pronoun !== 'vosotros')
  );

  if (eligibleTemplates.length === 0) {
    eligibleTemplates = SENTENCE_TEMPLATES.filter((t) =>
      includeVosotros || t.pronoun !== 'vosotros'
    );
  }

  // Pick random template
  const shuffledTemplates = [...eligibleTemplates].sort(() => Math.random() - 0.5);
  let chosenTemplate: SentenceTemplate | null = null;
  let chosenVerb: Verb | null = null;

  for (const t of shuffledTemplates) {
    // Find compatible verbs from pool
    let compatibleVerbs: Verb[] = [];
    if (t.compatibleVerbs && t.compatibleVerbs.length > 0) {
      compatibleVerbs = verbPool.filter((v) => t.compatibleVerbs!.includes(v.infinitive));
      // If none in pool, try looking up from whole library
      if (compatibleVerbs.length === 0) {
        compatibleVerbs = t.compatibleVerbs
          .map((inf) => VERBS_BY_INFINITIVE.get(inf))
          .filter((v): v is Verb => !!v);
      }
    } else {
      compatibleVerbs = verbPool;
    }

    if (compatibleVerbs.length > 0) {
      chosenTemplate = t;
      chosenVerb = compatibleVerbs[Math.floor(Math.random() * compatibleVerbs.length)];
      break;
    }
  }

  if (!chosenTemplate || !chosenVerb) {
    chosenTemplate = SENTENCE_TEMPLATES[0];
    chosenVerb = verbPool[0] || VERB_LIBRARY[0];
  }

  const correctAnswer = conjugate(chosenVerb, chosenTemplate.tense, chosenTemplate.pronoun);

  // Generate 3 plausible distractors
  const distractors = generateDistractors(
    chosenVerb,
    chosenTemplate.tense,
    chosenTemplate.pronoun,
    correctAnswer,
    includeVosotros
  );

  const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

  // Explanation
  const explanation = generateExplanation(
    chosenVerb,
    chosenTemplate.tense,
    chosenTemplate.pronoun,
    correctAnswer
  );

  // English translation of sentence with correct tense conjugation
  const englishFull = formatEnglishSentence(chosenTemplate, chosenVerb);

  return {
    id: `${chosenVerb.infinitive}-${chosenTemplate.tense}-${chosenTemplate.pronoun}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    verb: chosenVerb,
    tense: chosenTemplate.tense,
    pronoun: chosenTemplate.pronoun,
    template: chosenTemplate,
    correctAnswer,
    options,
    explanation,
    englishFull,
  };
}

function generateDistractors(
  verb: Verb,
  tense: TenseKey,
  pronoun: Pronoun,
  correctAnswer: string,
  includeVosotros: boolean
): string[] {
  const distractors = new Set<string>();

  // Distractor 1: Same tense, different pronoun (very plausible)
  const otherPronouns = ALL_PRONOUNS.filter(
    (p) => p !== pronoun && (includeVosotros || p !== 'vosotros')
  );
  for (const p of otherPronouns) {
    const candidate = conjugate(verb, tense, p);
    if (candidate && candidate !== correctAnswer) {
      distractors.add(candidate);
      if (distractors.size >= 2) break;
    }
  }

  // Distractor 2: Same pronoun, different tense (e.g. imperfect vs preterite)
  const otherTenses = ALL_TENSES.filter((t) => t !== tense);
  for (const t of otherTenses) {
    const candidate = conjugate(verb, t, pronoun);
    if (candidate && candidate !== correctAnswer) {
      distractors.add(candidate);
      if (distractors.size >= 3) break;
    }
  }

  // Fallbacks if not enough unique distractors
  if (distractors.size < 3) {
    for (const p of otherPronouns) {
      for (const t of otherTenses) {
        const candidate = conjugate(verb, t, p);
        if (candidate && candidate !== correctAnswer) {
          distractors.add(candidate);
          if (distractors.size >= 3) break;
        }
      }
      if (distractors.size >= 3) break;
    }
  }

  return Array.from(distractors).slice(0, 3);
}

function generateExplanation(
  verb: Verb,
  tense: TenseKey,
  pronoun: Pronoun,
  correctForm: string
): string {
  const pronounLabel = PRONOUN_LABELS[pronoun];
  const tenseLabel = TENSE_NAMES[tense];

  if (verb.irregular) {
    return `Irregular: ${verb.infinitive} (${tenseLabel}, ${pronounLabel}) → ${correctForm}`;
  }

  const ending = verb.ending;
  return `-${ending} ${tenseLabel}, ${pronounLabel} → ${correctForm}`;
}

export interface UnifiedRoundParams {
  count: number;
  verbPool: Verb[];
  vocabPool: VocabEntry[];
  frasesPool: VocabEntry[];
  selectedTenses?: TenseKey[];
  includeTypes?: QuizQuestionType[]; // defaults to ['verb', 'vocab', 'phrase']
  includeVosotros?: boolean;
}

/**
 * Generates a unified, balanced mix of verb conjugations, core/advanced vocabulary,
 * and high-frequency idiomatic phrases into a single streamlined quiz round.
 */
export function generateUnifiedQuizRound(params: UnifiedRoundParams): UnifiedQuestion[] {
  const {
    count = 10,
    verbPool,
    vocabPool,
    frasesPool,
    selectedTenses = ['presente', 'preterito', 'imperfecto'],
    includeTypes = ['verb', 'vocab', 'phrase'],
    includeVosotros = false,
  } = params;

  const questions: UnifiedQuestion[] = [];
  const usedVerbQuestionIds: string[] = [];
  const usedVocabIds = new Set<string>();
  const usedFrasesIds = new Set<string>();

  const types = includeTypes.length > 0 ? includeTypes : (['verb', 'vocab', 'phrase'] as QuizQuestionType[]);

  // Strictly alternate through types (Verb -> Vocab -> Phrase -> Verb -> ...)
  // so the user never gets bored doing several of the same type in a row!
  const startOffset = Math.floor(Math.random() * types.length);
  const typeQueue: QuizQuestionType[] = [];
  for (let i = 0; i < count; i++) {
    typeQueue.push(types[(i + startOffset) % types.length]);
  }

  for (const qType of typeQueue) {
    if (qType === 'verb' && verbPool.length > 0) {
      const q = generateQuestion(selectedTenses, verbPool, includeVosotros, usedVerbQuestionIds);
      if (q) {
        usedVerbQuestionIds.push(q.id);
        const blankPrompt = `${q.template.before} ___ ${q.template.after}`.trim();
        questions.push({
          id: `uq-${q.id}`,
          type: 'verb',
          prompt: blankPrompt,
          englishTranslation: q.englishFull,
          correctAnswer: q.correctAnswer,
          options: q.options,
          explanation: q.explanation,
          verbData: {
            verb: q.verb,
            tense: q.tense,
            pronoun: q.pronoun,
            template: q.template,
          },
        });
        continue;
      }
    }

    if (qType === 'vocab' && vocabPool.length > 0) {
      const available = vocabPool.filter((item) => !usedVocabIds.has(item.id));
      const chosen = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : vocabPool[Math.floor(Math.random() * vocabPool.length)];

      if (chosen) {
        usedVocabIds.add(chosen.id);
        const vq = createVocabQuestion(chosen, 'production');
        questions.push({
          id: `uq-${vq.id}`,
          type: 'vocab',
          prompt: vq.prompt,
          englishTranslation: vq.contextEn,
          correctAnswer: vq.correctAnswer,
          options: vq.options,
          explanation: vq.explanation,
          difficulty: chosen.difficulty,
          vocabData: { entry: chosen },
        });
        continue;
      }
    }

    if (qType === 'phrase' && frasesPool.length > 0) {
      const available = frasesPool.filter((item) => !usedFrasesIds.has(item.id));
      const chosen = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : frasesPool[Math.floor(Math.random() * frasesPool.length)];

      if (chosen) {
        usedFrasesIds.add(chosen.id);
        const pq = createVocabQuestion(chosen, 'production');
        questions.push({
          id: `uq-${pq.id}`,
          type: 'phrase',
          prompt: pq.prompt,
          englishTranslation: pq.contextEn,
          correctAnswer: pq.correctAnswer,
          options: pq.options,
          explanation: pq.explanation,
          difficulty: chosen.difficulty,
          vocabData: { entry: chosen },
        });
        continue;
      }
    }

    // Fallback: if a type couldn't produce, generate a verb question
    if (verbPool.length > 0) {
      const fallbackVq = generateQuestion(selectedTenses, verbPool, includeVosotros, usedVerbQuestionIds);
      if (fallbackVq) {
        usedVerbQuestionIds.push(fallbackVq.id);
        questions.push({
          id: `uq-${fallbackVq.id}`,
          type: 'verb',
          prompt: `${fallbackVq.template.before} ___ ${fallbackVq.template.after}`.trim(),
          englishTranslation: fallbackVq.englishFull,
          correctAnswer: fallbackVq.correctAnswer,
          options: fallbackVq.options,
          explanation: fallbackVq.explanation,
          verbData: {
            verb: fallbackVq.verb,
            tense: fallbackVq.tense,
            pronoun: fallbackVq.pronoun,
            template: fallbackVq.template,
          },
        });
      }
    }
  }

  return questions;
}
