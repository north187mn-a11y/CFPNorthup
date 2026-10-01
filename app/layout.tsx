import './globals.css';
import NavMenu from './NavMenu';
export const metadata={title:'College Football Survivor',description:'College football prediction and elimination league'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><nav className="nav"><div className="nav-inner"><strong>College Football Survivor</strong><NavMenu /></div></nav>{children}</body></html>;}