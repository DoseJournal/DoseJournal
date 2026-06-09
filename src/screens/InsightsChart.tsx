import { useState } from 'react';
import { ChevronDown, X, Info, Search } from 'lucide-react';
import { StatusBar, BottomNav, Card, SectionLabel, OrangeButton } from '../components';

const metrics = {
  'EVENING RATINGS': ['Focus Score', 'Anxiety Level', 'Stomach Comfort', 'Sleep Quality', 'Energy Level', 'Mood'],
  'LOGGING QUESTIONS': ['Ate Before Medication', 'Full Dose Taken', 'Took With Water', 'At Home', 'On Time'],
};

const timeRanges = ['1W', '2W', '1M', '3M'];

const chartData = {
  'Focus Score': { groups: [{ label: 'Yes', n: 9, value: 7.2 }, { label: 'No', n: 5, value: 5.1 }], avg: 6.3, high: 9, low: 3, entries: 14 },
  'Anxiety Level': { groups: [{ label: 'Yes', n: 9, value: 4.1 }, { label: 'No', n: 5, value: 6.8 }], avg: 5.1, high: 9, low: 1, entries: 14 },
  'Sleep Quality': { groups: [{ label: 'Yes', n: 9, value: 7.8 }, { label: 'No', n: 5, value: 6.2 }], avg: 7.2, high: 10, low: 4, entries: 14 },
  'default': { groups: [{ label: 'Yes', n: 9, value: 6.5 }, { label: 'No', n: 5, value: 5.0 }], avg: 5.9, high: 9, low: 2, entries: 14 },
};

function MetricPicker({ onClose, onSelect, current }: { onClose: () => void; onSelect: (m: string) => void; current: string }) {
  const [search, setSearch] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 390, margin: '0 auto' }}>
      <div style={{ background: 'var(--color-card)', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>Select Metric</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--color-foreground)" />
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} color="var(--color-muted-foreground)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search metrics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 40, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)', paddingLeft: 40, paddingRight: 16, fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {Object.entries(metrics).map(([section, items]) => {
            const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));
            if (!filtered.length) return null;
            return (
              <div key={section} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', padding: '8px 0 4px', textTransform: 'uppercase' }}>{section}</div>
                {filtered.map(item => (
                  <button key={item} onClick={() => { onSelect(item); onClose(); }} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                  }}>
                    <span style={{ fontSize: 15, fontFamily: 'Geist, sans-serif', color: item === current ? 'var(--color-primary)' : 'var(--color-foreground)' }}>{item}</span>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${item === current ? 'var(--color-primary)' : 'var(--color-border)'}`, background: item === current ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item === current && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16 }}>
          <OrangeButton onClick={onClose}>Done</OrangeButton>
        </div>
      </div>
    </div>
  );
}

export default function InsightsChartScreen() {
  const [metric, setMetric] = useState('Focus Score');
  const [timeRange, setTimeRange] = useState('2W');
  const [groupBy, _setGroupBy] = useState('Ate Before Medication');
  const [showPicker, setShowPicker] = useState(false);

  const data = (chartData as any)[metric] || chartData['default'];
  const maxVal = 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 20px' }}>Insights</h1>

        {/* Y-axis selector */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Y-AXIS METRIC</SectionLabel>
          <button onClick={() => setShowPicker(true)} style={{
            width: '100%', height: 48, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 15, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', fontWeight: 500 }}>{metric}</span>
            <ChevronDown size={16} color="var(--color-muted-foreground)" />
          </button>
        </div>

        {/* Time range */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>TIME RANGE</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {timeRanges.map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{
                flex: 1, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: r === timeRange ? 'var(--color-primary)' : 'var(--color-secondary)',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600,
                color: r === timeRange ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Group by */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>GROUP BY (OPTIONAL)</SectionLabel>
          <button style={{
            width: '100%', height: 48, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 15, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', fontWeight: 500 }}>{groupBy}</span>
            <ChevronDown size={16} color="var(--color-muted-foreground)" />
          </button>
        </div>

        {/* Chart card */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>{metric}</span>
            <span style={{ fontSize: 12, fontFamily: 'Geist, sans-serif', background: '#FFF3E0', color: '#804200', borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>{timeRange === '2W' ? '14 days' : timeRange === '1M' ? '30 days' : timeRange === '3M' ? '90 days' : '7 days'}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 16px' }}>Grouped by: {groupBy}</p>

          {/* Bar chart */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Geist Mono, monospace', marginBottom: 6 }}>10</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 120, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
              {data.groups.map((g: any, i: number) => (
                <div key={g.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--color-foreground)', fontWeight: 600 }}>{g.value.toFixed(1)}</span>
                  <div style={{ width: '70%', height: `${(g.value / maxVal) * 100}%`, background: i === 0 ? 'var(--color-primary)' : '#FFD4A8', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, paddingTop: 8 }}>
              {data.groups.map((g: any) => (
                <div key={g.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', fontWeight: 500 }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Geist Mono, monospace' }}>n={g.n}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {[['Avg', data.avg.toFixed(1)], ['High', data.high], ['Low', data.low], ['Entries', data.entries]].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--color-muted)', borderRadius: 8, padding: '10px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ background: 'var(--color-info)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Info size={14} color="var(--color-info-foreground)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--color-info-foreground)', fontFamily: 'Geist, sans-serif', lineHeight: 1.5 }}>
              Based on your personal logs only — discuss patterns with your healthcare provider
            </span>
          </div>
        </Card>
      </div>
      <BottomNav />
      {showPicker && <MetricPicker onClose={() => setShowPicker(false)} onSelect={setMetric} current={metric} />}
    </div>
  );
}
