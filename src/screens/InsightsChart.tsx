import { useMemo, useState } from 'react';
import { ChevronDown, X, Info, Search } from 'lucide-react';
import { StatusBar, BottomNav, Card, SectionLabel, OrangeButton, Select } from '../components';
import { useApp } from '../context/AppContext';

const timeRanges = ['1W', '2W', '1M', '3M'];
const rangeDays: Record<string, number> = { '1W': 7, '2W': 14, '1M': 30, '3M': 90 };
const rangeLabel: Record<string, string> = { '1W': '7 days', '2W': '14 days', '1M': '30 days', '3M': '90 days' };

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function MetricPicker({ onClose, onSelect, current, metrics }: {
  onClose: () => void;
  onSelect: (m: string) => void;
  current: string;
  metrics: Record<string, string[]>;
}) {
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
  const { settings, checkins, logs } = useApp();

  // Metrics are built from the user's actual configured questions, not hardcoded.
  const ratingQuestions = [...settings.checkinQuestions, ...settings.customQuestions];
  const loggingQuestions = settings.loggingQuestions;

  const metrics = useMemo(() => ({
    'EVENING RATINGS': ratingQuestions,
    'LOGGING QUESTIONS': loggingQuestions,
  }), [ratingQuestions, loggingQuestions]);

  const [metric, setMetric] = useState(ratingQuestions[0] ?? loggingQuestions[0] ?? '');
  const [timeRange, setTimeRange] = useState('2W');
  const [groupBy, setGroupBy] = useState<string>(loggingQuestions[0] ?? 'None');
  const [showPicker, setShowPicker] = useState(false);

  const isRatingMetric = ratingQuestions.includes(metric);
  const days = rangeDays[timeRange];
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const data = useMemo(() => {
    if (isRatingMetric) {
      const inRange = checkins.filter(c => new Date(c.date) >= cutoff);
      const valueFor = (c: typeof inRange[number]) => c.ratings.find(r => r.question === metric)?.value;

      const withValue = inRange
        .map(c => ({ checkin: c, value: valueFor(c) }))
        .filter((x): x is { checkin: typeof inRange[number]; value: number } => x.value !== undefined);

      if (withValue.length === 0) {
        return { groups: [{ label: 'No data', n: 0, value: 0 }], avg: 0, high: 0, low: 0, entries: 0, isPercentage: false };
      }

      const values = withValue.map(x => x.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const high = Math.max(...values);
      const low = Math.min(...values);

      let groups;
      if (groupBy && groupBy !== 'None') {
        // For each checkin day, find whether that day's logs answered the groupBy logging question yes/no.
        const classify = (checkinDate: Date): boolean | null => {
          const dayLogs = logs.filter(l => isSameDay(new Date(l.timestamp), checkinDate));
          const answers = dayLogs
            .map(l => l.questions.find(q => q.question === groupBy)?.answer)
            .filter((a): a is boolean => a !== undefined);
          if (answers.length === 0) return null;
          return answers.some(a => a === true);
        };

        const yesVals: number[] = [];
        const noVals: number[] = [];
        withValue.forEach(({ checkin, value }) => {
          const cls = classify(new Date(checkin.date));
          if (cls === true) yesVals.push(value);
          else if (cls === false) noVals.push(value);
        });

        groups = [
          { label: 'Yes', n: yesVals.length, value: yesVals.length ? yesVals.reduce((a, b) => a + b, 0) / yesVals.length : 0 },
          { label: 'No', n: noVals.length, value: noVals.length ? noVals.reduce((a, b) => a + b, 0) / noVals.length : 0 },
        ];
      } else {
        groups = [{ label: 'Overall', n: values.length, value: avg }];
      }

      return { groups, avg, high, low, entries: withValue.length, isPercentage: false };
    } else {
      // Logging-question metric: show % answered "yes" across logs in range.
      const inRangeLogs = logs.filter(l => new Date(l.timestamp) >= cutoff && l.questions.some(q => q.question === metric));
      const answers = inRangeLogs.map(l => l.questions.find(q => q.question === metric)!.answer);
      const yes = answers.filter(a => a === true).length;
      const no = answers.length - yes;
      const pct = answers.length ? (yes / answers.length) * 100 : 0;

      return {
        groups: [
          { label: 'Yes', n: yes, value: answers.length ? (yes / answers.length) * 100 : 0 },
          { label: 'No', n: no, value: answers.length ? (no / answers.length) * 100 : 0 },
        ],
        avg: pct,
        high: answers.length ? 100 : 0,
        low: 0,
        entries: answers.length,
        isPercentage: true,
      };
    }
  }, [checkins, logs, metric, isRatingMetric, groupBy, cutoff]);

  const maxVal = data.isPercentage ? 100 : 10;

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
            <span style={{ fontSize: 15, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', fontWeight: 500 }}>{metric || 'No metrics available'}</span>
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

        {/* Group by — only meaningful for rating metrics */}
        {isRatingMetric && loggingQuestions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>GROUP BY (OPTIONAL)</SectionLabel>
            <Select value={groupBy} onChange={setGroupBy} style={{ height: 48, borderRadius: 12 }}>
              <option value="None">None</option>
              {loggingQuestions.map(q => <option key={q} value={q}>{q}</option>)}
            </Select>
          </div>
        )}

        {/* Chart card */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>{metric || 'No data yet'}</span>
            <span style={{ fontSize: 12, fontFamily: 'Geist, sans-serif', background: 'var(--color-secondary)', color: 'var(--color-muted-foreground)', borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>{rangeLabel[timeRange]}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 16px' }}>
            {isRatingMetric && groupBy !== 'None' ? `Grouped by: ${groupBy}` : isRatingMetric ? 'All entries' : 'Answered yes vs no'}
          </p>

          {/* Bar chart */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Geist Mono, monospace', marginBottom: 6 }}>{maxVal}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 120, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
              {data.groups.map((g: any, i: number) => (
                <div key={g.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--color-foreground)', fontWeight: 600 }}>
                    {data.isPercentage ? `${g.value.toFixed(0)}%` : g.value.toFixed(1)}
                  </span>
                  <div style={{ width: '70%', height: `${maxVal ? (g.value / maxVal) * 100 : 0}%`, background: i === 0 ? 'var(--color-primary)' : 'var(--color-primary-tint)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
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
            {[
              ['Avg', data.isPercentage ? `${data.avg.toFixed(0)}%` : data.avg.toFixed(1)],
              ['High', data.isPercentage ? `${data.high.toFixed(0)}%` : data.high],
              ['Low', data.isPercentage ? `${data.low.toFixed(0)}%` : data.low],
              ['Entries', data.entries],
            ].map(([label, val]) => (
              <div key={label as string} style={{ background: 'var(--color-muted)', borderRadius: 8, padding: '10px 0', textAlign: 'center' }}>
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
      {showPicker && <MetricPicker onClose={() => setShowPicker(false)} onSelect={setMetric} current={metric} metrics={metrics} />}
    </div>
  );
}
