'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function LiveRefresh({weekId}:{weekId:number}){
 const router=useRouter();
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{try{await fetch('/api/scoreboard/refresh',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({weekId})});if(active)router.refresh();}catch{}};
  refresh();
  const id=setInterval(refresh,5*60*1000);
  return()=>{active=false;clearInterval(id)};
 },[weekId,router]);
 return null;
}