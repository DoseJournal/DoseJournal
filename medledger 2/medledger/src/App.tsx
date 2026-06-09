import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import HomeScreen from './screens/Home';
import ReminderScreen from './screens/Reminder';
import LogScreen from './screens/Log';
import LogSuccessScreen from './screens/LogSuccess';
import HistoryScreen from './screens/History';
import AddMedicationScreen from './screens/AddMedication';
import InsightsScreen from './screens/Insights';
import InsightsChartScreen from './screens/InsightsChart';
import CalendarScreen from './screens/Calendar';
import SettingsScreen from './screens/Settings';
import AppearanceScreen from './screens/Appearance';
import DisclaimerScreen from './screens/Disclaimer';
import OnboardingScreen from './screens/Onboarding';

function AppRoutes() {
  const { settings } = useApp();

  if (!settings.onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingScreen />} />
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
