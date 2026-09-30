'use client';
import {useState} from 'react';
type Game={id:number;game_number:number;away_team:string;away_team_id:string;home_team:string;home_team_id:string;favorite_team_id:string;favorite_points:number;underdog_points:number;kickoff_at:string|null;network:string|null};
export default function PickSheet({weekId,games,initial,deadline}:{weekId:number;games:Game[];initial:Record<string,string>;deadline:string|null}){
 const [picks,setPicks]=useState<Record<string,string>>(initial),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const locked=deadline?Date.now()>=new Date(deadline).getTime():false;
 const choose=(g:Game,id:string)=>!locked&&setPicks(p=>({...p,[g.id]:id}));
 async function save(){setBusy(true);setMsg('');const r=await fetch(`/api/weeks/${weekId}/picks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({picks})});const j=await r.json();setBusy(false);setMsg(r.ok?'Picks saved. You can edit them until the deadline.':j.error||'Could not save picks.');}
 return <div className="card" style={{marginTop:16}}><h2>Your Pick Sheet</h2><p className="muted">{locked?'The deadline has passed. Your picks are locked.':'Pick one winner in each game. You can save and return to edit before the deadline.'}</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>Game</th><th>Your pick</th><th>Kickoff</th><th>Network</th></tr></thead><tbody>{games.map(g=>{
 const favAway=g.favorite_team_id===g.away_team_id; const ap=favAway?Number(g.favorite_points):Number(g.underdog_points); const hp=favAway?Number(g.underdog_points):Number(g.favorite_points);
 return <tr key={g.id}><td>{g.game_number}</td><td>{g.away_team} @ {g.home_team}</td><td><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" disabled={locked} onClick={()=>choose(g,g.away_team_id)} style={{opacity:picks[g.id]===g.away_team_id?1:.55}}>{g.away_team} ({ap.toFixed(1)})</button><button type="button" disabled={locked} onClick={()=>choose(g,g.home_team_id)} style={{opacity:picks[g.id]===g.home_team_id?1:.55}}>{g.home_team} ({hp.toFixed(1)})</button></div></td><td>{g.kickoff_at?new Date(g.kickoff_at).toLocaleString():'—'}</td><td>{g.network||'—'}</td></tr>})}</tbody></table></div>
 {!locked&&<div style={{marginTop:16}}><button disabled={busy||Object.keys(picks).length!==games.length} onClick={save}>{busy?'Saving…':Object.keys(initial).length?'Save Changes':'Submit Picks'}</button> <span className="muted">{Object.keys(picks).length}/{games.length} picked</span></div>}{msg&&<p>{msg}</p>}</div>
}