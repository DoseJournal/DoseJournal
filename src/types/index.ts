export interface Medication {
  id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  times: string[];
  indication?: string;
  requirePhoto: boolean;
  tabletCount?: string;
  appearance?: string;
  /** True for as-needed (PRN) medications like paracetamol */
  asNeeded?: boolean;
  /** Minimum hours that must pass before the next dose can be taken (decimal allowed) */
  minIntervalHours?: number;
  /** Maximum total dose allowed in a 24-hour period for as-needed meds */
  maxDailyDose?: number;
  /** Unit for maxDailyDose (may differ from the per-dose unit, e.g. g vs mg) */
  maxDailyDoseUnit?: string;
}

/** A single dose taken for an as-needed (PRN) medication */
export interface PRNDose {
  id: string;
  medicationId: string;
  timestamp: Date;
  tabletsCount?: number;
}

export interface MedLog {
  id: string;
  medicationId: string;
  timestamp: Date;
  status: 'taken' | 'pending' | 'missed' | 'upcoming';
  photoDataUrl?: string;
  questions: { question: string; answer: boolean }[];
}

export interface CheckinEntry {
  id: string;
  date: Date;
  ratings: { question: string; value: number }[];
}

export interface AppSettings {
  userName: string;
  eveningCheckinEnabled: boolean;
  requirePhotoWhenLogging: boolean;
  loggingQuestionsEnabled: boolean;
  loggingQuestions: string[];
  checkinQuestions: string[];
  /** @deprecated use loggingQuestions */
  customQuestions: string[];
  eveningCheckinTime: string;
  accentColor: string;
  darkMode: boolean;
  disclaimerAccepted: boolean;
  onboardingComplete: boolean;
  accessibilityMode: boolean;
}
