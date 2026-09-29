export default function Dashboard() {
  return <main className="container">
    <h1>Player Dashboard</h1>
    <p className="muted">The production version will load the signed-in player's current week, picks, weekly score, YTD score, rank, and elimination status.</p>
    <div className="grid grid-3" style={{marginTop:20}}>
      <div className="card"><div className="muted">Current Week</div><div className="stat">—</div></div>
      <div className="card"><div className="muted">Weekly Score</div><div className="stat">—</div></div>
      <div className="card"><div className="muted">YTD Score</div><div className="stat">—</div></div>
    </div>
    <div className="card" style={{marginTop:16}}><h2>Current Picks</h2><p className="muted">Your 15 games and locked spreads will appear here once the commissioner publishes the week.</p></div>
  </main>;
}
