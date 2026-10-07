import { TenseGuide, TenseKey } from '../types';

export const TENSE_GUIDES: Record<TenseKey, TenseGuide> = {
  presente: {
    tense: 'presente',
    title: 'Presente de Indicativo',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Actions happening right now in the present moment.',
      'Habitual routines, repeated actions, and universal facts.',
      'Near-future scheduled events (e.g. "Mañana salgo a las ocho").',
    ],
    formula: {
      ar: 'Stem + -o, -as, -a, -amos, -áis, -an',
      er: 'Stem + -o, -es, -e, -emos, -éis, -en',
      ir: 'Stem + -o, -es, -e, -imos, -ís, -en',
    },
    keyIrregulars: [
      { verb: 'ser', forms: 'soy, eres, es, somos, sois, son', note: 'Radically irregular across all persons.' },
      { verb: 'ir', forms: 'voy, vas, va, vamos, vais, van', note: 'Completely suppletive stem change starting with v-.' },
      { verb: 'tener', forms: 'tengo, tienes, tiene, tenemos, tenéis, tienen', note: 'Yo-go irregular + e→ie stem change in boot forms.' },
    ],
  },
  preterito: {
    tense: 'preterito',
    title: 'Pretérito Indefinido',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Actions completed at a specific, defined point in the past.',
      'Events in a sequence or narrative chain of events.',
      'Actions with clear start or finish markers (ayer, anoche, el año pasado).',
    ],
    formula: {
      ar: 'Stem + -é, -aste, -ó, -amos, -asteis, -aron',
      er: 'Stem + -í, -iste, -ió, -imos, -isteis, -ieron',
      ir: 'Stem + -í, -iste, -ió, -imos, -isteis, -ieron',
    },
    keyIrregulars: [
      { verb: 'ser / ir', forms: 'fui, fuiste, fue, fuimos, fuisteis, fueron', note: 'Both verbs share the exact same forms in preterite!' },
      { verb: 'hacer', forms: 'hice, hiciste, hizo, hicimos, hicisteis, hicieron', note: 'U-stem irregular; note z in "él hizo" to keep soft /s/ sound.' },
      { verb: 'decir', forms: 'dije, dijiste, dijo, dijimos, dijisteis, dijeron', note: 'J-stem irregular; drops the "i" in 3rd person plural (-eron).' },
    ],
  },
  imperfecto: {
    tense: 'imperfecto',
    title: 'Pretérito Imperfecto',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Habitual or ongoing actions in the past ("used to" or "was -ing").',
      'Descriptions of scenes, weather, mental states, and background circumstances.',
      'Time, age, or emotional states in the past without definite endpoints.',
    ],
    formula: {
      ar: 'Stem + -aba, -abas, -aba, -ábamos, -abais, -aban',
      er: 'Stem + -ía, -ías, -ía, -íamos, -íais, -ían',
      ir: 'Stem + -ía, -ías, -ía, -íamos, -íais, -ían',
    },
    keyIrregulars: [
      { verb: 'ser', forms: 'era, eras, era, éramos, erais, eran', note: 'One of only 3 irregular verbs in the entire imperfect!' },
      { verb: 'ir', forms: 'iba, ibas, iba, íbamos, ibais, iban', note: 'Takes b-forms with written accent on nosotros.' },
      { verb: 'ver', forms: 'veía, veías, veía, veíamos, veíais, veían', note: 'Retains the original "e" before regular -ía endings.' },
    ],
  },
  futuro: {
    tense: 'futuro',
    title: 'Futuro Simple',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Actions that will occur in the future.',
      'Predictions, promises, intentions, and firm resolutions.',
      'Conjecture or probability in the present ("¿Dónde estará?" = "I wonder where he is").',
    ],
    formula: {
      ar: 'Infinitive + -é, -ás, -á, -emos, -éis, -án',
      er: 'Infinitive + -é, -ás, -á, -emos, -éis, -án',
      ir: 'Infinitive + -é, -ás, -á, -emos, -éis, -án',
    },
    keyIrregulars: [
      { verb: 'tener', forms: 'tendré, tendrás, tendrá, tendremos, tendréis, tendrán', note: 'Stem changes to tendr-.' },
      { verb: 'hacer', forms: 'haré, harás, hará, haremos, haréis, harán', note: 'Stem compresses to har-.' },
      { verb: 'decir', forms: 'diré, dirás, dirá, diremos, diréis, dirán', note: 'Stem compresses to dir-.' },
    ],
  },
  condicional: {
    tense: 'condicional',
    title: 'Condicional Simple',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Hypothetical or conditional actions ("would do").',
      'Polite requests, suggestions, and gentle advice ("¿Podrías ayudarme?").',
      'Future of the past in indirect reported speech.',
    ],
    formula: {
      ar: 'Infinitive + -ía, -ías, -ía, -íamos, -íais, -ían',
      er: 'Infinitive + -ía, -ías, -ía, -íamos, -íais, -ían',
      ir: 'Infinitive + -ía, -ías, -ía, -íamos, -íais, -ían',
    },
    keyIrregulars: [
      { verb: 'poner', forms: 'pondría, pondrías, pondría, pondríamos, pondríais, pondrían', note: 'Same irregular stem as future (pondr-).' },
      { verb: 'saber', forms: 'sabría, sabrías, sabría, sabríamos, sabríais, sabrían', note: 'Stem compresses to sabr-.' },
      { verb: 'querer', forms: 'querría, querrías, querría, querríamos, querríais, querrían', note: 'Double-r stem (querr-).' },
    ],
  },
  preterito_perfecto: {
    tense: 'preterito_perfecto',
    title: 'Pretérito Perfecto Compuesto',
    mood: 'Modo Indicativo',
    whenToUse: [
      'Past actions connected to the present time frame (today, this week, this year).',
      'Life experiences ("I have been to Spain three times").',
      'Actions just recently completed with present relevance.',
    ],
    formula: {
      ar: 'he / has / ha / hemos / habéis / han + Stem-ado',
      er: 'he / has / ha / hemos / habéis / han + Stem-ido',
      ir: 'he / has / ha / hemos / habéis / han + Stem-ido',
    },
    keyIrregulars: [
      { verb: 'abrir', forms: 'he abierto, has abierto...', note: 'Irregular past participle: abierto.' },
      { verb: 'escribir', forms: 'he escrito, has escrito...', note: 'Irregular past participle: escrito.' },
      { verb: 'ver', forms: 'he visto, has visto...', note: 'Irregular past participle: visto.' },
    ],
  },
  presente_subjuntivo: {
    tense: 'presente_subjuntivo',
    title: 'Presente de Subjuntivo',
    mood: 'Modo Subjuntivo',
    whenToUse: [
      'Wishes, hopes, and desires after WEIRDO verbs (quiero que, ojalá).',
      'Doubt, denial, uncertainty, and negative opinion (dudo que, no creo que).',
      'Impersonal emotional evaluations (es necesario que, es importante que).',
    ],
    formula: {
      ar: 'Stem (from yo-form) + -e, -es, -e, -emos, -éis, -en (opposite vowel)',
      er: 'Stem (from yo-form) + -a, -as, -a, -amos, -áis, -an (opposite vowel)',
      ir: 'Stem (from yo-form) + -a, -as, -a, -amos, -áis, -an (opposite vowel)',
    },
    keyIrregulars: [
      { verb: 'ser', forms: 'sea, seas, sea, seamos, seáis, sean', note: 'Built on sea- stem.' },
      { verb: 'ir', forms: 'vaya, vayas, vaya, vayamos, vayáis, vayan', note: 'Built on vaya- stem.' },
      { verb: 'saber', forms: 'sepa, sepas, sepa, sepamos, sepáis, sepan', note: 'Built on sepa- stem.' },
    ],
  },
  imperfecto_subjuntivo: {
    tense: 'imperfecto_subjuntivo',
    title: 'Imperfecto de Subjuntivo',
    mood: 'Modo Subjuntivo',
    whenToUse: [
      'Subjunctive triggers referring to past events (quería que vinieras).',
      'Hypothetical conditional "if" clauses (si tuviera tiempo, iría).',
      'Polite softened desires with quisiera ("quisiera pedir...").',
    ],
    formula: {
      ar: 'Stem from 3rd pl. preterite (ellos) minus -ron + -ra, -ras, -ra, -ramos, -rais, -ran',
      er: 'Stem from 3rd pl. preterite (ellos) minus -ron + -iera, -ieras, -iera, -iéramos, -ierais, -ieran',
      ir: 'Stem from 3rd pl. preterite (ellos) minus -ron + -iera, -ieras, -iera, -iéramos, -ierais, -ieran',
    },
    keyIrregulars: [
      { verb: 'tener', forms: 'tuviera, tuvieras, tuviera, tuviéramos, tuvierais, tuvieran', note: 'From preterite tuvieron.' },
      { verb: 'hacer', forms: 'hiciera, hicieras, hiciera, hiciéramos, hicierais, hicieran', note: 'From preterite hicieron.' },
      { verb: 'decir', forms: 'dijera, dijeras, dijera, dijéramos, dijerais, dijeran', note: 'From preterite dijeron (no "i" in ending).' },
    ],
  },
  imperativo_afirmativo: {
    tense: 'imperativo_afirmativo',
    title: 'Imperativo Afirmativo',
    mood: 'Modo Imperativo',
    whenToUse: [
      'Direct commands, instructions, and invitations in the affirmative.',
      'Tú form matches 3rd person singular present indicative (habla, come, vive).',
      'Ud., nosotros, Uds. use present subjunctive endings.',
    ],
    formula: {
      ar: 'tú: -a | Ud.: -e | nosotros: -emos | vosotros: -ad | Uds.: -en',
      er: 'tú: -e | Ud.: -a | nosotros: -amos | vosotros: -ed | Uds.: -an',
      ir: 'tú: -e | Ud.: -a | nosotros: -amos | vosotros: -id | Uds.: -an',
    },
    keyIrregulars: [
      { verb: 'hacer', forms: 'haz (tú), haga (Ud.), hagamos, haced, hagan', note: 'Short irregular command: haz.' },
      { verb: 'poner', forms: 'pon (tú), ponga (Ud.), pongamos, poned, pongan', note: 'Short irregular command: pon.' },
      { verb: 'decir', forms: 'di (tú), diga (Ud.), digamos, decid, digan', note: 'Short irregular command: di.' },
    ],
  },
  imperativo_negativo: {
    tense: 'imperativo_negativo',
    title: 'Imperativo Negativo',
    mood: 'Modo Imperativo',
    whenToUse: [
      'Direct prohibitions and negative commands ("No hables", "No comas").',
      'All persons use the present subjunctive with opposite vowel endings preceded by "No".',
      'Pronouns must attach to the front (e.g. "no me digas").',
    ],
    formula: {
      ar: 'tú: no -es | Ud.: no -e | nosotros: no -emos | vosotros: no -éis | Uds.: no -en',
      er: 'tú: no -as | Ud.: no -a | nosotros: no -amos | vosotros: no -áis | Uds.: no -an',
      ir: 'tú: no -as | Ud.: no -a | nosotros: no -amos | vosotros: no -áis | Uds.: no -an',
    },
    keyIrregulars: [
      { verb: 'ir', forms: 'no vayas, no vaya, no vayamos, no vayáis, no vayan', note: 'Uses present subjunctive forms.' },
      { verb: 'ser', forms: 'no seas, no sea, no seamos, no seáis, no sean', note: 'Uses present subjunctive forms.' },
      { verb: 'tener', forms: 'no tengas, no tenga, no tengamos, no tengáis, no tengan', note: 'Uses present subjunctive forms.' },
    ],
  },
};
