import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
import {fetchESPNSchedule} from '@/lib/espn';
export async function POST(req:Request,{params}:{params:Promise<{weekId:string;gameId:string}>}){
try{
const {weekId,gameId}=await params;
const {supabase,user}=await requireCommissioner();
const {eventId}=await req.json();
const {data:w}=await supabase.from('weeks').select('*').eq('id',weekId).single();
if(!w||w.status!=='DRAFT')return NextResponse.json({error:'Only draft weeks can be edited.'},{status:409});
const {data:m}=await supabase.from('league_members').select('id').eq('league_id',w.league_id).eq('user_id',user.id).maybeSingle();
if(!m)return NextResponse.json({error:'Not authorized.'},{status:403});
const {data:old}=await supabase.from('games').select('id').eq('id',gameId).eq('week_id',weekId).single();
if(!old)return NextResponse.json({error:'Game not found.'},{status:404});
const {count,error:ce}=await supabase.from('picks').select('id',{head:true,count:'exact'}).eq('game_id',gameId);
if(ce||count)return NextResponse.json({error:'Cannot replace a game with picks or unverified pick status.'},{status:409});
const {data:dup}=await supabase.from('games').select('id').eq('week_id',weekId).eq('espn_event_id',String(eventId)).neq('id',gameId).maybeSingle();
if(dup)return NextResponse.json({error:'Game already selected.'},{status:409});
const {data:l}=await supabase.from('leagues').select('season').eq('id',w.league_id).single();
if(!l)return NextResponse.json({error:'League not found.'},{status:404});
const schedule=await fetchESPNSchedule(l.season,w.week_number,w.week_type==='FINAL'?3:2);
const g=schedule.find(x=>x.eventId===String(eventId));
if(!g||g.spread===null||!g.favoriteTeamId||!g.underdogTeamId||g.underdogPoints===null)return NextResponse.json({error:'ESPN game or spread unavailable.'},{status:400});
const {error}=await supabase.from('games').update({espn_event_id:g.eventId,away_team:g.awayTeam,away_team_id:g.awayTeamId,home_team:g.homeTeam,home_team_id:g.homeTeamId,locked_spread:g.spread,favorite_team_id:g.favoriteTeamId,favorite_team_name:g.favoriteTeam,underdog_team_id:g.underdogTeamId,underdog_team_name:g.underdogTeam,favorite_points:1,underdog_points:g.underdogPoints,status:'SCHEDULED',source_url:g.sourceUrl,kickoff_at:g.kickoffAt,network:g.network,last_synced_at:new Date().toISOString()}).eq('id',gameId).eq('week_id',weekId);
if(error)throw error;
return NextResponse.json({ok:true});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Replacement failed'},{status:400});}
}