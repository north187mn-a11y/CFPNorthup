'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';

export default function LiveRefresh({weekId}:{weekId:number}){
 const router=useRouter();
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const refreshNow=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let active=true,inFlight=false;
  let timer:ReturnType<typeof setTimeout>;
  let controller:AbortController|undefined;
  const refresh=async()=>{
   if(!active||inFlight||document.visibilityState==='hidden')return;
   clearTimeout(timer);
   inFlight=true;setBusy(true);
   controller=new AbortController();
   const timeout=setTimeout(()=>controller?.abort(),45000);
   try{
    const res=await fetch('/api/scoreboard/refresh',{
     method:'POST',headers:{'content-type':'application/json'},
     body:JSON.stringify({weekId}),cache:'no-store',signal:controller.signal
    });
    if(!res.ok)throw new Error('Scoreboard refresh failed');
    const result=await res.json();
    if(result.ok!==true)throw new Error('Some games could not be updated');
    if(active)setError('');
   }catch{
    if(active)setError('Live updates are delayed. Scores may be out of date. Try Refresh now.');
   }finally{
    clearTimeout(timeout);inFlight=false;
    if(active){
     setBusy(false);
     router.refresh();
     timer=setTimeout(refresh,60000);
    }
   }
  };
  const foreground=()=>{if(document.visibilityState==='visible')void refresh();};
  refreshNow.current=()=>void refresh();
  document.addEventListener('visibilitychange',foreground);
  window.addEventListener('focus',foreground);
  void refresh();
  return()=>{
   active=false;clearTimeout(timer);controller?.abort();
   document.removeEventListener('visibilitychange',foreground);
   window.removeEventListener('focus',foreground);
  };
 },[weekId,router]);
 return <div style={{marginBottom:12}}>
  <button type="button" disabled={busy} onClick={()=>refreshNow.current()}>{busy?'Refreshing…':'Refresh now'}</button>
  {error&&<p role="alert">{error}</p>}
 </div>;
}
