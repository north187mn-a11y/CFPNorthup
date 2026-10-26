import Link from 'next/link';
import { requireCommissioner } from '@/lib/auth';
import InvitePlayerForm from './InvitePlayerForm';
import MakeFinalButton from './MakeFinalButton';
import ApplyWeeklyCutButton from './ApplyWeeklyCutButton';

export default async function Commissioner() {
  const { supabase, profile } = await requireCommissioner();
  const { data: league } = await supabase.from('leagues').select('id,name,season,commissioner_id').order('season',{ascending:false}).limit(1).single();
  if (!league) return <main className="container"><h1>No league found</h1><p className="muted">Your commissioner profile exists, but no league is attached.</p></main>;
  const { data: weeks } = await supabase.from('weeks').select('id,week_number,week_type,status,pick_deadline').eq('league_id', league.id).order('week_number');
  const weekIds = (weeks ?? []).map(w => w.id);
  const { data: allWeekGames } = weekIds.length ? await supabase.from('games').select('week_id,status').in('week_id',weekIds) : {data: [] as {week_id:number,status:string}[]};
  const finalReadiness = new Map((weeks ?? []).map(w => {
    const games = (allWeekGames ?? []).filter(g => g.week_id === w.id);
    const remaining = games.filter(g => g.status !== 'FINAL').length;
    return [w.id,{ready:games.length===15 && remaining===0,gameCount:games.length,remaining}] as const;
  }));
  const { data: appliedCuts } = weekIds.length ? await supabase.from('eliminations').select('week_id,player_id').in('week_id',weekIds) : {data: [] as {week_id:number,player_id:string}[]};
  const cutCountByWeek = new Map(weekIds.map(id => [id,(appliedCuts??[]).filter(e=>e.week_id===id).length]));
  const { count: playerCount } = await supabase.from('league_members').select('*',{count:'exact',head:true}).eq('league_id',league.id).neq('status','ELIMINATED');
  const currentWeek = [...(weeks ?? [])].reverse().find(w => ['OPEN','LOCKED','SCORING'].includes(w.status)) ?? [...(weeks ?? [])].reverse().find(w => w.status === 'COMPLETE') ?? [...(weeks ?? [])].reverse()[0];
  const { data: members } = await supabase.from('league_members').select('user_id').eq('league_id', league.id);
  const memberIds = (members ?? []).map(m => m.user_id);
  const { data: profiles } = memberIds.length ? await supabase.from('profiles').select('id,full_name,role').in('id',memberIds) : {data: [] as {id:string,full_name:string,role:string}[]};
  const playerIds = memberIds.filter(id => id !== league.commissioner_id);
  const { count: gameCount } = currentWeek ? await supabase.from('games').select('*',{count:'exact',head:true}).eq('week_id',currentWeek.id) : {count:0};
  const { data: submittedPicks } = currentWeek ? await supabase.from('picks').select('player_id,game_id').eq('week_id',currentWeek.id) : {data: [] as {player_id:string,game_id:number}[]};
  const submissionRows = playerIds.map(id => ({id, name: profiles?.find(p => p.id === id)?.full_name || 'Unnamed player', count: new Set((submittedPicks ?? []).filter(p => p.player_id === id).map(p => p.game_id)).size})).sort((a,b) => a.count-b.count || a.name.localeCompare(b.name));
  const totalGames = gameCount ?? 0;
  const completedCount = submissionRows.filter(r => totalGames > 0 && r.count >= totalGames).length;
  const incompleteCount = submissionRows.filter(r => r.count > 0 && r.count < totalGames).length;
  const notStartedCount = submissionRows.filter(r => r.count === 0).length;
  const { data: weekGames } = currentWeek ? await supabase.from('games').select('id,status,winner_team_id,commissioner_override,override_winner_team_id,game_number').eq('week_id',currentWeek.id) : {data: [] as {id:number,status:string,winner_team_id:string|null,commissioner_override:boolean,override_winner_team_id:string|null,game_number:number}[]};
  const { data: weeklyScores } = currentWeek ? await supabase.from('weekly_scores').select('player_id').eq('week_id',currentWeek.id) : {data: [] as {player_id:string}[]};
  const finalizedGames = (weekGames ?? []).filter(g => g.status === 'FINAL').length;
  const missingWinners = (weekGames ?? []).filter(g => g.status === 'FINAL' && !(g.commissioner_override ? g.override_winner_team_id : g.winner_team_id));
  const gamesReady = totalGames === 15;
  const scoresExpected = currentWeek?.status === 'COMPLETE';
  const missingScoreRows = scoresExpected ? playerIds.filter(id => !(weeklyScores ?? []).some(s => s.player_id === id)) : [];
  const healthIssues = [
    ...(!gamesReady ? [`Week has ${totalGames}/15 games`] : []),
    ...missingWinners.map(g => `Game ${g.game_number} is FINAL without a recorded winner`),
    ...(missingScoreRows.length ? [`${missingScoreRows.length} player(s) have no weekly score row`] : []),
  ];
  return <main className="container">
    <div className="page-head"><div><h1>Commissioner Dashboard</h1><p className="muted">{league.name} · {league.season}</p></div><Link href="/commissioner/weeks/new"><button>+ New Week</button></Link></div>
    <div className="grid grid-3" style={{marginTop:20}}>
      <div className="card"><div className="muted">Survivor Players Remaining</div><div className="stat">{playerCount ?? 0}</div></div>
      <div className="card"><div className="muted">Weeks Created</div><div className="stat">{weeks?.length ?? 0}</div></div>
      <div className="card"><div className="muted">Season</div><div className="stat">{league.season}</div></div>
    </div>
    {currentWeek && <section className="card" style={{marginTop:16}} aria-label="Week finalization checklist">
      <h2>Week {currentWeek.week_number} — Finalization Checklist</h2>
      <p className="muted">Review these checks before selecting Make Final. This checklist does not change league data.</p>
      <ul>
        <li>{totalGames === 15 ? '✓' : '○'} Games scheduled: {totalGames}/15</li>
        <li>{totalGames === 15 && finalizedGames === 15 ? '✓' : '○'} Games marked final: {finalizedGames}/15</li>
        <li>{missingWinners.length === 0 ? '✓' : '○'} Final games with a recorded winner: {finalizedGames - missingWinners.length}/{finalizedGames}</li>
        <li>{currentWeek.status === 'COMPLETE' ? '✓' : '○'} Week status: {currentWeek.status === 'COMPLETE' ? 'Completed' : 'Not yet completed'}</li>
      </ul>
      {currentWeek.status === 'COMPLETE'
        ? <p role="status">This week is already complete. Review the scores and, when applicable, the weekly cut preview.</p>
        : totalGames !== 15
        ? <p role="status">Next action: configure exactly 15 games.</p>
        : finalizedGames !== 15
        ? <p role="status">Next action: wait for all games to finish and verify their results.</p>
        : missingWinners.length
        ? <p role="status">Next action: resolve missing winners before finalizing.</p>
        : <p role="status">All checklist checks passed. You can review results and use Make Final in the Weeks table below.</p>}
      <p className="muted">Make Final recalculates scores. After completion, inspect official standings before applying a cut.</p>
    </section>}
    {currentWeek && <section className="card" style={{marginTop:16}} aria-label="League health">
      <h2>Week {currentWeek.week_number} — League Health</h2>
      <p className="muted">Read-only operational checks · {currentWeek.status}</p>
      <div className="grid grid-3">
        <div><strong>{totalGames}/15</strong><div className="muted">Games configured</div></div>
        <div><strong>{finalizedGames}/{totalGames}</strong><div className="muted">Games final</div></div>
        <div><strong>{(weeklyScores??[]).length}</strong><div className="muted">Weekly score records</div></div>
      </div>
      {healthIssues.length ? <div role="status" style={{marginTop:12}}><strong>Items to review</strong><ul>{healthIssues.map(issue=><li key={issue}>{issue}</li>)}</ul></div> : <p role="status" style={{marginTop:12}}>No structural issues detected by these checks. This does not guarantee scoring accuracy.</p>}
      <p className="muted">Scoring records are required after a week is completed. Open weeks may have none yet.</p>
    </section>}
    <div style={{marginTop:16,display:'flex',gap:12,flexWrap:'wrap'}}><Link href="/commissioner/corrections"><button>Game Corrections</button></Link><Link href="/commissioner/league-support" className="card link-card"><strong>League Support →</strong><p className="muted">Record contributions and view payment history and total collected.</p></Link></div>
    {currentWeek && <div className="card" style={{marginTop:16,overflowX:'auto'}}>
      <h2>Week {currentWeek.week_number} — Pick Submission Status</h2>
      <p className="muted">Completed: {completedCount} · Incomplete: {incompleteCount} · Not started: {notStartedCount} · Remaining: {submissionRows.length-completedCount}</p>
      <p className="muted">Deadline: {currentWeek.pick_deadline ? new Date(currentWeek.pick_deadline).toLocaleString() : 'Not set'} · {totalGames} games</p>
      <details open><summary>Players still needing picks ({submissionRows.length-completedCount})</summary>
        <table><thead><tr><th>Player</th><th>Picks</th><th>Status</th></tr></thead><tbody>
          {submissionRows.filter(r => r.count < totalGames).map(r => <tr key={r.id}><td>{r.name}</td><td>{r.count}/{totalGames}</td><td>{r.count === 0 ? 'Not started' : 'Incomplete'}</td></tr>)}
        </tbody></table>
      </details>
      <details style={{marginTop:12}}><summary>Completed players ({completedCount})</summary>
        <table><thead><tr><th>Player</th><th>Picks</th><th>Status</th></tr></thead><tbody>
          {submissionRows.filter(r => totalGames > 0 && r.count >= totalGames).map(r => <tr key={r.id}><td>{r.name}</td><td>{r.count}/{totalGames}</td><td>Completed</td></tr>)}
        </tbody></table>
      </details>
    </div>}
    {currentWeek && currentWeek.week_number >= 7 && <section className="card" style={{marginTop:16}}>
      <h2>Elimination Management — Week {currentWeek.week_number}</h2>
      <p className="muted">{currentWeek.week_number === 7
        ? 'Week 7 cut: rank by season-to-date points. The lowest 14 of the original 28 are eliminated.'
        : currentWeek.week_number <= 11
        ? 'Weeks 8–11: eliminate two active survivors based on weekly points, using YTD points to break ties.'
        : currentWeek.week_number <= 13
        ? 'Weeks 12–13: eliminate one active survivor based on weekly points, using YTD points to break ties.'
        : 'Finals: no automatic weekly survivor cut.'}</p>
      <p>Review the weekly standings and the cut line before confirming any elimination. A tie in both weekly and YTD scores at the boundary requires resolution.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <Link href="/standings"><button>Review Official Standings</button></Link>
        {currentWeek.status !== 'COMPLETE' && <Link href="/standings?projected=1"><button>Review Projected Cut</button></Link>}
      </div>
      <p className="muted" style={{marginTop:12}}>Projected standings are unofficial. Finalize the week and use the elimination preview before confirming a cut.</p>
    </section>}
    <InvitePlayerForm />
    <section className="card" style={{marginTop:16}}>
      <style>{`@media (max-width: 700px) { .commissioner-week-table { display: none; } } @media (min-width: 701px) { .commissioner-week-cards { display: none; } } .commissioner-week-cards { gap: 12px; } .commissioner-week-cards > article { margin-bottom: 12px; }`}</style>
      <h2>Weeks</h2>
      {!weeks?.length ? <p className="muted">No weeks yet. Create the first week to start entering games.</p> : <>
        <div className="commissioner-week-cards">
          {[...weeks].reverse().map(w => <article key={w.id} className="card" style={{padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
              <strong>Week {w.week_number}</strong><span className="badge">{w.status}</span>
            </div>
            <p className="muted">{w.week_type} · {w.pick_deadline ? new Date(w.pick_deadline).toLocaleString() : 'No deadline'}</p>
            <p className="muted">{finalReadiness.get(w.id)?.gameCount??0}/15 games · {finalReadiness.get(w.id)?.remaining??0} unfinished</p>
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:10}}>
              <Link href={`/commissioner/weeks/${w.id}`}>Manage week</Link>
              {w.status==='COMPLETE' ? <>{w.week_number>=8 && w.week_number<=13 && ((cutCountByWeek.get(w.id)??0)>0 ? <span className="muted">Cut applied ({cutCountByWeek.get(w.id)} players)</span> : <ApplyWeeklyCutButton weekId={w.id}/>)}</> : <MakeFinalButton weekId={w.id} disabled={!finalReadiness.get(w.id)?.ready}/>}
            </div>
          </article>)}
        </div>
        <div className="commissioner-week-table" style={{overflowX:'auto'}}>
          <table><thead><tr><th>Week</th><th>Type</th><th>Status</th><th>Deadline</th><th>Finalize</th><th>Manage</th></tr></thead><tbody>
            {weeks.map(w=><tr key={w.id}>
              <td>Week {w.week_number}</td><td>{w.week_type}</td><td><span className="badge">{w.status}</span></td>
              <td>{w.pick_deadline ? new Date(w.pick_deadline).toLocaleString() : '—'}</td>
              <td>{w.status==='COMPLETE' ? <><span className="muted">Final</span>{w.week_number>=8 && w.week_number<=13 && <ApplyWeeklyCutButton weekId={w.id}/>}</> : <><MakeFinalButton weekId={w.id} disabled={!finalReadiness.get(w.id)?.ready}/>{!finalReadiness.get(w.id)?.ready && <div className="muted" style={{fontSize:12,marginTop:4}}>{finalReadiness.get(w.id)?.gameCount??0}/15 games · {finalReadiness.get(w.id)?.remaining??0} unfinished</div>}</>}</td>
              <td><Link href={`/commissioner/weeks/${w.id}`}>Manage</Link></td>
            </tr>)}
          </tbody></table>
        </div>
      </>}
    </section>
  </main>;
}