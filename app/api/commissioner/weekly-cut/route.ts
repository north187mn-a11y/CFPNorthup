import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
export async function POST(req:Request){
 try {
  const {supabase}=await requireCommissioner();
  const {weekId,confirm=false}=await req.json();
  if(!Number.isInteger(Number(weekId)) || Number(weekId)<=0) return NextResponse.json({error:'Valid weekId required'},{status:400});
  const {data,error}=await supabase.rpc('apply_weekly_cut',{p_week_id:Number(weekId),p_confirm:confirm===true});
  if(error)throw error;
  return NextResponse.json(data);
 } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:'Could not apply weekly cut'},{status:400});}
}