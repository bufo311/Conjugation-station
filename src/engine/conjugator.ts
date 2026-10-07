import { Pronoun, TenseKey, ConjugationForms } from '../types';

// Regular endings map
export const REGULAR_ENDINGS: Record<
  'ar' | 'er' | 'ir',
  Record<TenseKey, Record<Pronoun, string>>
> = {
  ar: {
    presente: {
      yo: 'o',
      tu: 'as',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_uds: 'an',
    },
    preterito: {
      yo: 'é',
      tu: 'aste',
      el_ella_ud: 'ó',
      nosotros: 'amos',
      vosotros: 'asteis',
      ellos_ellas_uds: 'aron',
    },
    imperfecto: {
      yo: 'aba',
      tu: 'abas',
      el_ella_ud: 'aba',
      nosotros: 'ábamos',
      vosotros: 'abais',
      ellos_ellas_uds: 'aban',
    },
    futuro: {
      yo: 'é',
      tu: 'ás',
      el_ella_ud: 'á',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'án',
    },
    condicional: {
      yo: 'ía',
      tu: 'ías',
      el_ella_ud: 'ía',
      nosotros: 'íamos',
      vosotros: 'íais',
      ellos_ellas_uds: 'ían',
    },
    preterito_perfecto: {
      yo: 'he ',
      tu: 'has ',
      el_ella_ud: 'ha ',
      nosotros: 'hemos ',
      vosotros: 'habéis ',
      ellos_ellas_uds: 'han ',
    },
    presente_subjuntivo: {
      yo: 'e',
      tu: 'es',
      el_ella_ud: 'e',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'en',
    },
    imperfecto_subjuntivo: {
      yo: 'ara',
      tu: 'aras',
      el_ella_ud: 'ara',
      nosotros: 'áramos',
      vosotros: 'arais',
      ellos_ellas_uds: 'aran',
    },
    imperativo_afirmativo: {
      yo: '',
      tu: 'a',
      el_ella_ud: 'e',
      nosotros: 'emos',
      vosotros: 'ad',
      ellos_ellas_uds: 'en',
    },
    imperativo_negativo: {
      yo: '',
      tu: 'es',
      el_ella_ud: 'e',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'en',
    },
  },
  er: {
    presente: {
      yo: 'o',
      tu: 'es',
      el_ella_ud: 'e',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'en',
    },
    preterito: {
      yo: 'í',
      tu: 'iste',
      el_ella_ud: 'ió',
      nosotros: 'imos',
      vosotros: 'isteis',
      ellos_ellas_uds: 'ieron',
    },
    imperfecto: {
      yo: 'ía',
      tu: 'ías',
      el_ella_ud: 'ía',
      nosotros: 'íamos',
      vosotros: 'íais',
      ellos_ellas_uds: 'ían',
    },
    futuro: {
      yo: 'é',
      tu: 'ás',
      el_ella_ud: 'á',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'án',
    },
    condicional: {
      yo: 'ía',
      tu: 'ías',
      el_ella_ud: 'ía',
      nosotros: 'íamos',
      vosotros: 'íais',
      ellos_ellas_uds: 'ían',
    },
    preterito_perfecto: {
      yo: 'he ',
      tu: 'has ',
      el_ella_ud: 'ha ',
      nosotros: 'hemos ',
      vosotros: 'habéis ',
      ellos_ellas_uds: 'han ',
    },
    presente_subjuntivo: {
      yo: 'a',
      tu: 'as',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_uds: 'an',
    },
    imperfecto_subjuntivo: {
      yo: 'iera',
      tu: 'ieras',
      el_ella_ud: 'iera',
      nosotros: 'iéramos',
      vosotros: 'ierais',
      ellos_ellas_uds: 'ieran',
    },
    imperativo_afirmativo: {
      yo: '',
      tu: 'e',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'ed',
      ellos_ellas_uds: 'an',
    },
    imperativo_negativo: {
      yo: '',
      tu: 'as',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_uds: 'an',
    },
  },
  ir: {
    presente: {
      yo: 'o',
      tu: 'es',
      el_ella_ud: 'e',
      nosotros: 'imos',
      vosotros: 'ís',
      ellos_ellas_uds: 'en',
    },
    preterito: {
      yo: 'í',
      tu: 'iste',
      el_ella_ud: 'ió',
      nosotros: 'imos',
      vosotros: 'isteis',
      ellos_ellas_uds: 'ieron',
    },
    imperfecto: {
      yo: 'ía',
      tu: 'ías',
      el_ella_ud: 'ía',
      nosotros: 'íamos',
      vosotros: 'íais',
      ellos_ellas_uds: 'ían',
    },
    futuro: {
      yo: 'é',
      tu: 'ás',
      el_ella_ud: 'á',
      nosotros: 'emos',
      vosotros: 'éis',
      ellos_ellas_uds: 'án',
    },
    condicional: {
      yo: 'ía',
      tu: 'ías',
      el_ella_ud: 'ía',
      nosotros: 'íamos',
      vosotros: 'íais',
      ellos_ellas_uds: 'ían',
    },
    preterito_perfecto: {
      yo: 'he ',
      tu: 'has ',
      el_ella_ud: 'ha ',
      nosotros: 'hemos ',
      vosotros: 'habéis ',
      ellos_ellas_uds: 'han ',
    },
    presente_subjuntivo: {
      yo: 'a',
      tu: 'as',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_uds: 'an',
    },
    imperfecto_subjuntivo: {
      yo: 'iera',
      tu: 'ieras',
      el_ella_ud: 'iera',
      nosotros: 'iéramos',
      vosotros: 'ierais',
      ellos_ellas_uds: 'ieran',
    },
    imperativo_afirmativo: {
      yo: '',
      tu: 'e',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'id',
      ellos_ellas_uds: 'an',
    },
    imperativo_negativo: {
      yo: '',
      tu: 'as',
      el_ella_ud: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_uds: 'an',
    },
  },
};

export const PRONOUN_LABELS: Record<Pronoun, string> = {
  yo: 'yo',
  tu: 'tú',
  el_ella_ud: 'él/ella/Ud.',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos_ellas_uds: 'ellos/ellas/Uds.',
};

export const TENSE_NAMES: Record<TenseKey, string> = {
  presente: 'Presente',
  preterito: 'Pretérito indefinido',
  imperfecto: 'Pretérito imperfecto',
  futuro: 'Futuro simple',
  condicional: 'Condicional simple',
  preterito_perfecto: 'Pretérito perfecto',
  presente_subjuntivo: 'Presente de subjuntivo',
  imperfecto_subjuntivo: 'Imperfecto de subjuntivo',
  imperativo_afirmativo: 'Imperativo afirmativo',
  imperativo_negativo: 'Imperativo negativo',
};

// Conjugate regular verb using rules
export function conjugateRegular(
  infinitive: string,
  tense: TenseKey,
  pronoun: Pronoun
): string {
  const endingType = infinitive.slice(-2) as 'ar' | 'er' | 'ir';
  const stem = infinitive.slice(0, -2);
  const endings = REGULAR_ENDINGS[endingType]?.[tense];

  if (!endings) return infinitive;

  if (tense === 'futuro' || tense === 'condicional') {
    return infinitive + endings[pronoun];
  }

  if (tense === 'preterito_perfecto') {
    const aux = endings[pronoun];
    const participle = endingType === 'ar' ? stem + 'ado' : stem + 'ido';
    return aux + participle;
  }

  return stem + endings[pronoun];
}

// Accent-tolerant normalizer
export function normalizeSpanish(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Strips diacritics
}

export function isAnswerCorrect(userInput: string, target: string): boolean {
  return normalizeSpanish(userInput) === normalizeSpanish(target);
}
