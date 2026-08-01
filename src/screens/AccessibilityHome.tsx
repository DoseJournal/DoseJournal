import { useNavigate } from 'react-router-dom';
import { Settings, Check, Clock } from 'lucide-react';
import { StatusBar } from '../components';
import { useApp } from '../context/AppContext';
import { matchSlotsForDay } from '../utils/schedule';

function getSlotStatus(time: string, taken: boolean): 'taken' | 'due' | 'upcoming' {
  if (taken) return 'taken';
  if (!time) return 'upcoming';
  const now = new Date();
  const [rawTime, period] = time.split(' ');
  const [h, m] = rawTime.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;

  const scheduled = new Date();
  scheduled.setHours(hours, m, 0, 0);
  const diffMins = (scheduled.getTime() - now.getTime()) / 60000;
  if (diffMins < 60 && diffMins > -30) return 'due';
  return 'upcoming';
}

export default function AccessibilityHomeScreen() {
  const navigate = useNavigate();
  const { medications, logs } = useApp();
  const regularMeds = medications.filter(m => !m.asNeeded);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const statusStyle = {
    taken: { bg: '#DFE6E1', color: '#004D1A', label: 'Taken ✓' },
    due: { bg: '#FFF3E0', color: '#804200', label: 'Due now' },
    upcoming: { bg: 'var(--color-secondary)', color: 'var(--color-muted-foreground)', label: 'Upcoming' },
  };

  // Build one row per scheduled time slot per medication (handles twice/three-times daily correctly)
  const todaysRows = regularMeds.flatMap(med => {
    const todaysLogsForMed = logs.filter(l => {
      const ld = new Date(l.timestamp);
      return l.medicationId === med.id &&
        ld.getDate() === now.getDate() && ld.getMonth() === now.getMonth() && ld.getFullYear() === now.getFullYear() &&
        l.status === 'taken';
    });
    const slots = matchSlotsForDay(med.times, todaysLogsForMed);
    return slots.map(slot => ({
      key: `${med.id}-${slot.time}`,
      med,
      time: slot.time,
      status: getSlotStatus(slot.time, slot.taken),
    }));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />

      {/* Main content */}
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>

        {/* Greeting */}
        <p style={{ fontSize: 18, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-muted-foreground)', margin: '0 0 4px' }}>{greeting}</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 32px', letterSpacing: '-0.5px' }}>
          Today's Medications
        </h1>

        {todaysRows.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 20, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              No medications added yet.{'\n'}Go to Settings to add yours.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {todaysRows.map(row => {
              const style = statusStyle[row.status];
              return (
                <div key={row.key} style={{
                  background: 'var(--color-card)',
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '22px 24px',
                }}>
                  {/* Med name */}
                  <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 6px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                    {row.med.name}
                  </p>

                  {/* Dose */}
                  <p style={{ fontSize: 22, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary)', margin: '0 0 16px' }}>
                    {row.med.dose}{row.med.unit}{row.med.tabletCount && row.med.tabletCount !== '1' ? ` · ${row.med.tabletCount} tablets` : ''}
                  </p>

                  {/* Time + status row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {row.time ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={20} color="var(--color-muted-foreground)" />
                        <span style={{ fontSize: 20, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-foreground)' }}>
                          {row.time}
                        </span>
                      </div>
                    ) : <div />}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: style.bg, borderRadius: 999, padding: '8px 16px' }}>
                      {row.status === 'taken' && <Check size={18} color={style.color} strokeWidth={3} />}
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: style.color }}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* As-required meds */}
        {medications.filter(m => m.asNeeded).length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 16px' }}>As Required</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {medications.filter(m => m.asNeeded).map(med => (
                <div key={med.id} style={{ background: 'var(--color-card)', borderRadius: 20, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>{med.name}</p>
                    <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary)', margin: 0 }}>{med.dose}{med.unit} per tablet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — Settings only */}
      <div style={{ padding: '12px 24px 28px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', height: 58, borderRadius: 999,
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            cursor: 'pointer',
          }}
        >
          <Settings size={20} color="var(--color-muted-foreground)" />
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>Settings</span>
        </button>
      </div>
    </div>
  );
}
