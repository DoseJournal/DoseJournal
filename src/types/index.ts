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
  asNeeded?: boolean;
  minIntervalHours?: number;
  maxDailyDose?: number;
  maxDailyDoseUnit?: string;
  selectedQuestions?: string[];
  photoDataUrl?: string;
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

export interface PRNDose {
  id: string;
  medicationId: string;
  timestamp: Date;
  tabletsCount?: number;
  notes?: string;
}

export interface AppSettings {
  userName: string;
  eveningCheckinEnabled: boolean;
  requirePhotoWhenLogging: boolean;
  loggingQuestionsEnabled: boolean;
  loggingQuestions: string[];
  checkinQuestions: string[];
  customQuestions: string[];
  eveningCheckinTime: string;
  accentColor: string;
  darkMode: boolean;
  disclaimerAccepted: boolean;
  onboardingComplete: boolean;
  accessibilityMode: boolean;
}
