import {requireUser} from '@/lib/auth';

export default async function Standings(){
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!m)return <main className="container"><h1>Standings</h1><p className="muted">You are not attached to a league.</p></main>;

 const {data:weeks}=await supabase.from('weeks').select('id,week_number,status').eq('league_id',m.league_id).order('week_number');
 const {data:members}=await supabase.from('league_members').select('user_id,status').eq('league_id',m.league_id);
 const weekIds=(weeks??[]).map(w=>w.id);
 const {data:liveScores}=weekIds.length?await supabase.from('weekly_scores').select('week_id,player_id,points').in('week_id',weekIds):{data:[] as any[]};
 const ids=(members??[]).map(x=>x.user_id);
 const {data:profiles}=ids.length?await supabase.from('profiles').select('id,full_name,role').in('id',ids):{data:[] as any[]};
 const playerIds=(profiles??[]).filter((p:any)=>p.role==='PLAYER').map((p:any)=>p.id);
 const playerMembers=(members??[]).filter((x:any)=>playerIds.includes(x.user_id));

 const {data:historicalPlayers}=playerIds.length?await supabase.from('historical_players').select('id,user_id').eq('league_id',m.league_id).in('user_id',playerIds):{data:[] as any[]};
 const historicalIds=(historicalPlayers??[]).map(p=>p.id);
 const {data:historicalScores}=historicalIds.length&&weekIds.length?await supabase.from('historical_week_scores').select('week_id,historical_player_id,points').in('historical_player_id',historicalIds).in('week_id',weekIds):{data:[] as any[]};

 const rows=playerMembers.map((x:any)=>{
  const hp=(historicalPlayers??[]).find((p:any)=>p.user_id===x.user_id);
  const ps=(weeks??[]).map((w:any)=>{
   const historical=hp?(historicalScores??[]).find((s:any)=>s.historical_player_id===hp.id&&s.week_id===w.id):undefined;
   const live=(liveScores??[]).find((s:any)=>s.player_id===x.user_id&&s.week_id===w.id);
   const source=historical??live;
   return source?{week_id:w.id,week_number:w.week_number,points:Number(source.points)}:null;
  }).filter(Boolean) as {week_id:number,week_number:number,points:number}[];
  return {...x,name:(profiles??[]).find((p:any)=>p.id===x.user_id)?.full_name??'Player',ytd:ps.reduce((a,s)=>a+s.points,0),ps};
 }).sort((a,b)=>b.ytd-a.ytd);

 const completed=(weeks??[]).filter((w:any)=>w.status==='COMPLETE');
 const lastWeek=completed.length?completed[completed.length-1]:null;
 const postCut=!!lastWeek&&lastWeek.week_number>=7;
 const {data:eliminations}=postCut?await supabase.from('eliminations').select('player_id,weekly_score,ytd_score,elimination_rank').eq('league_id',m.league_id).eq('week_id',lastWeek.id):{data:[] as any[]};
 const eliminatedIds=(eliminations??[]).map((e:any)=>e.player_id);
 const survivorResults=postCut?[...rows].sort((a,b)=>{
   const aw=a.ps.find(p=>p.week_id===lastWeek.id)?.points??0, bw=b.ps.find(p=>p.week_id===lastWeek.id)?.points??0;
   return lastWeek.week_number===7?b.ytd-a.ytd:(bw-aw)||(b.ytd-a.ytd);
 }):[];
 const consolation=postCut?rows.filter((r:any)=>r.status==='ELIMINATED').map((r:any)=>({...r,last:r.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??0})).sort((a:any,b:any)=>b.last-a.last||b.ytd-a.ytd):[];

 return <main className="container"><h1>Standings</h1><p className="muted">Season totals and weekly scores.</p>
 <div className="card" style={{overflowX:'auto'}}><h2>Overall Standings</h2>{rows.length?<table><thead><tr><th>Rank</th><th>Player</th>{(weeks??[]).map((w:any)=><th key={w.id}>W{w.week_number}</th>)}<th>YTD</th><th>Survivor Status</th></tr></thead><tbody>{rows.map((r:any,i:number)=><tr key={r.user_id}><td>{i+1}</td><td>{r.name}</td>{(weeks??[]).map((w:any)=><td key={w.id}>{r.ps.find((s:any)=>s.week_id===w.id)?.points??'—'}</td>)}<td><strong>{r.ytd.toFixed(1)}</strong></td><td>{r.status}</td></tr>)}</tbody></table>:<p className="muted">Standings will appear when league scores are loaded.</p>}</div>

 {postCut&&<><div className="card" style={{marginTop:16,overflowX:'auto'}}><h2>Week {lastWeek.week_number} Survivor Results</h2><p className="muted">{lastWeek.week_number===7?'Cut based on YTD score.':'Cut based on weekly score, with YTD as the tiebreaker.'}</p><table><thead><tr><th>Rank</th><th>Player</th><th>Week {lastWeek.week_number}</th><th>YTD</th><th>Result</th></tr></thead><tbody>{survivorResults.map((r:any,i:number)=><tr key={r.user_id}><td>{i+1}</td><td>{r.name}</td><td>{r.ps.find((p:any)=>p.week_id===lastWeek.id)?.points??'—'}</td><td>{r.ytd.toFixed(1)}</td><td><strong>{eliminatedIds.includes(r.user_id)?'ELIMINATED':'SAFE'}</strong></td></tr>)}</tbody></table></div>
 {lastWeek.week_number>=8&&<div className="card" style={{marginTop:16,overflowX:'auto'}}><h2>Week {lastWeek.week_number} Consolation</h2><p className="muted">Weekly competition for players eliminated from Survivor.</p>{consolation.length?<table><thead><tr><th>Rank</th><th>Player</th><th>Weekly Score</th><th>YTD</th></tr></thead><tbody>{consolation.map((r:any,i:number)=><tr key={r.user_id}><td>{i+1}</td><td>{r.name}{i===0?' — Weekly Winner':''}</td><td><strong>{r.last.toFixed(1)}</strong></td><td>{r.ytd.toFixed(1)}</td></tr>)}</tbody></table>:<p className="muted">Consolation results will appear after eliminated players complete the next week.</p>}</div>}</>}
 </main>;
}