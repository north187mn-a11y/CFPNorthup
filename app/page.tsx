import Link from 'next/link';
import { requireUser } from '@/lib/auth';

export default async function Home() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  return <main className="container">
    <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
    <p className="muted">Northup College Football Picks — 2026 season.</p>
    <div className="grid grid-2" style={{marginTop:20}}>
      <Link href={profile?.role === 'COMMISSIONER' ? '/commissioner' : '/dashboard'} className="card link-card">
        <h2>{profile?.role === 'COMMISSIONER' ? 'Commissioner Dashboard' : 'Player Dashboard'}</h2>
        <p className="muted">Open your league dashboard.</p>
      </Link>
      {profile?.role === 'COMMISSIONER' && <Link href="/dashboard" className="card link-card"><h2>Player View</h2><p className="muted">Preview the player dashboard.</p></Link>}
    </div>
  </main>;
}