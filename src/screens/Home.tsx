import { Plus, Flame, Clock3, Check, X, AlertCircle, History, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';
import { convertUnit } from '../utils/units';
import { matchSlotsForDay } from '../utils/schedule';

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

function getSlotStatus(time: string, taken: boolean): 'taken' | 'pending' | 'missed' | 'upcoming' {
  if (taken) return 'taken';

  const now = new Date();
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

function formatCountdown(hours: number) {
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function PRNCountdownCard({ med, prnDoses }: { med: any; prnDoses: any[] }) {
  const now = new Date();
  const medDoses = prnDoses
    .filter(d => d.medicationId === med.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const lastDose = medDoses[0];
  if (!lastDose) return null;

  const lastDoseTime = new Date(lastDose.timestamp);
  const elapsedHours = (now.getTime() - lastDoseTime.getTime()) / (1000 * 60 * 60);
  const intervalHours = med.minIntervalHours ?? 0;
  const hoursRemaining = Math.max(0, intervalHours - elapsedHours);
  const canTakeNow = hoursRemaining <= 0;

  const nextDoseTime = new Date(lastDoseTime.getTime() + intervalHours * 60 * 60 * 1000);
  const nextDoseTimeStr = nextDoseTime.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  const lastDoseTimeStr = lastDoseTime.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });

  const todayDoses = medDoses.filter(d => {
    const dd = new Date(d.timestamp);
    return dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
  });
  const perTablet = parseFloat(med.dose) || 0;
  const todayTotalRaw = todayDoses.reduce((sum, d) => sum + perTablet * (d.tabletsCount ?? 1), 0);
  const maxUnit = med.maxDailyDoseUnit ?? med.unit;
  const todayTotalConverted = convertUnit(todayTotalRaw, med.unit, maxUnit) ?? todayTotalRaw;
  const maxDailyDose = med.maxDailyDose;
  const pctOfMax = maxDailyDose ? Math.min(100, (todayTotalConverted / maxDailyDose) * 100) : 0;
  const barColor = pctOfMax >= 100 ? '#8C1C00' : pctOfMax >= 75 ? '#804200' : 'var(--color-primary)';

  return (
    <Card style={{ padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>
            {med.name} {med.dose}{med.unit}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>
            Last taken {lastDoseTimeStr}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: canTakeNow ? '#DFE6E1' : '#E9E3D8',
          color: canTakeNow ? '#004D1A' : '#804200',
          borderRadius: 999, padding: '5px 12px', flexShrink: 0,
        }}>
          <Timer size={13} />
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {canTakeNow ? 'Ready now' : formatCountdown(hoursRemaining)}
          </span>
        </div>
      </div>

      {!canTakeNow && (
        <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 12px' }}>
          Next dose available at <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{nextDoseTimeStr}</span>
        </p>
      )}

      {maxDailyDose && (
        <div style={{ marginTop: canTakeNow ? 4 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontFamily: 'Geist, sans-serif', color: 'var(--color-muted-foreground)' }}>Daily dose used</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>
              {todayTotalConverted.toFixed(0)}{maxUnit} / {maxDailyDose}{maxUnit}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--color-secondary)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctOfMax}%`, background: barColor, borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
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

  const scheduledMeds = medications.filter(m => !m.asNeeded);
  const asNeededMeds = medications.filter(m => m.asNeeded);

  // Build today's schedule rows: one row per scheduled time slot per medication, matched to actual logs.
  const todaysRows = scheduledMeds.flatMap(med => {
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
      taken: slot.taken,
      status: getSlotStatus(slot.time, slot.taken),
    }));
  });

  const totalExpected = todaysRows.length;
  const totalTaken = todaysRows.filter(r => r.taken).length;

  // Calculate streak (a day counts if every scheduled dose that day was taken)
  const streak = (() => {
    if (scheduledMeds.length === 0) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      let expected = 0;
      let taken = 0;
      for (const med of scheduledMeds) {
        const dayLogs = logs.filter(l => {
          const ld = new Date(l.timestamp);
          return l.medicationId === med.id &&
            ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear() &&
            l.status === 'taken';
        });
        const slots = matchSlotsForDay(med.times, dayLogs);
        expected += slots.length;
        taken += slots.filter(s => s.taken).length;
      }
      if (expected > 0 && taken >= expected) count++;
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

        {/* As-needed countdown cards */}
        {asNeededMeds.length > 0 && asNeededMeds.some(med => prnDoses.some(d => d.medicationId === med.id)) && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 12px' }}>As Required</h2>
            {asNeededMeds.map(med => (
              <PRNCountdownCard key={med.id} med={med} prnDoses={prnDoses} />
            ))}
          </div>
        )}

        {/* Schedule */}
        {medications.length === 0 ? (
          <Card style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 12px' }}>No medications added yet.</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Go to Settings → Medications to add yours.</p>
          </Card>
        ) : totalExpected > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>Today's Schedule</h2>
              <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>{totalTaken}/{totalExpected} taken</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {todaysRows.map(row => (
                <Card key={row.key} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px' }}>{row.med.name} {row.med.dose}{row.med.unit}</p>
                    <p style={{ fontSize: 14, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)', margin: 0 }}>{row.time}</p>
                  </div>
                  <StatusPill status={row.status} />
                </Card>
              ))}
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
