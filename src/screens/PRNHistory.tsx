import { useParams } from 'react-router-dom';
import { Clock, Pill } from 'lucide-react';
import { StatusBar, BottomNav, NavBar, Card, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';
import { convertUnit } from '../utils/units';

export default function PRNHistoryScreen() {
  const { id } = useParams<{ id: string }>();
  const { medications, prnDoses } = useApp();

  const med = medications.find(m => m.id === id);
  const doses = prnDoses
    .filter(d => d.medicationId === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!med) return null;

  // Group by date
  const grouped: Record<string, typeof doses> = {};
  doses.forEach(d => {
    const date = new Date(d.timestamp).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(d);
  });

  const totalDose = (tabletsCount: number) => {
    const perTablet = parseFloat(med.dose) || 0;
    return perTablet > 0 ? ` · ${perTablet * tabletsCount}${med.unit} total` : '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title={`${med.name} — Dose Log`} />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>

        {/* Summary */}
        <Card style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Pill size={20} color="var(--color-primary)" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{med.name} {med.dose}{med.unit}</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                As required{med.minIntervalHours ? ` · every ${med.minIntervalHours}h` : ''} · {doses.length} dose{doses.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
        </Card>

        {doses.length === 0 ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>No doses logged yet</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Log a dose from the Log tab to start tracking.</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, dayDoses]) => {
            const dayTotalRaw = dayDoses.reduce((sum, d) => sum + (parseFloat(med.dose) || 0) * (d.tabletsCount ?? 1), 0);
            const maxUnit = med.maxDailyDoseUnit ?? med.unit;
            const dayTotalConverted = convertUnit(dayTotalRaw, med.unit, maxUnit) ?? dayTotalRaw;
            const dayLimitReached = med.maxDailyDose !== undefined && dayTotalConverted >= med.maxDailyDose;
            return (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <SectionLabel>{date}</SectionLabel>
                  {med.maxDailyDose && dayTotalConverted > 0 && (
                    <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', color: dayLimitReached ? '#804200' : 'var(--color-muted-foreground)', fontWeight: 600 }}>
                      {dayTotalConverted.toFixed(2).replace(/\.?0+$/, '')}{maxUnit} / {med.maxDailyDose}{maxUnit} daily max
                    </span>
                  )}
                </div>
                <Card style={{ overflow: 'hidden' }}>
                  {dayDoses.map((dose, i) => {
                    const time = new Date(dose.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
                    const tablets = dose.tabletsCount ?? 1;
                    return (
                      <div key={dose.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Clock size={14} color="var(--color-primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-foreground)', margin: '0 0 2px' }}>{time}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                            {tablets} tablet{tablets !== 1 ? 's' : ''}{totalDose(tablets)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}
