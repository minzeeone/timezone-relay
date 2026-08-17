export type LocalizationChangeType =
  | 'term'
  | 'acronym'
  | 'culture'
  | 'naturalization';

export interface LocalizationChange {
  original: string;
  localized: string;
  type: LocalizationChangeType;
  reason: string;
}

export interface LocalizationResult {
  original: string;
  localizedText: string;
  changes: LocalizationChange[];
  culturalNote?: string;
}

export interface AcronymExplanation {
  acronym: string;
  fullForm: string;
  explanation: string;
  action: 'keep' | 'explain' | 'simplify';
  reason: string;
}
