import Link from 'next/link';
import { requireCommissioner } from '@/lib/auth';

export default async function Commissioner() {
  const { supabase, profile } = await requireCommissioner();
  const { data: league } = await supabase.from('leagues').select('id,name,season').eq('commissioner_id', profile.id).order('season',{ascending:false}).limit(1).single();
  if (!league) return <main className="container"><h1>No league found</h1><p className="muted">Your commissioner profile exists, but no league is attached.</p></main>;
  const { data: weeks } = await supabase.from('weeks').select('id,week_number,week_type,status,pick_deadline').eq('league_id', league.id).order('week_number');
  const { count: playerCount } = await supabase.from('league_members').select('*',{count:'exact',head:true}).eq('league_id',league.id).neq('status','ELIMINATED');
  return <main className="container">
    <div className="page-head"><div><h1>Commissioner Dashboard</h1><p className="muted">{league.name} · {league.season}</p></div><Link href="/commissioner/weeks/new"><button>+ New Week</button></Link></div>
    <div className="grid grid-3" style={{marginTop:20}}>
      <div className="card"><div className="muted">Active Players</div><div className="stat">{playerCount ?? 0}</div></div>
      <div className="card"><div className="muted">Weeks Created</div><div className="stat">{weeks?.length ?? 0}</div></div>
      <div className="card"><div className="muted">Season</div><div className="stat">{league.season}</div></div>
    </div>
    <div className="card" style={{marginTop:16}}><h2>Weeks</h2>
      {!weeks?.length ? <p className="muted">No weeks yet. Create the first week to start entering games.</p> : <table><thead><tr><th>Week</th><th>Type</th><th>Status</th><th>Deadline</th><th></th></tr></thead><tbody>{weeks.map(w=><tr key={w.id}><td>Week {w.week_number}</td><td>{w.week_type}</td><td><span className="badge">{w.status}</span></td><td>{w.pick_deadline ? new Date(w.pick_deadline).toLocaleString() : '—'}</td><td><Link href={`/commissioner/weeks/${w.id}`}>Manage →</Link></td></tr>)}</tbody></table>}
    </div>
  </main>;
}
