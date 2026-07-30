import { ChevronLeft, ChevronRight, ImageOff, Filter, X, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, BottomNav, Card, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

type DayStatus = 'all' | 'partial' | 'missed' | 'none';

export default function CalendarScreen() {
  const navigate = useNavigate();
  const { medications, logs, prnDoses } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(now.getDate());
  const [tab, setTab] = useState<'calendar' | 'history'>('calendar');
  const [filterMedId, setFilterMedId] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const regularMeds = medications.filter(m => !m.asNeeded);

  // ── Calendar logic ──
  const getDayStatus = (day: number): DayStatus => {
    if (regularMeds.length === 0) return 'none';
    const d = new Date(year, month, day);
    if (d > now) return 'none';
    const dayLogs = logs.filter(l => {
      const ld = new Date(l.timestamp);
      return ld.getDate() === day && ld.getMonth() === month && ld.getFullYear() === year && l.status === 'taken';
    });
    const takenMedIds = new Set(dayLogs.map(l => l.medicationId));
    const takenCount = regularMeds.filter(m => takenMedIds.has(m.id)).length;
    if (takenCount === 0) return 'missed';
    if (takenCount >= regularMeds.length) return 'all';
    return 'partial';
  };

  const getDayLogs = (day: number) =>
    regularMeds.map(med => ({
      med,
      taken: logs.find(l => {
        const ld = new Date(l.timestamp);
        return l.medicationId === med.id &&
          ld.getDate() === day && ld.getMonth() === month && ld.getFullYear() === year &&
          l.status === 'taken';
      }),
    }));

  const statusColor: Record<DayStatus, string> = {
    all: 'var(--color-primary)',
    partial: 'var(--color-partial)',
    missed: 'var(--color-secondary)',
    none: 'transparent',
  };
  const statusTextColor: Record<DayStatus, string> = {
    all: 'var(--color-primary-foreground)',
    partial: 'var(--color-foreground)',
    missed: 'var(--color-muted-foreground)',
    none: 'var(--color-foreground)',
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const selectedDayLogs = getDayLogs(selected);

  // ── History logic ──
  const getMedName = (id: string) => {
    const m = medications.find(m => m.id === id);
    return m ? `${m.name} ${m.dose}${m.unit}` : 'Unknown';
  };
  const formatDate = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Combine regular logs and PRN doses into one list
  const allEntries = [
    ...logs.map(l => ({
      id: l.id,
      medicationId: l.medicationId,
      timestamp: new Date(l.timestamp),
      photoDataUrl: l.photoDataUrl,
      type: 'regular' as const,
      tabletsCount: undefined as number | undefined,
    })),
    ...prnDoses.map(d => ({
      id: d.id,
      medicationId: d.medicationId,
      timestamp: new Date(d.timestamp),
      photoDataUrl: undefined as string | undefined,
      type: 'prn' as const,
      tabletsCount: d.tabletsCount,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filtered = filterMedId === 'all'
    ? allEntries
    : allEntries.filter(e => e.medicationId === filterMedId);

  const withPhotos = filtered.filter(e => e.photoDataUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div style={{ padding: '8px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0 }}>
            {tab === 'calendar' ? 'Calendar' : 'History'}
          </h1>
          {tab === 'history' && (
            <button
              onClick={() => setShowFilter(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: filterMedId !== 'all' ? 'var(--color-primary)' : 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
            >
              <Filter size={13} color={filterMedId !== 'all' ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)'} />
              <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500, color: filterMedId !== 'all' ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)' }}>
                {filterMedId === 'all' ? 'Filter' : getMedName(filterMedId).split(' ')[0]}
              </span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--color-secondary)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {(['calendar', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--color-card)' : 'transparent',
              boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
              transition: 'all 0.15s',
            }}>
              {t === 'calendar' ? 'Calendar' : 'History & Photos'}
            </button>
          ))}
        </div>

        {/* Filter dropdown */}
        {tab === 'history' && showFilter && (
          <Card style={{ marginBottom: 12, overflow: 'hidden' }}>
            <button onClick={() => { setFilterMedId('all'); setShowFilter(false); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 16px', background: filterMedId === 'all' ? 'var(--color-secondary)' : 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', fontWeight: filterMedId === 'all' ? 600 : 400 }}>All medications</span>
              {filterMedId === 'all' && <X size={14} color="var(--color-muted-foreground)" />}
            </button>
            {medications.map(med => (
              <button key={med.id} onClick={() => { setFilterMedId(med.id); setShowFilter(false); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 16px', borderTop: '1px solid var(--color-border)', background: filterMedId === med.id ? 'var(--color-secondary)' : 'none', border: 'none', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 1px', fontWeight: filterMedId === med.id ? 600 : 400 }}>{med.name} {med.dose}{med.unit}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>{med.asNeeded ? 'As required' : med.frequency}</p>
                </div>
                {filterMedId === med.id && <X size={14} color="var(--color-muted-foreground)" />}
              </button>
            ))}
          </Card>
        )}
      </div>

      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px' }}>
        {tab === 'calendar' ? (
          <>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ChevronLeft size={18} color="var(--color-foreground)" />
              </button>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>{months[month]} {year}</span>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ChevronRight size={18} color="var(--color-foreground)" />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {dayHeaders.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const status = getDayStatus(day);
                  const isSelected = day === selected;
                  const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  return (
                    <button key={di} onClick={() => setSelected(day)} style={{
                      aspectRatio: '1', borderRadius: 10, border: isToday ? '2px solid var(--color-primary)' : '2px solid transparent',
                      background: isSelected ? 'var(--color-foreground)' : statusColor[status],
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400,
                      color: isSelected ? 'var(--color-card)' : statusTextColor[status],
                    }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, margin: '12px 0 20px' }}>
              {[['all', 'All taken'], ['partial', 'Partial'], ['missed', 'Missed']].map(([s, label]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: statusColor[s as DayStatus] }} />
                  <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Selected day detail */}
            <SectionLabel>{months[month]} {selected}</SectionLabel>
            {regularMeds.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>No medications added yet.</p>
            ) : (
              <Card style={{ overflow: 'hidden' }}>
                {selectedDayLogs.map(({ med, taken }, i) => (
                  <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{med.name} {med.dose}{med.unit}</p>
                      {taken && <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                        {new Date(taken.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', fontFamily: 'Inter, sans-serif',
                      background: taken ? '#DFE6E1' : 'var(--color-secondary)',
                      color: taken ? '#004D1A' : 'var(--color-muted-foreground)',
                    }}>
                      {taken ? 'Taken' : 'Not logged'}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>
                  {filterMedId === 'all' ? 'No logs yet. Start logging your medications!' : 'No logs for this medication yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Photo grid — only entries with photos */}
                {withPhotos.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <SectionLabel>Photos</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {withPhotos.map(entry => (
                        <div key={entry.id} style={{ borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                          <img src={entry.photoDataUrl} alt="Med" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', padding: '20px 10px 8px' }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif' }}>{getMedName(entry.medicationId)}</p>
                            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>
                              {entry.timestamp.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full log list */}
                <SectionLabel>All Logs — {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</SectionLabel>
                <button
                  onClick={() => navigate('/edit-log')}
                  style={{ width: '100%', height: 44, borderRadius: 999, background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}
                >
                  <Plus size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'var(--color-foreground)' }}>Add Past Dose</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(entry => {
                    const med = medications.find(m => m.id === entry.medicationId);
                    const doseTotal = entry.tabletsCount && med
                      ? ` · ${entry.tabletsCount} × ${med.dose}${med.unit} = ${entry.tabletsCount * parseFloat(med.dose || '0')}${med.unit}`
                      : '';
                    return (
                      <Card key={entry.id} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {entry.photoDataUrl ? (
                          <img src={entry.photoDataUrl} alt="Med" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ImageOff size={18} color="var(--color-muted-foreground)" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getMedName(entry.medicationId)}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                            {formatDate(entry.timestamp)}{doseTotal}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 8px', flexShrink: 0, fontFamily: 'Inter, sans-serif', background: entry.type === 'prn' ? 'var(--color-info)' : '#DFE6E1', color: entry.type === 'prn' ? 'var(--color-info-foreground)' : '#004D1A' }}>
                          {entry.type === 'prn' ? 'As req.' : 'Taken'}
                        </span>
                        {entry.type === 'regular' && (
                          <button
                            onClick={() => navigate(`/edit-log?id=${entry.id}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}
                          >
                            <Pencil size={14} color="var(--color-muted-foreground)" />
                          </button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
