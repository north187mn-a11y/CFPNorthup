import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {parseGameDetails} from '@/lib/espn-details';

export async function GET(_req:Request,{params}:{params:Promise<{gameId:string}>}) {
 const {supabase,user}=await requireUser();
 const {gameId}=await params;
 if(!/^(?:\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(gameId))return NextResponse.json({error:'Invalid game'},{status:400});
 const {data:game,error}=await supabase.from('games').select('id,week_id,espn_event_id,kickoff_at').eq('id',gameId).maybeSingle();
 if(error||!game)return NextResponse.json({error:'Game not found'},{status:404});
 const {data:week}=await supabase.from('weeks').select('league_id').eq('id',game.week_id).maybeSingle();
 if(!week)return NextResponse.json({error:'Game not found'},{status:404});
 const {data:member}=await supabase.from('league_members').select('user_id').eq('league_id',week.league_id).eq('user_id',user.id).maybeSingle();
 if(!member)return NextResponse.json({error:'Not authorized'},{status:403});
 const eventId=String(game.espn_event_id??'');
 if(!/^\d+$/.test(eventId))return NextResponse.json({error:'ESPN details are not available for this game yet.'},{status:404});
 try {
  const response=await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${eventId}`,{next:{revalidate:30},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('ESPN unavailable');
  const json=await response.json();
  const competition=json.header?.competitions?.[0];
  if(!competition)throw new Error('Missing game details');
  let situation=json.situation??competition.situation;
  // ESPN also publishes the live situation in its daily scoreboard feed.
  if(!situation&&competition.status?.type?.state==='in'&&game.kickoff_at) {
   try {
    const date=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(game.kickoff_at)).replace(/(\d{2})\/(\d{2})\/(\d{4})/,'$3$1$2');
    const scores=await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${date}&groups=80&limit=100`,{next:{revalidate:30},signal:AbortSignal.timeout(5000)});
    if(scores.ok){const board=await scores.json();situation=board.events?.find((e:any)=>String(e.id)===eventId)?.competitions?.[0]?.situation;}
   }catch{/* Keep the summary available if the situation feed is temporarily unavailable. */}
  }
  return NextResponse.json(parseGameDetails(json,eventId,situation),{headers:{'Cache-Control':'private, no-store'}});
 }catch {
  return NextResponse.json({error:'Game details are temporarily unavailable. Please try again.'},{status:502});
 }
}
