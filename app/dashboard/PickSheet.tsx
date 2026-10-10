'use client';
import {useEffect,useState} from 'react';
type Game={id:number;game_number:number;away_team:string;away_team_id:string;home_team:string;home_team_id:string;favorite_team_id:string|null;favorite_team_name:string|null;favorite_points:number;underdog_points:number;kickoff_at:string|null;network:string|null;status:string};
export default function PickSheet({weekId,games,initial,deadline,weekStatus,lateException}:{weekId:number;games:Game[];initial:Record<string,string>;deadline:string|null;weekStatus:string;lateException:string|null}){
 const [picks,setPicks]=useState<Record<string,string>>(initial),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const [now,setNow]=useState(Date.now()),[submitted,setSubmitted]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(timer);},[]);
 const after=deadline?now>=new Date(deadline).getTime():false;
 const late=after&&!!lateException;
 const lateOpen=late&&now<new Date(lateException!).getTime()&&!submitted;
 const locked=weekStatus!=='OPEN'||(after&&!lateOpen)||submitted;
 const gameLocked=(g:Game)=>locked||(late&&(g.status!=='SCHEDULED'||!g.kickoff_at||now>=new Date(g.kickoff_at).getTime()));
 const available=games.filter(g=>!gameLocked(g));
 const picked=available.filter(g=>picks[g.id]).length;
 const choose=(g:Game,id:string)=>!busy&&!gameLocked(g)&&setPicks(p=>({...p,[g.id]:id}));
 async function save(){
  setBusy(true);setMsg('');
  try{
   const selected=late?Object.fromEntries(available.filter(g=>g.kickoff_at&&Date.now()<new Date(g.kickoff_at).getTime()).map(g=>[g.id,picks[g.id]])):picks;
   const r=await fetch(`/api/weeks/${weekId}/picks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({picks:selected})});
   const j=await r.json();
   if(r.ok&&j.late){setSubmitted(true);setMsg('Picks submitted. Your picks are now locked.');}
   else setMsg(r.ok?'Picks saved. You can edit them until the deadline.':j.error||'Could not save picks.');
  }catch{setMsg('Could not save picks. Please try again.');}finally{setBusy(false);}
 }
 return <div className="card" style={{marginTop:16}}><h2>Your Pick Sheet</h2><p className="muted">{locked?'Your picks are locked.':late?'Your commissioner has allowed one late submission. Pick every remaining game; games close at kickoff. Your picks lock when you submit.':'Pick one winner in each game. You can save and return to edit before the deadline.'}</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>Game</th><th>Your pick</th><th>Kickoff</th><th>Network</th></tr></thead><tbody>{games.map(g=>{
 const favAway=g.favorite_team_id?g.favorite_team_id===g.away_team_id:g.favorite_team_name===g.away_team; const ap=favAway?Number(g.favorite_points):Number(g.underdog_points); const hp=favAway?Number(g.underdog_points):Number(g.favorite_points);
 return <tr key={g.id}><td>{g.game_number}</td><td>{g.away_team} @ {g.home_team}</td><td><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" disabled={busy||gameLocked(g)} aria-pressed={picks[g.id]===g.away_team_id} onClick={()=>choose(g,g.away_team_id)} style={{opacity:picks[g.id]===g.away_team_id?1:.55}}>{g.away_team} ({ap.toFixed(1)})</button><button type="button" disabled={busy||gameLocked(g)} aria-pressed={picks[g.id]===g.home_team_id} onClick={()=>choose(g,g.home_team_id)} style={{opacity:picks[g.id]===g.home_team_id?1:.55}}>{g.home_team} ({hp.toFixed(1)})</button></div>{late&&gameLocked(g)&&!submitted&&<span className="muted">Closed</span>}</td><td>{g.kickoff_at?new Date(g.kickoff_at).toLocaleString():'—'}</td><td>{g.network||'—'}</td></tr>})}</tbody></table></div>
 {!locked&&<div style={{marginTop:16}}><button disabled={busy||!available.length||picked!==available.length} onClick={save}>{busy?'Saving…':late?'Submit and Lock Picks':Object.keys(initial).length?'Save Changes':'Submit Picks'}</button> <span className="muted">{picked}/{available.length} {late?'remaining games picked':'picked'}</span></div>}{msg&&<p role="status">{msg}</p>}</div>
}
