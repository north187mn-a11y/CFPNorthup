import {requireUser} from '@/lib/auth';import PickSheet from './PickSheet';
export default async function Dashboard(){
 const {supabase,user}=await requireUser();
 const {data:membership}=await supabase.from('league_members').select('league_id,status').eq('user_id',user.id).limit(1).single();
 if(!membership)return <main className="container"><h1>Player Dashboard</h1><p className="muted">You are not yet attached to a league.</p></main>;
 const {data:week}=await supabase.from('weeks').select('*').eq('league_id',membership.league_id).in('status',['OPEN','LOCKED','SCORING','COMPLETE']).order('week_number',{ascending:false}).limit(1).single();
 if(!week)return <main className="container"><h1>Player Dashboard</h1><div className="card"><p className="muted">There is no published week yet.</p></div></main>;
 const {data:games}=await supabase.from('games').select('*').eq('week_id',week.id).order('game_number');
 const {data:mine}=await supabase.from('picks').select('game_id,selected_team_id').eq('week_id',week.id).eq('player_id',user.id);
 const initial=Object.fromEntries((mine??[]).map(p=>[String(p.game_id),p.selected_team_id]));
 const after=week.pick_deadline&&Date.now()>=new Date(week.pick_deadline).getTime();
 let all:any[]=[]; if(after){const {data}=await supabase.from('picks').select('player_id,game_id,selected_team_name').eq('week_id',week.id);all=data??[];}
 const {data:members}=after?await supabase.from('league_members').select('user_id').eq('league_id',membership.league_id):{data:[] as any[]};
 const ids=(members??[]).map((m:any)=>m.user_id); const {data:profiles}=after&&ids.length?await supabase.from('profiles').select('id,full_name').in('id',ids):{data:[] as any[]};
 return <main className="container"><div className="page-head"><div><h1>Player Dashboard</h1><p className="muted">Week {week.week_number} · <span className="badge">{week.status}</span>{week.pick_deadline?` · Picks due ${new Date(week.pick_deadline).toLocaleString()}`:''}</p></div></div>
 <PickSheet weekId={week.id} games={games??[]} initial={initial} deadline={week.pick_deadline}/>
 {after&&<div className="card" style={{marginTop:16}}><h2>Everyone's Picks</h2><p className="muted">Visible after the pick deadline.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Player</th>{(games??[]).map(g=><th key={g.id}>#{g.game_number}</th>)}</tr></thead><tbody>{(profiles??[]).map((p:any)=><tr key={p.id}><td>{p.full_name}</td>{(games??[]).map(g=><td key={g.id}>{all.find(x=>x.player_id===p.id&&x.game_id===g.id)?.selected_team_name??'—'}</td>)}</tr>)}</tbody></table></div></div>}
 </main>;
}