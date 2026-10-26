'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
type Candidate={player_id:string;name:string;weekly:number;ytd:number;rank:number};
export default function ApplyWeeklyCutButton({weekId}:{weekId:number}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState<Candidate[]|null>(null);
 const router=useRouter();
 async function request(confirm:boolean){
  setBusy(true);setError('');
  try {
   const response=await fetch('/api/commissioner/weekly-cut',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weekId,confirm})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Weekly cut failed');
   if(confirm){setPreview(null);router.refresh();}else setPreview(data.players||[]);
  }catch(e){setError(e instanceof Error?e.message:'Weekly cut failed');}finally{setBusy(false);}
 }
 return <div style={{marginTop:6}}>
  <button disabled={busy} onClick={()=>request(false)}>{busy?'Loading…':'Apply Weekly Cut'}</button>
  {preview&&<div className="card" style={{marginTop:8,padding:12}}>
   <strong>Confirm eliminations</strong>
   <p className="muted">
    Preview only. The players with the lowest weekly scores
    are eliminated. YTD breaks ties (lower YTD loses).
    No changes occur until you confirm.
   </p>
   <ul>{preview.map(p=><li key={p.player_id}>{p.name}: {Number(p.weekly).toFixed(2)} this week · {Number(p.ytd).toFixed(2)} YTD</li>)}</ul>
   <button disabled={busy} onClick={()=>request(true)}>Confirm elimination of {preview.length} player{preview.length===1?'':'s'}</button>{' '}
   <button disabled={busy} onClick={()=>setPreview(null)}>Cancel</button>
  </div>}
  {error&&<div className="error" style={{fontSize:12,marginTop:5}}>{error}</div>}
 </div>;
}
