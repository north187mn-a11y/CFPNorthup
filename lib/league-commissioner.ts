import {requireCommissioner} from '@/lib/auth';

/** Require both a commissioner profile and authority over this specific league. */
export async function requireLeagueCommissioner(leagueId:number){
 const {supabase,user}=await requireCommissioner();
 const {data:allowed,error}=await supabase.rpc('can_manage_league',{target_league_id:leagueId});
 if(error)throw error;
 if(allowed!==true)throw new Error('Not authorized to manage this league.');
 return {supabase,user};
}
