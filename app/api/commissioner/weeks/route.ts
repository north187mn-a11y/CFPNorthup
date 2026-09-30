import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireCommissioner();
    const body = await req.json();

    const weekNumber = Number(body.week_number);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 20) {
      return NextResponse.json({ error: 'Enter a valid week number.' }, { status: 400 });
    }

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, season')
      .eq('commissioner_id', user.id)
      .order('season', { ascending: false })
      .limit(1)
      .single();

    if (leagueError || !league) {
      return NextResponse.json({ error: 'Commissioner league not found.' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('weeks')
      .insert({
        league_id: league.id,
        week_number: weekNumber,
        week_type: 'REGULAR',
        status: 'DRAFT',
        pick_deadline: body.pick_deadline || null,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Week ${weekNumber} already exists.` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
