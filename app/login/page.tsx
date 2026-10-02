'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    window.location.href = '/';
  }
  async function resetPassword() {
    setError(''); setMessage('');
    if (!email) { setError('Enter your email address first, then click Forgot password.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setMessage('Password reset email sent. Check your inbox and spam/junk folder.');
  }
  return <main className="login-page"><div className="login-trophy-stage" aria-hidden="true"><picture className="login-trophy-picture"><source media="(max-width: 760px)" srcSet="/phone-sm.jpg" /><img className="login-trophy-image" src="/desktop-sm.jpg" alt="" /></picture></div><div className="login-card">
    <h1>College Football Survivor</h1><p className="muted">Sign in to your league account.</p>
    <form onSubmit={submit} className="form-stack">
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}
      <button disabled={busy}>{busy?'Please wait…':'Sign in'}</button>
      <button type="button" disabled={busy} onClick={resetPassword} style={{background:'transparent',color:'#111827',border:'1px solid #d1d5db'}}>Forgot password?</button>
    </form>
  </div></main>;
}