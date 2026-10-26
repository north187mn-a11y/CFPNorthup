import test from 'node:test';
import assert from 'node:assert/strict';
// Test TypeScript with Node's built-in type stripping (Node 22+).
import {weeklyCutCount,earnedPickPoints,hasUnresolvedCutTie} from '../lib/league-rules.ts';
test('weekly cut sizes',()=>{
 assert.equal(weeklyCutCount(7),0);
 for(let w=8;w<=11;w++)assert.equal(weeklyCutCount(w),2);
 assert.equal(weeklyCutCount(12),1);
 assert.equal(weeklyCutCount(13),1);
 assert.equal(weeklyCutCount(14),0);
});
test('scoring uses locked favorite and underdog points',()=>{
 assert.equal(earnedPickPoints('A','A','A',1,2.4),1);
 assert.equal(earnedPickPoints('B','B','A',1,2.4),2.4);
 assert.equal(earnedPickPoints('A','B','A',1,2.4),0);
 assert.equal(earnedPickPoints('A',null,'A',1,2.4),0);
});
test('a tied cut boundary requires manual resolution',()=>{
 assert.equal(hasUnresolvedCutTie([{weekly:1,ytd:10},{weekly:2,ytd:10},{weekly:2,ytd:10}],2),true);
 assert.equal(hasUnresolvedCutTie([{weekly:1,ytd:10},{weekly:2,ytd:10},{weekly:2,ytd:11}],2),false);
});
