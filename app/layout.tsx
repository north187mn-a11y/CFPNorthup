import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'College Football Survivor', description: 'College football prediction and elimination league' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <nav className="nav"><div className="nav-inner">
      <strong>College Football Survivor</strong>
      <div className="nav-links"><Link href="/dashboard">Dashboard</Link><Link href="/commissioner">Commissioner</Link></div>
    </div></nav>
    {children}
  </body></html>;
}