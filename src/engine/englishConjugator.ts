import { Verb, TenseKey, Pronoun, SentenceTemplate } from '../types';

interface EnglishVerbForms {
  base: string;
  past: string | { [key in Pronoun]?: string };
  pastParticiple: string;
  thirdSingular: string;
  gerund: string;
}

// Explicit mappings for Spanish verbs to natural English forms
const ENGLISH_VERBS_DICT: Record<string, EnglishVerbForms> = {
  ser: {
    base: 'be',
    past: {
      yo: 'was',
      tu: 'were',
      el_ella_ud: 'was',
      nosotros: 'were',
      vosotros: 'were',
      ellos_ellas_uds: 'were',
    },
    pastParticiple: 'been',
    thirdSingular: 'is',
    gerund: 'being',
  },
  estar: {
    base: 'be',
    past: {
      yo: 'was',
      tu: 'were',
      el_ella_ud: 'was',
      nosotros: 'were',
      vosotros: 'were',
      ellos_ellas_uds: 'were',
    },
    pastParticiple: 'been',
    thirdSingular: 'is',
    gerund: 'being',
  },
  haber: {
    base: 'have',
    past: 'had',
    pastParticiple: 'had',
    thirdSingular: 'has',
    gerund: 'having',
  },
  tener: {
    base: 'have',
    past: 'had',
    pastParticiple: 'had',
    thirdSingular: 'has',
    gerund: 'having',
  },
  hacer: {
    base: 'make',
    past: 'made',
    pastParticiple: 'made',
    thirdSingular: 'makes',
    gerund: 'making',
  },
  poder: {
    base: 'be able to',
    past: 'could',
    pastParticiple: 'been able to',
    thirdSingular: 'is able to',
    gerund: 'being able to',
  },
  decir: {
    base: 'say',
    past: 'said',
    pastParticiple: 'said',
    thirdSingular: 'says',
    gerund: 'saying',
  },
  ir: {
    base: 'go',
    past: 'went',
    pastParticiple: 'gone',
    thirdSingular: 'goes',
    gerund: 'going',
  },
  ver: {
    base: 'see',
    past: 'saw',
    pastParticiple: 'seen',
    thirdSingular: 'sees',
    gerund: 'seeing',
  },
  dar: {
    base: 'give',
    past: 'gave',
    pastParticiple: 'given',
    thirdSingular: 'gives',
    gerund: 'giving',
  },
  saber: {
    base: 'know',
    past: 'knew',
    pastParticiple: 'known',
    thirdSingular: 'knows',
    gerund: 'knowing',
  },
  querer: {
    base: 'want',
    past: 'wanted',
    pastParticiple: 'wanted',
    thirdSingular: 'wants',
    gerund: 'wanting',
  },
  llegar: {
    base: 'arrive',
    past: 'arrived',
    pastParticiple: 'arrived',
    thirdSingular: 'arrives',
    gerund: 'arriving',
  },
  pasar: {
    base: 'spend',
    past: 'spent',
    pastParticiple: 'spent',
    thirdSingular: 'spends',
    gerund: 'spending',
  },
  poner: {
    base: 'put',
    past: 'put',
    pastParticiple: 'put',
    thirdSingular: 'puts',
    gerund: 'putting',
  },
  parecer: {
    base: 'seem',
    past: 'seemed',
    pastParticiple: 'seemed',
    thirdSingular: 'seems',
    gerund: 'seeming',
  },
  quedar: {
    base: 'stay',
    past: 'stayed',
    pastParticiple: 'stayed',
    thirdSingular: 'stays',
    gerund: 'staying',
  },
  quedarse: {
    base: 'stay',
    past: 'stayed',
    pastParticiple: 'stayed',
    thirdSingular: 'stays',
    gerund: 'staying',
  },
  hablar: {
    base: 'speak',
    past: 'spoke',
    pastParticiple: 'spoken',
    thirdSingular: 'speaks',
    gerund: 'speaking',
  },
  dejar: {
    base: 'leave',
    past: 'left',
    pastParticiple: 'left',
    thirdSingular: 'leaves',
    gerund: 'leaving',
  },
  seguir: {
    base: 'continue',
    past: 'continued',
    pastParticiple: 'continued',
    thirdSingular: 'continues',
    gerund: 'continuing',
  },
  encontrar: {
    base: 'find',
    past: 'found',
    pastParticiple: 'found',
    thirdSingular: 'finds',
    gerund: 'finding',
  },
  llamar: {
    base: 'call',
    past: 'called',
    pastParticiple: 'called',
    thirdSingular: 'calls',
    gerund: 'calling',
  },
  venir: {
    base: 'come',
    past: 'came',
    pastParticiple: 'come',
    thirdSingular: 'comes',
    gerund: 'coming',
  },
  pensar: {
    base: 'think',
    past: 'thought',
    pastParticiple: 'thought',
    thirdSingular: 'thinks',
    gerund: 'thinking',
  },
  salir: {
    base: 'leave',
    past: 'left',
    pastParticiple: 'left',
    thirdSingular: 'leaves',
    gerund: 'leaving',
  },
  volver: {
    base: 'return',
    past: 'returned',
    pastParticiple: 'returned',
    thirdSingular: 'returns',
    gerund: 'returning',
  },
  tomar: {
    base: 'take',
    past: 'took',
    pastParticiple: 'taken',
    thirdSingular: 'takes',
    gerund: 'taking',
  },
  conocer: {
    base: 'know',
    past: 'knew',
    pastParticiple: 'known',
    thirdSingular: 'knows',
    gerund: 'knowing',
  },
  vivir: {
    base: 'live',
    past: 'lived',
    pastParticiple: 'lived',
    thirdSingular: 'lives',
    gerund: 'living',
  },
  sentir: {
    base: 'feel',
    past: 'felt',
    pastParticiple: 'felt',
    thirdSingular: 'feels',
    gerund: 'feeling',
  },
  comer: {
    base: 'eat',
    past: 'ate',
    pastParticiple: 'eaten',
    thirdSingular: 'eats',
    gerund: 'eating',
  },
  beber: {
    base: 'drink',
    past: 'drank',
    pastParticiple: 'drunk',
    thirdSingular: 'drinks',
    gerund: 'drinking',
  },
  dormir: {
    base: 'sleep',
    past: 'slept',
    pastParticiple: 'slept',
    thirdSingular: 'sleeps',
    gerund: 'sleeping',
  },
  cenar: {
    base: 'have dinner',
    past: 'had dinner',
    pastParticiple: 'had dinner',
    thirdSingular: 'has dinner',
    gerund: 'having dinner',
  },
  desayunar: {
    base: 'have breakfast',
    past: 'had breakfast',
    pastParticiple: 'had breakfast',
    thirdSingular: 'has breakfast',
    gerund: 'having breakfast',
  },
  escribir: {
    base: 'write',
    past: 'wrote',
    pastParticiple: 'written',
    thirdSingular: 'writes',
    gerund: 'writing',
  },
  leer: {
    base: 'read',
    past: 'read',
    pastParticiple: 'read',
    thirdSingular: 'reads',
    gerund: 'reading',
  },
  cocinar: {
    base: 'cook',
    past: 'cooked',
    pastParticiple: 'cooked',
    thirdSingular: 'cooks',
    gerund: 'cooking',
  },
  preparar: {
    base: 'prepare',
    past: 'prepared',
    pastParticiple: 'prepared',
    thirdSingular: 'prepares',
    gerund: 'preparing',
  },
  viajar: {
    base: 'travel',
    past: 'traveled',
    pastParticiple: 'traveled',
    thirdSingular: 'travels',
    gerund: 'traveling',
  },
  abrir: {
    base: 'open',
    past: 'opened',
    pastParticiple: 'opened',
    thirdSingular: 'opens',
    gerund: 'opening',
  },
  cerrar: {
    base: 'close',
    past: 'closed',
    pastParticiple: 'closed',
    thirdSingular: 'closes',
    gerund: 'closing',
  },
  responder: {
    base: 'answer',
    past: 'answered',
    pastParticiple: 'answered',
    thirdSingular: 'answers',
    gerund: 'answering',
  },
  contestar: {
    base: 'answer',
    past: 'answered',
    pastParticiple: 'answered',
    thirdSingular: 'answers',
    gerund: 'answering',
  },
  escuchar: {
    base: 'listen to',
    past: 'listened to',
    pastParticiple: 'listened to',
    thirdSingular: 'listens to',
    gerund: 'listening to',
  },
  escuchado: {
    base: 'hear',
    past: 'heard',
    pastParticiple: 'heard',
    thirdSingular: 'hears',
    gerund: 'hearing',
  },
  aprender: {
    base: 'learn',
    past: 'learned',
    pastParticiple: 'learned',
    thirdSingular: 'learns',
    gerund: 'learning',
  },
  aprendido: {
    base: 'learn',
    past: 'learned',
    pastParticiple: 'learned',
    thirdSingular: 'learns',
    gerund: 'learning',
  },
  recibir: {
    base: 'receive',
    past: 'received',
    pastParticiple: 'received',
    thirdSingular: 'receives',
    gerund: 'receiving',
  },
  nadar: {
    base: 'swim',
    past: 'swam',
    pastParticiple: 'swum',
    thirdSingular: 'swims',
    gerund: 'swimming',
  },
  soplar: {
    base: 'blow',
    past: 'blew',
    pastParticiple: 'blown',
    thirdSingular: 'blows',
    gerund: 'blowing',
  },
  sonar: {
    base: 'sound',
    past: 'sounded',
    pastParticiple: 'sounded',
    thirdSingular: 'sounds',
    gerund: 'sounding',
  },
  plantar: {
    base: 'plant',
    past: 'planted',
    pastParticiple: 'planted',
    thirdSingular: 'plants',
    gerund: 'planting',
  },
  perder: {
    base: 'lose',
    past: 'lost',
    pastParticiple: 'lost',
    thirdSingular: 'loses',
    gerund: 'losing',
  },
  ganar: {
    base: 'earn',
    past: 'earned',
    pastParticiple: 'earned',
    thirdSingular: 'earns',
    gerund: 'earning',
  },
  comprar: {
    base: 'buy',
    past: 'bought',
    pastParticiple: 'bought',
    thirdSingular: 'buys',
    gerund: 'buying',
  },
  conducir: {
    base: 'drive',
    past: 'drove',
    pastParticiple: 'driven',
    thirdSingular: 'drives',
    gerund: 'driving',
  },
  correr: {
    base: 'run',
    past: 'ran',
    pastParticiple: 'run',
    thirdSingular: 'runs',
    gerund: 'running',
  },
  terminar: {
    base: 'finish',
    past: 'finished',
    pastParticiple: 'finished',
    thirdSingular: 'finishes',
    gerund: 'finishing',
  },
  completar: {
    base: 'complete',
    past: 'completed',
    pastParticiple: 'completed',
    thirdSingular: 'completes',
    gerund: 'completing',
  },
  disfrutar: {
    base: 'enjoy',
    past: 'enjoyed',
    pastParticiple: 'enjoyed',
    thirdSingular: 'enjoys',
    gerund: 'enjoying',
  },
  descubrir: {
    base: 'discover',
    past: 'discovered',
    pastParticiple: 'discovered',
    thirdSingular: 'discovers',
    gerund: 'discovering',
  },
  probar: {
    base: 'try',
    past: 'tried',
    pastParticiple: 'tried',
    thirdSingular: 'tries',
    gerund: 'trying',
  },
  pedir: {
    base: 'order',
    past: 'ordered',
    pastParticiple: 'ordered',
    thirdSingular: 'orders',
    gerund: 'ordering',
  },
  olvidar: {
    base: 'forget',
    past: 'forgot',
    pastParticiple: 'forgotten',
    thirdSingular: 'forgets',
    gerund: 'forgetting',
  },
  caminar: {
    base: 'walk',
    past: 'walked',
    pastParticiple: 'walked',
    thirdSingular: 'walks',
    gerund: 'walking',
  },
  jugar: {
    base: 'play',
    past: 'played',
    pastParticiple: 'played',
    thirdSingular: 'plays',
    gerund: 'playing',
  },
  entender: {
    base: 'understand',
    past: 'understood',
    pastParticiple: 'understood',
    thirdSingular: 'understands',
    gerund: 'understanding',
  },
  comprender: {
    base: 'understand',
    past: 'understood',
    pastParticiple: 'understood',
    thirdSingular: 'understands',
    gerund: 'understanding',
  },
};

/**
 * Fallback regular inflection helper for any English verb base
 */
function regularEnglishForms(rawBase: string): EnglishVerbForms {
  const base = rawBase.toLowerCase().trim();
  let past = `${base}ed`;
  let third = `${base}s`;
  let gerund = `${base}ing`;

  if (base.endsWith('e')) {
    past = `${base}d`;
    gerund = `${base.slice(0, -1)}ing`;
  } else if (/[bcdfghjklmnpqrstvwxyz]y$/.test(base)) {
    past = `${base.slice(0, -1)}ied`;
    third = `${base.slice(0, -1)}ies`;
  }

  if (/(?:s|sh|ch|x|z|o)$/.test(base)) {
    third = `${base}es`;
  }

  return {
    base,
    past,
    pastParticiple: past,
    thirdSingular: third,
    gerund,
  };
}

/**
 * Retrieves the full English verb forms object for a given Spanish verb
 */
export function getEnglishVerbForms(verb: Verb): EnglishVerbForms {
  const inf = verb.infinitive.toLowerCase().trim();
  if (ENGLISH_VERBS_DICT[inf]) {
    return ENGLISH_VERBS_DICT[inf];
  }

  const rawBase = verb.translation
    .split('/')[0]
    .trim()
    .replace(/^to\s+/i, '')
    .trim();

  return regularEnglishForms(rawBase);
}

/**
 * Formats a sentence template by replacing {verb} or {verb}ing with the
 * grammatically correct, natural English verb tense matching the Spanish prompt.
 */
export function formatEnglishSentence(
  template: SentenceTemplate,
  verb: Verb
): string {
  const forms = getEnglishVerbForms(verb);
  const tpl = template.englishTemplate;

  // 1. Template has "{verb}ing" (e.g. "While they were {verb}ing dinner...")
  if (tpl.includes('{verb}ing')) {
    return tpl.replace('{verb}ing', forms.gerund);
  }

  // 2. Present Perfect templates (e.g. "I have {verb}...", "Have you ever {verb}...")
  const isPresentPerfect =
    template.tense === 'preterito_perfecto' ||
    /(?:have|has|had)\s+(?:already\s+|ever\s+|not yet\s+|never\s+)?\{verb\}/i.test(tpl);

  if (isPresentPerfect) {
    return tpl.replace('{verb}', forms.pastParticiple);
  }

  // 3. Auxiliary / Modal contexts take base infinitive:
  // "will {verb}", "would {verb}", "did you {verb}", "do you {verb}", "used to {verb}",
  // "could not {verb}", "want me to {verb}", "let us {verb}", "do not {verb}", "Please, {verb}"
  const hasModalOrAux =
    /(?:will|would|can|could|did|do|does|used to|to|let us|let'\''s|please|not)\s+\{verb\}/i.test(tpl) ||
    template.tense === 'futuro' ||
    template.tense === 'condicional' ||
    template.tense.startsWith('imperativo');

  if (hasModalOrAux) {
    return tpl.replace('{verb}', forms.base);
  }

  // 4. Past tense contexts without auxiliary:
  // e.g. imp-10: "Those old buildings {verb} very tall and majestic."
  // e.g. imp-5: "Back then, you all {verb} very happy..."
  // e.g. pret-1: "Yesterday I {verb} with my boss..."
  // e.g. pret-6: "They {verb} very kind throughout the visit."
  // e.g. subj-imp-1: "If I {verb} more money..."
  // e.g. subj-imp-6: "If they {verb} the truth..."
  const isPastTenseContext =
    template.tense === 'preterito' ||
    template.tense === 'imperfecto' ||
    template.tense === 'imperfecto_subjuntivo';

  if (isPastTenseContext) {
    const pronoun = template.pronoun;
    let pastForm: string;

    if (typeof forms.past === 'string') {
      pastForm = forms.past;
    } else {
      // Pronoun-specific (e.g. was vs were for 'be')
      pastForm = forms.past[pronoun] || 'were';
    }

    return tpl.replace('{verb}', pastForm);
  }

  // 5. Present 3rd person singular context:
  // e.g. pres-3: "She always {verb} the truth..."
  // e.g. pres-9: "The teacher {verb} the students..."
  if (template.tense === 'presente' && template.pronoun === 'el_ella_ud') {
    return tpl.replace('{verb}', forms.thirdSingular);
  }

  // 6. Default to base form
  return tpl.replace('{verb}', forms.base);
}
