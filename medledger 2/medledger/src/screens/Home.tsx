import { Plus, Flame, Clock3, Check, X, AlertCircle, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';

function StatusPill({ status }: { status: 'taken' | 'pending' | 'missed' | 'upcoming' }) {
  const cfg = {
    taken: { bg: '#DFE6E1', color: '#004D1A', label: 'Taken', Icon: Check },
    pending: { bg: '#E9E3D8', color: '#804200', label: 'Pending', Icon: Clock3 },
    missed: { bg: '#E5DCDA', color: '#8C1C00', label: 'Missed', Icon: X },
    upcoming: { bg: '#DFDFE6', color: '#000066', label: 'Upcoming', Icon: AlertCircle },
  };
  const { bg, color, label, Icon } = cfg[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>
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

export default function HomeScreen() {
  const navigate = useNavigate();
  const { settings, medications, logs } = useApp();

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
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px' }}>
              {greeting}{settings.userName ? `, ${settings.userName}` : ''} 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', margin: 0, fontFamily: 'Geist, sans-serif' }}>{dateStr}</p>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', borderRadius: 999, padding: '6px 12px' }}>
              <Flame size={14} color="var(--color-primary-foreground)" />
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Geist Mono, monospace', color: 'var(--color-primary-foreground)' }}>{streak} days</span>
            </div>
          )}
        </div>

        {/* Schedule */}
        {medications.length === 0 ? (
          <Card style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 12px' }}>No medications added yet.</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Go to Settings → Medications to add yours.</p>
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>Today's Schedule</h2>
              <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>{medications.length} medication{medications.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {medications.map(med => {
                const time = med.times[0] ?? '';
                const status = getMedStatus(time, logs, med.id);
                return (
                  <Card key={med.id} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px' }}>{med.name} {med.dose}{med.unit}</p>
                      <p style={{ fontSize: 14, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)', margin: 0 }}>{time}</p>
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
            onClick={() => navigate('/history')}
            style={{ width: '100%', marginTop: 12, height: 44, borderRadius: 999, background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'Geist, sans-serif', fontSize: 14, color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
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
