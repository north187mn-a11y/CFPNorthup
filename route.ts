import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';
import { fetchESPNGame } from '@/lib/espn';

export async function POST(_: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { supabase } = await requireCommissioner();
    const { gameId } = await params;
    const { data: game, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error || !game) throw error ?? new Error('Game not found');
    if (!game.espn_event_id) throw new Error('Game has no ESPN event ID.');
    const result = await fetchESPNGame(game.espn_event_id);
    const home = result.teams.find(t => t.id === game.home_team_id) ?? result.teams.find(t => t.name === game.home_team);
    const away = result.teams.find(t => t.id === game.away_team_id) ?? result.teams.find(t => t.name === game.away_team);
    if (!home || !away) throw new Error('ESPN teams did not match this league game. No result was changed.');
    let winnerTeamId: string | null = null;
    if (result.status === 'final' && home.score !== null && away.score !== null && home.score !== away.score) {
      winnerTeamId = home.score > away.score ? (home.id || game.home_team_id || game.home_team) : (away.id || game.away_team_id || game.away_team);
    }
    const status = result.status === 'final' ? 'FINAL' : result.status === 'in_progress' ? 'IN_PROGRESS' : result.status === 'scheduled' ? 'SCHEDULED' : game.status;
    const patch = { status, home_score: home.score, away_score: away.score, winner_team_id: winnerTeamId, source_url: result.sourceUrl, last_synced_at: new Date().toISOString() };
    const { data: updated, error: updateError } = await supabase.from('games').update(patch).eq('id', gameId).select().single();
    if (updateError) throw updateError;
    return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 }); }
}
