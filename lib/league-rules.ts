/** Pure competition rules shared by the site and regression tests. */
export function weeklyCutCount(weekNumber:number):number {
 if(weekNumber>=8&&weekNumber<=11)return 2;
 if(weekNumber>=12&&weekNumber<=13)return 1;
 return 0;
}
export function earnedPickPoints(selectedTeamId:string,winnerTeamId:string|null,favoriteTeamId:string|null,favoritePoints:number,underdogPoints:number):number {
 if(!winnerTeamId||selectedTeamId!==winnerTeamId)return 0;
 return selectedTeamId===favoriteTeamId?favoritePoints:underdogPoints;
}
export function hasUnresolvedCutTie(rows:{weekly:number;ytd:number}[],cutCount:number):boolean {
 if(cutCount<=0||rows.length<=cutCount)return false;
 const sorted=[...rows].sort((a,b)=>a.weekly-b.weekly||a.ytd-b.ytd);
 const lastCut=sorted[cutCount-1],firstSafe=sorted[cutCount];
 return lastCut.weekly===firstSafe.weekly&&lastCut.ytd===firstSafe.ytd;
}
