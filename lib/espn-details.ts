export type GameDetails = {
 status: string;
 possession: string | null;
 downDistance: string | null;
 fieldPosition: string | null;
 lastPlay: string | null;
 lastPlayTime: string | null;
 sourceUrl: string;
 fetchedAt: string;
};

// Use reported situation data only; the previous drive may belong to the other team.
export function parseGameDetails(json:any,eventId:string,reportedSituation?:any):GameDetails {
 const competition=json.header?.competitions?.[0];
 const live=competition?.status?.type?.state==='in'&&!competition?.status?.type?.completed;
 const situation=live?(reportedSituation??json.situation??competition?.situation):null;
 const competitors=competition?.competitors??[];
 const possessionId=situation?.possession;
 const possessionTeam=competitors.find((c:any)=>String(c.team?.id)===String(possessionId));
 const currentPlays=json.drives?.current?.plays??[];
 const previousDrives=json.drives?.previous??[];
 const previousPlays=previousDrives.flatMap((d:any)=>d.plays??[]);
 const lastPlay=situation?.lastPlay??currentPlays[currentPlays.length-1]??previousPlays[previousPlays.length-1];
 const down=Number(situation?.down),distance=situation?.distance;
 const downDistance=situation?.downDistanceText??situation?.shortDownDistanceText??
  (down>=1&&down<=4&&distance!=null?`${['','1st','2nd','3rd','4th'][down]} & ${distance}`:null);
 const clock=lastPlay?.clock?.displayValue;
 const period=lastPlay?.period?.number;
 return {
  status:competition?.status?.type?.shortDetail??competition?.status?.type?.detail??'Status unavailable',
  possession:live?(possessionTeam?.team?.displayName??null):null,
  downDistance:downDistance||null,
  fieldPosition:situation?.possessionText??null,
  lastPlay:lastPlay?.text??null,
  lastPlayTime:[period?(period>4?`OT${period-4}`:`Q${period}`):null,clock].filter(Boolean).join(' · ')||null,
  sourceUrl:`https://www.espn.com/college-football/game/_/gameId/${encodeURIComponent(eventId)}`,
  fetchedAt:new Date().toISOString()
 };
}
