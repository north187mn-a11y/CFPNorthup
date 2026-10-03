import {revalidatePath} from 'next/cache';
import {requireCommissioner} from '@/lib/auth';

export default async function LeagueSupport(){
 const {supabase,user}=await requireCommissioner();
 const {data:membership}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
 if(!membership)return <main className="container"><h1>League Support</h1><p className="muted">No league found.</p></main>;
 const leagueId=membership.league_id;

 async function addContribution(formData:FormData){
  'use server';
  const {supabase,user}=await requireCommissioner();
  const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
  if(!m)return;
  await supabase.from('league_support_contributions').insert({
   league_id:m.league_id,
   contributor_name:String(formData.get('name')||'').trim(),
   amount:Number(formData.get('amount')||0),
   contribution_date:String(formData.get('date')||new Date().toISOString().slice(0,10)),
   note:String(formData.get('note')||'').trim()||null,
   created_by:user.id
  });
  revalidatePath('/commissioner/league-support');
 }

 async function removeContribution(formData:FormData){
  'use server';
  const {supabase,user}=await requireCommissioner();
  const {data:m}=await supabase.from('league_members').select('league_id').eq('user_id',user.id).limit(1).single();
  if(!m)return;
  await supabase.from('league_support_contributions').delete().eq('id',Number(formData.get('id'))).eq('league_id',m.league_id);
  revalidatePath('/commissioner/league-support');
 }

 const {data:rows}=await supabase.from('league_support_contributions').select('id,contributor_name,amount,contribution_date,note').eq('league_id',leagueId).order('contribution_date',{ascending:false}).order('id',{ascending:false});
 const total=(rows??[]).reduce((s:number,r:any)=>s+Number(r.amount),0);

 return <main className="container">
  <div className="page-head"><div><h1>League Support</h1><p className="muted">Commissioner-only tracking for voluntary league contributions.</p></div></div>
  <div className="card"><h2>Total Support: ${total.toFixed(2)}</h2>
   <form action={addContribution} style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'end'}}>
    <label>Name<br/><input name="name" required placeholder="Contributor"/></label>
    <label>Amount<br/><input name="amount" type="number" min="0" step="0.01" required placeholder="0.00"/></label>
    <label>Date<br/><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label>
    <label>Note<br/><input name="note" placeholder="Optional"/></label>
    <button type="submit">Add Contribution</button>
   </form>
  </div>
  <div className="card" style={{marginTop:16,overflowX:'auto'}}><h2>Contribution History</h2>
   {(rows??[]).length?<table><thead><tr><th>Date</th><th>Contributor</th><th>Amount</th><th>Note</th><th></th></tr></thead>
   <tbody>{(rows??[]).map((r:any)=><tr key={r.id}><td style={{whiteSpace:'nowrap'}}>{r.contribution_date}</td><td style={{whiteSpace:'nowrap'}}>{r.contributor_name}</td><td>${Number(r.amount).toFixed(2)}</td><td>{r.note??'—'}</td><td><form action={removeContribution}><input type="hidden" name="id" value={r.id}/><button type="submit">Delete</button></form></td></tr>)}</tbody></table>:<p className="muted">No contributions recorded yet.</p>}
  </div>
 </main>;
}
