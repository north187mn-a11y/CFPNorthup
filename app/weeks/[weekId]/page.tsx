import {notFound} from 'next/navigation';import {requireUser} from '@/lib/auth';
export default async function WeekHistory({params}:{params:Promise<{weekId:string}>}){
 const {weekId}=await params;const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 const {data:w}=m?await supabase.from('weeks').select('*').eq('id',Number(weekId)).eq('league_id',m.league_id).single():{data:null};if(!w)notFound();
 const {data:games}=await supabase.from('games').select('*').eq('week_id',w.id).order('game_number');
 const {data:hp}=await supabase.from('historical_players').select('id,display_name').eq('league_id',m!.league_id);
 const {data:scores}=await supabase.from('historical_week_scores').select('historical_player_id,points,ytd_after').eq('week_id',w.id);
 const {data:picks}=await supabase.from('historical_picks').select('historical_player_id,game_number,selected_team_name,points').eq('week_id',w.id);
 const players=(hp??[]).map(p=>({ ...p, score:scores?.find(s=>s.historical_player_id===p.id)})).filter(p=>p.score).sort((a,b)=>Number(b.score!.ytd_after)-Number(a.score!.ytd_after));
 const pick=(pid:number,gn:number)=>picks?.find(p=>p.historical_player_id===pid&&p.game_number===gn);
 return <main className="container"><h1>Week {w.week_number}</h1><p className="muted">Complete · {players.length} players · 15 games</p>
 <div className="card" style={{overflowX:'auto',marginBottom:20}}><h2>Week {w.week_number} Standings</h2><table><thead><tr><th>Rank</th><th>Player</th><th>Week</th><th>YTD</th></tr></thead><tbody>{players.map((p,i)=><tr key={p.id}><td>{i+1}</td><td>{p.display_name}</td><td>{Number(p.score!.points).toFixed(1)}</td><td><strong>{Number(p.score!.ytd_after).toFixed(1)}</strong></td></tr>)}</tbody></table></div>
 <div className="card" style={{overflowX:'auto'}}><h2>Games & Picks</h2><table><thead><tr><th>Player</th>{(games??[]).map(g=><th key={g.id}>#{g.game_number}<br/><span className="muted">{g.away_team} @ {g.home_team}</span></th>)}<th>Score</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td style={{whiteSpace:'nowrap'}}><strong>{p.display_name}</strong></td>{(games??[]).map(g=>{const x=pick(p.id,g.game_number);return <td key={g.id} style={{whiteSpace:'nowrap'}}>{x? <>{x.selected_team_name}{Number(x.points)>0?<strong> ({Number(x.points).toFixed(1)})</strong>:''}</>:'—'}</td>})}<td><strong>{Number(p.score!.points).toFixed(1)}</strong></td></tr>)}</tbody></table></div>
 </main>;
}