import { CheckCircle2, Image } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrangeButton, SecondaryButton } from '../components';

export default function LogSuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { medName, photoDataUrl, timestamp } = (location.state ?? {}) as {
    medName?: string;
    photoDataUrl?: string;
    timestamp?: string;
  };

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)', padding: '60px 28px 40px', alignItems: 'center', justifyContent: 'center' }}>

      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <CheckCircle2 size={44} color="var(--color-primary)" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 8px', textAlign: 'center' }}>
        Logged!
      </h1>

      {medName && (
        <p style={{ fontSize: 16, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: '0 0 4px', textAlign: 'center' }}>
          {medName}
        </p>
      )}
      {timeStr && (
        <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', fontFamily: 'Geist Mono, monospace', margin: '0 0 32px', textAlign: 'center' }}>
          {timeStr}
        </p>
      )}

      {photoDataUrl && (
        <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 32, maxHeight: 220 }}>
          <img src={photoDataUrl} alt="Medication" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <OrangeButton onClick={() => navigate('/')}>Back to Home</OrangeButton>
        <SecondaryButton onClick={() => navigate('/history')}>
          <Image size={16} />
          View Photo History
        </SecondaryButton>
      </div>
    </div>
  );
}
