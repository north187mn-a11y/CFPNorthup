'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function LiveRefresh({weekId}:{weekId:number}){
 const router=useRouter();
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   try{
    const res=await fetch('/api/scoreboard/refresh',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({weekId}),
     cache:'no-store'
    });
    if(!res.ok)console.error('Scoreboard refresh failed:',await res.text());
    if(active)router.refresh();
   }catch(error){
    console.error('Scoreboard refresh failed:',error);
   }
  };
  refresh();
  const id=setInterval(refresh,60*1000);
  return()=>{active=false;clearInterval(id)};
 },[weekId,router]);
 return null;
}
