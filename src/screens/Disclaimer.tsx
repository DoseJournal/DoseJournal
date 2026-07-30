import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBar, OrangeButton } from '../components';

export default function DisclaimerScreen() {
  const [accepted, setAccepted] = useState(false);
  const { updateSettings } = useApp();
  const navigate = useNavigate();

  const handleAccept = () => {
    if (!accepted) return;
    updateSettings({ disclaimerAccepted: true });
    navigate('/');
  };

  const sections = [
    {
      title: 'PURPOSE',
      body: 'MedLedger is a personal tracking tool designed to help you record your medication use, contextual factors, and any side effects you observe. It is intended solely as a self-management and personal logging aid.',
    },
    {
      title: 'NOT MEDICAL ADVICE',
      body: 'This app does not provide medical advice, diagnosis, or treatment recommendations. Nothing in this app should be interpreted as professional medical advice or as a substitute for consultation with a qualified healthcare professional. Always consult your doctor, pharmacist, or other qualified healthcare provider before making any decisions about your medications.',
    },
    {
      title: 'NOT A MEDICAL DEVICE',
      body: 'This app is not a registered therapeutic good and has not been evaluated or approved by the Therapeutic Goods Administration (TGA) or any other regulatory body. It does not perform clinical analysis or interpret your health data.',
    },
    {
      title: 'EMERGENCY SITUATIONS',
      body: 'If you believe you are experiencing a medical emergency or a serious adverse drug reaction, call 000 (Australia) or your local emergency services immediately. Do not rely on this app in an emergency.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldCheck size={40} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 4px', textAlign: 'center' }}>MedLedger</h1>
          <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', margin: 0, fontFamily: 'Geist, sans-serif' }}>Important Disclaimer</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {sections.map(s => (
            <div key={s.title}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px', fontFamily: 'Geist, sans-serif', letterSpacing: '0.3px' }}>{s.title}</h2>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-foreground)', margin: 0, fontFamily: 'Geist, sans-serif' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px', background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setAccepted(!accepted)}
            style={{
              width: 24, height: 24, borderRadius: 6, border: '2px solid var(--color-primary)',
              background: accepted ? 'var(--color-primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {accepted && <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✓</span>}
          </button>
          <span style={{ fontSize: 14, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>
            I have read and understand this disclaimer
          </span>
        </div>

        <OrangeButton onClick={handleAccept} style={{ opacity: accepted ? 1 : 0.5 }}>
          I Understand & Accept
        </OrangeButton>
      </div>
    </div>
  );
}
