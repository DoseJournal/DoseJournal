import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { StatusBar, NavBar, BottomNav, Card, OrangeButton, Select, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

export default function EditLogScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { medications, logs, addLog, updateLog, deleteLog } = useApp();

  const logId = searchParams.get('id'); // null = new retrospective log
  const existing = logId ? logs.find(l => l.id === logId) : null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localIsoDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const localTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [medId, setMedId] = useState(existing?.medicationId ?? medications.filter(m => !m.asNeeded)[0]?.id ?? '');
  const [date, setDate] = useState(() => {
    if (existing) {
      const d = new Date(existing.timestamp);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    return localIsoDate;
  });
  const [time, setTime] = useState(() => {
    if (existing) {
      const d = new Date(existing.timestamp);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return localTime;
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const regularMeds = medications.filter(m => !m.asNeeded);

  const handleSave = async () => {
    if (!medId) return;
    const timestamp = new Date(`${date}T${time}:00`);
    if (existing) {
      await updateLog(existing.id, { medicationId: medId, timestamp });
    } else {
      await addLog({
        medicationId: medId,
        timestamp,
        status: 'taken',
        questions: [],
      });
    }
    navigate('/calendar');
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteLog(existing.id);
    navigate('/calendar');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title={existing ? 'Edit Log Entry' : 'Add Past Dose'} />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {!existing && (
          <Card style={{ padding: '14px 16px', marginBottom: 20, background: 'var(--color-info)' }}>
            <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-info-foreground)', margin: 0, lineHeight: 1.5 }}>
              Use this to record a dose that was taken but not logged at the time — for example, if you forgot to log your 9am paracetamol.
            </p>
          </Card>
        )}

        {/* Medication selector */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Medication</SectionLabel>
          {regularMeds.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>No regular medications added yet.</p>
          ) : (
            <Select value={medId} onChange={setMedId}>
              {regularMeds.map(m => (
                <option key={m.id} value={m.id}>{m.name} {m.dose}{m.unit}</option>
              ))}
            </Select>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Date taken</SectionLabel>
          <input
            type="date"
            value={date}
            max={localIsoDate}
            onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--color-border)',
              background: 'var(--color-card)', padding: '0 16px', fontSize: 15,
              fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', outline: 'none',
              boxShadow: 'var(--shadow-card)', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Time */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Time taken</SectionLabel>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{
              width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--color-border)',
              background: 'var(--color-card)', padding: '0 16px', fontSize: 15,
              fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', outline: 'none',
              boxShadow: 'var(--shadow-card)', boxSizing: 'border-box',
            }}
          />
        </div>

        <OrangeButton onClick={handleSave}>
          {existing ? 'Save Changes' : 'Add Log Entry'}
        </OrangeButton>

        {existing && (
          <button
            onClick={handleDelete}
            style={{
              width: '100%', height: 48, marginTop: 12, borderRadius: 999,
              background: confirmDelete ? 'var(--color-destructive)' : 'var(--color-card)',
              border: `1px solid ${confirmDelete ? 'var(--color-destructive)' : 'var(--color-border)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
              color: confirmDelete ? 'white' : 'var(--color-destructive)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Trash2 size={16} />
            {confirmDelete ? 'Tap again to confirm delete' : 'Delete this log entry'}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
