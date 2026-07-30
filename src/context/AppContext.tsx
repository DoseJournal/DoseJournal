import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Medication, MedLog, CheckinEntry, AppSettings, PRNDose } from '../types';
import { scheduleTodayReminders, saveScheduleToCache, registerPeriodicSync } from '../utils/notifications';

// Bump this version any time you need to wipe old cached data
const DATA_VERSION = '9';
const VERSION_KEY = 'medledger_data_version';

function clearOldData() {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== DATA_VERSION) {
    localStorage.removeItem('medledger_settings');
    localStorage.removeItem('medledger_meds');
    localStorage.removeItem('medledger_logs');
    localStorage.removeItem('medledger_checkins');
    localStorage.removeItem('medledger_prn_doses');
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }
}

interface AppContextType {
  medications: Medication[];
  logs: MedLog[];
  checkins: CheckinEntry[];
  prnDoses: PRNDose[];
  settings: AppSettings;
  session: null;
  addMedication: (med: Omit<Medication, 'id'>) => void;
  removeMedication: (id: string) => void;
  addLog: (log: Omit<MedLog, 'id'>) => void;
  updateLog: (id: string, updates: Partial<MedLog>) => void;
  deleteLog: (id: string) => void;
  addCheckin: (entry: Omit<CheckinEntry, 'id'>) => void;
  addPRNDose: (dose: Omit<PRNDose, 'id'>) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}

const defaultSettings: AppSettings = {
  userName: '',
  eveningCheckinEnabled: true,
  requirePhotoWhenLogging: false,
  loggingQuestionsEnabled: true,
  loggingQuestions: [
    'Did you take this with food?',
    'Did you take your full dose?',
    'Did you drink water with it?',
    'Were you at home?',
    'Did you take it on time?',
  ],
  checkinQuestions: [
    'How focused did you feel today?',
    'How anxious did you feel today?',
    'Any stomach upset today?',
    'How well did you sleep last night?',
  ],
  customQuestions: [],
  eveningCheckinTime: '10:00 PM',
  accentColor: 'purple',
  darkMode: false,
  disclaimerAccepted: false,
  onboardingComplete: false,
  accessibilityMode: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  clearOldData();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [prnDoses, setPrnDoses] = useState<PRNDose[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('medledger_settings');
    if (saved) setSettings(JSON.parse(saved));
    const savedMeds = localStorage.getItem('medledger_meds');
    if (savedMeds) setMedications(JSON.parse(savedMeds));
    const savedLogs = localStorage.getItem('medledger_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs).map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
    const savedCheckins = localStorage.getItem('medledger_checkins');
    if (savedCheckins) setCheckins(JSON.parse(savedCheckins).map((c: any) => ({ ...c, date: new Date(c.date) })));
    const savedPrn = localStorage.getItem('medledger_prn_doses');
    if (savedPrn) setPrnDoses(JSON.parse(savedPrn).map((d: any) => ({ ...d, timestamp: new Date(d.timestamp) })));
  }, []);

  useEffect(() => { localStorage.setItem('medledger_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('medledger_meds', JSON.stringify(medications)); }, [medications]);
  useEffect(() => { localStorage.setItem('medledger_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('medledger_checkins', JSON.stringify(checkins)); }, [checkins]);
  useEffect(() => { localStorage.setItem('medledger_prn_doses', JSON.stringify(prnDoses)); }, [prnDoses]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    const colors: Record<string, string> = {
      orange: '#FF8400', teal: '#38BDF8', purple: '#863bff',
      green: '#22C55E', red: '#EF4444', blue: '#3B82F6',
      coral: '#F97316', pink: '#EC4899', grey: '#6B7280', indigo: '#6366F1',
    };
    const hex = colors[settings.accentColor] || '#863bff';
    document.documentElement.style.setProperty('--color-primary', hex);

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    document.documentElement.style.setProperty('--color-primary-foreground', luminance > 0.6 ? '#14181C' : '#FFFFFF');

    const isDark = document.documentElement.classList.contains('dark') || document.querySelector('#root')?.classList.contains('dark');
    const baseShadow = isDark
      ? `0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(${r},${g},${b},0.22), inset 0 1px 0 rgba(255,255,255,0.12)`
      : `0 1px 2px rgba(20,24,28,0.08), 0 6px 16px rgba(${r},${g},${b},0.24), inset 0 1px 0 rgba(255,255,255,0.35)`;
    document.documentElement.style.setProperty('--shadow-button', baseShadow);
  }, [settings.accentColor, settings.darkMode]);

  useEffect(() => {
    if (medications.length === 0) return;
    scheduleTodayReminders(medications);
    saveScheduleToCache(medications);
    registerPeriodicSync();
  }, [medications]);

  const addMedication = (med: Omit<Medication, 'id'>) => {
    setMedications(prev => [...prev, { ...med, id: Date.now().toString() }]);
  };

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const addLog = (log: Omit<MedLog, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: Date.now().toString() }]);
  };

  const updateLog = (id: string, updates: Partial<MedLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const addCheckin = (entry: Omit<CheckinEntry, 'id'>) => {
    setCheckins(prev => [...prev, { ...entry, id: Date.now().toString() }]);
  };

  const addPRNDose = (dose: Omit<PRNDose, 'id'>) => {
    setPrnDoses(prev => [...prev, { ...dose, id: Date.now().toString() }]);
  };

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  return (
    <AppContext.Provider value={{
      medications, logs, checkins, prnDoses, settings,
      session: null,
      addMedication, removeMedication,
      addLog, updateLog, deleteLog,
      addCheckin, addPRNDose,
      updateSettings, setMedications,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
