import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Info, Search } from 'lucide-react';
import { StatusBar, BottomNav, Card, SectionLabel, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';

const timeRanges = ['1W', '2W', '1M', '3M'];
const timeLabels: Record<string, string> = { '1W': '7 days', '2W': '14 days', '1M': '30 days', '3M': '90 days' };

function daysForRange(r: string) {
  return r === '1W' ? 7 : r === '2W' ? 14 : r === '1M' ? 30 : 90;
}

function Picker({ title, onClose, onSelect, current, items }: {
  title: string; onClose: () => void; onSelect: (m: string) => void; current: string; items: string[];
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'var(--color-card)', borderRadius: '16px 16px 0 0', padding: '20px 20px 36px', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--color-foreground)" />
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="var(--color-muted-foreground)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 999, background: 'var(--color-muted)', border: '1px solid var(--color-border)', paddingLeft: 36, paddingRight: 14, fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '20px 0' }}>No questions found</p>}
          {filtered.map(item => (
            <button key={item} onClick={() => { onSelect(item); onClose(); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: 52, background: item === current ? 'var(--color-primary)' + '18' : 'none', borderRadius: 10, border: 'none', cursor: 'pointer', padding: '10px 12px', marginBottom: 4, textAlign: 'left' }}>
              <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: item === current ? 'var(--color-primary)' : 'var(--color-foreground)', flex: 1, paddingRight: 12, lineHeight: 1.4 }}>{item}</span>
              {item === current && (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InsightsChartScreen() {
  const navigate = useNavigate();
  const { checkins, logs } = useApp();
  const [timeRange, setTimeRange] = useState('2W');
  const [metric, setMetric] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const days = daysForRange(timeRange);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentCheckins = checkins.filter(c => new Date(c.date) >= cutoff);
  const recentLogs = logs.filter(l => new Date(l.timestamp) >= cutoff);

  // Available questions from real data
  const ratingQuestions = Array.from(new Set(checkins.flatMap(c => c.ratings.map(r => r.question))));
  const logQuestions = Array.from(new Set(logs.flatMap(l => l.questions.map(q => q.question))));

  const activeMetric = metric || ratingQuestions[0] || '';
  const activeGroupBy = groupBy || logQuestions[0] || '';

  const computeData = () => {
    if (!activeMetric || recentCheckins.length === 0) return null;
    const values = recentCheckins.map(c => c.ratings.find(r => r.question === activeMetric)?.value).filter((v): v is number => v !== undefined);
    if (values.length === 0) return null;

    const avg = (arr: number[]) => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

    if (activeGroupBy && logQuestions.includes(activeGroupBy)) {
      const yesValues: number[] = [];
      const noValues: number[] = [];
      recentCheckins.forEach(c => {
        const val = c.ratings.find(r => r.question === activeMetric)?.value;
        if (val === undefined) return;
        const cDate = new Date(c.date);
        const sameDayLogs = recentLogs.filter(l => {
          const ld = new Date(l.timestamp);
          return ld.getDate() === cDate.getDate() && ld.getMonth() === cDate.getMonth() && ld.getFullYear() === cDate.getFullYear();
        });
        const answered = sameDayLogs.some(l => l.questions.find(q => q.question === activeGroupBy)?.answer === true);
        (answered ? yesValues : noValues).push(val);
      });
      return {
        grouped: true,
        yesAvg: avg(yesValues),
        noAvg: avg(noValues),
        yesN: yesValues.length,
        noN: noValues.length,
        overallAvg: avg(values)!,
        high: Math.max(...values),
        low: Math.min(...values),
        entries: values.length,
      };
    }

    return {
      grouped: false,
      overallAvg: avg(values)!,
      high: Math.max(...values),
      low: Math.min(...values),
      entries: values.length,
    };
  };

  const data = computeData();
  const noData = recentCheckins.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 20px' }}>Insights</h1>

        {noData ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>No check-in data yet</p>
            <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 20px', lineHeight: 1.5 }}>Complete your first evening check-in to start seeing insights here.</p>
            <OrangeButton onClick={() => navigate('/insights')}>Go to Check-in</OrangeButton>
          </Card>
        ) : (
          <>
            {/* Time range */}
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>TIME RANGE</SectionLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {timeRanges.map(r => (
                  <button key={r} onClick={() => setTimeRange(r)} style={{ flex: 1, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer', background: r === timeRange ? 'var(--color-primary)' : 'var(--color-secondary)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: r === timeRange ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)' }}>{r}</button>
                ))}
              </div>
            </div>

            {/* Y axis — what to chart */}
            <div style={{ marginBottom: 12 }}>
              <SectionLabel>WHAT TO CHART (Y AXIS)</SectionLabel>
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 8px' }}>Pick a check-in question — this is the value shown on the vertical axis.</p>
              <button onClick={() => setShowMetricPicker(true)} style={{ width: '100%', minHeight: 52, background: 'var(--color-card)', borderRadius: 12, border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', gap: 10 }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'Inter, sans-serif', margin: '0 0 2px', letterSpacing: '0.3px' }}>Y AXIS</p>
                  <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: activeMetric ? 'var(--color-foreground)' : 'var(--color-muted-foreground)', fontWeight: 500, margin: 0 }}>{activeMetric || 'Select a check-in question...'}</p>
                </div>
                <ChevronDown size={16} color="var(--color-muted-foreground)" style={{ flexShrink: 0 }} />
              </button>
            </div>

            {/* Group by — comparison */}
            {logQuestions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>COMPARE BY (OPTIONAL)</SectionLabel>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 8px' }}>Split results by a yes/no logging question to see if it makes a difference.</p>
                <button onClick={() => setShowGroupPicker(true)} style={{ width: '100%', minHeight: 52, background: 'var(--color-card)', borderRadius: 12, border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', gap: 10 }}>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 2px', letterSpacing: '0.3px' }}>COMPARE BY</p>
                    <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', fontWeight: 500, margin: 0 }}>{activeGroupBy}</p>
                  </div>
                  <ChevronDown size={16} color="var(--color-muted-foreground)" style={{ flexShrink: 0 }} />
                </button>
              </div>
            )}

            {/* Chart */}
            {data ? (
              <Card style={{ padding: 20, marginBottom: 16 }}>

                {/* Chart title */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px', lineHeight: 1.4 }}>{activeMetric}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                    {data.entries} check-in{data.entries !== 1 ? 's' : ''} over the last {timeLabels[timeRange]}
                    {data.grouped ? ` · split by "${activeGroupBy}"` : ''}
                  </p>
                </div>

                {data.grouped ? (
                  <>
                    {/* Comparison bars */}
                    <div style={{ marginBottom: 20 }}>
                      {/* Y axis label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: "'JetBrains Mono', monospace", writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 140, textAlign: 'center', lineHeight: '11px' }}>
                          avg score (1–10)
                        </div>

                        <div style={{ flex: 1 }}>
                          {/* Grid lines */}
                          <div style={{ position: 'relative', height: 140, marginBottom: 8 }}>
                            {[10, 7.5, 5, 2.5].map(line => (
                              <div key={line} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(line / 10) * 100}%`, borderTop: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)', fontFamily: "'JetBrains Mono', monospace", background: 'var(--color-card)', paddingRight: 4, lineHeight: 1, marginTop: -1 }}>{line}</span>
                              </div>
                            ))}
                            {/* Bars */}
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 12, paddingLeft: 24 }}>
                              {[
                                { label: `"${activeGroupBy}"\nAnswered YES`, value: (data.yesAvg ?? 0) as number, n: (data.yesN ?? 0) as number, color: 'var(--color-primary)' },
                                { label: `"${activeGroupBy}"\nAnswered NO`, value: (data.noAvg ?? 0) as number, n: (data.noN ?? 0) as number, color: '#C4B5FD' },
                              ].map((bar, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 }}>
                                  {bar.n > 0 && (
                                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>{bar.value.toFixed(1)}</span>
                                  )}
                                  <div style={{
                                    width: '80%',
                                    height: bar.n === 0 ? '4px' : `${(bar.value / 10) * 100}%`,
                                    background: bar.n === 0 ? 'var(--color-border)' : bar.color,
                                    borderRadius: '6px 6px 0 0',
                                    minHeight: 4,
                                    transition: 'height 0.3s',
                                  }} />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ borderTop: '2px solid var(--color-border)', paddingLeft: 24 }}>
                            {/* X axis labels */}
                            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                              {[
                                { label: 'Yes', sublabel: `n=${data.yesN ?? 0}`, color: 'var(--color-primary)' },
                                { label: 'No', sublabel: `n=${data.noN ?? 0}`, color: '#C4B5FD' },
                              ].map((bar, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: bar.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>{bar.label}</span>
                                  </div>
                                  <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>{bar.sublabel} days</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* X axis description */}
                      <div style={{ background: 'var(--color-secondary)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700 }}>X axis:</span> Days when you answered <span style={{ fontWeight: 700 }}>"Yes"</span> vs <span style={{ fontWeight: 700 }}>"No"</span> to<br />
                          <span style={{ fontStyle: 'italic', color: 'var(--color-muted-foreground)' }}>"{activeGroupBy}"</span>
                        </p>
                      </div>

                      {/* Difference callout */}
                      {data.yesAvg != null && data.noAvg != null && (data.yesN ?? 0) > 0 && (data.noN ?? 0) > 0 && (() => {
                        const ya = data.yesAvg as number;
                        const na = data.noAvg as number;
                        return (
                          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
                            <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.6 }}>
                              {Math.abs(ya - na) < 0.5 ? (
                                <>On days you answered <strong>Yes</strong>, your score was similar to days you answered <strong>No</strong> ({ya.toFixed(1)} vs {na.toFixed(1)}).</>
                              ) : ya > na ? (
                                <>On days you answered <strong>Yes</strong>, your score was <strong style={{ color: 'var(--color-primary)' }}>{(ya - na).toFixed(1)} points higher</strong> ({ya.toFixed(1)} vs {na.toFixed(1)}).</>
                              ) : (
                                <>On days you answered <strong>No</strong>, your score was <strong style={{ color: 'var(--color-primary)' }}>{(na - ya).toFixed(1)} points higher</strong> ({na.toFixed(1)} vs {ya.toFixed(1)}).</>
                              )}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  /* Single average bar */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, background: 'var(--color-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(data.overallAvg / 10) * 100}%`, background: 'var(--color-primary)', borderRadius: 999 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>1</span>
                        <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>10</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary)', margin: 0 }}>{data.overallAvg}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>avg / 10</p>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[['Avg', data.overallAvg], ['High', data.high], ['Low', data.low], ['Entries', data.entries]].map(([label, val]) => (
                    <div key={label as string} style={{ background: 'var(--color-muted)', borderRadius: 8, padding: '10px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--color-secondary)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={13} color="var(--color-muted-foreground)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    Personal logs only — discuss any patterns with your healthcare provider
                  </span>
                </div>
              </Card>
            ) : (
              <Card style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  {activeMetric ? 'Not enough data for this time range yet.' : 'Select a check-in question above to see your chart.'}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
      <BottomNav />
      {showMetricPicker && <Picker title="Select check-in question" onClose={() => setShowMetricPicker(false)} onSelect={setMetric} current={activeMetric} items={ratingQuestions} />}
      {showGroupPicker && <Picker title="Compare by logging question" onClose={() => setShowGroupPicker(false)} onSelect={setGroupBy} current={activeGroupBy} items={logQuestions} />}
    </div>
  );
}
