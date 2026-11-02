import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareNews,federalRaceKey,freshNews} from '../public/news-view.js';
import {parseAbcSenate,parseFoxTexas,parseCnnSenate,parseNbcTexas,parseFoxRatings,getNews} from '../news-feed.mjs';
const now=Date.parse('2026-11-02T18:00:00Z');
const poll=(sourceId,value,extras={})=>({sourceId,kind:'poll',status:'available',electionDate:'2026-11-03',population:'likely-voters',fieldEnd:'2026-10-27',pollId:sourceId+'-1',candidates:[{id:'D:test',name:'Fictional candidate',party:'D',pollShare:value}],...extras});

test('news averages use the newest poll per network and preserve unallocated responses',()=>{
 const r=compareNews([poll('fox',40,{fieldEnd:'2026-10-10'}),poll('fox',48),poll('cnn',52)],now);
 assert.equal(r.averages[0].pollShare.value,50);
 assert.equal(r.averages[0].pollShare.sources,2);
 assert.equal(r.averages[0].winProbability.value,null);
 assert.equal(r.averages[0].finalVoteShare.value,null);
});
test('old, delayed, future, wrong election and different population polls do not affect averages',()=>{
 const reports=[poll('fox',10,{fieldEnd:'2026-09-10'}),poll('cnn',90,{status:'stale'}),poll('nbc',80,{population:'registered-voters'}),poll('abc',70,{fieldEnd:'2026-11-05'})];
 const r=compareNews(reports,now);assert.equal(r.averages[0].pollShare.value,null);
 assert.equal(r.selected.length,3);assert.equal(freshNews(reports[0],now),false);
 assert.equal(compareNews([poll('fox',50,{electionDate:'2024-11-05'})],now).selected.length,0);
});
test('shared underlying polls count once and ratings never become numeric odds',()=>{
 const r=compareNews([poll('fox',51,{pollId:'shared'}),poll('cnn',51,{pollId:'shared'}),{sourceId:'abc',kind:'estimate',electionDate:'2026-11-03',status:'available',publishedAt:'2026-10-26',rating:'Toss-up',candidates:[]}],now);
 assert.equal(r.averages[0].pollShare.sources,1);assert.equal(r.averages[0].winProbability.value,null);
});
test('poll shares, final-share estimates and win probabilities average independently',()=>{
 const estimate={sourceId:'cnn',kind:'estimate',status:'available',electionDate:'2026-11-03',publishedAt:'2026-10-29',candidates:[{id:'D:test',name:'Fictional candidate',party:'D',finalVoteShare:53,winProbability:71}]};
 const r=compareNews([poll('fox',48),estimate],now).averages[0];
 assert.equal(r.pollShare.value,48);assert.equal(r.finalVoteShare.value,53);assert.equal(r.winProbability.value,71);
 assert.equal(compareNews([poll('fox',NaN),poll('cnn',105)],now).averages[0].pollShare.value,null);
});
test('county federal races map to full-election polls while local races do not',()=>{
 assert.equal(federalRaceKey({level:'Federal',scope:'cameron',ballotOffice:'United States Senator'}),'us-senate');
 assert.equal(federalRaceKey({level:'Federal',scope:'cameron',ballotOffice:'United States Representative, District 34'}),'house-34');
 assert.equal(federalRaceKey({level:'Local',scope:'cameron',ballotOffice:'County Judge'}),null);
 assert.equal(federalRaceKey({level:'Federal',id:'us-senate-oh',kind:'special'}),'us-senate-oh');
});
test('news document adapters reject changed dates or missing verified structure',()=>{
 for(const parse of [parseFoxTexas,parseCnnSenate,parseNbcTexas,parseAbcSenate,parseFoxRatings])assert.throws(()=>parse('<article>Old election report 2024-11-05</article>'));
 const states=['Michigan','Texas','Alaska','Ohio','Kansas','Maine','Iowa'];
 const fixture='<meta content="2026-10-26">'+states.map(s=>'<h3>'+s+': Example</h3><p>ABC News rating: Tossup</p>').join('');
 const reports=parseAbcSenate(fixture);assert.equal(reports.length,7);
 assert.equal(reports.find(r=>r.raceId==='us-senate-oh').rating,'Toss-up');
 assert.deepEqual(reports[0].candidates,[]);
 assert.throws(()=>parseAbcSenate(fixture.replace('<h3>Texas:', '<h3>Other:')));
});
test('upstream failures retain the verified NBC baseline as delayed, never as live or average eligible',async()=>{
 const original=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;return new Response('Unavailable',{status:503});};
 try{
  const first=await getNews(),second=await getNews();
  assert.equal(requests,5);assert.deepEqual(second,first);
  const nbc=first.reports.find(r=>r.sourceId==='nbc');
  assert.equal(nbc.status,'stale');assert.equal(nbc.fieldEnd,'2026-09-10');
  assert.equal(nbc.retrievedAt,'2026-11-02T23:20:34.156Z');
  assert.equal(freshNews(nbc,now),false);
  assert.equal(compareNews(first.reports,now).averages[0].pollShare.value,null);
  assert.equal(first.documents.every(d=>d.status==='unavailable'),true);
 }finally{globalThis.fetch=original;}
});
