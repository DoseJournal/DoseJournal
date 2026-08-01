import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, NavBar, Card, Toggle, OrangeButton, Input, Select, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

const defaultTimesForFrequency: Record<string, string[]> = {
  'Once daily': ['8:00 AM'],
  'Twice daily': ['9:00 AM', '1:00 PM'],
  'Three times daily': ['8:00 AM', '1:00 PM', '6:00 PM'],
};

export default function AddMedicationScreen() {
  const navigate = useNavigate();
  const { addMedication } = useApp();
  const [form, setForm] = useState({
    name: '', dose: '', unit: 'mg', frequency: 'Once daily',
    times: ['8:00 AM'] as string[],
    indication: '', requirePhoto: false,
    asNeeded: false, minIntervalHours: '4', maxDailyDose: '', maxDailyDoseUnit: 'mg',
  });

  const handleSave = () => {
    if (!form.name) return;
    addMedication({
      name: form.name,
      dose: form.dose,
      unit: form.unit,
      frequency: form.asNeeded ? 'As needed' : form.frequency,
      times: form.asNeeded ? [] : form.times,
      indication: form.indication,
      requirePhoto: form.requirePhoto,
      asNeeded: form.asNeeded,
      minIntervalHours: form.asNeeded && form.minIntervalHours ? parseFloat(form.minIntervalHours) : undefined,
      maxDailyDose: form.asNeeded && form.maxDailyDose ? parseFloat(form.maxDailyDose) : undefined,
      maxDailyDoseUnit: form.asNeeded ? form.maxDailyDoseUnit : undefined,
    });
    navigate('/');
  };

  const field = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));

  const handleFrequencyChange = (freq: string) => {
    setForm(prev => ({
      ...prev,
      frequency: freq,
      times: defaultTimesForFrequency[freq] ?? ['8:00 AM'],
    }));
  };

  const updateTimeAt = (index: number, value: string) => {
    setForm(prev => {
      const next = [...prev.times];
      next[index] = value;
      return { ...prev, times: next };
    });
  };

  const timeSlotLabels = ['First dose', 'Second dose', 'Third dose', 'Fourth dose'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Add Medication" />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Medication Name</SectionLabel>
          <Input placeholder="e.g. Ritalin" value={form.name} onChange={field('name')} />
        </div>

        {/* Dose + unit */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Dose (per tablet)</SectionLabel>
            <Input placeholder="e.g. 10" value={form.dose} onChange={field('dose')} />
          </div>
          <div style={{ width: 120 }}>
            <SectionLabel>Unit</SectionLabel>
            <Select value={form.unit} onChange={field('unit')}>
              <option>mg</option>
              <option>mcg</option>
              <option>g</option>
              <option>ml</option>
            </Select>
          </div>
        </div>

        {/* As Required toggle */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <div>
              <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', display: 'block', marginBottom: 2 }}>As required (PRN)</span>
              <span style={{ fontSize: 12, fontFamily: 'Geist, sans-serif', color: 'var(--color-muted-foreground)' }}>Taken as needed, not on a fixed schedule</span>
            </div>
            <Toggle checked={form.asNeeded} onChange={v => setForm(prev => ({ ...prev, asNeeded: v }))} />
          </div>
        </Card>

        {form.asNeeded ? (
          <>
            {/* Minimum interval */}
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Minimum hours between doses</SectionLabel>
              <Input placeholder="e.g. 4" value={form.minIntervalHours} onChange={field('minIntervalHours')} type="number" />
            </div>

            {/* Max daily dose + unit */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <SectionLabel>Max daily dose</SectionLabel>
                <Input placeholder="e.g. 4000" value={form.maxDailyDose} onChange={field('maxDailyDose')} type="number" />
              </div>
              <div style={{ width: 120 }}>
                <SectionLabel>Unit</SectionLabel>
                <Select value={form.maxDailyDoseUnit} onChange={field('maxDailyDoseUnit')}>
                  <option>mg</option>
                  <option>mcg</option>
                  <option>g</option>
                  <option>ml</option>
                </Select>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Frequency */}
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Frequency</SectionLabel>
              <Select value={form.frequency} onChange={handleFrequencyChange}>
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
              </Select>
            </div>

            {/* Time(s) — one field per dose in the frequency */}
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>{form.times.length > 1 ? 'Times to take' : 'Time to take'}</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.times.map((t, i) => (
                  <div key={i}>
                    {form.times.length > 1 && (
                      <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
                        {timeSlotLabels[i] ?? `Dose ${i + 1}`}
                      </p>
                    )}
                    <Input placeholder="8:00 AM" value={t} onChange={v => updateTimeAt(i, v)} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Photo */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Add photo of tablet</SectionLabel>
          <div style={{ height: 80, background: 'var(--color-secondary)', borderRadius: 16, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            <Camera size={20} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>Tap to add photo</span>
          </div>
        </div>

        {/* Indication */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Indication / Reason (optional)</SectionLabel>
          <Input placeholder="e.g. ADHD focus support" value={form.indication} onChange={field('indication')} />
        </div>

        {/* Require photo toggle */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>Require photo when logging</span>
            <Toggle checked={form.requirePhoto} onChange={v => setForm(prev => ({ ...prev, requirePhoto: v }))} />
          </div>
        </Card>

        <OrangeButton onClick={handleSave}>Save Medication</OrangeButton>
      </div>
    </div>
  );
}
