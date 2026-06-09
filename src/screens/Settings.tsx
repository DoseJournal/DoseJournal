import { GripVertical, X, Plus, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, Toggle, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const [newQ, setNewQ] = useState('');
  const [addingQ, setAddingQ] = useState(false);

  const removeQuestion = (q: string) => {
    updateSettings({ customQuestions: settings.customQuestions.filter(x => x !== q) });
  };

  const addQuestion = () => {
    if (newQ.trim()) {
      updateSettings({ customQuestions: [...settings.customQuestions, newQ.trim()] });
      setNewQ('');
      setAddingQ(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 24px' }}>Settings</h1>

        {/* Tracking preferences */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>TRACKING PREFERENCES</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            {[
              { label: 'Evening check-in questions', sub: 'Rate focus, anxiety & more at 10 PM', key: 'eveningCheckinEnabled' },
              { label: 'Require photo when logging', sub: 'Must photograph medication to log', key: 'requirePhotoWhenLogging' },
              { label: 'Logging questions', sub: 'Ask yes/no questions when logging', key: 'loggingQuestionsEnabled' },
            ].map((item, i) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>{item.sub}</p>
                </div>
                <Toggle
                  checked={(settings as any)[item.key]}
                  onChange={v => updateSettings({ [item.key]: v })}
                />
              </div>
            ))}
          </Card>
        </div>

        {/* Custom questions */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>CUSTOM QUESTIONS</SectionLabel>
          <Card style={{ overflow: 'hidden', marginBottom: 8 }}>
            {settings.customQuestions.map((q, i) => (
              <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <GripVertical size={16} color="var(--color-muted-foreground)" />
                <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', flex: 1 }}>{q}</span>
                <button onClick={() => removeQuestion(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  <X size={14} color="var(--color-muted-foreground)" />
                </button>
              </div>
            ))}
            {addingQ && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
                <input
                  autoFocus
                  value={newQ}
                  onChange={e => setNewQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addQuestion()}
                  placeholder="Enter question..."
                  style={{ flex: 1, height: 36, borderRadius: 999, border: '1px solid var(--color-border)', background: 'var(--color-muted)', padding: '0 12px', fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', outline: 'none' }}
                />
                <button onClick={addQuestion} style={{ height: 36, paddingInline: 16, borderRadius: 999, background: 'var(--color-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-primary-foreground)', fontWeight: 600 }}>Add</button>
              </div>
            )}
          </Card>
          <button onClick={() => setAddingQ(true)} style={{
            width: '100%', height: 40, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <Plus size={16} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>Add Custom Question</span>
          </button>
        </div>

        {/* Reminders */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>REMINDERS</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Evening check-in time</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Daily reminder to complete ratings</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--color-primary)" />
                <span style={{ fontSize: 13, fontFamily: 'Geist Mono, monospace', color: 'var(--color-primary)', fontWeight: 600 }}>{settings.eveningCheckinTime}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Medication reminders</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Get notified before each dose</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Appearance link */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>APPEARANCE</SectionLabel>
          <Card>
            <button onClick={() => navigate('/settings/appearance')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>Theme & Colors</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>→</span>
            </button>
          </Card>
        </div>

        {/* Disclaimer link */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>ABOUT</SectionLabel>
          <Card>
            <button onClick={() => navigate('/disclaimer')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>View Disclaimer</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>→</span>
            </button>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
