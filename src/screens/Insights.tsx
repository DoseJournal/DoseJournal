import { Moon, Bell } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';
import { getNotificationPermission, enableNotifications, scheduleTodayReminders, saveScheduleToCache, registerPeriodicSync } from '../utils/notifications';

const defaultQuestions = [
  { q: 'How focused did you feel today?', default: 5 },
  { q: 'How anxious did you feel today?', default: 5 },
  { q: 'Any stomach upset today?', default: 3 },
  { q: 'How well did you sleep last night?', default: 7 },
];

export default function InsightsScreen() {
  const navigate = useNavigate();
  const { addCheckin, settings, checkins, medications } = useApp();
  const [permState, setPermState] = useState(getNotificationPermission());

  const [enableMsg, setEnableMsg] = useState('');

  const handleEnableReminder = async () => {
    const result = await enableNotifications();
    setPermState(result.success ? 'granted' : 'denied');
    setEnableMsg(result.message);
    if (result.success && medications.length > 0) {
      scheduleTodayReminders(medications);
      saveScheduleToCache(medications);
      registerPeriodicSync();
    }
  };

  // Use checkinQuestions from settings, falling back to defaults if empty
  const allQuestions = (settings.checkinQuestions ?? []).length > 0
    ? (settings.checkinQuestions ?? [])
    : defaultQuestions.map(q => q.q);

  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(allQuestions.map((q, i) => [q, defaultQuestions[i]?.default ?? 5]))
  );

  // Check if already checked in today
  const today = new Date();
  const alreadyCheckedIn = checkins.some(c => {
    const d = new Date(c.date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const handleSubmit = () => {
    addCheckin({
      date: new Date(),
      ratings: Object.entries(ratings).map(([question, value]) => ({ question, value })),
    });
    navigate('/insights/chart');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Reminder banner */}
        {permState !== 'granted' && permState !== 'unsupported' && (
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={16} color="var(--color-primary)" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Enable reminders</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Get notified when your medication is due</p>
              </div>
            </div>
            <button onClick={handleEnableReminder} style={{ background: permState === 'denied' ? 'var(--color-secondary)' : 'var(--color-primary)', border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: permState === 'denied' ? 'var(--color-muted-foreground)' : 'var(--color-primary-foreground)', flexShrink: 0 }}>
              {permState === 'denied' ? 'Blocked' : 'Enable'}
            </button>
          </div>
        )}
        {permState === 'granted' && (
          <div style={{ background: '#DFE6E1', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bell size={16} color="#004D1A" />
            <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#004D1A', margin: 0 }}>{enableMsg || 'Medication reminders are enabled ✓'}</p>
          </div>
        )}
        {permState === 'denied' && enableMsg && (
          <div style={{ background: 'var(--color-error)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-error-foreground)', margin: 0 }}>{enableMsg}</p>
          </div>
        )}

        {/* Already checked in today */}
        {alreadyCheckedIn && (
          <div style={{ background: '#DFE6E1', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#004D1A', margin: '0 0 2px' }}>Already checked in today</p>
              <p style={{ fontSize: 12, color: '#004D1A', fontFamily: 'Inter, sans-serif', margin: 0, opacity: 0.8 }}>You can submit again to update your ratings.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, textAlign: 'center' }}>
          <Moon size={32} color="var(--color-primary)" style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>Evening Check-in</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', margin: 0, fontFamily: 'Inter, sans-serif' }}>How was your day? Rate each area from 1-10.</p>
        </div>

        {/* Sliders */}
        <style>{`
          .med-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 36px;
            background: transparent;
            cursor: pointer;
            outline: none;
            margin: 0;
          }
          .med-slider::-webkit-slider-runnable-track {
            height: 10px;
            border-radius: 999px;
            background: var(--color-secondary);
          }
          .med-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 2px;
            height: 10px;
            border-radius: 0;
            background: transparent;
            margin-top: 0px;
            cursor: pointer;
          }
          .med-slider::-moz-range-track {
            height: 10px;
            border-radius: 999px;
            background: var(--color-secondary);
          }
          .med-slider::-moz-range-thumb {
            width: 2px;
            height: 10px;
            border-radius: 0;
            background: transparent;
            border: none;
            cursor: pointer;
          }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {allQuestions.map(q => {
            const val = ratings[q] ?? 5;
            const pct = (val - 1) / 9 * 100;
            return (
              <Card key={q} style={{ padding: '16px 16px 12px' }}>
                {/* Question + number input */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', flex: 1, paddingRight: 12, lineHeight: 1.4 }}>{q}</span>
                  <input
                    type="number" min={1} max={10} value={val}
                    onChange={e => {
                      const n = Math.min(10, Math.max(1, Number(e.target.value)));
                      if (!isNaN(n)) setRatings(prev => ({ ...prev, [q]: n }));
                    }}
                    style={{ width: 52, height: 38, borderRadius: 10, background: 'var(--color-primary)', border: 'none', textAlign: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary-foreground)', outline: 'none', flexShrink: 0 }}
                  />
                </div>

                {/* Visible slider with gradient fill */}
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: 0, right: 0,
                    transform: 'translateY(-50%)',
                    height: 10, borderRadius: 999, overflow: 'hidden',
                    background: 'var(--color-secondary)', pointerEvents: 'none',
                  }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.1s' }} />
                  </div>
                  <input
                    className="med-slider"
                    type="range" min={1} max={10} value={val}
                    onChange={e => setRatings(prev => ({ ...prev, [q]: Number(e.target.value) }))}
                  />
                </div>

                {/* Scale labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>1 — Low</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>5</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>10 — High</span>
                </div>
              </Card>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OrangeButton onClick={handleSubmit}>Submit Check-in</OrangeButton>
          <button onClick={() => navigate('/insights/chart')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', padding: '8px 0' }}>
            View Insights →
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
