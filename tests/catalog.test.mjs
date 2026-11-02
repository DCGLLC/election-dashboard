import {test} from 'node:test';
import assert from 'node:assert/strict';
import {races,senateStates,sourceDefinitions,filterRaces,normalizeFavorites,texasSenateDistricts} from '../public/catalog.js';

const elections = races.filter(r=>r.kind!=='collection');
test('Texas House and U.S. House have complete individually selectable districts',()=>{
  for(const [office,count] of [['state-house',150],['us-house',38]]) {
    const group=elections.filter(r=>r.office===office);
    assert.deepEqual(group.map(r=>r.district),Array.from({length:count},(_,i)=>i+1));
    assert.ok(group.every(r=>r.state==='TX'&&r.sources.includes('texas')));
  }
});
test('all 33 regular U.S. Senate elections plus Ohio and Florida specials appear exactly once',()=>{
  const senate=elections.filter(r=>r.office==='us-senate');
  assert.equal(senate.length,35);
  assert.equal(new Set(senate.map(r=>r.state)).size,35);
  assert.equal(senate.filter(r=>r.kind==='general').length,33);
  assert.deepEqual(senate.filter(r=>r.kind==='special').map(r=>r.state).sort(),['FL','OH']);
  assert.equal(senate.filter(r=>r.state==='TX').length,1);
  assert.equal(senate.find(r=>r.state==='TX').id,'us-senate');
  assert.ok(!senate.some(r=>['CA','NY','PA'].includes(r.state)));
  assert.equal(senateStates.length,35);
});
test('Texas state senate distinguishes regular District 22 from its unexpired-term special',()=>{
  const regular=elections.filter(r=>r.office==='state-senate'&&r.kind==='general');
  assert.deepEqual(regular.map(r=>r.district),texasSenateDistricts);
  assert.equal(regular.length,16);
  const both=elections.filter(r=>r.office==='state-senate'&&r.district===22);
  assert.equal(both.length,2);
  assert.notEqual(both[0].id,both[1].id);
  assert.ok(!regular.some(r=>r.district===27));
});
test('non-Texas Senate elections have the correct official state source and national news',()=>{
  assert.equal(new Set(races.map(r=>r.id)).size,races.length);
  for(const r of elections) {
    assert.ok(r.sources.every(id=>sourceDefinitions.some(s=>s.id===id)));
    if(r.office==='us-senate'&&r.state!=='TX') {
      assert.deepEqual(r.sources,['official-'+r.state.toLowerCase(),'ap']);
      assert.equal(sourceDefinitions.find(s=>s.id===r.sources[0]).abbr,r.state);
    }
  }
});
test('office, state and search filters combine without confusing state and U.S. House',()=>{
  assert.equal(filterRaces(elections,{office:'state-house',state:'TX'}).length,150);
  assert.equal(filterRaces(elections,{office:'us-senate',state:'TX'}).length,1);
  assert.equal(filterRaces(elections,{office:'us-senate',state:'OH'})[0].kind,'special');
  assert.equal(filterRaces(elections,{office:'us-senate',query:'new jersey'})[0].state,'NJ');
  assert.equal(filterRaces(elections,{office:'state-house',state:'FL'}).length,0);
  assert.equal(filterRaces(elections,{level:'State',office:'us-senate'}).length,0);
  assert.equal(filterRaces(elections,{query:'state rep district 150'})[0].id,'state-house-150');
});
test('existing saved race IDs survive catalog expansion and invalid IDs are dropped',()=>{
  const old=['county','governor','us-senate','house-34','state-house','state-senate','statewide'];
  assert.deepEqual(normalizeFavorites([...old,'missing','county']),old);
  assert.deepEqual(normalizeFavorites(null),[]);
  assert.deepEqual(normalizeFavorites([]),[]);
});
test('direct source links do not trigger dozens of background upstream requests',async()=>{
  const original=globalThis.fetch;const requested=[];
  globalThis.fetch=async url=>{requested.push(url);return new Response('<html><a href="/results">Current election results</a></html>');};
  try {
    const {getSources}=await import('../sources.mjs?catalog-test');
    const result=await getSources();
    assert.equal(result.length,sourceDefinitions.length);
    assert.equal(requested.length,4);
    assert.ok(result.filter(s=>!s.monitor).every(s=>s.status==='link'&&s.items.length===0));
  } finally {globalThis.fetch=original;}
});
