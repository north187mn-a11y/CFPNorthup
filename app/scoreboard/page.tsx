import {requireUser} from '@/lib/auth';
import LiveRefresh from './LiveRefresh';

export default async function Scoreboard(){
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!m)return <main className="container"><h1>Live Scoreboard</h1><p className="muted">You are not attached to a league.</p></main>;
 const {data:week}=await supabase.from('weeks').select('id,week_number').eq('league_id',m.league_id).in('status',['OPEN','LOCKED','SCORING','COMPLETE']).order('week_number',{ascending:false}).limit(1).single();
 if(!week)return <main className="container"><h1>Live Scoreboard</h1><p className="muted">No published week yet.</p></main>;
 const {data:games}=await supabase.from('games').select('id,game_number,away_team_id,home_team_id,away_team,home_team,kickoff_at,network,favorite_team_name,favorite_points,underdog_points,status,away_score,home_score,period,clock,status_detail,last_synced_at').eq('week_id',week.id).order('game_number');
 const gameIds=(games??[]).map((g:any)=>g.id);
 const {data:picks}=gameIds.length?await supabase.from('picks').select('game_id,selected_team_id').eq('player_id',user.id).in('game_id',gameIds):{data:[] as any[]};
 const last=(games??[]).map((g:any)=>g.last_synced_at).filter(Boolean).sort().pop();
 return <main className="container"><LiveRefresh weekId={week.id}/><div className="page-head"><div><h1>Week {week.week_number} Scoreboard</h1><p className="muted">The 15 league games only · refreshes from ESPN about every minute{last?` · Last updated ${new Date(last).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'})}`:''}</p></div></div>
 <div className="grid" style={{marginTop:16}}>{(games??[]).map((g:any)=>{
  const favAway=g.favorite_team_name===g.away_team;
  const awayPts=favAway?Number(g.favorite_points):Number(g.underdog_points);
  const homePts=favAway?Number(g.underdog_points):Number(g.favorite_points);
  const detail=g.status==='FINAL'?'Final':g.status==='IN_PROGRESS'?(g.status_detail||[g.period?`Q${g.period}`:'',g.clock].filter(Boolean).join(' ')):(g.kickoff_at?new Date(g.kickoff_at).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'Scheduled');
  const pick=(picks??[]).find((p:any)=>p.game_id===g.id)?.selected_team_id;
  const pickedAway=pick===g.away_team_id, pickedHome=pick===g.home_team_id;
  return <div className="card" key={g.id}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>Game {g.game_number}</strong><span className="badge">{detail}</span></div>
   <table style={{marginTop:8}}><tbody><tr><td>{pickedAway?<>★ {g.away_team}</>:g.away_team}</td><td style={{textAlign:'right'}}><strong>{g.away_score??'—'}</strong></td><td style={{textAlign:'right'}}>{`${awayPts.toFixed(1)} pts`}</td></tr><tr><td>{pickedHome?<>★ {g.home_team}</>:g.home_team}</td><td style={{textAlign:'right'}}><strong>{g.home_score??'—'}</strong></td><td style={{textAlign:'right'}}>{`${homePts.toFixed(1)} pts`}</td></tr></tbody></table>
   <p className="muted" style={{marginBottom:0}}>{pick?'★ = your pick':'No pick submitted'} · {g.network||'Network TBD'}</p></div>
 })}</div></main>;
}