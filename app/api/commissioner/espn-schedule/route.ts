import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';
import { fetchESPNSchedule } from '@/lib/espn';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireCommissioner();
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');
    if (!weekId) return NextResponse.json({ error: 'weekId is required' }, { status: 400 });

    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .select('id,week_number,week_type,league_id')
      .eq('id', weekId)
      .single();
    if (weekError || !week) return NextResponse.json({ error: 'Week not found' }, { status: 404 });

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('season')
      .eq('id', week.league_id)
      .single();
    if (leagueError || !league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    const seasonType = week.week_type === 'FINAL' ? 3 : 2;
    const games = await fetchESPNSchedule(league.season, week.week_number, seasonType);
    return NextResponse.json({
      year: league.season,
      week: week.week_number,
      seasonType,
      games,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load ESPN schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
