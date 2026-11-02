import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseTexas,parseOpenAmerica,candidateKey} from '../results.mjs';
import {forecastRange,primaryReport,reportingLabel,reportStatus,currentStanding} from '../public/race-view.js';

const row=(party,name,value)=>`<tr><td class="party">${party}</td><td class="candidate">${name}</td>${value===null?'<td class="ballot" />':`<td class="ballot">${value}</td>`}</tr>`;
const contest=(title,rows,progress='20')=>`<div class="election">${title}</div><div class="polling">Polling Locations Reporting: ${progress}%</div><table class="election">${rows}</table>`;
const section=(name,body)=>`<button data-target="#collapse123">${name}<span>(Updated 11/03/2026 08:00 PM)</span></button>${body}`;
const html=body=>`<title>Election Results - Tuesday, November 3, 2026</title>${body}`;

test('Texas count adapter preserves official candidates, counts and polling-location units',()=>{
  const result=parseTexas(html(section('2026 NOVEMBER GENERAL ELECTION',contest('U. S. SENATOR',row('DEMOCRATIC','Test Democrat','6,000')+row('REPUBLICAN','Test Republican','4,000')))));
  const report=result.reports['us-senate'];
  assert.equal(report.total,10000);
  assert.deepEqual(report.candidates.map(c=>[c.party,c.votes,c.voteShare]),[['D',6000,60],['R',4000,40]]);
  assert.equal(report.reporting.locationsIn,20);
  assert.equal(report.reporting.votesIn,null);
  assert.equal(report.calledWinnerId,null);
  assert.deepEqual(reportingLabel(report),{value:20,label:'polling locations reporting'});
});
test('blank counts remain unknown, while explicit zero counts remain zero',()=>{
  const blank=parseTexas(html(section('2026 NOVEMBER GENERAL ELECTION',contest('STATE REPRESENTATIVE DISTRICT 150',row('REPUBLICAN','Test A',null)+row('DEMOCRATIC','Test B',null),'0')))).reports['state-house-150'];
  assert.equal(blank.total,null);assert.ok(blank.candidates.every(c=>c.votes===null&&c.voteShare===null));
  const zero=parseTexas(html(section('2026 NOVEMBER GENERAL ELECTION',contest('STATE REPRESENTATIVE DISTRICT 150',row('REPUBLICAN','Test A','0')+row('DEMOCRATIC','Test B','0'),'0')))).reports['state-house-150'];
  assert.equal(zero.total,0);assert.ok(zero.candidates.every(c=>c.votes===0&&c.voteShare===null));
});
test('wrong election dates, unrecognized markup and primary contests cannot masquerade as November returns',()=>{
  assert.throws(()=>parseTexas('<title>Election Results - Tuesday, March 3, 2026</title>'));
  assert.throws(()=>parseTexas(html('<div>Format changed</div>')));
  const data=parseTexas(html(section('2026 NOVEMBER GENERAL ELECTION',contest('GOVERNOR',row('REPUBLICAN','General candidate','100')))+section('2026 MARCH PRIMARY ELECTION',contest('GOVERNOR',row('REPUBLICAN','Primary candidate','999')))));
  assert.equal(data.reports.governor.candidates[0].name,'General candidate');
});
test('regular and special Texas Senate elections remain separate and incomplete percentages are unavailable',()=>{
  const data=parseTexas(html(section('2026 NOVEMBER GENERAL ELECTION',contest('STATE SENATOR, DISTRICT 22',row('REPUBLICAN','New term','20'),'101'))+section('2026 SPECIAL ELECTION SENATE DISTRICT 22',contest('STATE SENATOR, DISTRICT 22',row('REPUBLICAN','Unexpired term','15'),'10'))));
  assert.equal(data.reports['state-senate-22'].candidates[0].name,'New term');
  assert.equal(data.reports['state-senate-22-special'].candidates[0].name,'Unexpired term');
  assert.equal(data.reports['state-senate-22'].reporting.locationsIn,null);
});
const national=entries=>({api:1,year:2026,office:'Senate',as_of:'2026-11-04T02:00:00Z',stale:false,races:entries});
test('compact race list distinguishes a leader from a called winner and handles ties and missing counts',()=>{
  const candidates=[{id:'a',name:'Test A',votes:600},{id:'b',name:'Test B',votes:400}];
  assert.deepEqual(currentStanding({candidates}),{kind:'leading',candidateIds:['a'],name:'Test A',margin:200});
  assert.equal(currentStanding({candidates,calledWinnerId:'b'}).kind,'called');
  assert.equal(currentStanding({candidates:candidates.map(c=>({...c,votes:500}))}).kind,'tied');
  assert.equal(currentStanding({candidates:candidates.map(c=>({...c,votes:0}))}).kind,'awaiting');
  assert.equal(currentStanding({candidates:[candidates[0],{...candidates[1],votes:null}]}).kind,'awaiting');
});
test('national adapter matches specials explicitly and never turns leading into a winner call',()=>{
  const parsed=parseOpenAmerica(national({'FL-special':{cands:[{n:'Test Florida',p:'R',v:100,pct:100}],pct_in:100},FL:{cands:[{n:'Wrong regular election',p:'D',v:100}]},GA:{cands:[{n:'Test Georgia',p:'D',v:10}],pct_in:null}}));
  assert.equal(parsed.reports['us-senate-fl'].candidates[0].name,'Test Florida');
  assert.equal(parsed.reports['us-senate-fl'].calledWinnerId,null);
  assert.equal(parsed.reports['us-senate-fl'].reporting.votesIn,null);
  assert.equal(parsed.reports['us-senate-fl'].reporting.precinctsIn,100);
  assert.equal(parsed.reports['us-senate-ga'].reporting.precinctsIn,null);
  assert.equal(parsed.reports['us-senate-oh'],undefined);
  assert.throws(()=>parseOpenAmerica({...national({}),year:2024}));
  assert.throws(()=>parseOpenAmerica({...national({}),api:2}));
});
test('forecast ranges compare the same metric across unique current sources, never observed shares',()=>{
  const id=candidateKey('Test Candidate','D');
  const report=(source,share,prob,status='available')=>({sourceId:source,status,electionDate:'2026-11-03',candidates:[{id,finalVoteShare:share,winProbability:prob}]});
  const data={reports:[{candidates:[{id,voteShare:90}]}],forecasts:[report('one',51,60),report('two',53,80),report('stale',60,95,'stale'),report('invalid',101,-1),{...report('old',20,10),electionDate:'2024-11-05'}]};
  assert.deepEqual(forecastRange(data,id,'finalVoteShare'),{min:51,max:53,sources:2});
  assert.deepEqual(forecastRange(data,id,'winProbability'),{min:60,max:80,sources:2});
  assert.equal(forecastRange(data,'R:another candidate','finalVoteShare'),null);
  assert.equal(forecastRange({reports:data.reports,forecasts:[]},id,'winProbability'),null);
  assert.deepEqual(forecastRange({forecasts:[report('one',50,0)]},id,'winProbability'),{min:0,max:0,sources:1});
});
test('fresh counts are preferred over a stale report and stale status is explicit',()=>{
  const stale={status:'stale',candidates:[{name:'Old'}]};const fresh={status:'available',candidates:[{name:'Fresh'}]};
  assert.equal(primaryReport({reports:[stale,fresh]}),fresh);
  assert.match(reportStatus(stale),/delayed/);
  assert.deepEqual(reportingLabel({reporting:{votesIn:null,locationsIn:null,precinctsIn:null}}),{value:null,label:'reporting progress unavailable'});
});

test('national official total and share remain the source figures, including unlisted votes',()=>{
  const report=parseOpenAmerica(national({GA:{total:100,cands:[{n:'Test Georgia',p:'D',v:60,pct:60}],pct_in:30}})).reports['us-senate-ga'];
  assert.equal(report.total,100);assert.equal(report.candidates[0].voteShare,60);
  const malformed=parseOpenAmerica(national({GA:{total:20,cands:[{n:'Test Georgia',p:'D',v:60,pct:60}]}}));
  assert.equal(malformed.reports['us-senate-ga'],undefined);
});

test('failed refresh retains prior counts as stale and backs off instead of producing zero',async()=>{
  const realFetch=globalThis.fetch,realNow=Date.now;let current=realNow(),fail=false,requests=0;
  Date.now=()=>current;
  globalThis.fetch=async url=>{
    requests++;
    if(fail)throw Error('Temporary outage');
    return url.includes('sos.state.tx.us')?new Response(html(section('2026 NOVEMBER GENERAL ELECTION',contest('U. S. SENATOR',row('DEMOCRATIC','Test A','600')+row('REPUBLICAN','Test B','400'))))):Response.json(national({}));
  };
  try{
    const {getResults}=await import('../results.mjs?cache-regression');
    const initial=await getResults();assert.equal(initial.races['us-senate'].reports[0].total,1000);
    fail=true;current+=61000;
    const next=await getResults();const report=next.races['us-senate'].reports[0];
    assert.equal(report.total,1000);assert.equal(report.status,'stale');
    assert.equal(report.retrievedAt,initial.races['us-senate'].reports[0].retrievedAt);
    const before=requests;await getResults();assert.equal(requests,before);
  }finally{globalThis.fetch=realFetch;Date.now=realNow;}
});
