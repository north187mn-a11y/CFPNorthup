'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function ResetPassword() {
  const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState('');
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  async function submit(e:React.FormEvent){e.preventDefault();setError('');if(password.length<8){setError('Password must be at least 8 characters.');return;}if(password!==confirm){setError('Passwords do not match.');return;}setBusy(true);const {error}=await supabase.auth.updateUser({password});if(error){setError(error.message);setBusy(false);return;}window.location.href='/';}
  return <main className="container narrow"><div className="card"><h1>Set a new password</h1><p className="muted">Choose a new password for College Football Survivor.</p><form onSubmit={submit} className="form-stack"><label>New password<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input type="password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<p className="error">{error}</p>}<button disabled={busy}>{busy?'Saving…':'Set password'}</button></form></div></main>;
}