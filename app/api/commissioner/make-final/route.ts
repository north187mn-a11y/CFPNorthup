import {NextResponse} from 'next/server';
import {requireCommissioner} from '@/lib/auth';
export async function POST(req:Request){
 try{
  const {supabase}=await requireCommissioner();
  const {weekId}=await req.json();
  if(!weekId)return NextResponse.json({error:'weekId is required'},{status:400});
  const {error}=await supabase.rpc('make_week_final',{p_week_id:Number(weekId)});
  if(error)throw error;
  return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not make week final'},{status:400});}
}