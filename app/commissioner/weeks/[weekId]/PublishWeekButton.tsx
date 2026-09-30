'use client';

import { useState } from 'react';

export default function PublishWeekButton({ weekId, gameCount }: { weekId: string; gameCount: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function publishWeek() {
    if (gameCount !== 15) return;
    if (!window.confirm('Publish this week? The 15 locked spreads and point values will not be changed.')) return;
    setBusy(true);
    setError('');
    const r = await fetch(`/api/commissioner/weeks/${weekId}/publish`, { method: 'POST' });
    const j = await r.json();
    if (!r.ok) {
      setError(j.error || 'Could not publish week.');
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return <div>
    <button onClick={publishWeek} disabled={busy || gameCount !== 15}>
      {busy ? 'Publishing…' : 'Publish Week'}
    </button>
    {gameCount !== 15 && <p className="muted" style={{marginTop:6}}>A week must have exactly 15 games before publishing.</p>}
    {error && <p className="error">{error}</p>}
  </div>;
}
