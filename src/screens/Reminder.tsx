import { Bell, Pill, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBar, Card, OrangeButton, SecondaryButton } from '../components';

export default function ReminderScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

        {/* Alert badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E9E3D8', borderRadius: 999, padding: '8px 16px', marginBottom: 24 }}>
          <Bell size={14} color="#804200" />
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: '#804200' }}>Medication Reminder</span>
        </div>

        {/* Icon */}
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Pill size={40} color="white" />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', textAlign: 'center', margin: '0 0 8px', maxWidth: 260 }}>
          Time to take your medication
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', textAlign: 'center', margin: '0 0 24px', fontFamily: 'Geist, sans-serif' }}>
          Don't forget — consistency is key
        </p>

        {/* Med card */}
        <Card style={{ width: '100%', padding: 24, textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 6px' }}>Ritalin 10mg</p>
          <p style={{ fontSize: 14, color: 'var(--color-muted-foreground)', margin: '0 0 16px', fontFamily: 'Geist, sans-serif' }}>1 tablet - Oral</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-secondary)', borderRadius: 999, padding: '6px 14px' }}>
            <Clock3 size={13} color="var(--color-muted-foreground)" />
            <span style={{ fontSize: 13, fontFamily: 'Geist Mono, monospace', color: 'var(--color-muted-foreground)' }}>Scheduled for 2:00 PM</span>
          </div>
        </Card>

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OrangeButton onClick={() => navigate('/log')}>Log Now</OrangeButton>
          <SecondaryButton onClick={() => navigate('/')}>Snooze 10 min</SecondaryButton>
        </div>
      </div>
    </div>
  );
}
