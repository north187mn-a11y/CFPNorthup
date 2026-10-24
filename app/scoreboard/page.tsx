import {requireUser} from '@/lib/auth';
import LiveRefresh from './LiveRefresh';
import GameDetails from './GameDetails';

export default async function Scoreboard(){
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!m)return <main className="container"><h1>Live Scoreboard</h1><p className="muted">You are not attached to a league.</p></main>;
 const {data:week}=await supabase.from('weeks').select('id,week_number').eq('league_id',m.league_id).in('status',['OPEN','LOCKED','SCORING','COMPLETE']).order('week_number',{ascending:false}).limit(1).single();
 if(!week)return <main className="container"><h1>Live Scoreboard</h1><p className="muted">No published week yet.</p></main>;
 const {data:games}=await supabase.from('games').select('id,espn_event_id,game_number,away_team_id,home_team_id,away_team,home_team,kickoff_at,network,favorite_team_name,favorite_points,underdog_points,status,away_score,home_score,period,clock,status_detail,last_synced_at').eq('week_id',week.id).order('game_number');
 const gameIds=(games??[]).map((g:any)=>g.id);
 const {data:picks}=gameIds.length?await supabase.from('picks').select('game_id,selected_team_id').eq('player_id',user.id).in('game_id',gameIds):{data:[] as any[]};
 const {data:hp}=await supabase.from('historical_players').select('id').eq('league_id',m.league_id).eq('user_id',user.id).maybeSingle();
 const {data:priorScores}=hp?await supabase.from('historical_week_scores').select('points,week_id').eq('historical_player_id',hp.id):{data:[] as any[]};
 // Historical weeks 1-4 are stored separately from scored website weeks 5+.
 // Exclude the live week to avoid counting its points twice.
 const {data:completedWeeks}=await supabase.from('weeks').select('id').eq('league_id',m.league_id).eq('status','COMPLETE').lt('week_number',week.week_number);
 const completedIds=(completedWeeks??[]).map((w:any)=>w.id);
 const {data:completedScores}=completedIds.length?await supabase.from('weekly_scores').select('points,week_id').eq('player_id',user.id).in('week_id',completedIds):{data:[] as any[]};
 const historicalIds=new Set((priorScores??[]).map((s:any)=>String(s.week_id)));
 const priorYtd=(priorScores??[]).reduce((sum:number,s:any)=>sum+Number(s.points??0),0)
  +(completedScores??[]).filter((s:any)=>!historicalIds.has(String(s.week_id))).reduce((sum:number,s:any)=>sum+Number(s.points??0),0);
 const pickedPoints=(g:any,pick:string|null|undefined)=>{
  if(!pick)return 0;
  const favAway=g.favorite_team_name===g.away_team;
  if(pick===g.away_team_id)return favAway?Number(g.favorite_points):Number(g.underdog_points);
  if(pick===g.home_team_id)return favAway?Number(g.underdog_points):Number(g.favorite_points);
  return 0;
 };
 const wtdEarned=(games??[]).reduce((sum:number,g:any)=>{
  const pick=(picks??[]).find((p:any)=>p.game_id===g.id)?.selected_team_id;
  if(g.status!=='FINAL'||!pick)return sum;
  const won=(g.away_score>g.home_score&&pick===g.away_team_id)||(g.home_score>g.away_score&&pick===g.home_team_id);
  return sum+(won?pickedPoints(g,pick):0);
 },0);
 const wtdPotential=(games??[]).reduce((sum:number,g:any)=>{
  const pick=(picks??[]).find((p:any)=>p.game_id===g.id)?.selected_team_id;
  if(!pick)return sum;
  if(g.status==='FINAL'){
   const won=(g.away_score>g.home_score&&pick===g.away_team_id)||(g.home_score>g.away_score&&pick===g.home_team_id);
   return sum+(won?pickedPoints(g,pick):0);
  }
  return sum+pickedPoints(g,pick);
 },0);
 const ytd=priorYtd+wtdEarned;
 const last=(games??[]).map((g:any)=>g.last_synced_at).filter(Boolean).sort().pop();
 return <main className="container"><LiveRefresh weekId={week.id}/><div className="page-head"><div><h1>Week {week.week_number} Scoreboard</h1><p className="muted">The 15 league games only · refreshes from ESPN about every minute{last?` · Last updated ${new Date(last).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'})}`:''}</p></div></div>
 <div className="grid scoreboard-summary" style={{marginTop:16}}>
  <div className="card" style={{textAlign:'center'}}><div className="muted">YTD Total</div><div style={{fontSize:'2rem',fontWeight:700}}>{ytd.toFixed(1)}</div><div className="muted">points through now</div></div>
  <div className="card" style={{textAlign:'center'}}><div className="muted">WTD Total</div><div style={{fontSize:'2rem',fontWeight:700}}>{wtdEarned.toFixed(1)}</div><div className="muted">earned this week</div></div>
  <div className="card" style={{textAlign:'center'}}><div className="muted">Max This Week</div><div style={{fontSize:'2rem',fontWeight:700}}>{wtdPotential.toFixed(1)}</div><div className="muted">if remaining picks win</div></div>
 </div>
 <div className="grid" style={{marginTop:16}}>{[...(games??[])].sort((a:any,b:any)=>{const kickoff=(g:any)=>{const time=g.kickoff_at?Date.parse(g.kickoff_at):NaN;return Number.isFinite(time)?time:Infinity};const priority=(g:any)=>g.status==='IN_PROGRESS'?0:g.status==='FINAL'?2:1;return priority(a)-priority(b)||kickoff(a)-kickoff(b)||a.game_number-b.game_number}).map((g:any)=>{
  const favAway=g.favorite_team_name===g.away_team;
  const awayPts=favAway?Number(g.favorite_points):Number(g.underdog_points);
  const homePts=favAway?Number(g.underdog_points):Number(g.favorite_points);
  const isLive=g.status==='IN_PROGRESS';
  const showScore=isLive||g.status==='FINAL';
  const kickoff=g.kickoff_at?new Date(g.kickoff_at):null;
  const kickoffDay=kickoff?.toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'short'});
  const kickoffTime=kickoff?.toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).replace(':00','').replace('12 PM','Noon').replace('12 AM','Midnight');
  const detail=g.status==='FINAL'?'Final':isLive?(g.status_detail||[g.period?`Q${g.period}`:'',g.clock].filter(Boolean).join(' ')||'In progress'):(kickoff?`${kickoffDay} · ${kickoffTime} ET`:'Scheduled');
  const pick=(picks??[]).find((p:any)=>p.game_id===g.id)?.selected_team_id;
  const pickedAway=pick===g.away_team_id, pickedHome=pick===g.home_team_id;
  const pickPts=pick?pickedPoints(g,pick):0;
  const pickedWon=g.status==='FINAL'&&((pickedAway&&Number(g.away_score)>Number(g.home_score))||(pickedHome&&Number(g.home_score)>Number(g.away_score)));
  const pickedLost=g.status==='FINAL'&&!!pick&&!pickedWon;
  const pickLabel=!pick?'No pick submitted':pickedWon?`Your pick won · +${pickPts.toFixed(1)} pts`:pickedLost?'Your pick lost':`Potential +${pickPts.toFixed(1)} pts`;
  return <article className="card scoreboard-game" key={g.id}>
   <GameDetails updatedAt={g.last_synced_at} gameId={g.id} eventId={g.espn_event_id?String(g.espn_event_id):null}>
   <div className="scoreboard-game-header"><strong>Game {g.game_number}</strong><span className="badge">{isLive&&<strong style={{color:'#b7f7bf'}}>● LIVE · </strong>}{detail}</span></div>
   <div className="scoreboard-teams">
    <div className={pickedAway?'scoreboard-team is-picked':'scoreboard-team'}><span className="scoreboard-team-name">{pickedAway&&<span aria-label="Your pick">★ </span>}{g.away_team}</span><strong className="scoreboard-team-score">{showScore?(g.away_score??'—'):'—'}</strong><span className="scoreboard-team-points">{awayPts.toFixed(1)} pts</span></div>
    <div className={pickedHome?'scoreboard-team is-picked':'scoreboard-team'}><span className="scoreboard-team-name">{pickedHome&&<span aria-label="Your pick">★ </span>}{g.home_team}</span><strong className="scoreboard-team-score">{showScore?(g.home_score??'—'):'—'}</strong><span className="scoreboard-team-points">{homePts.toFixed(1)} pts</span></div>
   </div>
   <div className="scoreboard-game-footer"><strong className={pickedLost?'scoreboard-pick-lost':'scoreboard-pick-status'}>{pickLabel}</strong><span>{g.network||'Network TBD'}</span></div>
   </GameDetails>
  </article>;
 })}</div></main>;
}
