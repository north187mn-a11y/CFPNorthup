import { requireCommissioner } from '@/lib/auth';
import Link from 'next/link';
import PublishWeekButton from './PublishWeekButton';
import DeleteWeekButton from './DeleteWeekButton';
import ESPNGameSelector from './ESPNGameSelector';

function gameDay(value:string|null){
  if(!value)return '—';
  return new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'America/New_York'}).format(new Date(value));
}
function gameTime(value:string|null){
  if(!value)return '—';
  return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York',timeZoneName:'short'}).format(new Date(value));
}

export default async function ManageWeek({params}:{params:Promise<{weekId:string}>}){
  const {weekId}=await params;
  const {supabase}=await requireCommissioner();
  const {data:week}=await supabase.from('weeks').select('*').eq('id',weekId).single();
  if(!week)return <main className="container"><h1>Week not found</h1></main>;
  const {data:games}=await supabase.from('games').select('*').eq('week_id',weekId).order('game_number');
  return <main className="container">
    <div className="page-head"><div><h1>Week {week.week_number}</h1><p className="muted">Status: <span className="badge">{week.status}</span>{week.pick_deadline?` · Deadline: ${new Date(week.pick_deadline).toLocaleString()}`:''}</p></div><div style={{display:'flex',gap:10,alignItems:'flex-start'}}>{week.status==='DRAFT' && <PublishWeekButton weekId={weekId} gameCount={games?.length??0}/>}{(games?.length??0)>0 && <Link href={`/commissioner/weeks/${weekId}/games/new`}><button>+ Add Game</button></Link>}</div></div>
    {week.status==='DRAFT' && (games?.length??0)===0 && <ESPNGameSelector weekId={weekId}/>}\n    <div className="card" style={{marginTop:16}}><h2>Games ({games?.length??0}/15)</h2>
      {!games?.length?<p className="muted">Load the ESPN week and select 15 games. The spread, bonus, day, time, and network will come from ESPN.</p>:
      <div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>Matchup</th><th>Day</th><th>Time</th><th>Network</th><th>Locked spread</th><th>ESPN ID</th><th>Status</th></tr></thead><tbody>
        {games.map(g=><tr key={g.id}><td>{g.game_number}</td><td>{g.away_team} @ {g.home_team}</td><td>{gameDay(g.kickoff_at)}</td><td>{gameTime(g.kickoff_at)}</td><td>{g.network||'—'}</td><td>{g.locked_spread}</td><td>{g.espn_event_id||'—'}</td><td>{g.status}</td></tr>)}
      </tbody></table></div>}
    </div>
    <DeleteWeekButton weekId={weekId} weekNumber={week.week_number} status={week.status}/>
  </main>
}