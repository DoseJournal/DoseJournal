import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Medication, MedLog, CheckinEntry, AppSettings } from '../types';

// Bump this version any time you need to wipe old cached data
const DATA_VERSION = '2';
const VERSION_KEY = 'medledger_data_version';

function clearOldData() {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== DATA_VERSION) {
    localStorage.removeItem('medledger_settings');
    localStorage.removeItem('medledger_meds');
    localStorage.removeItem('medledger_logs');
    localStorage.removeItem('medledger_checkins');
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }
}

interface AppContextType {
  medications: Medication[];
  logs: MedLog[];
  checkins: CheckinEntry[];
  settings: AppSettings;
  addMedication: (med: Omit<Medication, 'id'>) => void;
  removeMedication: (id: string) => void;
  addLog: (log: Omit<MedLog, 'id'>) => void;
  addCheckin: (entry: Omit<CheckinEntry, 'id'>) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}

const defaultSettings: AppSettings = {
  userName: '',
  eveningCheckinEnabled: true,
  requirePhotoWhenLogging: false,
  loggingQuestionsEnabled: false,
  customQuestions: [
    'Did you eat before taking?',
    'Did you take your full dose?',
    'Did you drink water with it?',
    'Were you at home?',
  ],
  eveningCheckinTime: '10:00 PM',
  accentColor: 'purple',
  darkMode: false,
  disclaimerAccepted: false,
  onboardingComplete: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  clearOldData();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
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
  }, []);

  useEffect(() => { localStorage.setItem('medledger_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('medledger_meds', JSON.stringify(medications)); }, [medications]);
  useEffect(() => { localStorage.setItem('medledger_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('medledger_checkins', JSON.stringify(checkins)); }, [checkins]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    const colors: Record<string, string> = {
      orange: '#FF8400', teal: '#38BDF8', purple: '#863bff',
      green: '#22C55E', red: '#EF4444', blue: '#3B82F6',
      coral: '#F97316', pink: '#EC4899', grey: '#6B7280', indigo: '#6366F1',
    };
    document.documentElement.style.setProperty('--color-primary', colors[settings.accentColor] || '#863bff');
  }, [settings.accentColor]);

  const addMedication = (med: Omit<Medication, 'id'>) => {
    setMedications(prev => [...prev, { ...med, id: Date.now().toString() }]);
  };

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const addLog = (log: Omit<MedLog, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: Date.now().toString() }]);
  };

  const addCheckin = (entry: Omit<CheckinEntry, 'id'>) => {
    setCheckins(prev => [...prev, { ...entry, id: Date.now().toString() }]);
  };

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  return (
    <AppContext.Provider value={{ medications, logs, checkins, settings, addMedication, removeMedication, addLog, addCheckin, updateSettings, setMedications }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
