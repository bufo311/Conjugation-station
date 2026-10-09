export type Pronoun = 'yo' | 'tu' | 'el_ella_ud' | 'nosotros' | 'vosotros' | 'ellos_ellas_uds';

export type TenseKey =
  | 'presente'
  | 'preterito'
  | 'imperfecto'
  | 'futuro'
  | 'condicional'
  | 'preterito_perfecto'
  | 'presente_subjuntivo'
  | 'imperfecto_subjuntivo'
  | 'imperativo_afirmativo'
  | 'imperativo_negativo';

export interface TenseInfo {
  id: TenseKey;
  name: string;
  englishName: string;
  category: 'indicativo' | 'subjuntivo' | 'imperativo' | 'compuesto';
  description: string;
}

export interface ConjugationForms {
  yo?: string;
  tu: string;
  el_ella_ud: string;
  nosotros: string;
  vosotros: string;
  ellos_ellas_uds: string;
}

export type VerbConjugations = Partial<Record<TenseKey, ConjugationForms>>;

export interface Verb {
  infinitive: string;
  translation: string;
  ending: 'ar' | 'er' | 'ir';
  irregular: boolean;
  commonRank: number;
  pattern?: string; // e.g. A1, A10, E3, I11
  forms?: VerbConjugations; // Provided for irregulars or overrides
  exampleSentences?: [string, string]; // Spanish example, English translation
}

export interface SentenceTemplate {
  id: string;
  tense: TenseKey;
  pronoun: Pronoun;
  before: string; // Text before the blank
  after: string; // Text after the blank
  englishTemplate: string; // e.g. "I {verb} with my mother every Sunday."
  compatibleVerbs?: string[]; // Specific verbs, or if empty, any verb fits grammatically
  excludedVerbs?: string[];
  contextHint?: string;
}

export interface Question {
  id: string;
  verb: Verb;
  tense: TenseKey;
  pronoun: Pronoun;
  template: SentenceTemplate;
  correctAnswer: string;
  options: string[]; // 4 options for multiple choice
  explanation: string;
  englishFull: string;
}

export interface LeitnerCard {
  id: string; // key like "hablar:preterito:yo" or "vocab:core500:libro"
  itemType?: 'verb' | 'vocab';
  infinitive?: string;
  tense?: TenseKey;
  pronoun?: Pronoun;
  vocabId?: string;
  deckId?: string;
  correctAnswer: string;
  englishFull: string;
  sentenceContext: string;
  level: number; // 1 to 5
  nextReviewDate: number; // timestamp
  timesReviewed: number;
  timesCorrect: number;
  lastReviewedDate?: number;
}

export interface VocabEntry {
  id: string;
  es: string;
  article?: 'el' | 'la' | 'los' | 'las';
  en: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'connector' | 'pronoun' | 'preposition' | 'chunk';
  sentence: string;
  sentenceEn: string;
  type?: 'word' | 'chunk';
  category?: string;
  note?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  deckId: 'core500' | 'core1000' | 'core2000' | 'frases' | 'advanced';
}

export interface VocabQuestion {
  id: string;
  entry: VocabEntry;
  direction: 'production' | 'recognition'; // production = EN -> ES, recognition = ES -> EN
  prompt: string;
  contextEn: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

export type QuizQuestionType = 'verb' | 'vocab' | 'phrase';

export interface UnifiedQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string; // Spanish sentence with blank ___
  englishTranslation: string; // English translation of sentence
  correctAnswer: string;
  options: string[];
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  verbData?: {
    verb: Verb;
    tense: TenseKey;
    pronoun: Pronoun;
    template: SentenceTemplate;
  };
  vocabData?: {
    entry: VocabEntry;
  };
}

export interface UserStats {
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  totalAnswered: number;
  totalCorrect: number;
  tenseStats: Record<TenseKey, { answered: number; correct: number }>;
  verbErrors: Record<string, number>; // infinitive -> error count
  vocabStats?: Record<string, { answered: number; correct: number }>; // deckId -> stats
  vocabErrors?: Record<string, number>; // word -> error count
  newWordsIntroducedDate?: string;
  newWordsIntroducedCount?: number;
  favorites: string[]; // array of infinitives or word IDs
  settings: {
    includeVosotros: boolean;
    defaultMode: 'choice' | 'type';
    soundEffects: boolean;
    autoSpeak: boolean;
    newWordsPerDay?: number;
    vocabDifficulty?: 'all' | 'beginner' | 'intermediate' | 'advanced';
    unlockAllLayers?: boolean;
    verbPoolMode?: 'pyramid' | 'all' | 'irregulars';
  };
}

export interface TenseGuide {
  tense: TenseKey;
  title: string;
  mood: string;
  whenToUse: string[];
  formula: {
    ar: string;
    er: string;
    ir: string;
  };
  keyIrregulars: Array<{
    verb: string;
    forms: string;
    note: string;
  }>;
}
