import { Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBar, NavBar, Card, Toggle, OrangeButton, Input, Select, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

const TABLET_SHAPES = ['Round', 'Oval', 'Capsule', 'Oblong', 'Square', 'Triangle', 'Diamond', 'Other'];
const TABLET_COLOURS = ['White', 'Yellow', 'Orange', 'Pink', 'Red', 'Purple', 'Blue', 'Green', 'Brown', 'Grey', 'Black', 'Speckled', 'Other'];

async function getExistingSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

async function registerPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return;

    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC_KEY) return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });

    await fetch('/api/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

export default function AddMedicationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetAsNeeded = searchParams.get('asNeeded') === '1';
  const { addMedication, medications } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [form, setForm] = useState({
    name: '', dose: '', unit: 'mg', frequency: 'Once daily',
    time: '8:00 AM', indication: '', requirePhoto: false,
    tabletCount: '1',
    appearanceShape: '',
    appearanceColour: '',
    appearanceNotes: '',
    photoDataUrl: '',
    selectedQuestions: [] as string[],
    asNeeded: presetAsNeeded,
    minIntervalHours: '',
    maxDailyDose: '',
    maxDailyDoseUnit: 'mg',
  });

  const promptForNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerPushSubscription();
    } else {
      setShowNotifBanner(true);
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    const appearance = [form.appearanceShape, form.appearanceColour, form.appearanceNotes]
      .filter(Boolean).join(' · ');
    addMedication({
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
    });

    // Prompt for notifications on first medication added
    const isFirstMed = medications.length === 0;
    const alreadySubscribed = await getExistingSubscription();
    if (isFirstMed && !alreadySubscribed) {
      await promptForNotifications();
    }

    navigate('/');
  };

  const field = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(prev => ({ ...prev, photoDataUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title={presetAsNeeded ? "Add As Required Medication" : "Add Medication"} />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Notification banner (shown if permission denied) */}
        {showNotifBanner && (
          <div style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.5 }}>
              Enable notifications to get dose reminders. You can also turn these on in your device Settings.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={promptForNotifications}
                style={{
                  flex: 1, background: 'var(--color-primary)', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 0', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Enable now
              </button>
              <button
                onClick={() => setShowNotifBanner(false)}
                style={{
                  flex: 1, background: 'var(--color-secondary)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)',
                  borderRadius: 10, padding: '10px 0', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Medication Name</SectionLabel>
          <Input placeholder="e.g. Metformin" value={form.name} onChange={field('name')} />
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
            {['0.5','1','1.5','2','2.5','3','4','5'].map(n => (
              <option key={n} value={n}>{n} {n === '1' ? 'tablet' : 'tablets'}</option>
            ))}
          </Select>
        </div>

        {/* As-needed toggle (only shown if not preset) */}
        {!presetAsNeeded && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>As Required medication</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>e.g. Paracetamol — track time until next safe dose</p>
              </div>
              <Toggle checked={form.asNeeded} onChange={v => setForm(prev => ({ ...prev, asNeeded: v }))} />
            </div>
          </Card>
        )}

        {/* Frequency + time (scheduled meds only) */}
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

        {/* As-needed disclaimer + free-text fields */}
        {form.asNeeded && (
          <>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.6 }}>
                <strong>Please enter these details exactly as directed by your pharmacist or doctor.</strong> MedLedger calculates your countdown and daily dose totals purely from what you enter here — it does not know any standard dosing information and cannot suggest safe values. Double-check the dose, unit, minimum interval, and maximum daily dose against the medication packaging or your prescriber's instructions before saving.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Minimum time between doses (hours)</SectionLabel>
              <Input placeholder="e.g. 4 or 6.5 — as directed" value={form.minIntervalHours} onChange={field('minIntervalHours')} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Maximum total dose per 24 hours</SectionLabel>
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 10px' }}>
                The app will add up every logged dose ({form.dose || '?'}{form.unit || ''} each), convert it to the unit you choose here, and alert you on the home screen once this total is reached in a 24-hour period.
              </p>
              {form.unit === 'ml' ? (
                <p style={{ fontSize: 12, color: '#804200', fontFamily: 'Inter, sans-serif', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Dose unit is "ml" — this can't be converted to mg/mcg/g, so daily totals can't be calculated for this medication. Leave this blank if your dose is in ml.
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

        {/* Tablet appearance */}
        <div style={{ marginBottom: 4 }}>
          <SectionLabel>Tablet appearance (optional)</SectionLabel>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <Select value={form.appearanceShape} onChange={field('appearanceShape')}>
              <option value="">Shape...</option>
              {TABLET_SHAPES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <Select value={form.appearanceColour} onChange={field('appearanceColour')}>
              <option value="">Colour...</option>
              {TABLET_COLOURS.map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input placeholder="e.g. scored, film-coated, imprint M30" value={form.appearanceNotes} onChange={field('appearanceNotes')} />
        </div>

        {/* Photo of tablet */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Photo of tablet (optional)</SectionLabel>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
          {form.photoDataUrl ? (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 120 }}>
              <img src={form.photoDataUrl} alt="Tablet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setForm(p => ({ ...p, photoDataUrl: '' }))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ height: 80, background: 'var(--color-secondary)', borderRadius: 14, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
              <Camera size={20} color="var(--color-muted-foreground)" />
              <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif' }}>Tap to add photo</span>
            </div>
          )}
        </div>

        {/* Indication */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Reason / Indication (optional)</SectionLabel>
          <Input placeholder="e.g. Type 2 diabetes" value={form.indication} onChange={field('indication')} />
        </div>

        {/* Logging questions (scheduled meds only) */}
        {!form.asNeeded && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Questions to ask when logging (optional)</SectionLabel>
            <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 10px' }}>These will appear every time you log this medication.</p>
            {[
              'Did you eat before taking?',
              'Did you take your full dose?',
              'Did you drink water with it?',
              'Were you at home?',
              'Taking early or late?',
            ].map(q => (
              <button
                key={q}
                onClick={() => {
                  const current = form.selectedQuestions ?? [];
                  const next = current.includes(q) ? current.filter(x => x !== q) : [...current, q];
                  setForm(p => ({ ...p, selectedQuestions: next }));
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  background: 'var(--color-card)', border: '1px solid var(--color-border)',
                  borderRadius: 10, padding: '10px 14px', cursor: 'pointer', marginBottom: 8,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 5, border: '2px solid var(--color-primary)',
                  background: (form.selectedQuestions ?? []).includes(q) ? 'var(--color-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {(form.selectedQuestions ?? []).includes(q) && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', textAlign: 'left' }}>{q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Require photo toggle */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)' }}>Require photo when logging</span>
            <Toggle checked={form.requirePhoto} onChange={v => setForm(prev => ({ ...prev, requirePhoto: v }))} />
          </div>
        </Card>

        <OrangeButton onClick={handleSave}>Save Medication</OrangeButton>
        {form.asNeeded && !form.dose && (
          <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', textAlign: 'center', margin: '10px 0 0' }}>
            Tip: enter the dose per tablet/dose above so the app can calculate your daily total correctly.
          </p>
        )}
      </div>
    </div>
  );
}
