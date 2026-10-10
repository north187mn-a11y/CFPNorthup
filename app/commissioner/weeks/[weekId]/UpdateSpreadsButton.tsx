'use client';
import {useState} from 'react';
export default function UpdateSpreadsButton({weekId}:{weekId:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function update(){
  if(!window.confirm('Refresh all selected games to their current ESPN spreads? This replaces the saved spreads and point values for this unpublished week.'))return;
  setBusy(true);setError('');
  try{
   const r=await fetch(`/api/commissioner/weeks/${weekId}/update-spreads`,{method:'POST'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Could not update spreads');
   window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:'Could not update spreads');setBusy(false);}
 }
 return <div><button disabled={busy} onClick={update}>{busy?'Updating…':'Update Spreads'}</button>{error&&<p className="error">{error}</p>}</div>;
}
