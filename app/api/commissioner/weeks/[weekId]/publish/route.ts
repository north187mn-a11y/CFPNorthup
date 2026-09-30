import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  try {
    const { weekId } = await params;
    const { supabase, profile } = await requireCommissioner();

    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .select('id, league_id, status')
      .eq('id', weekId)
      .single();

    if (weekError || !week) return NextResponse.json({ error: 'Week not found.' }, { status: 404 });

    const { data: league } = await supabase
      .from('leagues')
      .select('id')
      .eq('id', week.league_id)
      .eq('commissioner_id', profile.id)
      .single();

    if (!league) return NextResponse.json({ error: 'You cannot publish this week.' }, { status: 403 });
    if (week.status !== 'DRAFT') return NextResponse.json({ error: `Week is already ${week.status}.` }, { status: 409 });

    const { count, error: countError } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('week_id', week.id);

    if (countError) throw countError;
    if (count !== 15) return NextResponse.json({ error: `Week must have exactly 15 games; it currently has ${count ?? 0}.` }, { status: 400 });

    const { data, error } = await supabase
      .from('weeks')
      .update({ status: 'OPEN' })
      .eq('id', week.id)
      .eq('status', 'DRAFT')
      .select('id, status')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}
