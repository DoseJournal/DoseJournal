import { useState } from 'react';
import { Plus, Trash2, Pill } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Input, Select, OrangeButton, SecondaryButton, Toggle } from '../components';

type MedDraft = {
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  time: string;
  indication: string;
  requirePhoto: boolean;
};

const STEPS = ['welcome', 'name', 'disclaimer', 'meds', 'prefs', 'done'] as const;
type Step = typeof STEPS[number];

const ACCENT_COLORS = [
  { key: 'purple', hex: '#863bff' },
  { key: 'orange', hex: '#FF8400' },
  { key: 'teal', hex: '#38BDF8' },
  { key: 'pink', hex: '#EC4899' },
  { key: 'green', hex: '#22C55E' },
  { key: 'indigo', hex: '#6366F1' },
];

function ProgressDots({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{
          width: i === idx ? 20 : 6, height: 6, borderRadius: 999,
          background: i <= idx ? 'var(--color-primary)' : 'var(--color-border)',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
}

export default function OnboardingScreen() {
  const { addMedication, updateSettings } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState('purple');
  const [meds, setMeds] = useState<MedDraft[]>([]);
  const [medForm, setMedForm] = useState<MedDraft>({
    name: '', dose: '', unit: 'mg', frequency: 'Once daily',
    time: '8:00 AM', indication: '', requirePhoto: false,
  });
  const [addingMed, setAddingMed] = useState(false);

  const next = () => setStep(s => STEPS[STEPS.indexOf(s) + 1]);
  const back = () => setStep(s => STEPS[STEPS.indexOf(s) - 1]);

  const addMed = () => {
    if (!medForm.name) return;
    setMeds(prev => [...prev, { ...medForm }]);
    setMedForm({ name: '', dose: '', unit: 'mg', frequency: 'Once daily', time: '8:00 AM', indication: '', requirePhoto: false });
    setAddingMed(false);
  };

  const removeMed = (i: number) => setMeds(prev => prev.filter((_, idx) => idx !== i));

  const finish = () => {
    meds.forEach(m => addMedication({
      name: m.name, dose: m.dose, unit: m.unit,
      frequency: m.frequency, times: [m.time],
      indication: m.indication, requirePhoto: m.requirePhoto,
    }));
    updateSettings({
      userName: name,
      accentColor,
      darkMode,
      disclaimerAccepted: true,
      onboardingComplete: true,
    });
  };

  const wrap = (children: React.ReactNode, canNext?: boolean, onNext?: () => void, onBack?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', padding: '60px 28px 40px' }}>
      <ProgressDots step={step} />
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <OrangeButton onClick={onNext ?? next} style={{ opacity: canNext === false ? 0.4 : 1 }}>
          Continue
        </OrangeButton>
        {onBack !== undefined && (
          <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        )}
      </div>
    </div>
  );

  // ── WELCOME ──────────────────────────────────────────────
  if (step === 'welcome') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', padding: '60px 28px 40px', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: 28, background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 4px 24px rgba(134,59,255,0.15)' }}>
        <Pill size={48} color="var(--color-primary)" />
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 12px', textAlign: 'center' }}>MedLedger</h1>
      <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', textAlign: 'center', lineHeight: 1.6, margin: '0 0 48px' }}>
        Your personal medication tracker. Let's get you set up in a couple of minutes.
      </p>
      <OrangeButton onClick={next}>Get Started</OrangeButton>
    </div>
  );

  // ── NAME ─────────────────────────────────────────────────
  if (step === 'name') return wrap(
    <>
      <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>What's your name?</h2>
      <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 28px', lineHeight: 1.5 }}>
        We'll use this to personalise your experience.
      </p>
      <Input
        placeholder="Your first name"
        value={name}
        onChange={setName}
        style={{ height: 52, fontSize: 16, borderRadius: 16 }}
      />
    </>,
    name.trim().length > 0,
    next,
    back,
  );

  // ── DISCLAIMER ───────────────────────────────────────────
  if (step === 'disclaimer') {
    const sections = [
      { title: 'PURPOSE', body: 'MedLedger is a personal tracking tool to record medication use, contextual factors, and side effects. It is solely a self-management logging aid.' },
      { title: 'NOT MEDICAL ADVICE', body: 'This app does not provide medical advice, diagnosis, or treatment recommendations. Always consult your doctor or pharmacist before changing your medications.' },
      { title: 'NOT A MEDICAL DEVICE', body: 'Not a registered therapeutic good. Not evaluated by the TGA or any other regulatory body. Does not perform clinical analysis.' },
      { title: 'EMERGENCIES', body: 'If you think you are experiencing a medical emergency, call 000 immediately. Do not rely on this app in an emergency.' },
    ];
    return wrap(
      <>
        <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>Important disclaimer</h2>
        <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 24px' }}>Please read before continuing.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {sections.map(s => (
            <div key={s.title}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px', fontFamily: 'Geist, sans-serif', letterSpacing: '0.5px' }}>{s.title}</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-foreground)', margin: 0, fontFamily: 'Geist, sans-serif' }}>{s.body}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setDisclaimerChecked(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px', width: '100%', cursor: 'pointer' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid var(--color-primary)', background: disclaimerChecked ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {disclaimerChecked && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', textAlign: 'left' }}>I have read and understand this disclaimer</span>
        </button>
      </>,
      disclaimerChecked,
      next,
      back,
    );
  }

  // ── MEDICATIONS ──────────────────────────────────────────
  if (step === 'meds') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', padding: '60px 28px 40px' }}>
      <ProgressDots step={step} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>Your medications</h2>
        <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 24px', lineHeight: 1.5 }}>
          Add the medications you want to track. You can add more later.
        </p>

        {/* Added meds list */}
        {meds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {meds.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '12px 16px' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>{m.dose}{m.unit} · {m.frequency} · {m.time}</p>
                </div>
                <button onClick={() => removeMed(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={16} color="var(--color-muted-foreground)" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add med form */}
        {addingMed ? (
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Medication name</p>
              <Input placeholder="e.g. Metformin" value={medForm.name} onChange={v => setMedForm(p => ({ ...p, name: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Dose</p>
                <Input placeholder="500" value={medForm.dose} onChange={v => setMedForm(p => ({ ...p, dose: v }))} />
              </div>
              <div style={{ width: 110 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Unit</p>
                <Select value={medForm.unit} onChange={v => setMedForm(p => ({ ...p, unit: v }))}>
                  <option>mg</option><option>mcg</option><option>g</option><option>ml</option>
                </Select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Frequency</p>
              <Select value={medForm.frequency} onChange={v => setMedForm(p => ({ ...p, frequency: v }))}>
                <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option>
              </Select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Time to take</p>
              <Input placeholder="8:00 AM" value={medForm.time} onChange={v => setMedForm(p => ({ ...p, time: v }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif' }}>Reason (optional)</p>
              <Input placeholder="e.g. Type 2 diabetes" value={medForm.indication} onChange={v => setMedForm(p => ({ ...p, indication: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <OrangeButton onClick={addMed} style={{ opacity: medForm.name ? 1 : 0.4 }}>Add</OrangeButton>
              <SecondaryButton onClick={() => setAddingMed(false)}>Cancel</SecondaryButton>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingMed(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', marginBottom: 16 }}
          >
            <Plus size={18} color="var(--color-primary)" />
            <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-primary)', fontWeight: 600 }}>Add a medication</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <OrangeButton onClick={next}>
          {meds.length === 0 ? 'Skip for now' : `Continue with ${meds.length} medication${meds.length > 1 ? 's' : ''}`}
        </OrangeButton>
        <SecondaryButton onClick={back}>Back</SecondaryButton>
      </div>
    </div>
  );

  // ── PREFERENCES ──────────────────────────────────────────
  if (step === 'prefs') return wrap(
    <>
      <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px' }}>Personalise</h2>
      <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 28px' }}>Choose your look and feel.</p>

      <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 12px', fontFamily: 'Geist, sans-serif' }}>Accent colour</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {ACCENT_COLORS.map(c => (
          <button
            key={c.key}
            onClick={() => setAccentColor(c.key)}
            style={{
              width: 40, height: 40, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer',
              boxShadow: accentColor === c.key ? `0 0 0 3px var(--color-background), 0 0 0 5px ${c.hex}` : 'none',
              transition: 'box-shadow 0.2s',
            }}
          />
        ))}
      </div>

      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Dark mode</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Easier on the eyes at night</p>
          </div>
          <Toggle checked={darkMode} onChange={v => {
            setDarkMode(v);
            document.documentElement.classList.toggle('dark', v);
          }} />
        </div>
      </div>
    </>,
    true,
    next,
    back,
  );

  // ── DONE ─────────────────────────────────────────────────
  if (step === 'done') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', padding: '60px 28px 40px', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 12px', textAlign: 'center' }}>
        You're all set{name ? `, ${name}` : ''}!
      </h1>
      <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', textAlign: 'center', lineHeight: 1.6, margin: '0 0 48px' }}>
        MedLedger is ready to go. Start logging your medications and tracking how you feel.
      </p>
      <OrangeButton onClick={finish}>Go to MedLedger</OrangeButton>
    </div>
  );

  return null;
}
