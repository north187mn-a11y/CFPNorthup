'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import LogoutButton from './LogoutButton';

export default function NavMenu(){
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 return <div className="menu-wrap" ref={ref}>
  <button type="button" className="menu-button" aria-expanded={open} aria-label="Open navigation menu" onClick={()=>setOpen(v=>!v)}>Menu <span aria-hidden="true">☰</span></button>
  {open&&<div className="menu-dropdown" onClick={()=>setOpen(false)}>
   <Link href="/dashboard">This Week</Link>
   <Link href="/standings">Standings</Link>
   <Link href="/weeks">Previous Weeks</Link>
   <Link href="/rules">Rules</Link>
   <Link href="/commissioner">Commissioner</Link>
   <div className="menu-logout"><LogoutButton /></div>
  </div>}
 </div>;
}