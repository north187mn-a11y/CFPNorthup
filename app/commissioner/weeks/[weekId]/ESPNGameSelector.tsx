'use client';
import {useEffect,useState} from 'react';

type G={eventId:string;awayTeam:string;awayTeamId:string;homeTeam:string;homeTeamId:string;favoriteTeam:string|null;favoriteTeamId:string|null;underdogTeam:string|null;underdogTeamId:string|null;spread:number|null;favoritePoints:number;underdogPoints:number|null;lineText:string|null;day:string|null;time:string|null;network:string|null;kickoffAt:string|null;sourceUrl:string};

export default function ESPNGameSelector({weekId}:{weekId:string}){
 const [games,setGames]=useState<G[]>([]),[selected,setSelected]=useState<string[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{fetch(`/api/commissioner/espn-schedule?weekId=${weekId}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);setGames(j.games)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[weekId]);
 function toggle(id:string){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<15?[...s,id]:s)}
 async function save(){setBusy(true);setError('');const r=await fetch(`/api/commissioner/weeks/${weekId}/import-games`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventIds:selected})});const j=await r.json();if(!r.ok){setError(j.error||'Could not add games');setBusy(false);return;}window.location.reload();}
 if(loading)return <div className="card" style={{marginTop:16}}><h2>ESPN Games</h2><p className="muted">Loading this week's schedule from ESPN…</p></div>;
 return <div className="card" style={{marginTop:16}}><div className="page-head"><div><h2>Select 15 Games</h2><p className="muted">Choose games from ESPN. The displayed line and point values will be locked when you save the 15 games.</p></div><div><strong>{selected.length}/15 selected</strong></div></div>
 {error&&<p className="error">{error}</p>}
 <div style={{overflowX:'auto'}}><table><thead><tr><th></th><th>Matchup</th><th>Day</th><th>Time</th><th>Network</th><th>ESPN line</th><th>Points</th></tr></thead><tbody>
 {games.map(g=><tr key={g.eventId}><td><input type="checkbox" checked={selected.includes(g.eventId)} disabled={!selected.includes(g.eventId)&&selected.length>=15} onChange={()=>toggle(g.eventId)}/></td><td>{g.awayTeam} @ {g.homeTeam}</td><td>{g.day||'—'}</td><td>{g.time||'—'}</td><td>{g.network||'—'}</td><td>{g.lineText||'—'}</td><td>{g.favoriteTeam&&g.underdogTeam&&g.underdogPoints!==null?`${g.favoriteTeam} (1.0) / ${g.underdogTeam} (${g.underdogPoints.toFixed(1)})`:'Line unavailable'}</td></tr>)}
 </tbody></table></div>
 <div style={{marginTop:16}}><button disabled={busy||selected.length!==15} onClick={save}>{busy?'Saving…':'Save Selected 15 Games'}</button></div>
 </div>;
}