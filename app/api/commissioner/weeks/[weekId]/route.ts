import { NextResponse } from 'next/server';
import { requireCommissioner } from '@/lib/auth';

export async function DELETE(_req:Request,{params}:{params:Promise<{weekId:string}>}){
 try{
  const {weekId}=await params;
  const {supabase,profile}=await requireCommissioner();
  const {data:week,error:weekError}=await supabase.from('weeks').select('id,league_id,week_number,status').eq('id',weekId).single();
  if(weekError||!week)return NextResponse.json({error:'Week not found.'},{status:404});
  const {data:league}=await supabase.from('leagues').select('id').eq('id',week.league_id).eq('commissioner_id',profile.id).single();
  if(!league)return NextResponse.json({error:'You cannot delete this week.'},{status:403});
  if(week.status!=='DRAFT')return NextResponse.json({error:'Only draft weeks can be deleted.'},{status:409});

  const {count:picks}=await supabase.from('picks').select('id',{count:'exact',head:true}).eq('week_id',week.id);
  if((picks??0)>0)return NextResponse.json({error:'This week already has player picks and cannot be deleted.'},{status:409});

  const {error:gamesError}=await supabase.from('games').delete().eq('week_id',week.id);
  if(gamesError)throw gamesError;
  const {error}=await supabase.from('weeks').delete().eq('id',week.id).eq('status','DRAFT');
  if(error)throw error;
  return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unknown error'},{status:400});}
}
export async function PATCH(req:Request,{params}:{params:Promise<{weekId:string}>}){
 const {weekId}=await params;
 const {supabase,user}=await requireCommissioner();
 try{
  const body=await req.json();
  if(typeof body.pick_deadline!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(body.pick_deadline)||!Number.isFinite(Date.parse(body.pick_deadline)))
   return NextResponse.json({error:'Enter a valid deadline with a timezone.'},{status:400});
  const {data:week,error:weekError}=await supabase.from('weeks').select('id,league_id,status').eq('id',weekId).single();
  if(weekError||!week)return NextResponse.json({error:'Week not found.'},{status:404});
  const {data:league}=await supabase.from('leagues').select('id').eq('id',week.league_id).eq('commissioner_id',user.id).single();
  if(!league)return NextResponse.json({error:'You cannot edit this week.'},{status:403});
  if(!['DRAFT','OPEN'].includes(week.status))return NextResponse.json({error:'Only draft or open weeks can have their deadline edited.'},{status:409});
  const {data,error}=await supabase.from('weeks').update({pick_deadline:new Date(body.pick_deadline).toISOString()}).eq('id',week.id).eq('status',week.status).select('id').maybeSingle();
  if(error)throw error;
  if(!data)return NextResponse.json({error:'Week status changed. Refresh and try again.'},{status:409});
  return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not save deadline.'},{status:400});}
}
