import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useEffect } from 'react';
import HomeScreen from './screens/Home';
import ReminderScreen from './screens/Reminder';
import LogScreen from './screens/Log';
import LogSuccessScreen from './screens/LogSuccess';
import HistoryScreen from './screens/History';
import AddMedicationScreen from './screens/AddMedication';
import EditMedicationScreen from './screens/EditMedication';
import EditLogScreen from './screens/EditLog';
import PRNHistoryScreen from './screens/PRNHistory';
import InsightsScreen from './screens/Insights';
import InsightsChartScreen from './screens/InsightsChart';
import CalendarScreen from './screens/Calendar';
import SettingsScreen from './screens/Settings';
import AppearanceScreen from './screens/Appearance';
import DisclaimerScreen from './screens/Disclaimer';
import OnboardingScreen from './screens/Onboarding';
import AccessibilityHomeScreen from './screens/AccessibilityHome';
import AuthScreen from './screens/Auth';

function AppRoutes() {
  const { settings, session, loading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (settings.accessibilityMode && location.pathname !== '/settings' && location.pathname !== '/settings/appearance' && location.pathname !== '/disclaimer') {
      navigate('/', { replace: true });
    }
  }, [settings.accessibilityMode]);

  // Not logged in — show auth screen
  if (!session) return <AuthScreen />;

  // Loading data from Supabase
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-button)' }}>
          <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary-foreground)' }}>M</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Loading your medications...</p>
      </div>
    );
  }

  if (!settings.onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingScreen />} />
      </Routes>
    );
  }

  if (settings.accessibilityMode) {
    return (
      <Routes>
        <Route path="/" element={<AccessibilityHomeScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/settings/appearance" element={<AppearanceScreen />} />
        <Route path="/disclaimer" element={<DisclaimerScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/reminder" element={<ReminderScreen />} />
      <Route path="/log" element={<LogScreen />} />
      <Route path="/log/success" element={<LogSuccessScreen />} />
      <Route path="/history" element={<HistoryScreen />} />
      <Route path="/add" element={<AddMedicationScreen />} />
      <Route path="/edit/:id" element={<EditMedicationScreen />} />
      <Route path="/edit-log" element={<EditLogScreen />} />
      <Route path="/prn-history/:id" element={<PRNHistoryScreen />} />
      <Route path="/insights" element={<InsightsScreen />} />
      <Route path="/insights/chart" element={<InsightsChartScreen />} />
      <Route path="/calendar" element={<CalendarScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/settings/appearance" element={<AppearanceScreen />} />
      <Route path="/disclaimer" element={<DisclaimerScreen />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
