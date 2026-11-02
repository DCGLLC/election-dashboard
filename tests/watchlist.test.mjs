import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WatchlistSync} from '../public/watchlist.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function backend(){const rows=new Map();return {rows,async list(user){return [...(rows.get(user)||[])];},async add(user,id){if(!rows.has(user))rows.set(user,new Set());rows.get(user).add(id);},async remove(user,id){rows.get(user)?.delete(id);}};}
function store(repository,options={}){return new WatchlistSync({repository,storage:memory(),validIds:['race-a','race-b','race-c'],...options});}

test('a second device receives additions and removals without losing its own races',async()=>{
 const repo=backend(),desktop=store(repo),phone=store(repo);await desktop.connect('alice');await phone.connect('alice');
 desktop.setSelected('race-a',true);phone.setSelected('race-b',true);await Promise.all([desktop.flush(),phone.flush()]);
 await phone.sync();await desktop.sync();assert.deepEqual([...phone.ids].sort(),['race-a','race-b']);assert.deepEqual([...desktop.ids].sort(),['race-a','race-b']);
 desktop.setSelected('race-a',false);await desktop.flush();await phone.sync();assert.deepEqual([...phone.ids],['race-b']);
});
test('separate accounts never share caches, queued changes, or fetched dashboard lists',async()=>{
 const repo=backend(),storage=memory(),s=store(repo,{storage});await s.connect('alice');s.setSelected('race-a',true);await s.flush();await s.connect('bob');assert.deepEqual([...s.ids],[]);
 s.setSelected('race-b',true);await s.flush();await s.connect('alice');assert.deepEqual([...s.ids],['race-a']);await s.connect(null);assert.deepEqual([...s.ids],[]);
 assert.equal(repo.rows.get('bob').has('race-a'),false);
});
test('offline changes survive reload and retry without replacing unrelated server memberships',async()=>{
 const repo=backend(),storage=memory();await repo.add('alice','race-b');let offline=true;
 const flaky={...repo,async add(...args){if(offline)throw Error('offline');return repo.add(...args);}};
 const first=store(flaky,{storage});await first.connect('alice');first.setSelected('race-a',true);await first.flush();assert.equal(first.pending.size,1);
 const second=store(flaky,{storage});await second.connect('alice');assert.equal(second.ids.has('race-a'),true);offline=false;await second.sync();assert.deepEqual([...second.ids].sort(),['race-a','race-b']);assert.equal(second.pending.size,0);
});
test('an old read cannot erase a local operation that finished while the request was in flight',async()=>{
 const repo=backend(),s=store(repo);await s.connect('alice');const read=deferred();repo.list=()=>read.promise;
 const pendingRead=s.refresh();s.setSelected('race-a',true);await s.flush();read.resolve([]);await pendingRead;assert.equal(s.ids.has('race-a'),true);
});
test('responses from a signed-out account cannot populate the next account',async()=>{
 const read=deferred();const repo=backend();const original=repo.list;repo.list=user=>user==='alice'?read.promise:original(user);
 const s=store(repo);const old=s.connect('alice');await s.connect('bob');read.resolve(['race-a']);await old;assert.equal(s.userId,'bob');assert.deepEqual([...s.ids],[]);
});
test('rapidly toggling a race ends at the newest selection, even during an earlier write',async()=>{
 const repo=backend(),write=deferred();const original=repo.add;repo.add=async(...args)=>{await write.promise;await original(...args);};
 const s=store(repo);await s.connect('alice');s.setSelected('race-a',true);s.setSelected('race-a',false);write.resolve();await s.flush();assert.equal(repo.rows.get('alice').has('race-a'),false);assert.equal(s.ids.has('race-a'),false);
});
test('invalid race IDs and edits without an account cannot reach the database',async()=>{
 const repo=backend(),s=store(repo);assert.equal(s.setSelected('race-a',true),false);await s.connect('alice');assert.equal(s.setSelected('not-in-catalog',true),false);assert.equal(repo.rows.size,0);
});
