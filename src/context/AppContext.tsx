import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Medication, MedLog, CheckinEntry, AppSettings, PRNDose } from '../types';
import { scheduleTodayReminders, saveScheduleToCache, registerPeriodicSync } from '../utils/notifications';
import { supabase } from '../lib/supabase';

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
  session: Session | null;
  loading: boolean;
  medications: Medication[];
  logs: MedLog[];
  checkins: CheckinEntry[];
  prnDoses: PRNDose[];
  settings: AppSettings;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  addLog: (log: Omit<MedLog, 'id'>) => Promise<void>;
  updateLog: (id: string, log: Partial<Omit<MedLog, 'id'>>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  addCheckin: (entry: Omit<CheckinEntry, 'id'>) => Promise<void>;
  addPRNDose: (dose: Omit<PRNDose, 'id'>) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  signOut: () => Promise<void>;
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

// ── Supabase <-> App type converters ──────────────────────────────────────────

function dbToMed(row: any): Medication {
  return {
    id: row.id,
    name: row.name,
    dose: row.dose ?? '',
    unit: row.unit ?? 'mg',
    frequency: row.frequency ?? '',
    times: row.times ?? [],
    indication: row.indication,
    requirePhoto: row.require_photo ?? false,
    tabletCount: row.tablet_count ?? '1',
    appearance: row.appearance,
    asNeeded: row.as_needed ?? false,
    minIntervalHours: row.min_interval_hours,
    maxDailyDose: row.max_daily_dose,
    maxDailyDoseUnit: row.max_daily_dose_unit,
  };
}

function medToDb(med: Omit<Medication, 'id'>, profileId: string) {
  return {
    profile_id: profileId,
    name: med.name,
    dose: med.dose,
    unit: med.unit,
    frequency: med.frequency,
    times: med.times,
    indication: med.indication,
    require_photo: med.requirePhoto,
    tablet_count: med.tabletCount,
    appearance: med.appearance,
    as_needed: med.asNeeded ?? false,
    min_interval_hours: med.minIntervalHours,
    max_daily_dose: med.maxDailyDose,
    max_daily_dose_unit: med.maxDailyDoseUnit,
  };
}

function dbToLog(row: any): MedLog {
  return {
    id: row.id,
    medicationId: row.medication_id,
    timestamp: new Date(row.timestamp),
    status: row.status ?? 'taken',
    photoDataUrl: row.photo_url,
    questions: row.questions ?? [],
  };
}

function logToDb(log: Omit<MedLog, 'id'>, profileId: string) {
  return {
    profile_id: profileId,
    medication_id: log.medicationId,
    timestamp: log.timestamp.toISOString(),
    status: log.status,
    photo_url: log.photoDataUrl,
    questions: log.questions,
  };
}

function dbToPrn(row: any): PRNDose {
  return {
    id: row.id,
    medicationId: row.medication_id,
    timestamp: new Date(row.timestamp),
    tabletsCount: row.tablets_count ?? 1,
  };
}

function prnToDb(dose: Omit<PRNDose, 'id'>, profileId: string) {
  return {
    profile_id: profileId,
    medication_id: dose.medicationId,
    timestamp: dose.timestamp.toISOString(),
    tablets_count: dose.tabletsCount ?? 1,
  };
}

function dbToCheckin(row: any): CheckinEntry {
  return {
    id: row.id,
    date: new Date(row.date),
    ratings: row.ratings ?? [],
  };
}

function dbToSettings(row: any): AppSettings {
  return {
    ...defaultSettings,
    userName: row.user_name ?? '',
    eveningCheckinEnabled: row.evening_checkin_enabled ?? true,
    requirePhotoWhenLogging: row.require_photo_when_logging ?? false,
    loggingQuestionsEnabled: row.logging_questions_enabled ?? true,
    loggingQuestions: row.logging_questions ?? defaultSettings.loggingQuestions,
    checkinQuestions: row.checkin_questions ?? defaultSettings.checkinQuestions,
    eveningCheckinTime: row.evening_checkin_time ?? '10:00 PM',
    accentColor: row.accent_color ?? 'purple',
    darkMode: row.dark_mode ?? false,
    accessibilityMode: row.accessibility_mode ?? false,
    onboardingComplete: row.onboarding_complete ?? false,
    disclaimerAccepted: row.onboarding_complete ?? false,
  };
}

function settingsToDb(s: Partial<AppSettings>, profileId: string) {
  const map: any = { profile_id: profileId, updated_at: new Date().toISOString() };
  if (s.userName !== undefined) map.user_name = s.userName;
  if (s.eveningCheckinEnabled !== undefined) map.evening_checkin_enabled = s.eveningCheckinEnabled;
  if (s.requirePhotoWhenLogging !== undefined) map.require_photo_when_logging = s.requirePhotoWhenLogging;
  if (s.loggingQuestionsEnabled !== undefined) map.logging_questions_enabled = s.loggingQuestionsEnabled;
  if (s.loggingQuestions !== undefined) map.logging_questions = s.loggingQuestions;
  if (s.checkinQuestions !== undefined) map.checkin_questions = s.checkinQuestions;
  if (s.eveningCheckinTime !== undefined) map.evening_checkin_time = s.eveningCheckinTime;
  if (s.accentColor !== undefined) map.accent_color = s.accentColor;
  if (s.darkMode !== undefined) map.dark_mode = s.darkMode;
  if (s.accessibilityMode !== undefined) map.accessibility_mode = s.accessibilityMode;
  if (s.onboardingComplete !== undefined) map.onboarding_complete = s.onboardingComplete;
  return map;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  clearOldData();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [prnDoses, setPrnDoses] = useState<PRNDose[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const settingsSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data from Supabase when session changes ──
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    loadFromSupabase(session.user.id);
  }, [session]);

  const loadFromSupabase = async (userId: string) => {
    setLoading(true);
    try {
      const [medsRes, logsRes, prnRes, checkinsRes, settingsRes] = await Promise.all([
        supabase.from('medications').select('*').eq('profile_id', userId).order('created_at'),
        supabase.from('medication_logs').select('*').eq('profile_id', userId).order('timestamp', { ascending: false }),
        supabase.from('prn_doses').select('*').eq('profile_id', userId).order('timestamp', { ascending: false }),
        supabase.from('checkins').select('*').eq('profile_id', userId).order('date', { ascending: false }),
        supabase.from('settings').select('*').eq('profile_id', userId).single(),
      ]);

      if (medsRes.data) setMedications(medsRes.data.map(dbToMed));
      if (logsRes.data) setLogs(logsRes.data.map(dbToLog));
      if (prnRes.data) setPrnDoses(prnRes.data.map(dbToPrn));
      if (checkinsRes.data) setCheckins(checkinsRes.data.map(dbToCheckin));
      if (settingsRes.data) setSettings(dbToSettings(settingsRes.data));
    } catch (e) {
      console.error('MedLedger: failed to load from Supabase', e);
    }
    setLoading(false);
  };

  // ── Theme effects ──
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
    const isDark = settings.darkMode;
    const shadow = isDark
      ? `0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(${r},${g},${b},0.22), inset 0 1px 0 rgba(255,255,255,0.12)`
      : `0 1px 2px rgba(20,24,28,0.08), 0 6px 16px rgba(${r},${g},${b},0.24), inset 0 1px 0 rgba(255,255,255,0.35)`;
    document.documentElement.style.setProperty('--shadow-button', shadow);
  }, [settings.accentColor, settings.darkMode]);

  useEffect(() => {
    if (medications.length === 0) return;
    scheduleTodayReminders(medications);
    saveScheduleToCache(medications);
    registerPeriodicSync();
  }, [medications]);

  // ── CRUD operations (Supabase + optimistic local state) ──

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('medications')
      .insert(medToDb(med, session.user.id))
      .select()
      .single();
    if (!error && data) setMedications(prev => [...prev, dbToMed(data)]);
  };

  const removeMedication = async (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    if (session) await supabase.from('medications').delete().eq('id', id);
  };

  const addLog = async (log: Omit<MedLog, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('medication_logs')
      .insert(logToDb(log, session.user.id))
      .select()
      .single();
    if (!error && data) setLogs(prev => [dbToLog(data), ...prev]);
  };

  const updateLog = async (id: string, log: Partial<Omit<MedLog, 'id'>>) => {
    const updates: any = {};
    if (log.timestamp) updates.timestamp = log.timestamp.toISOString();
    if (log.medicationId) updates.medication_id = log.medicationId;
    if (log.status) updates.status = log.status;
    if (log.questions) updates.questions = log.questions;
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...log } : l));
    if (session) await supabase.from('medication_logs').update(updates).eq('id', id);
  };

  const deleteLog = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    if (session) await supabase.from('medication_logs').delete().eq('id', id);
  };

  const addCheckin = async (entry: Omit<CheckinEntry, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('checkins')
      .insert({ profile_id: session.user.id, date: entry.date.toISOString(), ratings: entry.ratings })
      .select()
      .single();
    if (!error && data) setCheckins(prev => [dbToCheckin(data), ...prev]);
  };

  const addPRNDose = async (dose: Omit<PRNDose, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('prn_doses')
      .insert(prnToDb(dose, session.user.id))
      .select()
      .single();
    if (!error && data) setPrnDoses(prev => [dbToPrn(data), ...prev]);
  };

  const updateSettings = async (s: Partial<AppSettings>) => {
    // Update local state immediately for snappy UI
    setSettings(prev => ({ ...prev, ...s }));
    // Debounce Supabase write by 500ms to avoid rapid-fire updates
    if (settingsSaveTimeout.current) clearTimeout(settingsSaveTimeout.current);
    settingsSaveTimeout.current = setTimeout(async () => {
      if (!session) return;
      await supabase.from('settings').upsert(settingsToDb({ ...settings, ...s }, session.user.id));
    }, 500);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMedications([]);
    setLogs([]);
    setCheckins([]);
    setPrnDoses([]);
    setSettings(defaultSettings);
  };

  return (
    <AppContext.Provider value={{ session, loading, medications, logs, checkins, prnDoses, settings, addMedication, removeMedication, addLog, updateLog, deleteLog, addCheckin, addPRNDose, updateSettings, setMedications, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
