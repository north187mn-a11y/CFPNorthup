'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    window.location.href = '/';
  }
  return <main className="container narrow"><div className="card">
    <h1>College Football Survivor</h1><p className="muted">Sign in to your league account.</p>
    <form onSubmit={submit} className="form-stack">
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}<button disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
    </form>
  </div></main>;
}