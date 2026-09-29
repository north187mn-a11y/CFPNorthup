'use client';
import { useState } from 'react';
export default function NewWeek(){
 const [week,setWeek]=useState(''); const [deadline,setDeadline]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');const r=await fetch('/api/commissioner/weeks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({week_number:Number(week),pick_deadline:deadline?new Date(deadline).toISOString():null})});const j=await r.json();if(!r.ok){setError(j.error||'Could not create week');setBusy(false);return;}window.location.href=`/commissioner/weeks/${j.id}`;}
 return <main className="container narrow"><div className="card"><h1>Create Week</h1><p className="muted">Create the week first, then add its 15 games.</p><form onSubmit={submit} className="form-stack"><label>Week number<input type="number" min="1" max="20" required value={week} onChange={e=>setWeek(e.target.value)}/></label><label>Pick deadline<input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label>{error&&<p className="error">{error}</p>}<button disabled={busy}>{busy?'Creating…':'Create week'}</button></form></div></main>;
}
