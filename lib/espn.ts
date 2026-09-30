export type ESPNScheduleGame = {
  eventId: string; awayTeam: string; awayTeamId: string; homeTeam: string; homeTeamId: string;
  favoriteTeam: string | null; favoriteTeamId: string | null; underdogTeam: string | null; underdogTeamId: string | null;
  spread: number | null; favoritePoints: number; underdogPoints: number | null; lineText: string | null;
  day: string | null; time: string | null; network: string | null; kickoffAt: string | null; sourceUrl: string;
};

export function espnScheduleUrl(year:number,week:number,seasonType=2){
 return `https://www.espn.com/college-football/schedule/_/week/${week}/year/${year}/seasontype/${seasonType}`;
}

export async function fetchESPNSchedule(year:number,week:number,seasonType=2):Promise<ESPNScheduleGame[]>{
 const sourceUrl=espnScheduleUrl(year,week,seasonType);
 const api=`https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${year}&seasontype=${seasonType}&week=${week}&groups=80&limit=1000&offset=0`;
 const response=await fetch(api,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0'}});
 if(!response.ok)throw new Error(`ESPN returned ${response.status}`);
 const json=await response.json();
 return (json.events??[]).map((event:any)=>{
   const comp=event.competitions?.[0];
   const competitors=comp?.competitors??[];
   const away=competitors.find((x:any)=>x.homeAway==='away');
   const home=competitors.find((x:any)=>x.homeAway==='home');
   if(!away||!home)return null;
   const odds=comp.odds?.[0];
   const details=odds?.details??null;
   const spreadRaw=typeof odds?.spread==='number'?Math.abs(odds.spread):null;
   let favorite=competitors.find((x:any)=>x.curatedRank?.current && false)??null;
   if(odds?.awayTeamOdds?.favorite===true)favorite=away;
   if(odds?.homeTeamOdds?.favorite===true)favorite=home;
   if(!favorite && details){
     const token=String(details).split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g,'');
     favorite=competitors.find((x:any)=>{
       const t=x.team;
       return [t.abbreviation,t.shortDisplayName,t.displayName,t.name].filter(Boolean)
         .some((v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,'')===token);
     })??null;
   }
   const spread=favorite&&spreadRaw!==null?spreadRaw:null;
   const underdog=favorite?(favorite.id===away.id?home:away):null;
   const kickoffAt=event.date??comp?.date??null;
   const dt=kickoffAt?new Date(kickoffAt):null;
   const network=(comp?.broadcasts??[]).flatMap((b:any)=>b.names??[]).filter(Boolean).join(' / ')||null;
   return {
    eventId:String(event.id), awayTeam:away.team.displayName, awayTeamId:String(away.team.id),
    homeTeam:home.team.displayName, homeTeamId:String(home.team.id),
    favoriteTeam:favorite?.team.displayName??null, favoriteTeamId:favorite?String(favorite.team.id):null,
    underdogTeam:underdog?.team.displayName??null, underdogTeamId:underdog?String(underdog.team.id):null,
    spread, favoritePoints:1, underdogPoints:spread===null?null:Math.round((1+0.2*spread)*10)/10,
    lineText:details, day:dt?new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/New_York'}).format(dt):null,
    time:dt?new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).format(dt):null,
    network,kickoffAt,sourceUrl
   };
 }).filter(Boolean);
}

export type ESPNTeamResult={name:string;id:string;score:number|null};
export type ESPNGame={eventId:string;status:'scheduled'|'in_progress'|'final'|'unknown';teams:ESPNTeamResult[];winnerTeamId:string|null;sourceUrl:string};

export async function fetchESPNGame(eventId:string):Promise<ESPNGame>{
 const url=`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${encodeURIComponent(eventId)}`;
 const r=await fetch(url,{cache:'no-store'}); if(!r.ok)throw new Error(`ESPN returned ${r.status}`);
 const j=await r.json(); const comp=j.header?.competitions?.[0]; const cs=comp?.competitors??[];
 const teams=cs.map((x:any)=>({name:x.team?.displayName??'',id:String(x.team?.id??''),score:x.score==null?null:Number(x.score)}));
 const state=comp?.status?.type?.state; const status=state==='post'?'final':state==='in'?'in_progress':state==='pre'?'scheduled':'unknown';
 let winnerTeamId:string|null=null; if(status==='final'){const w=cs.find((x:any)=>x.winner===true); if(w)winnerTeamId=String(w.team.id);}
 return {eventId,status,teams,winnerTeamId,sourceUrl:`https://www.espn.com/college-football/game/_/gameId/${eventId}`};
}
