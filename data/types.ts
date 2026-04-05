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
  // Nouns: nominative/accusative/dative case examples
  nominative?: SentencePair;
  accusative?: SentencePair;
  dative?: SentencePair;
  // Non-nouns: extra usage examples in place of case sentences
  usage1?: SentencePair;
  usage2?: SentencePair;
  usage3?: SentencePair;
}

export interface VerbForms {
  present_3sg: string;   // e.g. "arbeitet"
  simple_past: string;   // e.g. "arbeitete"
  perfect: string;       // e.g. "hat gearbeitet"
  future: string;        // e.g. "wird arbeiten"
}

export interface Word {
  id: string;
  german: string;
  article: 'der' | 'die' | 'das' | null;
  english: string;
  wordType: WordType;
  plural: string | null;      // full plural form e.g. "die Abfälle"
  theme: Theme;
  verbForms?: VerbForms;
  sentences: Sentences;
}

export interface StudyProgress {
  knownIds: string[];
  unknownIds: string[];
  deckPositions: Record<string, number>;  // deckId → last card index
}

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
  noun: '#DBEAFE',       // blue-100
  verb: '#DCFCE7',       // green-100
  adjective: '#FEF9C3',  // yellow-100
  adverb: '#EDE9FE',     // violet-100
  preposition: '#FCE7F3',// pink-100
  conjunction: '#FFE4E6',// rose-100
  other: '#F3F4F6',      // gray-100
};
