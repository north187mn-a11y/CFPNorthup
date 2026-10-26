import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
import {fetchESPNSchedule} from '@/lib/espn';

export async function POST(_req:Request,{params}:{params:Promise<{weekId:string}>}){
 try{
  const {weekId}=await params;
  const {supabase,user}=await requireCommissioner();
  const {data:week,error:weekError}=await supabase.from('weeks').select('id,league_id,week_number,week_type,status').eq('id',weekId).single();
  if(weekError||!week)return NextResponse.json({error:'Week not found.'},{status:404});
  if(week.status!=='DRAFT')return NextResponse.json({error:'Spreads can only be updated before publication.'},{status:409});
  const {data:league}=await supabase.from('leagues').select('id,season').eq('id',week.league_id).single();
  const {data:membership}=await supabase.from('league_members').select('id').eq('league_id',week.league_id).eq('user_id',user.id).maybeSingle();
  if(!league||!membership)return NextResponse.json({error:'Not authorized.'},{status:403});
  const {data:games,error:gamesError}=await supabase.from('games').select('id,espn_event_id').eq('week_id',week.id);
  if(gamesError)throw gamesError;
  if(!games?.length)return NextResponse.json({error:'Select games before updating spreads.'},{status:400});
  const schedule=await fetchESPNSchedule(league.season,week.week_number,week.week_type==='FINAL'?3:2);
  const changes=games.map(g=>({saved:g,latest:schedule.find(s=>s.eventId===g.espn_event_id)}));
  if(changes.some(c=>!c.latest||c.latest.spread===null||!c.latest.favoriteTeamId||!c.latest.underdogTeamId||c.latest.underdogPoints===null))
   return NextResponse.json({error:'One or more games has no current ESPN line. No spreads were updated.'},{status:409});
  // Recheck draft status immediately before writes.
  const {data:stillDraft}=await supabase.from('weeks').select('status').eq('id',week.id).single();
  if(stillDraft?.status!=='DRAFT')return NextResponse.json({error:'Week is no longer a draft.'},{status:409});
  for(const c of changes){
   const s=c.latest!;
   const {error}=await supabase.from('games').update({
    locked_spread:s.spread,favorite_team_id:s.favoriteTeamId,favorite_team_name:s.favoriteTeam,
    underdog_team_id:s.underdogTeamId,underdog_team_name:s.underdogTeam,
    favorite_points:1,underdog_points:s.underdogPoints,last_synced_at:new Date().toISOString()
   }).eq('id',c.saved.id).eq('week_id',week.id);
   if(error)throw error;
  }
  return NextResponse.json({ok:true,count:changes.length});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not update spreads'},{status:400});}
}
