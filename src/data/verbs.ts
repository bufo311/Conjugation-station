import { Verb, TenseKey, Pronoun } from '../types';
import { conjugateRegular } from '../engine/conjugator';
import { conjugateWithPattern } from '../engine/patternConjugator';
import { IRREGULAR_VERBS_DATA } from './irregularVerbs';
import { IRREGULAR_VERBS_DATA_PART2 } from './irregularVerbsPart2';
import { IRREGULAR_VERBS_DATA_PART3 } from './irregularVerbsPart3';
import { IRREGULAR_VERBS_DATA_PART4 } from './irregularVerbsPart4';
import { IRREGULAR_VERBS_DATA_PART5 } from './irregularVerbsPart5';
import { IRREGULAR_VERBS_DATA_PART6 } from './irregularVerbsPart6';
import { REGULAR_VERBS_DATA } from './regularVerbs';
import { RAW_VERB_LIST_300 } from './rawVerbList300';

// Combine all irregular verbs with explicit datasets
const ALL_IRREGULAR = [
  ...IRREGULAR_VERBS_DATA,
  ...IRREGULAR_VERBS_DATA_PART2,
  ...IRREGULAR_VERBS_DATA_PART3,
  ...IRREGULAR_VERBS_DATA_PART4,
  ...IRREGULAR_VERBS_DATA_PART5,
  ...IRREGULAR_VERBS_DATA_PART6,
];

// Map of irregular definitions with full pre-computed forms
const irregularFormsMap = new Map<string, (typeof ALL_IRREGULAR)[0]>();
for (const item of ALL_IRREGULAR) {
  if (!irregularFormsMap.has(item.infinitive)) {
    irregularFormsMap.set(item.infinitive, item);
  }
}

// Most frequent verbs in Spanish in order of frequency
export const VERB_FREQUENCY_ORDER = [
  'ser', 'haber', 'estar', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar', 'saber', 'querer',
  'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar',
  'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar',
  'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir',
  'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar',
  'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'ganar', 'formar', 'partir',
  'morir', 'aceptar', 'realizar', 'suponer', 'comprender', 'lograr', 'explicar', 'preguntar', 'tocar', 'reconocer', 'estudiar', 'alcanzar',
  'nacer', 'dirigir', 'correr', 'utilizar', 'pagar', 'ayudar', 'gustar', 'jugar', 'escuchar', 'cumplir', 'ofrecer', 'descubrir',
  'levantar', 'intentar', 'usar', 'decidir', 'repetir', 'olvidar', 'valer', 'comer', 'beber', 'dormir', 'elegir', 'corregir',
  'vestir', 'reír', 'mentir', 'preferir', 'andar', 'caber', 'traer', 'construir', 'destruir', 'conducir', 'traducir', 'huir',
];

// Build unified Verb Library
const rawUnorderedVerbs: Verb[] = [];
const seenInfinitives = new Set<string>();

// 1. Add irregulars first to ensure high-priority irregular data
for (const [inf, irreg] of irregularFormsMap.entries()) {
  if (!seenInfinitives.has(inf)) {
    seenInfinitives.add(inf);
    rawUnorderedVerbs.push({
      infinitive: irreg.infinitive,
      translation: irreg.translation,
      ending: irreg.ending,
      irregular: true,
      commonRank: 999,
      forms: irreg.forms,
      exampleSentences: irreg.exampleSentences,
    });
  }
}

// 2. Add verbs from RAW_VERB_LIST_300
for (const raw of RAW_VERB_LIST_300) {
  if (seenInfinitives.has(raw.infinitive)) continue;
  seenInfinitives.add(raw.infinitive);

  const ending = raw.infinitive.slice(-2) as 'ar' | 'er' | 'ir';
  const irregDef = irregularFormsMap.get(raw.infinitive);
  const isRegularPattern = raw.pattern === 'A1' || raw.pattern === 'E1' || raw.pattern === 'I1';

  rawUnorderedVerbs.push({
    infinitive: raw.infinitive,
    translation: raw.translation,
    ending,
    irregular: !isRegularPattern || !!irregDef,
    commonRank: 999,
    pattern: raw.pattern,
    forms: irregDef?.forms,
    exampleSentences: irregDef?.exampleSentences || [
      `${raw.infinitive.charAt(0).toUpperCase() + raw.infinitive.slice(1)} es importante en la vida diaria.`,
      `To ${raw.translation.split('/')[0].trim()} is important in daily life.`,
    ],
  });
}

// 3. Add regular verbs
for (const reg of REGULAR_VERBS_DATA) {
  if (!seenInfinitives.has(reg.infinitive)) {
    seenInfinitives.add(reg.infinitive);
    rawUnorderedVerbs.push({
      infinitive: reg.infinitive,
      translation: reg.translation,
      ending: reg.ending,
      irregular: false,
      commonRank: 999,
      pattern: reg.ending === 'ar' ? 'A1' : reg.ending === 'er' ? 'E1' : 'I1',
      exampleSentences: reg.exampleSentences,
    });
  }
}

// Sort by frequency rank
const freqMap = new Map<string, number>();
VERB_FREQUENCY_ORDER.forEach((inf, idx) => freqMap.set(inf, idx));

rawUnorderedVerbs.sort((a, b) => {
  const rankA = freqMap.has(a.infinitive) ? freqMap.get(a.infinitive)! : 1000;
  const rankB = freqMap.has(b.infinitive) ? freqMap.get(b.infinitive)! : 1000;
  if (rankA !== rankB) return rankA - rankB;
  return a.infinitive.localeCompare(b.infinitive);
});

export const VERB_LIBRARY: Verb[] = rawUnorderedVerbs.map((v, i) => ({
  ...v,
  commonRank: i + 1,
}));

// Map for instant O(1) lookup
export const VERBS_BY_INFINITIVE = new Map<string, Verb>(
  VERB_LIBRARY.map((v) => [v.infinitive, v])
);

// Unified conjugate function:
// 1. Checks irregular pre-computed forms table
// 2. Checks pattern conjugator
// 3. Falls back to regular rules
export function conjugate(
  verbOrInfinitive: Verb | string,
  tense: TenseKey,
  pronoun: Pronoun
): string {
  const verb =
    typeof verbOrInfinitive === 'string'
      ? VERBS_BY_INFINITIVE.get(verbOrInfinitive)
      : verbOrInfinitive;

  if (!verb) {
    const inf = typeof verbOrInfinitive === 'string' ? verbOrInfinitive : verbOrInfinitive.infinitive;
    return conjugateRegular(inf, tense, pronoun);
  }

  // 1. Check irregular full forms table
  if (verb.forms && verb.forms[tense]) {
    const form = verb.forms[tense]![pronoun];
    if (form) return form;
  }

  // 2. Check pattern conjugator
  if (verb.pattern) {
    return conjugateWithPattern(verb.infinitive, verb.pattern, tense, pronoun);
  }

  // 3. Regular conjugator
  return conjugateRegular(verb.infinitive, tense, pronoun);
}

