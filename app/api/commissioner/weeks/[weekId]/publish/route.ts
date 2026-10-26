import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';
import {requireLeagueCommissioner} from '@/lib/league-commissioner';

export async function POST(_req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  try {
    const { weekId } = await params;
    const { supabase, user } = await requireCommissioner();

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
            .single();

    if (!league) return NextResponse.json({ error: 'League not found.' }, { status: 404 });
    await requireLeagueCommissioner(week.league_id);
    if (week.status !== 'DRAFT') return NextResponse.json({ error: `Week is already ${week.status}.` }, { status: 409 });

    // A new week cannot be published until every earlier week is finalized.
    const { data:earlierWeeks,error:earlierError } = await supabase.from('weeks')
      .select('week_number,status').eq('league_id',week.league_id)
      .lt('week_number', (await supabase.from('weeks').select('week_number').eq('id',week.id).single()).data?.week_number ?? 0);
    if(earlierError)throw earlierError;
    const unfinished=(earlierWeeks??[]).filter(w=>w.status!=='COMPLETE');
    if(unfinished.length)return NextResponse.json({error:`Close Week ${unfinished[0].week_number} before publishing this week.`},{status:409});

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
