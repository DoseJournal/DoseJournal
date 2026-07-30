import { GripVertical, X, Plus, Clock, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, Toggle, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

function QuestionList({
  questions,
  onRemove,
  onAdd,
  placeholder,
}: {
  questions: string[];
  onRemove: (q: string) => void;
  onAdd: (q: string) => void;
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState('');

  const handleAdd = () => {
    if (newQ.trim()) { onAdd(newQ.trim()); setNewQ(''); setAdding(false); }
  };

  return (
    <>
      <Card style={{ overflow: 'hidden', marginBottom: 8 }}>
        {questions.length === 0 && !adding && (
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>No questions yet.</p>
          </div>
        )}
        {questions.map((q, i) => (
          <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
            <GripVertical size={16} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', flex: 1 }}>{q}</span>
            <button onClick={() => onRemove(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={14} color="var(--color-muted-foreground)" />
            </button>
          </div>
        ))}
        {adding && (
          <div style={{ padding: '12px 16px', borderTop: questions.length > 0 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: 8 }}>
            <input
              autoFocus value={newQ} onChange={e => setNewQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={placeholder}
              style={{ flex: 1, height: 36, borderRadius: 999, border: '1px solid var(--color-border)', background: 'var(--color-muted)', padding: '0 12px', fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', outline: 'none' }}
            />
            <button onClick={handleAdd} style={{ height: 36, paddingInline: 16, borderRadius: 999, background: 'var(--color-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary-foreground)', fontWeight: 600 }}>Add</button>
          </div>
        )}
      </Card>
      <button onClick={() => setAdding(true)} style={{ width: '100%', height: 40, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}>
        <Plus size={16} color="var(--color-muted-foreground)" />
        <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>Add Question</span>
      </button>
    </>
  );
}

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings, medications, removeMedication, signOut } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 24px' }}>Settings</h1>

        {/* Accessibility Mode */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>ACCESSIBILITY</SectionLabel>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 3px' }}>Accessibility Mode</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
                  Simplified view — large text showing medications, dose, time, and taken status only. Turn off here to return to the full app.
                </p>
              </div>
              <Toggle checked={settings.accessibilityMode} onChange={v => { updateSettings({ accessibilityMode: v }); if (v) navigate('/'); }} />
            </div>
          </Card>
        </div>

        {/* Medications */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>MEDICATIONS</SectionLabel>
          <Card style={{ overflow: 'hidden', marginBottom: 8 }}>
            {medications.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>No medications added yet.</p>
              </div>
            ) : (
              medications.map((med, i) => (
                <div key={med.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{med.name} {med.dose}{med.unit}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>{med.asNeeded ? `As Required${med.minIntervalHours ? ` · every ${med.minIntervalHours}h` : ''}` : `${med.frequency} · ${med.times[0]}`}{med.tabletCount ? ` · ${med.tabletCount} tablet${med.tabletCount === '1' ? '' : 's'}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/edit/${med.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                      <Pencil size={15} color="var(--color-muted-foreground)" />
                    </button>
                    {med.asNeeded && (
                      <button onClick={() => navigate(`/prn-history/${med.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                        <Clock size={15} color="var(--color-muted-foreground)" />
                      </button>
                    )}
                    <button onClick={() => removeMedication(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                      <Trash2 size={15} color="var(--color-muted-foreground)" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/add')} style={{ width: '100%', height: 40, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
              <Plus size={16} color="var(--color-muted-foreground)" />
              <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>Add Regular Medication</span>
            </button>
            <button onClick={() => navigate('/add?asNeeded=1')} style={{ width: '100%', height: 40, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
              <Plus size={16} color="var(--color-muted-foreground)" />
              <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>Add As Required Medication</span>
            </button>
          </div>
        </div>

        {/* Logging questions (yes/no when dose logged) */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>LOGGING QUESTIONS</SectionLabel>
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 10px', lineHeight: 1.5 }}>
            Yes/no questions shown every time a dose is logged (e.g. "Did you take this with food?")
          </p>
          <div style={{ marginBottom: 10 }}>
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Show logging questions</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Ask questions each time a dose is logged</p>
                </div>
                <Toggle checked={settings.loggingQuestionsEnabled} onChange={v => updateSettings({ loggingQuestionsEnabled: v })} />
              </div>
            </Card>
          </div>
          <QuestionList
            questions={settings.loggingQuestions ?? []}
            onRemove={q => updateSettings({ loggingQuestions: (settings.loggingQuestions ?? []).filter(x => x !== q) })}
            onAdd={q => updateSettings({ loggingQuestions: [...(settings.loggingQuestions ?? []), q] })}
            placeholder="e.g. Did you take this with food?"
          />
        </div>

        {/* Check-in questions (rated 1-10 in evening) */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>DAILY CHECK-IN QUESTIONS</SectionLabel>
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 10px', lineHeight: 1.5 }}>
            Rated 1–10 in your evening check-in (e.g. "How anxious did you feel today?")
          </p>
          <div style={{ marginBottom: 10 }}>
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Evening check-in</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Show daily reflection questions</p>
                </div>
                <Toggle checked={settings.eveningCheckinEnabled} onChange={v => updateSettings({ eveningCheckinEnabled: v })} />
              </div>
            </Card>
          </div>
          <QuestionList
            questions={settings.checkinQuestions ?? []}
            onRemove={q => updateSettings({ checkinQuestions: (settings.checkinQuestions ?? []).filter(x => x !== q) })}
            onAdd={q => updateSettings({ checkinQuestions: [...(settings.checkinQuestions ?? []), q] })}
            placeholder="e.g. How did you feel today?"
          />
        </div>

        {/* Tracking preferences */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>OTHER PREFERENCES</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Require photo when logging</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Must photograph medication to log</p>
              </div>
              <Toggle checked={settings.requirePhotoWhenLogging} onChange={v => updateSettings({ requirePhotoWhenLogging: v })} />
            </div>
          </Card>
        </div>

        {/* Reminders */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>REMINDERS</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Evening check-in time</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Daily reminder to complete ratings</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--color-primary)" />
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-primary)', fontWeight: 600 }}>{settings.eveningCheckinTime}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Medication reminders</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Get notified when each dose is due</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Appearance */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>APPEARANCE</SectionLabel>
          <Card>
            <button onClick={() => navigate('/settings/appearance')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>Theme & Colors</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>→</span>
            </button>
          </Card>
        </div>

        {/* About */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>ABOUT</SectionLabel>
          <Card>
            <button onClick={() => navigate('/disclaimer')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>View Disclaimer</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>→</span>
            </button>
          </Card>
        </div>

        {/* Account */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>ACCOUNT</SectionLabel>
          <Card>
            <button onClick={async () => { await signOut(); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-destructive)' }}>Sign out</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>→</span>
            </button>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
