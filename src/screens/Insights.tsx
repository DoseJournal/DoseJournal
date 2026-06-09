import { Moon, CirclePlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';

const questions = [
  { q: 'How focused did you feel today?', default: 7 },
  { q: 'How anxious did you feel today?', default: 4 },
  { q: 'Any stomach upset today?', default: 2 },
  { q: 'How well did you sleep last night?', default: 8 },
];

export default function InsightsScreen() {
  const navigate = useNavigate();
  const { addCheckin } = useApp();
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(questions.map(q => [q.q, q.default]))
  );

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

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, textAlign: 'center' }}>
          <Moon size={32} color="var(--color-primary)" style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>Evening Check-in</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', margin: 0, fontFamily: 'Geist, sans-serif' }}>How was your day? Rate each area from 1-10.</p>
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {questions.map(({ q }) => {
            const val = ratings[q] ?? 5;
            return (
              <Card key={q} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', flex: 1, paddingRight: 12 }}>{q}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-primary)', minWidth: 32, textAlign: 'right' }}>{val}/10</span>
                </div>
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <div style={{ height: 8, background: 'var(--color-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val * 10}%`, background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.15s' }} />
                  </div>
                  <input
                    type="range" min={1} max={10} value={val}
                    onChange={e => setRatings(prev => ({ ...prev, [q]: Number(e.target.value) }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: 8 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {['1', '5', '10'].map(l => (
                    <span key={l} style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>{l}</span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add custom */}
        <button
          onClick={() => navigate('/settings')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginBottom: 20 }}
        >
          <CirclePlus size={16} color="var(--color-muted-foreground)" />
          <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>Add custom question</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OrangeButton onClick={handleSubmit}>Submit Check-in</OrangeButton>
          <button onClick={() => navigate('/insights/chart')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', padding: '8px 0' }}>
            View Insights →
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
