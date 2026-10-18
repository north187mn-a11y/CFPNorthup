import Link from 'next/link';
import { requireUser } from '@/lib/auth';

export default async function Home() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  return <main className="container">
    <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
    <p className="muted">College Football Survivor — 2026 season.</p>
    <div className="grid grid-2" style={{marginTop:20}}>
      <Link href={profile?.role === 'COMMISSIONER' ? '/commissioner' : '/dashboard'} className="card link-card">
        <h2>{profile?.role === 'COMMISSIONER' ? 'Commissioner Dashboard' : 'Player Dashboard'}</h2>
        <p className="muted">Open your league dashboard.</p>
      </Link>
      {profile?.role === 'COMMISSIONER' && <Link href="/dashboard" className="card link-card"><h2>Player View</h2><p className="muted">Preview the player dashboard.</p></Link>}
    </div>
    <section className="card" aria-labelledby="league-support-heading" style={{marginTop:24}}>
      <h2 id="league-support-heading">League Support</h2>
      <p className="muted">Want to contribute? Choose PayPal or Venmo below. Contributions are voluntary.</p>
      <div className="grid grid-2" style={{marginTop:16}}>
        <a href="https://www.paypal.com/qrcodes/p2pqrc/84U9BE5XKVWDY" target="_blank" rel="noopener noreferrer" className="card link-card" style={{minHeight:48}}>
          <strong>Contribute with PayPal ↗</strong>
          <p className="muted" style={{overflowWrap:'anywhere'}}>CFPNorthup@hotmail.com</p>
        </a>
        <a href="https://venmo.com/mark-northup-2" target="_blank" rel="noopener noreferrer" className="card link-card" style={{minHeight:48}}>
          <strong>Contribute with Venmo ↗</strong>
          <p className="muted">@mark-northup-2</p>
        </a>
      </div>
    </section>
  </main>;
}