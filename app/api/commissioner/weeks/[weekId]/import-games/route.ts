import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
import {fetchESPNSchedule} from '@/lib/espn';

export async function POST(req:Request,{params}:{params:Promise<{weekId:string}>}){
 try{
  const {weekId}=await params; const {supabase,profile}=await requireCommissioner(); const body=await req.json();
  const ids=[...new Set((body.eventIds??[]).map(String))];
  if(ids.length!==15)return NextResponse.json({error:'Select exactly 15 games.'},{status:400});
  const {data:week}=await supabase.from('weeks').select('id,league_id,week_number,week_type,status').eq('id',weekId).single();
  if(!week)return NextResponse.json({error:'Week not found.'},{status:404});
  if(week.status!=='DRAFT')return NextResponse.json({error:'Games can only be selected while the week is a draft.'},{status:409});
  const {data:league}=await supabase.from('leagues').select('id,season').eq('id',week.league_id).eq('commissioner_id',profile.id).single();
  if(!league)return NextResponse.json({error:'Not authorized.'},{status:403});
  const {count}=await supabase.from('games').select('id',{count:'exact',head:true}).eq('week_id',week.id);
  if((count??0)>0)return NextResponse.json({error:'This week already has games. Delete the existing games before importing a new slate.'},{status:409});
  const seasonType=week.week_type==='FINAL'?3:2; const schedule=await fetchESPNSchedule(league.season,week.week_number,seasonType);
  const chosen=ids.map(id=>schedule.find(g=>g.eventId===id));
  if(chosen.some(g=>!g))return NextResponse.json({error:'One or more selected ESPN games could not be verified.'},{status:400});
  if(chosen.some(g=>g!.spread===null||!g!.favoriteTeamId||!g!.underdogTeamId||g!.underdogPoints===null))return NextResponse.json({error:'One or more selected games does not currently have a usable ESPN point spread. Please choose games with a posted line.'},{status:400});
  const rows=chosen.map((g,i)=>({week_id:week.id,game_number:i+1,espn_event_id:g!.eventId,away_team:g!.awayTeam,away_team_id:g!.awayTeamId,home_team:g!.homeTeam,home_team_id:g!.homeTeamId,locked_spread:g!.spread,favorite_team_id:g!.favoriteTeamId,favorite_team_name:g!.favoriteTeam,underdog_team_id:g!.underdogTeamId,underdog_team_name:g!.underdogTeam,favorite_points:1,underdog_points:g!.underdogPoints,status:'SCHEDULED',source_url:g!.sourceUrl,kickoff_at:g!.kickoffAt,network:g!.network,last_synced_at:new Date().toISOString()}));
  const {error}=await supabase.from('games').insert(rows); if(error)throw error;
  return NextResponse.json({ok:true,count:rows.length});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unknown error'},{status:400});}
}