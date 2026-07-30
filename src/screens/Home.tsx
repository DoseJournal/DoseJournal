import { Plus, Flame, Clock3, Check, X, AlertCircle, History, Pill, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';
import { convertUnit } from '../utils/units';

function StatusPill({ status }: { status: 'taken' | 'pending' | 'missed' | 'upcoming' }) {
  const cfg = {
    taken: { bg: '#DFE6E1', color: '#004D1A', label: 'Taken', Icon: Check },
    pending: { bg: '#E9E3D8', color: '#804200', label: 'Pending', Icon: Clock3 },
    missed: { bg: '#E5DCDA', color: '#8C1C00', label: 'Missed', Icon: X },
    upcoming: { bg: '#DFDFE6', color: '#000066', label: 'Upcoming', Icon: AlertCircle },
  };
  const { bg, color, label, Icon } = cfg[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function getMedStatus(time: string, logs: any[], medId: string): 'taken' | 'pending' | 'missed' | 'upcoming' {
  const now = new Date();
  const todayLogs = logs.filter(l => {
    const d = new Date(l.timestamp);
    return l.medicationId === medId &&
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      l.status === 'taken';
  });
  if (todayLogs.length > 0) return 'taken';

  // Parse time string e.g. "8:00 AM"
  const [timePart, ampm] = time.split(' ');
  const [hStr, mStr] = timePart.split(':');
  let hour = parseInt(hStr);
  const min = parseInt(mStr);
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const medTime = new Date();
  medTime.setHours(hour, min, 0, 0);

  const diffMins = (medTime.getTime() - now.getTime()) / 60000;
  if (diffMins > 30) return 'upcoming';
  if (diffMins > -60) return 'pending';
  return 'missed';
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CountdownCard({ med, nextDoseTime, maxReached }: { med: { id: string; name: string; dose: string; unit: string; minIntervalHours?: number; maxDailyDose?: number; maxDailyDoseUnit?: string }; nextDoseTime: Date; maxReached?: boolean }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = nextDoseTime.getTime() - now.getTime();
  const ready = remainingMs <= 0;
  const intervalHours = med.minIntervalHours ?? 0;
  const totalMs = intervalHours * 60 * 60 * 1000;
  const elapsedPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 100;

  return (
    <Card style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: ready ? '#DFE6E1' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pill size={16} color={ready ? '#004D1A' : 'var(--color-primary)'} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{med.name} {med.dose}{med.unit}</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>As Required{intervalHours ? ` · every ${intervalHours}h` : ''}</p>
          </div>
        </div>
      </div>

      {ready ? (
        maxReached ? (
          <div style={{ background: '#FFF3E0', border: '1px solid #FFD4A8', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#804200" />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#804200' }}>Daily limit reached — do not take more</span>
          </div>
        ) : (
          <div style={{ background: '#DFE6E1', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="#004D1A" />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#004D1A' }}>Safe to take next dose</span>
          </div>
        )
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-primary)' }}>{formatCountdown(remainingMs)}</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>until next dose</span>
          </div>
          <div style={{ height: 6, background: 'var(--color-secondary)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${elapsedPct}%`, background: 'var(--color-primary)', borderRadius: 999, transition: 'width 1s linear' }} />
          </div>
        </>
      )}
      <button onClick={() => navigate(`/prn-history/${med.id}`)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
        View dose history
      </button>
    </Card>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { settings, medications, logs, prnDoses } = useApp();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

  // Calculate streak
  const streak = (() => {
    if (logs.length === 0) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLogs = logs.filter(l => {
        const ld = new Date(l.timestamp);
        return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear() && l.status === 'taken';
      });
      if (dayLogs.length > 0) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>

        {/* Greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px' }}>
              {greeting}{settings.userName ? `, ${settings.userName}` : ''} 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', margin: 0, fontFamily: 'Inter, sans-serif' }}>{dateStr}</p>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', borderRadius: 999, padding: '6px 12px' }}>
              <Flame size={14} color="var(--color-primary-foreground)" />
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-primary-foreground)' }}>{streak} days</span>
            </div>
          )}
        </div>

        {/* As-needed medication countdowns */}
        {medications.filter(m => m.asNeeded).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>As Required</h2>
            </div>
            {medications.filter(m => m.asNeeded).map(med => {
              const doses = prnDoses.filter(d => d.medicationId === med.id);
              const lastDose = doses.length > 0
                ? doses.reduce((latest, d) => new Date(d.timestamp) > new Date(latest.timestamp) ? d : latest)
                : null;

              // Total dose taken in the last 24 hours, in the medication's unit
              const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const dosesLast24h = doses.filter(d => new Date(d.timestamp) >= last24h);
              const dosePerLog = parseFloat(med.dose) || 0;
              const totalDoseLast24hRaw = dosesLast24h.reduce((sum, d) => sum + dosePerLog * (d.tabletsCount ?? 1), 0);
              const maxUnit = med.maxDailyDoseUnit ?? med.unit;
              const totalDoseLast24hConverted = convertUnit(totalDoseLast24hRaw, med.unit, maxUnit);
              const maxReached = med.maxDailyDose !== undefined && totalDoseLast24hConverted !== null && totalDoseLast24hConverted >= med.maxDailyDose;

              if (!lastDose) {
                return (
                  <Card key={med.id} style={{ padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pill size={16} color="var(--color-primary)" />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{med.name} {med.dose}{med.unit}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Not taken yet</p>
                      </div>
                    </div>
                  </Card>
                );
              }

              const nextDoseTime = new Date(new Date(lastDose.timestamp).getTime() + (med.minIntervalHours ?? 0) * 60 * 60 * 1000);
              return (
                <div key={med.id}>
                  {maxReached && (
                    <div style={{ background: '#FFF3E0', border: '1px solid #FFD4A8', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <AlertTriangle size={16} color="#804200" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#804200', margin: '0 0 2px' }}>Daily limit reached</p>
                        <p style={{ fontSize: 12, color: '#804200', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
                          You've taken {totalDoseLast24hConverted?.toFixed(2).replace(/\.?0+$/, '')}{med.maxDailyDoseUnit ?? med.unit} of {med.maxDailyDose}{med.maxDailyDoseUnit ?? med.unit} max for {med.name} in the last 24 hours. Contact a pharmacist or doctor before taking more.
                        </p>
                      </div>
                    </div>
                  )}
                  <CountdownCard med={med} nextDoseTime={nextDoseTime} maxReached={maxReached} />
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule */}
        {medications.filter(m => !m.asNeeded).length === 0 ? (
          medications.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 12px' }}>No medications added yet.</p>
              <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Go to Settings → Medications to add yours.</p>
            </Card>
          )
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>Today's Schedule</h2>
              <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>{medications.filter(m => !m.asNeeded).length} medication{medications.filter(m => !m.asNeeded).length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {medications.filter(m => !m.asNeeded).map(med => {
                const time = med.times[0] ?? '';
                const status = getMedStatus(time, logs, med.id);
                return (
                  <Card key={med.id} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px' }}>{med.name} {med.dose}{med.unit}</p>
                      <p style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-muted-foreground)', margin: 0 }}>{time}</p>
                    </div>
                    <StatusPill status={status} />
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <OrangeButton onClick={() => navigate('/log')}>
          <Plus size={18} />
          Log Medication
        </OrangeButton>

        {logs.length > 0 && (
          <button
            onClick={() => navigate('/calendar')}
            style={{ width: '100%', marginTop: 12, height: 44, borderRadius: 999, background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <History size={15} />
            View History & Photos
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
