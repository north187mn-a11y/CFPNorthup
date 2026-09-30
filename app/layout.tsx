import './globals.css';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export const metadata = { title: 'College Football Survivor', description: 'College football prediction and elimination league' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <nav className="nav"><div className="nav-inner">
      <strong>College Football Survivor</strong>
      <div className="nav-links"><Link href="/dashboard">Dashboard</Link><Link href="/commissioner">Commissioner</Link><LogoutButton /></div>
    </div></nav>
    {children}
  </body></html>;
}