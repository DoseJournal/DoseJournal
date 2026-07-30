import { Clock3, Camera, X, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, NavBar, BottomNav, Card, Toggle, OrangeButton } from '../components';
import { useApp } from '../context/AppContext';


export default function LogScreen() {
  const navigate = useNavigate();
  const { settings, addLog, addPRNDose, medications } = useApp();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<string>(medications[0]?.id ?? '');
  const [prnTablets, setPrnTablets] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const questions = settings.loggingQuestionsEnabled
    ? (settings.loggingQuestions ?? [])
    : [];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  const selectedMedInfo = medications.find(m => m.id === selectedMedId);
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!selectedMedId) return;
    const med = medications.find(m => m.id === selectedMedId);

    if (med?.asNeeded) {
      addPRNDose({ medicationId: selectedMedId, timestamp: now, tabletsCount: prnTablets });
      navigate('/log/success', {
        state: {
          medName: med ? `${med.name} ${med.dose}${med.unit}` : '',
          photoDataUrl: photoDataUrl ?? null,
          timestamp: now.toISOString(),
        }
      });
      return;
    }

    addLog({
      medicationId: selectedMedId,
      timestamp: now,
      status: 'taken',
      photoDataUrl: photoDataUrl ?? undefined,
      questions: questions.map(q => ({ question: q, answer: answers[q] ?? false })),
    });
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
          <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>No medications added yet.</p>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>Add your medications in Settings first.</p>
        </div>
        <BottomNav />
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
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>Medication</p>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedMedId}
              onChange={e => setSelectedMedId(e.target.value)}
              style={{ width: '100%', height: 48, borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', padding: '0 40px 0 16px', fontSize: 15, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', appearance: 'none', outline: 'none', cursor: 'pointer' }}
            >
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name} {m.dose}{m.unit}{m.asNeeded ? ' (as required)' : ''}</option>
              ))}
            </select>
            <ChevronDown size={16} color="var(--color-muted-foreground)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {selectedMedInfo?.asNeeded && (
          <>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.5 }}>
                This is an as required medication.{selectedMedInfo.minIntervalHours ? ` A ${selectedMedInfo.minIntervalHours}-hour countdown will start on your home screen.` : ''}
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>
                How many {selectedMedInfo.name} did you take?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setPrnTablets(n)} style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid', borderColor: prnTablets === n ? 'var(--color-primary)' : 'var(--color-border)', background: prnTablets === n ? 'var(--color-primary)' : 'var(--color-card)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: prnTablets === n ? 'var(--color-primary-foreground)' : 'var(--color-foreground)', transition: 'all 0.12s' }}>
                    {n}
                  </button>
                ))}
              </div>
              {selectedMedInfo.dose && (
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '8px 0 0' }}>
                  = {prnTablets * parseFloat(selectedMedInfo.dose)}{selectedMedInfo.unit} total
                </p>
              )}
            </div>
          </>
        )}

        {/* Time */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-secondary)', borderRadius: 999, padding: '6px 12px' }}>
            <Clock3 size={13} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-muted-foreground)' }}>{timeStr}</span>
          </div>
        </div>

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
            <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>Tap to take photo</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', opacity: 0.7 }}>Stored locally on your device</span>
          </div>
        )}

        {/* Questions */}
        {!selectedMedInfo?.asNeeded && questions.length > 0 && (
          <Card style={{ overflow: 'hidden', marginBottom: 20 }}>
            {questions.map((q, i) => (
              <div key={q} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', flex: 1, paddingRight: 12 }}>{q}</span>
                <Toggle checked={answers[q] ?? false} onChange={v => setAnswers(prev => ({ ...prev, [q]: v }))} />
              </div>
            ))}
          </Card>
        )}

        <OrangeButton onClick={handleConfirm}>Confirm Log</OrangeButton>
      </div>
      <BottomNav />
    </div>
  );
}
