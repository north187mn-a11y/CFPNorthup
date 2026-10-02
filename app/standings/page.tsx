import {requireUser} from '@/lib/auth';

export default async function Standings(){
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!m)return <main className="container"><h1>Standings</h1><p className="muted">You are not attached to a league.</p></main>;

 const {data:weeks}=await supabase.from('weeks').select('id,week_number').eq('league_id',m.league_id).order('week_number');
 const {data:members}=await supabase.from('league_members').select('user_id,status').eq('league_id',m.league_id);
 const weekIds=(weeks??[]).map(w=>w.id);
 const {data:liveScores}=weekIds.length?await supabase.from('weekly_scores').select('week_id,player_id,points').in('week_id',weekIds):{data:[] as any[]};
 const ids=(members??[]).map(x=>x.user_id);
 const {data:profiles}=ids.length?await supabase.from('profiles').select('id,full_name').in('id',ids):{data:[] as any[]};

 // Historical Weeks 1-4 are stored separately. user_id links a registered
 // account to the historical player record without guessing from names.
 const {data:historicalPlayers}=ids.length?await supabase.from('historical_players').select('id,user_id').eq('league_id',m.league_id).in('user_id',ids):{data:[] as any[]};
 const historicalIds=(historicalPlayers??[]).map(p=>p.id);
 const {data:historicalScores}=historicalIds.length&&weekIds.length?await supabase.from('historical_week_scores').select('week_id,historical_player_id,points').in('historical_player_id',historicalIds).in('week_id',weekIds):{data:[] as any[]};

 const rows=(members??[]).map(x=>{
  const hp=(historicalPlayers??[]).find(p=>p.user_id===x.user_id);
  const ps=(weeks??[]).map(w=>{
   const historical=hp?(historicalScores??[]).find(s=>s.historical_player_id===hp.id&&s.week_id===w.id):undefined;
   const live=(liveScores??[]).find(s=>s.player_id===x.user_id&&s.week_id===w.id);
   const source=historical??live;
   return source?{week_id:w.id,points:Number(source.points)}:null;
  }).filter(Boolean) as {week_id:number,points:number}[];
  return {...x,name:(profiles??[]).find(p=>p.id===x.user_id)?.full_name??'Player',ytd:ps.reduce((a,s)=>a+s.points,0),ps};
 }).sort((a,b)=>b.ytd-a.ytd);

 return <main className="container"><h1>Standings</h1><p className="muted">Season totals and weekly scores.</p><div className="card" style={{overflowX:'auto'}}>{rows.length?<table><thead><tr><th>Rank</th><th>Player</th>{(weeks??[]).map(w=><th key={w.id}>W{w.week_number}</th>)}<th>YTD</th><th>Status</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.user_id}><td>{i+1}</td><td>{r.name}</td>{(weeks??[]).map(w=><td key={w.id}>{r.ps.find(s=>s.week_id===w.id)?.points??'—'}</td>)}<td><strong>{r.ytd.toFixed(1)}</strong></td><td>{r.status}</td></tr>)}</tbody></table>:<p className="muted">Standings will appear when league scores are loaded.</p>}</div></main>;
}