import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, NavBar, Card, Toggle, OrangeButton, Input, Select, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

const TABLET_SHAPES = ['Round', 'Oval', 'Capsule', 'Oblong', 'Square', 'Triangle', 'Diamond', 'Other'];
const TABLET_COLOURS = ['White', 'Yellow', 'Orange', 'Pink', 'Red', 'Purple', 'Blue', 'Green', 'Brown', 'Grey', 'Black', 'Speckled', 'Other'];

export default function EditMedicationScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { medications, setMedications, session } = useApp();
  const med = medications.find(m => m.id === id);

  const [form, setForm] = useState({
    name: '', dose: '', unit: 'mg', frequency: 'Once daily',
    time: '8:00 AM', indication: '', requirePhoto: false,
    tabletCount: '1',
    appearanceShape: '',
    appearanceColour: '',
    appearanceNotes: '',
    photoDataUrl: '',
    asNeeded: false,
    minIntervalHours: '',
    maxDailyDose: '',
    maxDailyDoseUnit: 'mg',
  });

  useEffect(() => {
    if (!med) return;
    const appParts = (med.appearance ?? '').split(' · ');
    setForm({
      name: med.name,
      dose: med.dose,
      unit: med.unit,
      frequency: med.frequency,
      time: med.times[0] ?? '8:00 AM',
      indication: med.indication ?? '',
      requirePhoto: med.requirePhoto,
      tabletCount: med.tabletCount ?? '1',
      appearanceShape: appParts[0] ?? '',
      appearanceColour: appParts[1] ?? '',
      appearanceNotes: appParts[2] ?? '',
      photoDataUrl: '',
      asNeeded: med.asNeeded ?? false,
      minIntervalHours: med.minIntervalHours?.toString() ?? '',
      maxDailyDose: med.maxDailyDose?.toString() ?? '',
      maxDailyDoseUnit: med.maxDailyDoseUnit ?? 'mg',
    });
  }, [id]);

  if (!med) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
        <StatusBar />
        <NavBar title="Edit Medication" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>Medication not found.</p>
        </div>
      </div>
    );
  }

  const field = (key: string) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    if (!form.name) return;
    const appearance = [form.appearanceShape, form.appearanceColour, form.appearanceNotes].filter(Boolean).join(' · ');
    const updated = {
      ...med,
      name: form.name,
      dose: form.dose,
      unit: form.unit,
      frequency: form.asNeeded ? 'As Required' : form.frequency,
      times: form.asNeeded ? [] : [form.time],
      indication: form.indication,
      requirePhoto: form.requirePhoto,
      tabletCount: form.tabletCount,
      appearance: appearance || undefined,
      asNeeded: form.asNeeded,
      minIntervalHours: form.asNeeded && form.minIntervalHours ? Number(form.minIntervalHours) : undefined,
      maxDailyDose: form.asNeeded && form.maxDailyDose ? Number(form.maxDailyDose) : undefined,
      maxDailyDoseUnit: form.asNeeded && form.maxDailyDose ? form.maxDailyDoseUnit : undefined,
    };
    setMedications(prev => prev.map(m => m.id === id ? updated : m));
    // Sync to Supabase
    if (session) {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('medications').update({
        name: updated.name, dose: updated.dose, unit: updated.unit,
        frequency: updated.frequency, times: updated.times,
        indication: updated.indication, require_photo: updated.requirePhoto,
        tablet_count: updated.tabletCount, appearance: updated.appearance,
        as_needed: updated.asNeeded ?? false,
        min_interval_hours: updated.minIntervalHours,
        max_daily_dose: updated.maxDailyDose,
        max_daily_dose_unit: updated.maxDailyDoseUnit,
      }).eq('id', id);
    }
    navigate('/settings');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Edit Medication" />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Medication Name</SectionLabel>
          <Input placeholder="e.g. Paracetamol" value={form.name} onChange={field('name')} />
        </div>

        {/* Dose + unit */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>{form.asNeeded ? 'Dose per tablet / capsule' : 'Dose'}</SectionLabel>
            <Input placeholder="e.g. 500" value={form.dose} onChange={field('dose')} />
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
        {form.asNeeded && (
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '-4px 0 16px', lineHeight: 1.5 }}>
            Enter the dose in a single tablet or capsule. The app will multiply this by the number of tablets taken each time.
          </p>
        )}
        {!form.asNeeded && <div style={{ marginBottom: 8 }} />}

        {/* Tablet count */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Number of tablets per dose</SectionLabel>
          <Select value={form.tabletCount} onChange={field('tabletCount')}>
            {['0.5','1','1.5','2','2.5','3','4','5'].map(n => <option key={n} value={n}>{n} tablet{n === '1' ? '' : 's'}</option>)}
          </Select>
        </div>

        {/* As-required toggle (show for non-preset only) */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>As required medication</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>e.g. Paracetamol — track time until next safe dose</p>
            </div>
            <Toggle checked={form.asNeeded} onChange={(v: boolean) => setForm(prev => ({ ...prev, asNeeded: v }))} />
          </div>
        </Card>

        {!form.asNeeded && (
          <>
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Frequency</SectionLabel>
              <Select value={form.frequency} onChange={field('frequency')}>
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
                <option>Four times daily</option>
              </Select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Time to take</SectionLabel>
              <Input placeholder="e.g. 8:00 AM" value={form.time} onChange={field('time')} />
            </div>
          </>
        )}

        {form.asNeeded && (
          <>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.6 }}>
                <strong>Please enter these details exactly as directed by your pharmacist or doctor.</strong> DoseJournal calculates countdowns and daily totals purely from what you enter here — it has no built-in dosing knowledge. Double-check against your medication packaging or prescriber's instructions.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Minimum time between doses (hours)</SectionLabel>
              <Input placeholder="e.g. 4 or 6.5 — as directed" value={form.minIntervalHours} onChange={field('minIntervalHours')} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Maximum total dose per 24 hours</SectionLabel>
              {form.unit === 'ml' ? (
                <p style={{ fontSize: 12, color: '#804200', fontFamily: 'Inter, sans-serif', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Dose unit is "ml" — this can't be converted to mg/mcg/g, so daily totals can't be calculated for this medication.
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Input placeholder="e.g. total max — as directed" value={form.maxDailyDose} onChange={field('maxDailyDose')} />
                  </div>
                  <div style={{ width: 110 }}>
                    <Select value={form.maxDailyDoseUnit} onChange={field('maxDailyDoseUnit')}>
                      <option>mg</option>
                      <option>mcg</option>
                      <option>g</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Indication (optional)</SectionLabel>
          <Input placeholder="e.g. Blood pressure" value={form.indication} onChange={field('indication')} />
        </div>

        {/* Appearance */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Tablet appearance (optional)</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Select value={form.appearanceShape} onChange={field('appearanceShape')} style={{ flex: 1 }}>
              <option value="">Shape...</option>
              {TABLET_SHAPES.map(s => <option key={s}>{s}</option>)}
            </Select>
            <Select value={form.appearanceColour} onChange={field('appearanceColour')} style={{ flex: 1 }}>
              <option value="">Colour...</option>
              {TABLET_COLOURS.map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <Input placeholder="Any other notes (e.g. scored, coating)" value={form.appearanceNotes} onChange={field('appearanceNotes')} />
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Require photo when logging</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>Must photograph medication to log</p>
            </div>
            <Toggle checked={form.requirePhoto} onChange={(v: boolean) => setForm(prev => ({ ...prev, requirePhoto: v }))} />
          </div>
        </Card>

        <OrangeButton onClick={handleSave}>Save Changes</OrangeButton>
      </div>
    </div>
  );
}
