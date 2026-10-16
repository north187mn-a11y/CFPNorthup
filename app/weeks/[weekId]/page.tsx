import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/auth';

export default async function WeekHistory({params}:{params:Promise<{weekId:string}>}){
 const {weekId}=await params;
 const {supabase,user}=await requireUser();
 const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 const {data:w}=m?await supabase.from('weeks').select('*').eq('id',Number(weekId)).eq('league_id',m.league_id).single():{data:null};
 if(!w)notFound();
 const {data:games}=await supabase.from('games').select('*').eq('week_id',w.id).order('game_number');
 const {data:hp}=await supabase.from('historical_players').select('id,display_name,user_id').eq('league_id',m!.league_id);
 const linkedIds=(hp??[]).map(p=>p.user_id).filter(Boolean) as string[];
 const {data:profiles}=linkedIds.length?await supabase.from('profiles').select('id,full_name').in('id',linkedIds):{data:[] as any[]};
 const useLive=w.week_number>=5;
 const {data:historicalScores}=!useLive?await supabase.from('historical_week_scores').select('historical_player_id,points,ytd_after').eq('week_id',w.id):{data:[] as any[]};
 const {data:historicalPicks}=!useLive?await supabase.from('historical_picks').select('historical_player_id,game_number,selected_team_name,points').eq('week_id',w.id):{data:[] as any[]};
 const {data:liveScores}=useLive?await supabase.from('weekly_scores').select('player_id,points').eq('week_id',w.id):{data:[] as any[]};
 const {data:livePicks}=useLive?await supabase.from('picks').select('player_id,game_id,selected_team_name').eq('week_id',w.id):{data:[] as any[]};
 const {data:allScores}=useLive?await supabase.from('weekly_scores').select('week_id,player_id,points').in('week_id',(await supabase.from('weeks').select('id').eq('league_id',m!.league_id).lte('week_number',w.week_number)).data?.map(x=>x.id)??[w.id]):{data:[] as any[]};
 const {data:earlierHistorical}=useLive?await supabase.from('historical_week_scores').select('historical_player_id,points,week_id'): {data:[] as any[]};
 const {data:earlierWeeks}=useLive?await supabase.from('weeks').select('id,week_number').eq('league_id',m!.league_id).lt('week_number',5):{data:[] as any[]};
 const earlierIds=new Set((earlierWeeks??[]).map(x=>x.id));
 const players=(hp??[]).map(p=>{
  const name=(profiles??[]).find(x=>x.id===p.user_id)?.full_name??p.display_name;
  const historical=(historicalScores??[]).find(x=>x.historical_player_id===p.id);
  const live=(liveScores??[]).find(x=>x.player_id===p.user_id);
  const points=useLive?Number(live?.points??0):Number(historical?.points??0);
  const ytd=useLive?(earlierHistorical??[]).filter(x=>x.historical_player_id===p.id&&earlierIds.has(x.week_id)).reduce((a,x)=>a+Number(x.points),0)+(allScores??[]).filter(x=>x.player_id===p.user_id).reduce((a,x)=>a+Number(x.points),0):Number(historical?.ytd_after??0);
  return {...p,name,points,ytd,hasScore:useLive?!!live:!!historical};
 }).filter(p=>p.hasScore).sort((a,b)=>b.points-a.points||b.ytd-a.ytd||a.name.localeCompare(b.name));
 const pick=(pid:number,userId:string|null,gn:number,gameId:number)=>useLive?(livePicks??[]).find(p=>p.player_id===userId&&p.game_id===gameId):(historicalPicks??[]).find(p=>p.historical_player_id===pid&&p.game_number===gn);
 return <main className="container"><h1>Week {w.week_number}</h1><p className="muted">{w.status} · {players.length} players · {(games??[]).length} games</p>
 <div className="card" style={{overflowX:'auto',marginBottom:20}}><h2>Week {w.week_number} Standings</h2><table><thead><tr><th>Rank</th><th>Player</th><th>Week</th><th>YTD</th></tr></thead><tbody>{players.map((p,i)=><tr key={p.id}><td>{i+1}</td><td>{p.name}</td><td>{p.points.toFixed(1)}</td><td><strong>{p.ytd.toFixed(1)}</strong></td></tr>)}</tbody></table></div>
 <div className="card" style={{overflowX:'auto'}}><h2>All Players' Picks — Ranked by Weekly Score</h2><p className="muted">Highest weekly score first. Ties are ordered by year-to-date score.</p><table><thead><tr><th>Player</th>{(games??[]).map(g=><th key={g.id}>#{g.game_number}<br/><span className="muted">{g.away_team} @ {g.home_team}</span></th>)}<th>Score</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td style={{whiteSpace:'nowrap'}}><strong>{p.name}</strong></td>{(games??[]).map(g=>{const x=pick(p.id,p.user_id,g.game_number,g.id);return <td key={g.id} style={{whiteSpace:'nowrap'}}>{x? <>{x.selected_team_name}{!useLive&&Number((x as any).points)>0?<strong> ({Number((x as any).points).toFixed(1)})</strong>:''}</>:'—'}</td>})}<td><strong>{p.points.toFixed(1)}</strong></td></tr>)}</tbody></table></div>
 </main>;
}
