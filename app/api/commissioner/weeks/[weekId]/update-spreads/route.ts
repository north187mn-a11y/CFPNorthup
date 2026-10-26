import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
import {requireLeagueCommissioner} from '@/lib/league-commissioner';
import {fetchESPNSchedule} from '@/lib/espn';

export async function POST(_req:Request,{params}:{params:Promise<{weekId:string}>}){
 try{
  const {weekId}=await params;
  const {supabase,user}=await requireCommissioner();
  const {data:week,error:weekError}=await supabase.from('weeks').select('id,league_id,week_number,week_type,status').eq('id',weekId).single();
  if(weekError||!week)return NextResponse.json({error:'Week not found.'},{status:404});
  if(week.status!=='DRAFT')return NextResponse.json({error:'Spreads can only be updated before publication.'},{status:409});
  const {data:league}=await supabase.from('leagues').select('id,season').eq('id',week.league_id).single();
  if(!league)return NextResponse.json({error:'League not found.'},{status:404});
  await requireLeagueCommissioner(week.league_id);
  const {data:games,error:gamesError}=await supabase.from('games').select('id,espn_event_id').eq('week_id',week.id);
  if(gamesError)throw gamesError;
  if(!games?.length)return NextResponse.json({error:'Select games before updating spreads.'},{status:400});
  const schedule=await fetchESPNSchedule(league.season,week.week_number,week.week_type==='FINAL'?3:2);
  const changes=games.map(g=>({saved:g,latest:schedule.find(s=>s.eventId===g.espn_event_id)}));
  if(changes.some(c=>!c.latest||c.latest.spread===null||!c.latest.favoriteTeamId||!c.latest.underdogTeamId||c.latest.underdogPoints===null))
   return NextResponse.json({error:'One or more games has no current ESPN line. No spreads were updated.'},{status:409});
  const payload=changes.map(c=>({id:c.saved.id,locked_spread:c.latest!.spread,favorite_team_id:c.latest!.favoriteTeamId,favorite_team_name:c.latest!.favoriteTeam,underdog_team_id:c.latest!.underdogTeamId,underdog_team_name:c.latest!.underdogTeam,underdog_points:c.latest!.underdogPoints}));
  const {data:count,error}=await supabase.rpc('update_week_spreads_atomic',{p_week_id:Number(week.id),p_changes:payload});
  if(error)throw error;
  return NextResponse.json({ok:true,count});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not update spreads'},{status:400});}
}
