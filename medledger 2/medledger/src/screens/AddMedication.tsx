import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, NavBar, Card, Toggle, OrangeButton, Input, Select, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

export default function AddMedicationScreen() {
  const navigate = useNavigate();
  const { addMedication } = useApp();
  const [form, setForm] = useState({
    name: '', dose: '', unit: 'mg', frequency: 'Once daily',
    time: '8:00 AM', indication: '', requirePhoto: false,
  });

  const handleSave = () => {
    if (!form.name) return;
    addMedication({
      name: form.name,
      dose: form.dose,
      unit: form.unit,
      frequency: form.frequency,
      times: [form.time],
      indication: form.indication,
      requirePhoto: form.requirePhoto,
    });
    navigate('/');
  };

  const field = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Add Medication" />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Medication Name</SectionLabel>
          <Input placeholder="e.g. Adderall XR" value={form.name} onChange={field('name')} />
        </div>

        {/* Dose + unit */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Dose</SectionLabel>
            <Input placeholder="e.g. 20" value={form.dose} onChange={field('dose')} />
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

        {/* Frequency */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Frequency</SectionLabel>
          <Select value={form.frequency} onChange={field('frequency')}>
            <option>Once daily</option>
            <option>Twice daily</option>
            <option>Three times daily</option>
            <option>As needed</option>
          </Select>
        </div>

        {/* Time */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Time(s) to take</SectionLabel>
          <Input placeholder="8:00 AM" value={form.time} onChange={field('time')} />
        </div>

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
