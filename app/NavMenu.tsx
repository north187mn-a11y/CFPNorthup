'use client';
import Link from 'next/link';
import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function NavMenu(){
 const pathname=usePathname();const router=useRouter();
 const [mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true)},[]);
 const [pendingTab,setPendingTab]=useState<string|null>(null);
 useEffect(()=>{setPendingTab(null)},[pathname]);
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
 </div>{/* Keep fixed tabs outside the header; isolate Safari scroll compositing. */}
 {mounted&&createPortal(<nav className="mobile-bottom-nav" style={{transform:"translate3d(0,0,0)",WebkitBackfaceVisibility:"hidden"}} aria-label="Primary mobile navigation">{[{href:"/",label:"Home",icon:"⌂"},{href:"/dashboard",label:"Picks",icon:"✓"},{href:"/standings",label:"Standings",icon:"★"},{href:"/scoreboard",label:"Scores",icon:"▤"}].map(item=><Link key={item.href} href={item.href} onPointerDown={()=>{if(item.href!==pathname)setPendingTab(item.href);router.prefetch(item.href)}} onClick={()=>{if(item.href!==pathname)setPendingTab(item.href)}} aria-current={pathname===item.href?"page":undefined} className={pathname===item.href?"mobile-tab active":pendingTab===item.href?"mobile-tab pending":"mobile-tab"}><span aria-hidden="true" className="mobile-tab-icon">{item.icon}</span><span>{item.label}</span></Link>)}</nav>,document.body)}</>;
}