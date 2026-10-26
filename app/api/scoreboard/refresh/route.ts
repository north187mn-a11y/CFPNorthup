import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {supabaseAdmin} from '@/lib/supabase';

function gameStatus(state:string,completed:boolean){
 if(completed)return 'FINAL';
 if(state==='in')return 'IN_PROGRESS';
 return 'SCHEDULED';
}

export async function POST(req:Request){
 try{
  const {supabase,user}=await requireUser();
  const body=await req.json().catch(()=>({}));
  const weekId=Number(body.weekId);
  if(!weekId)return NextResponse.json({error:'weekId is required'},{status:400});
  const {data:week}=await supabase.from('weeks').select('id,league_id').eq('id',weekId).single();
  if(!week)return NextResponse.json({error:'Week not found'},{status:404});
  const {data:membership}=await supabase.from('league_members').select('user_id').eq('league_id',week.league_id).eq('user_id',user.id).maybeSingle();
  if(!membership)return NextResponse.json({error:'Not authorized'},{status:403});
  const {data:games,error:gamesError}=await supabase.from('games').select('id,espn_event_id,last_synced_at,commissioner_override,status').eq('week_id',weekId).order('game_number');
  if(gamesError)throw new Error('Could not load scoreboard games');
  const admin=supabaseAdmin();
  let updated=0;
  const errors:string[]=[];
  // Bound each request and isolate failures so one game cannot block the rest.
  const pending=(games??[]).filter((g:any)=>g.status!=='FINAL');
  for(let start=0;start<pending.length;start+=4){
   await Promise.all(pending.slice(start,start+4).map(async(g:any)=>{
   try{
   if(!g.espn_event_id||g.commissioner_override)return;
   if(g.last_synced_at&&Date.now()-new Date(g.last_synced_at).getTime()<55*1000)return;
   const res=await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${g.espn_event_id}`,{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!res.ok){errors.push(`ESPN ${g.espn_event_id}: ${res.status}`);return;}
   const j=await res.json();
   const comp=j.header?.competitions?.[0];
   if(!comp)throw new Error('Missing ESPN game state');
   const away=comp.competitors?.find((c:any)=>c.homeAway==='away');
   const home=comp.competitors?.find((c:any)=>c.homeAway==='home');
   const st=comp.status??j.header?.competitions?.[0]?.status;
   const {error}=await admin.rpc('update_game_live_state',{
    p_game_id:g.id,
    p_status:gameStatus(st?.type?.state,!!st?.type?.completed),
    p_away_score:Number(away?.score??0),
    p_home_score:Number(home?.score??0),
    p_period:Number(st?.period??0)||null,
    p_clock:st?.displayClock??null,
    p_status_detail:st?.type?.shortDetail??st?.type?.detail??null
   });
   if(error)errors.push(`Game ${g.id}: ${error.message}`);
   else updated++;
   }catch(error){errors.push(`Game ${g.id}: ${error instanceof Error?error.message:'Refresh failed'}`);}
   }));
  }
  return NextResponse.json({ok:errors.length===0,updated,errors});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not refresh scoreboard'},{status:500});}
}
