import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const picks=readFileSync(new URL('../app/api/weeks/[weekId]/picks/route.ts',import.meta.url),'utf8');
const spreads=readFileSync(new URL('../app/api/commissioner/weeks/[weekId]/update-spreads/route.ts',import.meta.url),'utf8');

test('regular pick submissions delegate to one atomic RPC',()=>{
 assert.match(picks,/rpc\(['"]submit_week_picks_atomic['"]/);
 assert.doesNotMatch(picks,/from\(['"]picks['"]\)\.upsert/);
});
test('late picks retain their separate exception-aware RPC',()=>{
 assert.match(picks,/rpc\(['"]submit_late_picks['"]/);
});
test('spread refresh delegates all changes to one atomic RPC',()=>{
 assert.match(spreads,/rpc\(['"]update_week_spreads_atomic['"]/);
 assert.doesNotMatch(spreads,/\.from\(['"]games['"]\)\s*\.update/);
});
test('spread refresh rejects missing ESPN lines before database update',()=>{
 assert.match(spreads,/changes\.some\(/);
 assert.match(spreads,/No spreads were updated/);
});
test('spread refresh checks commissioner authority for the league',()=>{
 assert.match(spreads,/requireLeagueCommissioner\(week\.league_id\)/);
});

const scoreboard=readFileSync(new URL('../app/scoreboard/page.tsx',import.meta.url),'utf8');
const standings=readFileSync(new URL('../app/standings/page.tsx',import.meta.url),'utf8');
test('scoreboard earned points use authoritative weekly scores',()=>{
 assert.match(scoreboard,/officialWeekly\?\.points/);
 assert.doesNotMatch(scoreboard,/const wtdEarned=\(games/);
});
test('standings use authoritative weekly scores for official rankings',()=>{
 assert.match(standings,/from\(['"]weekly_scores['"]\)/);
});
test('projected standings honor commissioner overrides on final games',()=>{
 assert.match(standings,/commissioner_override,override_winner_team_id/);
 assert.match(standings,/g\.override_winner_team_id===g\.away_team_id/);
});
