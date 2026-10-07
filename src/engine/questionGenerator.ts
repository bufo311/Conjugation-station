import { Question, SentenceTemplate, TenseKey, Pronoun, Verb } from '../types';
import { conjugate, VERB_LIBRARY, VERBS_BY_INFINITIVE } from '../data/verbs';
import { SENTENCE_TEMPLATES } from '../data/templates';
import { PRONOUN_LABELS, TENSE_NAMES } from './conjugator';

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

  // English translation of sentence
  const englishFull = chosenTemplate.englishTemplate.replace(
    '{verb}',
    chosenVerb.translation.replace(/^to /, '')
  );

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
