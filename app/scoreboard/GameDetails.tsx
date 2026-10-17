'use client';
import {useEffect,useState,type ReactNode} from 'react';
import type {GameDetails as Details} from '@/lib/espn-details';

export default function GameDetails({gameId,eventId,children}:{gameId:string|number;eventId:string|null;children:ReactNode}) {
 const [open,setOpen]=useState(false);
 const [data,setData]=useState<Details|null>(null);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!open)return;
  let active=true;
  let timer:ReturnType<typeof setTimeout>;
  const controller=new AbortController();
  const load=async()=>{
   try {
    const response=await fetch(`/api/scoreboard/games/${gameId}`,{cache:'no-store',signal:controller.signal});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Could not load game details.');
    if(active){setData(result);setError('');}
   }catch(e){if(active)setError(e instanceof Error?e.message:'Could not load game details.');}
   finally{if(active)timer=setTimeout(load,60000);}
  };
  load();
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[open,gameId,retry]);
 const sourceUrl=eventId&&/^\d+$/.test(eventId)?`https://www.espn.com/college-football/game/_/gameId/${eventId}`:null;
 return <details className="scoreboard-expandable" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary className="scoreboard-game-summary">{children}<span className="scoreboard-details-hint">{open?'Close game details ▴':'Game details ▾'}</span></summary>
  <div className="scoreboard-details-panel">
   {!data&&!error&&<p role="status" className="muted">Loading game details…</p>}
   {error&&<div role="status"><p className="muted">{error}{data?' Showing the last loaded details.':''}</p><button type="button" onClick={()=>{setError('');setRetry(n=>n+1);}}>Try again</button></div>}
   {data&&<>
    <p className="scoreboard-detail-status">{data.status}</p>
    <dl className="scoreboard-situation">
     <div><dt>Possession</dt><dd>{data.possession||'—'}</dd></div>
     <div><dt>Down & distance</dt><dd>{data.downDistance||'—'}</dd></div>
     <div><dt>Ball on</dt><dd>{data.fieldPosition||'—'}</dd></div>
    </dl>
    {data.situationNote&&<p className="muted scoreboard-details-updated">{data.situationNote}</p>}
    {!data.possession&&!data.downDistance&&!data.fieldPosition&&<p className="muted">Live situation will appear here when available.</p>}
    <div className="scoreboard-last-play"><strong>Latest play{data.lastPlayTime?` · ${data.lastPlayTime}`:''}</strong><p>{data.lastPlay||'No play details available yet.'}</p></div>
    <p className="muted scoreboard-details-updated">Loaded {new Date(data.fetchedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · Updates every minute while open</p>
   </>}
   {sourceUrl&&<a className="scoreboard-espn-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open ESPN Gamecast ↗</a>}
  </div>
 </details>;
}
