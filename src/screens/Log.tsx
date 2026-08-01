import { Clock3, Camera, X, ChevronDown, AlertTriangle, Timer } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, NavBar, Card, Toggle, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';
import { convertUnit } from '../utils/units';

const defaultQuestions = [
  'Did you eat before taking?',
  'Did you take your full dose?',
  'Did you drink water with it?',
  'Were you at home?',
  'Taking early or late?',
];

function formatHoursRemaining(hours: number) {
  if (hours <= 0) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function LogScreen() {
  const navigate = useNavigate();
  const { settings, addLog, addPRNDose, medications, prnDoses } = useApp();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<string>(medications[0]?.id ?? '');
  const [tabletsCount, setTabletsCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMed = medications.find(m => m.id === selectedMedId);
  const isAsNeeded = !!selectedMed?.asNeeded;

  const questions = settings.loggingQuestionsEnabled
    ? [...defaultQuestions, ...settings.customQuestions]
    : defaultQuestions;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });

  // --- PRN countdown + daily max calculation ---
  const prnStatus = useMemo(() => {
    if (!selectedMed || !isAsNeeded) return null;

    const medDoses = prnDoses
      .filter(d => d.medicationId === selectedMed.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const lastDose = medDoses[0];
    let hoursRemaining = 0;
    if (lastDose && selectedMed.minIntervalHours) {
      const elapsedHours = (now.getTime() - new Date(lastDose.timestamp).getTime()) / (1000 * 60 * 60);
      hoursRemaining = Math.max(0, selectedMed.minIntervalHours - elapsedHours);
    }

    const todayDoses = medDoses.filter(d => {
      const dd = new Date(d.timestamp);
      return dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
    });
    const perTablet = parseFloat(selectedMed.dose) || 0;
    const todayTotalRaw = todayDoses.reduce((sum, d) => sum + perTablet * (d.tabletsCount ?? 1), 0);
    const maxUnit = selectedMed.maxDailyDoseUnit ?? selectedMed.unit;
    const todayTotalConverted = convertUnit(todayTotalRaw, selectedMed.unit, maxUnit) ?? todayTotalRaw;
    const thisDoseConverted = convertUnit(perTablet * tabletsCount, selectedMed.unit, maxUnit) ?? (perTablet * tabletsCount);
    const wouldExceedMax = selectedMed.maxDailyDose !== undefined && (todayTotalConverted + thisDoseConverted) > selectedMed.maxDailyDose;

    return {
      hoursRemaining,
      canLogNow: hoursRemaining <= 0,
      todayTotalConverted,
      maxUnit,
      maxDailyDose: selectedMed.maxDailyDose,
      wouldExceedMax,
      lastDoseTime: lastDose ? new Date(lastDose.timestamp) : null,
    };
  }, [selectedMed, isAsNeeded, prnDoses, now.getTime(), tabletsCount]);

  const blocked = isAsNeeded && prnStatus && (!prnStatus.canLogNow || prnStatus.wouldExceedMax);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!selectedMedId || blocked) return;
    const med = medications.find(m => m.id === selectedMedId);

    if (isAsNeeded) {
      addPRNDose({
        medicationId: selectedMedId,
        timestamp: now,
        tabletsCount,
      });
    } else {
      addLog({
        medicationId: selectedMedId,
        timestamp: now,
        status: 'taken',
        photoDataUrl: photoDataUrl ?? undefined,
        questions: questions.map(q => ({ question: q, answer: answers[q] ?? false })),
      });
    }

    navigate('/log/success', {
      state: {
        medName: med ? `${med.name} ${med.dose}${med.unit}` : '',
        photoDataUrl: photoDataUrl ?? null,
        timestamp: now.toISOString(),
      }
    });
  };

  if (medications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
        <StatusBar />
        <NavBar title="Log Medication" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', marginBottom: 8 }}>No medications added yet.</p>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>Add your medications in Settings first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Log Medication" />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Medication selector */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 8px', fontFamily: 'Geist, sans-serif' }}>Medication</p>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedMedId}
              onChange={e => setSelectedMedId(e.target.value)}
              style={{ width: '100%', height: 48, borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', padding: '0 40px 0 16px', fontSize: 15, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', appearance: 'none', outline: 'none', cursor: 'pointer' }}
            >
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name} {m.dose}{m.unit}{m.asNeeded ? ' (as required)' : ''}</option>
              ))}
            </select>
            <ChevronDown size={16} color="var(--color-muted-foreground)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Time */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-secondary)', borderRadius: 999, padding: '6px 12px' }}>
            <Clock3 size={13} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)' }}>{timeStr}</span>
          </div>
        </div>

        {isAsNeeded && prnStatus && (
          <>
            {/* Tablet count selector */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 8px', fontFamily: 'Geist, sans-serif' }}>Tablets Taken</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setTabletsCount(n)}
                    style={{
                      flex: 1, height: 44, borderRadius: 12,
                      border: tabletsCount === n ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: tabletsCount === n ? 'var(--color-secondary)' : 'var(--color-card)',
                      fontSize: 15, fontWeight: 600, fontFamily: 'Geist, sans-serif',
                      color: 'var(--color-foreground)', cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown / status card */}
            <Card style={{
              marginBottom: 16, padding: '14px 16px',
              borderColor: blocked ? '#E5A24A' : 'var(--color-border)',
              background: blocked ? '#FFF8ED' : 'var(--color-card)',
            }}>
              {!prnStatus.canLogNow ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Timer size={18} color="#804200" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: '#804200', margin: '0 0 2px' }}>
                      Wait {formatHoursRemaining(prnStatus.hoursRemaining)} before next dose
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>
                      Last taken {prnStatus.lastDoseTime?.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
              ) : prnStatus.wouldExceedMax ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={18} color="#8C1C00" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: '#8C1C00', margin: '0 0 2px' }}>
                      This would exceed your daily max
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>
                      {prnStatus.todayTotalConverted.toFixed(0)}{prnStatus.maxUnit} taken today · max {prnStatus.maxDailyDose}{prnStatus.maxUnit}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock3 size={18} color="var(--color-primary)" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>
                      Safe to log now
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>
                      {prnStatus.todayTotalConverted.toFixed(0)}{prnStatus.maxUnit} taken today{prnStatus.maxDailyDose ? ` · max ${prnStatus.maxDailyDose}${prnStatus.maxUnit}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Photo */}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />

        {photoDataUrl ? (
          <div style={{ position: 'relative', marginBottom: 16, borderRadius: 16, overflow: 'hidden', height: 200 }}>
            <img src={photoDataUrl} alt="Medication" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => setPhotoDataUrl(null)} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="white" />
            </button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} style={{ height: 120, background: 'var(--color-card)', borderRadius: 16, border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <Camera size={28} color="var(--color-primary)" />
            <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>Tap to take photo</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', opacity: 0.7 }}>Stored locally on your device</span>
          </div>
        )}

        {/* Questions (only for scheduled meds) */}
        {!isAsNeeded && (
          <Card style={{ overflow: 'hidden', marginBottom: 20 }}>
            {questions.map((q, i) => (
              <div key={q} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', flex: 1, paddingRight: 12 }}>{q}</span>
                <Toggle checked={answers[q] ?? false} onChange={v => setAnswers(prev => ({ ...prev, [q]: v }))} />
              </div>
            ))}
          </Card>
        )}

        <OrangeButton
          onClick={handleConfirm}
          style={blocked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {blocked ? 'Cannot Log Yet' : 'Confirm Log'}
        </OrangeButton>
      </div>
    </div>
  );
}
