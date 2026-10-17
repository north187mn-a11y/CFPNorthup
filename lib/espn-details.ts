export type GameDetails = {
 status: string;
 possession: string | null;
 downDistance: string | null;
 fieldPosition: string | null;
 situationNote: string | null;
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
 const currentPlays=json.drives?.current?.plays??[];
 const previousDrives=json.drives?.previous??[];
 const previousPlays=previousDrives.flatMap((d:any)=>d.plays??[]);
 const currentLast=currentPlays[currentPlays.length-1];
 const lastPlay=situation?.lastPlay??currentLast??previousPlays[previousPlays.length-1];
 // A timeout can replace the situation with down=0 and stale field position.
 // Use only the current drive's reported play ending, never a previous drive.
 const timeout=/timeout/i.test(currentLast?.type?.text??'');
 const action=timeout?[...currentPlays].reverse().find((p:any)=>!/timeout/i.test(p.type?.text??'')):currentLast;
 const validEnd=live&&action&&!action.scoringPlay&&!action.isTurnover&&
  action.end?.down>=1&&action.end?.down<=4&&
  (!timeout||action.period?.number===currentLast?.period?.number);
 const ending=validEnd?action.end:null;
 const reportedDown=Number(situation?.down);
 const hasReportedDown=reportedDown>=1&&reportedDown<=4;
 const fallback=!hasReportedDown&&ending;
 const position=fallback?ending:situation;
 const possessionId=situation?.possession??ending?.team?.id;
 const possessionTeam=competitors.find((c:any)=>String(c.team?.id)===String(possessionId));
 const down=Number(position?.down),distance=position?.distance;
 const downDistance=position?.shortDownDistanceText??position?.downDistanceText??
  (down>=1&&down<=4&&distance!=null?`${['','1st','2nd','3rd','4th'][down]} & ${distance}`:null);
 const clock=lastPlay?.clock?.displayValue;
 const period=lastPlay?.period?.number;
 return {
  status:competition?.status?.type?.shortDetail??competition?.status?.type?.detail??'Status unavailable',
  possession:live?(possessionTeam?.team?.displayName??null):null,
  downDistance:downDistance||null,
  fieldPosition:position?.possessionText??ending?.possessionText??null,
  situationNote:fallback?'Situation after the latest snap':null,
  lastPlay:lastPlay?.text??null,
  lastPlayTime:[period?(period>4?`OT${period-4}`:`Q${period}`):null,clock].filter(Boolean).join(' · ')||null,
  sourceUrl:`https://www.espn.com/college-football/game/_/gameId/${encodeURIComponent(eventId)}`,
  fetchedAt:new Date().toISOString()
 };
}
