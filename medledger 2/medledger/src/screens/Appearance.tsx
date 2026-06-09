import { Check } from 'lucide-react';

import { StatusBar, BottomNav, NavBar, Card, Toggle, SectionLabel } from '../components';
import { useApp } from '../context/AppContext';

const accentColors = [
  { id: 'orange', hex: '#FF8400', label: 'Orange' },
  { id: 'teal', hex: '#38BDF8', label: 'Teal' },
  { id: 'purple', hex: '#A855F7', label: 'Purple' },
  { id: 'green', hex: '#22C55E', label: 'Green' },
  { id: 'pink', hex: '#EC4899', label: 'Pink' },
  { id: 'grey', hex: '#6B7280', label: 'Grey' },
  { id: 'red', hex: '#EF4444', label: 'Red' },
  { id: 'blue', hex: '#3B82F6', label: 'Blue' },
  { id: 'coral', hex: '#F97316', label: 'Coral' },
  { id: 'indigo', hex: '#6366F1', label: 'Indigo' },
];

export default function AppearanceScreen() {
  const { settings, updateSettings } = useApp();

  const currentColor = accentColors.find(c => c.id === settings.accentColor) || accentColors[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Appearance" />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Dark mode */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>MODE</SectionLabel>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Dark Mode</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Easier on the eyes at night</p>
              </div>
              <Toggle checked={settings.darkMode} onChange={v => updateSettings({ darkMode: v })} />
            </div>
          </Card>
        </div>

        {/* Accent colors */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>ACCENT COLOR</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {accentColors.map(color => (
              <button
                key={color.id}
                onClick={() => updateSettings({ accentColor: color.id })}
                title={color.label}
                style={{
                  width: 48, height: 48, borderRadius: '50%', background: color.hex,
                  border: color.id === settings.accentColor ? '3px solid var(--color-foreground)' : '3px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  justifySelf: 'center',
                }}
              >
                {color.id === settings.accentColor && <Check size={20} color="white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>PREVIEW</SectionLabel>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: currentColor.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>◉</span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 2px' }}>Current: {currentColor.label}</p>
                <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif', margin: 0 }}>Applied to buttons, badges, active tabs & charts</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, height: 36, borderRadius: 999, background: 'var(--color-primary)', border: 'none', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 600, color: 'var(--color-primary-foreground)' }}>Primary</button>
              <button style={{ flex: 1, height: 36, borderRadius: 999, background: 'var(--color-secondary)', border: 'none', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>Secondary</button>
              <button style={{ flex: 1, height: 36, borderRadius: 999, background: 'transparent', border: '1px solid var(--color-primary)', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>Outline</button>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
