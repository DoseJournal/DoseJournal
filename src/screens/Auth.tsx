import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrangeButton, SecondaryButton, Input, StatusBar } from '../components';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !name) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (error) setError(error.message);
    else setMessage('Check your email for a confirmation link, then sign in.');
    setLoading(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError('Enter your email address first.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Password reset email sent. Check your inbox.');
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
      <StatusBar />
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '40px 28px 32px' }}>

        {/* Logo / wordmark */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: 'var(--shadow-button)' }}>
            <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-primary-foreground)' }}>M</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--color-foreground)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {mode === 'signin' ? 'Sign in to access your medications' : mode === 'signup' ? 'Start tracking your medications' : 'Enter your email and we\'ll send a reset link'}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your name</p>
              <Input placeholder="e.g. Amy" value={name} onChange={setName} />
            </div>
          )}

          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
            <Input placeholder="you@email.com" value={email} onChange={setEmail} type="email" />
          </div>

          {mode !== 'forgot' && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</p>
              <Input placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} value={password} onChange={setPassword} type="password" />
            </div>
          )}

          {/* Error / success messages */}
          {error && (
            <div style={{ background: 'var(--color-error)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, color: 'var(--color-error-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>{error}</p>
            </div>
          )}
          {message && (
            <div style={{ background: 'var(--color-success)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, color: 'var(--color-success-foreground)', fontFamily: 'Inter, sans-serif', margin: 0 }}>{message}</p>
            </div>
          )}

          {/* Primary action */}
          <div style={{ marginTop: 4 }}>
            <OrangeButton onClick={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleForgot}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </OrangeButton>
          </div>

          {/* Mode switches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {mode === 'signin' && (
              <>
                <SecondaryButton onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>
                  Create a new account
                </SecondaryButton>
                <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', padding: '4px 0' }}>
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <SecondaryButton onClick={() => { setMode('signin'); setError(''); setMessage(''); }}>
                Already have an account? Sign in
              </SecondaryButton>
            )}
            {mode === 'forgot' && (
              <SecondaryButton onClick={() => { setMode('signin'); setError(''); setMessage(''); }}>
                Back to sign in
              </SecondaryButton>
            )}
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
            MedLedger is a personal tracking tool only. It does not provide medical advice. Always follow your prescriber's instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
