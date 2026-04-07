// data/types.ts

export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'other';

export type Theme =
  | 'daily_life'
  | 'work'
  | 'travel'
  | 'health'
  | 'food'
  | 'education'
  | 'technology'
  | 'society'
  | 'environment'
  | 'relationships'
  | 'culture'
  | 'time_numbers'
  | 'language_exam'
  | 'other';

export interface SentencePair {
  de: string;
  en: string;
}

export interface Sentences {
  present: SentencePair;
  past: SentencePair;
  future: SentencePair;
  nominative?: SentencePair;
  accusative?: SentencePair;
  dative?: SentencePair;
  usage1?: SentencePair;
  usage2?: SentencePair;
  usage3?: SentencePair;
}

export interface TenseConjugation {
  ich: string;
  du: string;
  er: string;   // represents er/sie/es
  wir: string;
  ihr: string;
  sie: string;  // represents sie/Sie
}

export interface TenseForms {
  present: TenseConjugation;
  simple_past: TenseConjugation;
  present_perfect: TenseConjugation;
  past_perfect: TenseConjugation;
  future: TenseConjugation;
  future_perfect: TenseConjugation;
}

export interface VerbForms {
  present_3sg: string;
  simple_past: string;
  perfect: string;
  future: string;
}

export interface Word {
  id: string;
  german: string;
  article: 'der' | 'die' | 'das' | null;
  english: string;
  wordType: WordType;
  plural: string | null;
  theme: Theme;
  verbForms?: VerbForms; // legacy — kept for backward compat
  tenses?: TenseForms;   // full conjugation table for verbs
  sentences: Sentences;
}

export interface StudyProgress {
  knownIds: string[];
  unknownIds: string[];
  reviewIds: string[];
  deckPositions: Record<string, number>;
  languageMode: 'de-en' | 'en-de';
}

export type Gender = 'masculine' | 'feminine' | 'neuter' | null;

export const ARTICLE_GENDER: Record<string, Gender> = {
  der: 'masculine',
  die: 'feminine',
  das: 'neuter',
};

export const GENDER_COLORS: Record<string, string> = {
  masculine: '#DBEAFE',   // blue-100
  feminine:  '#FCE7F3',   // pink-100
  neuter:    '#FEF9C3',   // yellow-100
};

export const THEME_LABELS: Record<Theme, string> = {
  daily_life: 'Daily Life',
  work: 'Work',
  travel: 'Travel',
  health: 'Health',
  food: 'Food & Shopping',
  education: 'Education',
  technology: 'Technology',
  society: 'Society',
  environment: 'Environment',
  relationships: 'Relationships',
  culture: 'Culture',
  time_numbers: 'Time & Numbers',
  language_exam: 'Exam Language',
  other: 'Other',
};

export const WORD_TYPE_LABELS: Record<WordType, string> = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  other: 'Other',
};

export const WORD_TYPE_COLORS: Record<WordType, string> = {
  noun: '#DBEAFE',
  verb: '#DCFCE7',
  adjective: '#FEF9C3',
  adverb: '#EDE9FE',
  preposition: '#FCE7F3',
  conjunction: '#FFE4E6',
  other: '#F3F4F6',
};

export const TENSE_LABELS: Record<keyof TenseForms, string> = {
  present: 'Präsens (Present)',
  simple_past: 'Präteritum (Simple Past)',
  present_perfect: 'Perfekt (Present Perfect)',
  past_perfect: 'Plusquamperfekt (Past Perfect)',
  future: 'Futur I (Future)',
  future_perfect: 'Futur II (Future Perfect)',
};
