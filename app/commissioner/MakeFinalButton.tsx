'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function MakeFinalButton({weekId,disabled}:{weekId:number;disabled:boolean}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const router=useRouter();
 async function makeFinal(){
  if(!confirm('Make this week final? This will recalculate all scores and mark the week COMPLETE.'))return;
  setBusy(true);setError('');
  const res=await fetch('/api/commissioner/make-final',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weekId})});
  const j=await res.json();setBusy(false);
  if(!res.ok){setError(j.error??'Could not make week final');return;}
  router.refresh();
 }
 return <div><button onClick={makeFinal} disabled={disabled||busy}>{busy?'Finalizing…':'Make Final'}</button>{disabled&&<div className="muted" style={{fontSize:12,marginTop:5}}>Available after all 15 games are final.</div>}{error&&<div className="error" style={{fontSize:12,marginTop:5}}>{error}</div>}</div>;
}