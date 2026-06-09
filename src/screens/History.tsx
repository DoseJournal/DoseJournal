import { useNavigate } from 'react-router-dom';
import { StatusBar, NavBar, Card } from '../components';
import { useApp } from '../context/AppContext';
import { ImageOff } from 'lucide-react';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { logs, medications } = useApp();

  // All logs sorted newest first
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const withPhotos = sorted.filter(l => l.photoDataUrl);

  const getMedName = (id: string) => {
    const m = medications.find(m => m.id === id);
    return m ? `${m.name} ${m.dose}${m.unit}` : 'Unknown';
  };

  const formatDate = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <NavBar title="Medication History" onBack={() => navigate('/')} />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Geist, sans-serif' }}>No logs yet. Start logging your medications!</p>
          </div>
        ) : (
          <>
            {/* Photo grid */}
            {withPhotos.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 12px', fontFamily: 'Geist, sans-serif' }}>Photos</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {withPhotos.map(log => (
                    <div key={log.id} style={{ borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                      <img src={log.photoDataUrl} alt="Med" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', padding: '20px 10px 8px' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'white', fontFamily: 'Geist, sans-serif' }}>{getMedName(log.medicationId)}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'Geist Mono, monospace' }}>
                          {new Date(log.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* All logs list */}
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: '0 0 12px', fontFamily: 'Geist, sans-serif' }}>All Logs</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map(log => (
                <Card key={log.id} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {log.photoDataUrl ? (
                    <img src={log.photoDataUrl} alt="Med" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ImageOff size={18} color="var(--color-muted-foreground)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: 'var(--color-foreground)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getMedName(log.medicationId)}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontFamily: 'Geist Mono, monospace', margin: 0 }}>
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#004D1A', background: '#DFE6E1', borderRadius: 999, padding: '3px 8px', flexShrink: 0, fontFamily: 'Geist, sans-serif' }}>
                    Taken
                  </span>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
