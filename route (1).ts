import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';

export async function POST(_: Request, { params }: { params: Promise<{ weekId: string }> }) {
  try {
    const { supabase } = await requireCommissioner();
    const { weekId } = await params;
    const { data: picks, error } = await supabase.from('picks').select('id, player_id, selected_team_id, game_id, games!inner(winner_team_id, favorite_team_id, favorite_points, underdog_points, locked_spread)').eq('week_id', weekId);
    if (error) throw error;
    const totals = new Map<string, number>();
    for (const pick of picks ?? []) {
      const game = Array.isArray(pick.games) ? pick.games[0] : pick.games as any;
      if (!game?.winner_team_id) continue;
      const correct = pick.selected_team_id === game.winner_team_id;
      const points = correct ? Number(pick.selected_team_id === game.favorite_team_id ? game.favorite_points : game.underdog_points) : 0;
      const rounded = Math.round(points * 100) / 100;
      totals.set(pick.player_id, Math.round(((totals.get(pick.player_id) ?? 0) + rounded) * 100) / 100);
      await supabase.from('pick_results').upsert({ pick_id: pick.id, points: rounded, correct, was_favorite: pick.selected_team_id === game.favorite_team_id, spread: game.locked_spread });
    }
    for (const [playerId, points] of totals) await supabase.from('weekly_scores').upsert({ week_id: weekId, player_id: playerId, points }, { onConflict: 'week_id,player_id' });
    return NextResponse.json({ weekId, totals: Object.fromEntries(totals) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 }); }
}
