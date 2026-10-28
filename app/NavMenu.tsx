'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function NavMenu(){
 const pathname=usePathname();const router=useRouter();
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{['/','/dashboard','/standings','/scoreboard'].forEach(path=>router.prefetch(path));},[router]);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 return <><div className="menu-wrap" ref={ref}>
  <button type="button" className="menu-button" aria-expanded={open} aria-label="Open navigation menu" onClick={()=>setOpen(v=>!v)}>Menu <span aria-hidden="true">☰</span></button>
  {open&&<div className="menu-dropdown" onClick={()=>setOpen(false)}>
   <Link href="/dashboard">This Week</Link>
   <Link href="/standings">Standings</Link>
   <Link href="/scoreboard">Live Scoreboard</Link>
   <Link href="/weeks">Previous Weeks</Link>
   <Link href="/rules">Rules</Link>
   <Link href="/commissioner">Commissioner</Link>
   <div className="menu-logout"><LogoutButton /></div>
  </div>}
 </div><nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">{[{href:"/",label:"Home",icon:"⌂"},{href:"/dashboard",label:"Picks",icon:"✓"},{href:"/standings",label:"Standings",icon:"★"},{href:"/scoreboard",label:"Scores",icon:"▤"}].map(item=><Link key={item.href} href={item.href} onTouchStart={()=>router.prefetch(item.href)} aria-current={pathname===item.href?"page":undefined} className={pathname===item.href?"mobile-tab active":"mobile-tab"}><span aria-hidden="true" className="mobile-tab-icon">{item.icon}</span><span>{item.label}</span></Link>)}</nav></>;
}