'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditDeadline({weekId,deadline}:{weekId:string;deadline:string|null}){
 const router=useRouter();
 const [editing,setEditing]=useState(false);
 const [value,setValue]=useState('');
 const [zone,setZone]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  if(deadline){
   const d=new Date(deadline);
   const pad=(n:number)=>String(n).padStart(2,'0');
   setValue(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }
 },[deadline]);
 async function save(e:React.FormEvent){
  e.preventDefault();setError('');
  const date=new Date(value);
  if(!value||!Number.isFinite(date.getTime())){setError('Enter a valid deadline.');return;}
  setBusy(true);
  try{
   const res=await fetch(`/api/commissioner/weeks/${weekId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({pick_deadline:date.toISOString()})});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||'Could not save deadline.');
   setEditing(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Could not save deadline.');}
  finally{setBusy(false);}
 }
 if(!editing)return <button onClick={()=>{setError('');setEditing(true);}}>Edit deadline</button>;
 return <form onSubmit={save} className="card" style={{marginTop:16}}>
  <h2>Edit picks deadline</h2>
  <label htmlFor="pick-deadline">Deadline in your local time ({zone})</label>
  <input id="pick-deadline" type="datetime-local" required value={value} onChange={e=>setValue(e.target.value)} disabled={busy}/>
  <p className="muted">Saving changes when picks lock for every player.</p>
  {error&&<p role="alert">{error}</p>}
  <div style={{display:'flex',gap:10}}><button disabled={busy}>{busy?'Saving…':'Save deadline'}</button><button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></div>
 </form>;
}
