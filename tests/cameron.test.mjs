import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameronContests} from '../public/cameron.js';
import {races,normalizeFavorites} from '../public/catalog.js';
import {discoverCameronResults,parseCameronRows} from '../cameron-feed.mjs';
import {currentStanding} from '../public/race-view.js';

test('complete county ballot union has 86 unique contests with scoped candidate rosters',()=>{
  assert.equal(cameronContests.length,86);
  assert.equal(new Set(cameronContests.map(c=>c.id)).size,86);
  assert.ok(cameronContests.every(c=>c.roster.length&&c.scope==='cameron'&&c.office==='cameron'));
  assert.ok(cameronContests.every(c=>races.some(r=>r.id===c.id)));
  assert.equal(cameronContests.filter(c=>c.jurisdiction==='City of Brownsville'&&c.measure).length,15);
  assert.equal(cameronContests.filter(c=>c.category==='School boards').length,15);
  assert.equal(cameronContests.filter(c=>c.ballotOffice==='Mayor').length,2);
  assert.ok(!cameronContests.some(c=>/Sheriff|Tax Assessor|Constable/.test(c.ballotOffice)));
  assert.equal(races.find(r=>r.id==='county').kind,'collection');
  assert.deepEqual(normalizeFavorites(['county',cameronContests[0].id]),['county',cameronContests[0].id]);
});
test('county propositions, nonpartisan candidates and three-seat director contests stay distinct',()=>{
  const measures=cameronContests.filter(c=>c.measure);
  assert.equal(measures.length,16);
  assert.ok(measures.every(c=>c.description&&c.roster.map(c=>c.name).join(',')==='For,Against'));
  assert.ok(cameronContests.filter(c=>c.category==='School boards').every(c=>c.roster.every(c=>c.party==='N')));
  const directors=cameronContests.find(c=>c.voteFor===3);
  assert.equal(directors.roster.length,3);
  assert.match(directors.jurisdiction,/San Benito Municipal Utility/);
  assert.equal(currentStanding({voteFor:3,candidates:directors.roster.map((c,i)=>({...c,votes:100-i}))}).kind,'multi-seat');
});
test('results discovery accepts only November summary links and excludes archived, turnout and unrelated hosts',()=>{
  const html=`<h4>2026 November 3 General and Special Elections</h4>
  <h3>Early Voting Turnout</h3><a href="/elections/2026/turnout.pdf">Cameron County General Election</a>
  <h3>Election Night Results</h3><a href="/elections/2026/November-Election-Night-Summary.pdf">Cameron County General Election</a>
  <a href="https://unrelated.example/results.pdf">Election Night Results</a>
  <h2>Elections Archives</h2><h4>2026 May 2 Joint Local Election</h4><a href="/May-Election-Night-Summary.pdf">Summary Results</a>`;
  assert.deepEqual(discoverCameronResults(html),[{url:'https://www.cameroncountytx.gov/elections/2026/November-Election-Night-Summary.pdf',label:'Cameron County General Election'}]);
  assert.throws(()=>discoverCameronResults('<h4>2026 May 2 Election</h4>'));
});
test('county native summary parsing preserves actual counts without borrowing statewide totals',()=>{
  const rows=['Summary Results Report','Cameron County, Texas','November 3, 2026','County Judge','TOTAL VOTE % Mail EV ED','Mauro Garza REP 4,000 40% 0 0 0','Esteban "Steve" Guerra DEM 6,000 60% 0 0 0','Total Votes Cast 10,000 100%'];
  const parsed=parseCameronRows(rows);const report=Object.values(parsed)[0];
  assert.equal(report.scope,'cameron');assert.equal(report.total,10000);
  assert.deepEqual(report.candidates.map(c=>c.votes),[4000,6000]);
  assert.deepEqual(report.candidates.map(c=>c.voteShare),[40,60]);
  assert.equal(report.calledWinnerId,null);
  assert.equal(report.reporting.votesIn,null);
  assert.throws(()=>parseCameronRows(rows.map(r=>r.replace('November 3, 2026','May 2, 2026'))));
  assert.throws(()=>parseCameronRows([...rows,'SAMPLE BALLOT']));
});
test('identical proposition labels are resolved by jurisdiction, never by candidate option alone',()=>{
  const rows=['Summary Results Report','November 3, 2026','Proposition A','TOTAL VOTE %','For 120 60%','Against 80 40%','Total Votes Cast 200 100%'];
  const none=parseCameronRows(rows);assert.equal(Object.keys(none).length,0);
  const brownsville=parseCameronRows(rows,{hint:'City of Brownsville'});
  assert.equal(Object.keys(brownsville).length,1);
  assert.equal(cameronContests.find(c=>c.id===Object.keys(brownsville)[0]).jurisdiction,'City of Brownsville');
  assert.equal(Object.values(brownsville)[0].total,200);
});
test('blank county candidate rows and unsupported column order never become false zeros',()=>{
  const head=['Summary Results Report','November 3, 2026','County Judge'];
  assert.deepEqual(parseCameronRows([...head,'Mauro Garza 4000','Esteban "Steve" Guerra 6000']),{});
  assert.deepEqual(parseCameronRows([...head,'TOTAL VOTE %','Mauro Garza —','Esteban "Steve" Guerra —']),{});
  const report=Object.values(parseCameronRows([...head,'TOTAL VOTE %','Mauro Garza 0','Esteban "Steve" Guerra 0','Total Votes Cast 0']))[0];
  assert.equal(report.total,0);assert.ok(report.candidates.every(c=>c.votes===0&&c.voteShare===null));
});
