import { ChevronLeft, ChevronRight, Check, Pill, X } from 'lucide-react';
import { useState } from 'react';
import { StatusBar, BottomNav, Card } from '../components';
import { useApp } from '../context/AppContext';
import { matchSlotsForDay, getDayDoseSummary } from '../utils/schedule';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

type DayStatus = 'all' | 'partial' | 'missed' | 'none';

export default function CalendarScreen() {
  const { medications, logs, prnDoses } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(now.getDate());

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Only scheduled (non-PRN) medications count toward "missed" / heatmap status.
  const scheduledMeds = medications.filter(m => !m.asNeeded);
  const asNeededMeds = medications.filter(m => m.asNeeded);

  const logsOnDay = (day: number) => logs.filter(l => {
    const ld = new Date(l.timestamp);
    return ld.getDate() === day && ld.getMonth() === month && ld.getFullYear() === year && l.status === 'taken';
  });

  const getDayStatus = (day: number): DayStatus => {
    if (scheduledMeds.length === 0) return 'none';
    const d = new Date(year, month, day);
    if (d > now) return 'none';

    const { expected, taken } = getDayDoseSummary(scheduledMeds, logsOnDay(day));
    if (expected === 0) return 'none';
    if (taken === 0) return 'missed';
    if (taken >= expected) return 'all';
    return 'partial';
  };

  // Per-medication, per-time-slot breakdown for the selected day's detail card.
  const getDaySlots = (day: number) => {
    const dayLogs = logsOnDay(day);
    return scheduledMeds.map(med => {
      const medLogs = dayLogs.filter(l => l.medicationId === med.id);
      const slots = matchSlotsForDay(med.times, medLogs);
      return { med, slots };
    });
  };

  const getDayPRNDoses = (day: number) => {
    return prnDoses
      .filter(d => {
        const dd = new Date(d.timestamp);
        return dd.getDate() === day && dd.getMonth() === month && dd.getFullYear() === year;
      })
      .map(dose => ({
        dose,
        med: asNeededMeds.find(m => m.id === dose.medicationId),
      }))
      .filter(x => x.med)
      .sort((a, b) => new Date(a.dose.timestamp).getTime() - new Date(b.dose.timestamp).getTime());
  };

  const statusColor: Record<DayStatus, string> = {
    all: 'var(--color-primary)',
    partial: 'var(--color-primary-tint)',
    missed: 'var(--color-secondary)',
    none: 'var(--color-secondary)',
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selectedDaySlots = getDaySlots(selected);
  const selectedDayPRN = getDayPRNDoses(selected);
  const isFutureSelected = new Date(year, month, selected) > now;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>Calendar</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={18} color="var(--color-foreground)" />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', minWidth: 100, textAlign: 'center' }}>{months[month]} {year}</span>
            <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronRight size={18} color="var(--color-foreground)" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[['var(--color-secondary)', 'Missed'], ['var(--color-primary-tint)', 'Partial'], ['var(--color-primary)', 'All taken']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>

        {scheduledMeds.length === 0 && asNeededMeds.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 12px' }}>
            The heatmap tracks scheduled medications only. As-required doses are shown below when you select a day.
          </p>
        )}

        <Card style={{ padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {dayHeaders.map(d => (
              <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', gap: 4 }}>
                {week.map((day, di) => {
                  const status = day ? getDayStatus(day) : 'none';
                  const isSelected = day === selected;
                  const isFuture = day ? new Date(year, month, day) > now : false;
                  return (
                    <div
                      key={di}
                      onClick={() => day && setSelected(day)}
                      style={{
                        flex: 1, height: 42, borderRadius: 8,
                        background: day && !isFuture ? statusColor[status] : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: day ? 'pointer' : 'default',
                        outline: isSelected ? '2px solid var(--color-foreground)' : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      {day && (
                        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: status === 'all' && !isFuture ? 'var(--color-primary-foreground)' : 'var(--color-foreground)' }}>{day}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16, marginBottom: asNeededMeds.length > 0 ? 12 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>
              {dayHeaders[(new Date(year, month, selected).getDay() + 6) % 7]}, {months[month]} {selected}
            </span>
            {selected === now.getDate() && month === now.getMonth() && year === now.getFullYear() && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'Geist, sans-serif' }}>Today</span>
            )}
          </div>

          {scheduledMeds.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>No scheduled medications added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDaySlots.map(({ med, slots }) => (
                slots.map((slot, i) => (
                  <div key={`${med.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: slot.taken ? 'var(--color-primary)' : 'var(--color-primary-tint)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', flex: 1 }}>
                      {med.name} {med.dose}{med.unit}{slots.length > 1 ? ` · ${slot.time}` : ''}
                    </span>
                    {slot.taken ? (
                      <>
                        <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)' }}>
                          {slot.logTimestamp?.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                        <Check size={14} color="#004D1A" />
                      </>
                    ) : (
                      <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>
                        {isFutureSelected ? 'Upcoming' : 'Missed'}
                      </span>
                    )}
                  </div>
                ))
              ))}
            </div>
          )}
        </Card>

        {/* As-required doses for the selected day — informational only, never "missed" */}
        {asNeededMeds.length > 0 && (
          <Card style={{ padding: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', display: 'block', marginBottom: 10 }}>
              As Required
            </span>
            {selectedDayPRN.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>
                No as-required doses logged this day.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDayPRN.map(({ dose, med }) => (
                  <div key={dose.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Pill size={14} color="var(--color-muted-foreground)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', flex: 1 }}>
                      {med!.name} {med!.dose}{med!.unit}{dose.tabletsCount && dose.tabletsCount > 1 ? ` × ${dose.tabletsCount}` : ''}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)' }}>
                      {new Date(dose.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
