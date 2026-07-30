import { House, Pill, Calendar, ChartNoAxesColumn, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: false });

  return (
    <div style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--color-foreground)' }}>{time}</span>
    </div>
  );
}

const tabs = [
  { label: 'HOME', icon: House, path: '/' },
  { label: 'LOG', icon: Pill, path: '/log' },
  { label: 'CALENDAR', icon: Calendar, path: '/calendar' },
  { label: 'INSIGHTS', icon: ChartNoAxesColumn, path: '/insights' },
  { label: 'SETTINGS', icon: Settings, path: '/settings' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ padding: '12px 21px 21px', flexShrink: 0 }}>
      <div style={{
        background: 'var(--color-card)',
        borderRadius: 36,
        height: 62,
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        {tabs.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: 54,
                borderRadius: 26,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <tab.icon size={16} color={active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)'} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontFamily: 'Geist, sans-serif',
                color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
              }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 24,
        borderRadius: 999,
        border: 'none',
        background: checked ? 'var(--color-primary)' : 'var(--color-secondary)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: 2,
        left: checked ? 18 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      borderRadius: 16,
      border: '1px solid var(--color-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color: 'var(--color-muted-foreground)',
      marginBottom: 8,
      fontFamily: 'Geist, sans-serif',
    }}>
      {children}
    </div>
  );
}

export function OrangeButton({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      height: 48,
      borderRadius: 999,
      background: 'var(--color-primary)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--color-primary-foreground)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...style,
    }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      height: 48,
      borderRadius: 999,
      background: 'var(--color-secondary)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--color-foreground)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...style,
    }}>
      {children}
    </button>
  );
}

export function NavBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', flexShrink: 0 }}>
      <button onClick={onBack || (() => navigate(-1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>
      <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)' }}>{title}</span>
    </div>
  );
}

export function Input({ placeholder, value, onChange, style, type }: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      style={{
        height: 40,
        borderRadius: 999,
        background: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
        padding: '0 16px',
        fontSize: 14,
        fontFamily: 'Geist, sans-serif',
        color: 'var(--color-foreground)',
        width: '100%',
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

export function Select({ value, onChange, children, style }: {
  value?: string;
  onChange?: (v: string) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      style={{
        height: 40,
        borderRadius: 999,
        background: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
        padding: '0 16px',
        fontSize: 14,
        fontFamily: 'Geist, sans-serif',
        color: 'var(--color-foreground)',
        width: '100%',
        outline: 'none',
        appearance: 'none',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function StatusBadge({ status }: { status: 'taken' | 'pending' | 'missed' | 'upcoming' }) {
  const config = {
    taken: { bg: '#DFE6E1', color: '#004D1A', label: 'Taken', icon: '✓' },
    pending: { bg: '#E9E3D8', color: '#804200', label: 'Pending', icon: '⏱' },
    missed: { bg: '#E5DCDA', color: '#8C1C00', label: 'Missed', icon: '✗' },
    upcoming: { bg: '#DFDFE6', color: '#000066', label: 'Upcoming', icon: '→' },
  };
  const c = config[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: c.bg,
      color: c.color,
      borderRadius: 999,
      padding: '4px 10px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'Geist, sans-serif',
    }}>
      <span>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
}
