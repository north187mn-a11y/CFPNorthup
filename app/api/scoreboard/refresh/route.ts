import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {createClient} from '@supabase/supabase-js';

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
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!serviceKey)return NextResponse.json({error:'Server scoring credential is not configured'},{status:500});
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:games}=await supabase.from('games').select('id,espn_event_id,last_synced_at,commissioner_override').eq('week_id',weekId).order('game_number');
  let updated=0;
  for(const g of games??[]){
   if(!g.espn_event_id||g.commissioner_override)continue;
   if(g.last_synced_at&&Date.now()-new Date(g.last_synced_at).getTime()<4*60*1000)continue;
   const res=await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${g.espn_event_id}`,{cache:'no-store'});
   if(!res.ok)continue;
   const j=await res.json();
   const comp=j.header?.competitions?.[0];
   if(!comp)continue;
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
   if(!error)updated++;
  }
  return NextResponse.json({ok:true,updated});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not refresh scoreboard'},{status:500});}
}