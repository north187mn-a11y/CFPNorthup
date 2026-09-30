'use client';
import { useState } from 'react';

export default function DeleteWeekButton({weekId,weekNumber,status}:{weekId:string;weekNumber:number;status:string}){
 const [confirming,setConfirming]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function remove(){
  setBusy(true); setError('');
  const r=await fetch(`/api/commissioner/weeks/${weekId}`,{method:'DELETE'});
  const j=await r.json();
  if(!r.ok){setError(j.error||'Could not delete week.');setBusy(false);return;}
  window.location.href='/commissioner';
 }
 if(status!=='DRAFT')return null;
 return <div style={{marginTop:20}}>
  {!confirming?<button onClick={()=>setConfirming(true)}>Delete Week</button>:
   <div className="card"><strong>Delete Week {weekNumber}?</strong><p className="muted">This permanently deletes this draft week and any games in it.</p><div style={{display:'flex',gap:10}}><button onClick={remove} disabled={busy}>{busy?'Deleting…':'Yes, Delete Week'}</button><button onClick={()=>setConfirming(false)} disabled={busy}>Cancel</button></div></div>}
  {error&&<p className="error">{error}</p>}
 </div>;
}