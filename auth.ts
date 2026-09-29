import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase-server';

export async function requireUser() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function requireCommissioner() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'COMMISSIONER') redirect('/dashboard');
  return { supabase, user, profile };
}
