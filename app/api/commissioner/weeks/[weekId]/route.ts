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