import {Fragment} from 'react';
import {requireUser} from '@/lib/auth';

export default async function Standings({searchParams}:{searchParams:Promise<{projected?:string}>}){
 const params=await searchParams;
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!m)return <main className="container"><h1>Standings</h1><p className="muted">You are not attached to a league.</p></main>;

 const {data:weeks}=await supabase.from('weeks').select('id,week_number,status').eq('league_id',m.league_id).order('week_number');
 const {data:members}=await supabase.from('league_members').select('user_id,status').eq('league_id',m.league_id);
 const weekIds=(weeks??[]).map((w:any)=>w.id);
 const {data:liveScores}=weekIds.length?await supabase.from('weekly_scores').select('week_id,player_id,points').in('week_id',weekIds):{data:[] as any[]};
 const ids=(members??[]).map((x:any)=>x.user_id);
 const {data:profiles}=ids.length?await supabase.from('profiles').select('id,full_name,role').in('id',ids):{data:[] as any[]};

 const {data:historicalPlayers}=await supabase.from('historical_players').select('id,user_id,display_name').eq('league_id',m.league_id).order('display_name');
 const historicalIds=(historicalPlayers??[]).map((p:any)=>p.id);
 const {data:historicalScores}=historicalIds.length&&weekIds.length?await supabase.from('historical_week_scores').select('week_id,historical_player_id,points').in('historical_player_id',historicalIds).in('week_id',weekIds):{data:[] as any[]};
 const week5=(weeks??[]).find((w:any)=>w.week_number===5);
 const {data:week5Games}=week5?await supabase.from('games').select('game_number,away_team,home_team,favorite_team_name,favorite_points,underdog_points,status,away_score,home_score').eq('week_id',week5.id):{data:[] as any[]};
 const {data:week5HistoricalPicks}=week5&&historicalIds.length?await supabase.from('historical_picks').select('historical_player_id,game_number,selected_team_name').eq('week_id',week5.id).in('historical_player_id',historicalIds):{data:[] as any[]};

 const importedWeek5Score=(hpId:number)=>{
  return (week5HistoricalPicks??[]).filter((p:any)=>p.historical_player_id===hpId).reduce((sum:number,p:any)=>{
   const g=(week5Games??[]).find((x:any)=>x.game_number===p.game_number);
   if(!g||g.status!=='FINAL'||g.away_score===g.home_score)return sum;
   const winner=g.away_score>g.home_score?g.away_team:g.home_team;
   if(p.selected_team_name!==winner)return sum;
   return sum+Number(p.selected_team_name===g.favorite_team_name?g.favorite_points:g.underdog_points);
  },0);
 };

 const rankingWeek=[...(weeks??[])].reverse().find((w:any)=>['OPEN','LOCKED','SCORING','COMPLETE'].includes(w.status));
 const projected=params.projected==='1'&&!!rankingWeek&&rankingWeek.status!=='COMPLETE';
 const {data:projectionGames,error:gamesError}=projected?await supabase.from('games').select('id,game_number,away_team_id,home_team_id,away_team,home_team,favorite_team_name,favorite_points,underdog_points,status,away_score,home_score').eq('week_id',rankingWeek!.id):{data:[],error:null};
 const projectionGameIds=(projectionGames??[]).map((g:any)=>g.id);
 const {data:projectionPicks,error:picksError}=projected&&projectionGameIds.length?await supabase.from('picks').select('player_id,game_id,selected_team_id').in('game_id',projectionGameIds):{data:[],error:null};
 const {data:projectionHistoricalPicks,error:historicalPicksError}=projected&&historicalIds.length?await supabase.from('historical_picks').select('historical_player_id,game_number,selected_team_name').eq('week_id',rankingWeek!.id).in('historical_player_id',historicalIds):{data:[],error:null};
 const projectionReady=projected&&!gamesError&&!picksError&&!historicalPicksError&&projectionGameIds.length>0;
 const projectedPoints=(hp:any)=>(projectionGames??[]).reduce((sum:number,g:any)=>{
  if(!['FINAL','IN_PROGRESS'].includes(g.status)||g.away_score==null||g.home_score==null||Number(g.away_score)===Number(g.home_score))return sum;
  const awayWins=Number(g.away_score)>Number(g.home_score);
  const winner=awayWins?g.away_team:g.home_team;
  const winnerId=awayWins?g.away_team_id:g.home_team_id;
  const livePick=hp.user_id?(projectionPicks??[]).find((p:any)=>p.player_id===hp.user_id&&p.game_id===g.id):undefined;
  const historicalPick=(projectionHistoricalPicks??[]).find((p:any)=>p.historical_player_id===hp.historical_id&&p.game_number===g.game_number);
  const won=livePick?livePick.selected_team_id===winnerId:historicalPick?.selected_team_name===winner;
  return sum+(won?Number(winner===g.favorite_team_name?g.favorite_points:g.underdog_points):0);
 },0);
 const rankByWeek=!!rankingWeek&&rankingWeek.week_number>=8;
 const officialRows=(historicalPlayers??[]).map((hp:any)=>{
  const member=hp.user_id?(members??[]).find((x:any)=>x.user_id===hp.user_id):undefined;
  const profile=hp.user_id?(profiles??[]).find((p:any)=>p.id===hp.user_id):undefined;
  const ps=(weeks??[]).map((w:any)=>{
   if(w.week_number===5){
    if(hp.user_id){
     const live=(liveScores??[]).find((s:any)=>s.player_id===hp.user_id&&s.week_id===w.id);
     return {week_id:w.id,week_number:w.week_number,points:Number(live?.points??0)};
    }
    return {week_id:w.id,week_number:w.week_number,points:importedWeek5Score(hp.id)};
   }
   const historical=(historicalScores??[]).find((s:any)=>s.historical_player_id===hp.id&&s.week_id===w.id);
   const live=hp.user_id?(liveScores??[]).find((s:any)=>s.player_id===hp.user_id&&s.week_id===w.id):undefined;
   const source=historical??live;
   return source?{week_id:w.id,week_number:w.week_number,points:Number(source.points)}:null;
  }).filter(Boolean) as {week_id:number,week_number:number,points:number}[];
  return {user_id:hp.user_id,historical_id:hp.id,status:member?.status??'ACTIVE',name:profile?.full_name??hp.display_name,ytd:ps.reduce((a:number,s:any)=>a+s.points,0),ps};
 }).sort((a:any,b:any)=>{
  const weeklyDifference=rankByWeek
   ?(b.ps.find((s:any)=>s.week_id===rankingWeek.id)?.points??0)-(a.ps.find((s:any)=>s.week_id===rankingWeek.id)?.points??0)
   :0;
  return weeklyDifference||b.ytd-a.ytd||a.name.localeCompare(b.name);
 });

 // Substitute the current week only; never persist simulated scores.
 const rows=projectionReady?officialRows.map((r:any)=>{
  const points=projectedPoints(r);
  const previous=r.ps.find((p:any)=>p.week_id===rankingWeek!.id)?.points??0;
  return {...r,ytd:r.ytd-previous+points,ps:[...r.ps.filter((p:any)=>p.week_id!==rankingWeek!.id),{week_id:rankingWeek!.id,week_number:rankingWeek!.week_number,points}]};
 }).sort((a:any,b:any)=>{
  const weeklyDifference=rankByWeek?(b.ps.find((p:any)=>p.week_id===rankingWeek!.id)?.points??0)-(a.ps.find((p:any)=>p.week_id===rankingWeek!.id)?.points??0):0;
  return weeklyDifference||b.ytd-a.ytd||a.name.localeCompare(b.name);
 }):officialRows;

 const completed=(weeks??[]).filter((w:any)=>w.status==='COMPLETE');
 const lastWeek=completed.length?completed[completed.length-1]:null;
 const postCut=!!lastWeek&&lastWeek.week_number>=7;
 const {data:eliminations}=postCut?await supabase.from('eliminations').select('player_id').eq('league_id',m.league_id).eq('week_id',lastWeek.id):{data:[] as any[]};
 const eliminatedIds=(eliminations??[]).map((e:any)=>e.player_id);
 const survivorResults=postCut?[...officialRows].sort((a:any,b:any)=>{
   const aw=a.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??0,bw=b.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??0;
   return lastWeek.week_number===7?b.ytd-a.ytd:(bw-aw)||(b.ytd-a.ytd);
 }):[];
 const consolation=postCut?officialRows.filter((r:any)=>r.status==='ELIMINATED').map((r:any)=>({...r,last:r.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??0})).sort((a:any,b:any)=>b.last-a.last||b.ytd-a.ytd):[];


 const cutCount=rankingWeek&&rankingWeek.week_number>=8&&rankingWeek.week_number<=13
  ?(rankingWeek.week_number<=11?2:1):0;
 const cutFinal=rankingWeek?.status==='COMPLETE';
 const finalCutIds=cutFinal&&lastWeek?.id===rankingWeek?.id?eliminatedIds:[];
 // Include this week's eliminated players in final results, but exclude earlier cuts.
 const activeStandings=rows.filter((r:any)=>['ACTIVE','FINALIST','CHAMPION'].includes(r.status)||(r.user_id&&finalCutIds.includes(r.user_id)));
 const cutIndex=Math.max(0,activeStandings.length-cutCount);
 const cutBoundary=activeStandings[cutIndex];
 const weeklyPoints=(r:any)=>r.ps.find((p:any)=>p.week_id===rankingWeek?.id)?.points??0;
 const cutTied=!cutFinal&&cutIndex>0&&!!cutBoundary
  &&weeklyPoints(activeStandings[cutIndex-1])===weeklyPoints(cutBoundary)
  &&activeStandings[cutIndex-1].ytd===cutBoundary.ytd;
 const belowCut=(r:any,i:number)=>cutFinal
  ?!!r.user_id&&finalCutIds.includes(r.user_id)
  :i>=cutIndex||cutTied&&weeklyPoints(r)===weeklyPoints(cutBoundary)&&r.ytd===cutBoundary.ytd;
 const firstBelowCut=activeStandings.findIndex(belowCut);

 return <main className="container"><h1>Standings</h1><p className="muted">Season totals and weekly scores.</p>
 {rankingWeek&&rankingWeek.status!=='COMPLETE'&&<div className="card" style={{marginBottom:16}}>
  <form action="/standings" method="get">
   <button type="submit" role="switch" aria-checked={projected} name="projected" value={projected?'0':'1'} aria-describedby="projection-note">
    Show projected standings: {projected?'ON':'OFF'}
   </button>
  </form>
  <p id="projection-note" className="muted">{projectionReady?'UNOFFICIAL — ':''}Treats current game leaders as winners. Tied and unstarted games are unscored. Official results and eliminations are unchanged.</p>
  {projected&&!projectionReady&&<p role="alert">Projected scores could not be loaded. Showing official standings. Please refresh to try again.</p>}
 </div>}
 {projectionReady&&<p role="status"><strong>Unofficial projected standings — Week {rankingWeek!.week_number}</strong>. Weekly scores, YTD totals, rankings, and the cut line below assume current leaders win. Refresh for updated game scores.</p>}

 {rankingWeek&&cutCount>0&&activeStandings.length>0&&<div className="card" style={{overflowX:'auto',marginBottom:16}}>
  <h2>Week {rankingWeek.week_number} Survivor Standings</h2>
  <p className="muted">{cutFinal?'Final cut':'Projected cut'}: {cutCount} {cutCount===1?'player':'players'}. Ranked by weekly score, with YTD as the tiebreaker.</p>
  {cutTied&&<p role="status">Tie at the cut line: weekly score and YTD are equal. The highlighted tied players need a tiebreaker before the cut is final.</p>}
  <table><thead><tr><th>Rank</th><th>Player</th><th>Week {rankingWeek.week_number}</th><th>YTD</th><th>Cut Status</th></tr></thead>
   <tbody>{activeStandings.map((r:any,i:number)=>{
    const atRisk=belowCut(r,i);
    return <Fragment key={r.historical_id}>
     {i===firstBelowCut&&<tr><td colSpan={5} style={{borderTop:'3px solid #b91c1c',color:'#991b1b',fontWeight:700}}>{cutFinal?'Final cut':cutTied?'Projected cut — tied at boundary':'Projected cut'}</td></tr>}
     <tr style={atRisk?{backgroundColor:'#fef2f2',color:'#991b1b'}:undefined}>
      <td>{i+1}</td><td>{r.name}</td><td><strong>{weeklyPoints(r).toFixed(1)}</strong></td><td>{r.ytd.toFixed(1)}</td>
      <td>{atRisk?(cutFinal?'ELIMINATED':cutTied&&weeklyPoints(r)===weeklyPoints(cutBoundary)&&r.ytd===cutBoundary.ytd?'Tied at cut':'Currently below cut'):(cutFinal?'SAFE':'Currently above cut')}</td>
     </tr>
    </Fragment>;
   })}</tbody>
  </table>
 </div>}

 <div className="card" style={{overflowX:'auto'}}><h2>Overall Standings</h2><p className="muted">{rankByWeek?`Ranked by Week ${rankingWeek.week_number} score, with YTD as the tiebreaker.`:'Ranked by YTD score.'}</p>{rows.length?<table><thead><tr><th style={{width:1,whiteSpace:'nowrap'}}></th><th style={{whiteSpace:'nowrap',minWidth:'max-content'}}>Player</th><th>YTD</th>{[...(weeks??[])].reverse().map((w:any)=><th key={w.id}>W{w.week_number}</th>)}<th>Survivor Status</th></tr></thead><tbody>{rows.map((r:any,i:number)=><tr key={r.historical_id}><td style={{width:1,whiteSpace:'nowrap'}}>{i+1}</td><td style={{whiteSpace:'nowrap',minWidth:'max-content'}}>{r.name}</td><td><strong>{r.ytd.toFixed(1)}</strong></td>{[...(weeks??[])].reverse().map((w:any)=><td key={w.id}>{(r.ps.find((s:any)=>s.week_id===w.id)?.points??0).toFixed(1)}</td>)}<td>{r.status}</td></tr>)}</tbody></table>:<p className="muted">Standings will appear when league scores are loaded.</p>}</div>

 {postCut&&<><div className="card" style={{marginTop:16,overflowX:'auto'}}><h2>Week {lastWeek.week_number} Survivor Results</h2><p className="muted">{lastWeek.week_number===7?'Cut based on YTD score.':'Cut based on weekly score, with YTD as the tiebreaker.'}</p><table><thead><tr><th>Rank</th><th>Player</th><th>Week {lastWeek.week_number}</th><th>YTD</th><th>Result</th></tr></thead><tbody>{survivorResults.map((r:any,i:number)=><tr key={r.historical_id}><td>{i+1}</td><td>{r.name}</td><td>{r.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??'—'}</td><td>{r.ytd.toFixed(1)}</td><td><strong>{r.user_id&&eliminatedIds.includes(r.user_id)?'ELIMINATED':'SAFE'}</strong></td></tr>)}</tbody></table></div>
 {lastWeek.week_number>=8&&<div className="card" style={{marginTop:16,overflowX:'auto'}}><h2>Week {lastWeek.week_number} Consolation</h2><p className="muted">Weekly competition for players eliminated from Survivor.</p>{consolation.length?<table><thead><tr><th>Rank</th><th>Player</th><th>Weekly Score</th><th>YTD</th></tr></thead><tbody>{consolation.map((r:any,i:number)=><tr key={r.historical_id}><td>{i+1}</td><td>{r.name}{i===0?' — Weekly Winner':''}</td><td><strong>{r.last.toFixed(1)}</strong></td><td>{r.ytd.toFixed(1)}</td></tr>)}</tbody></table>:<p className="muted">Consolation results will appear after eliminated players complete the next week.</p>}</div>}</>}
 </main>;
}