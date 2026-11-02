import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Postgres ownership policies isolate two users and deny unauthenticated access',async()=>{
 const db=new PGlite();
 const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('${alice}'),('${bob}');`);
  await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${alice}',false);`);
  await db.query('insert into public.dashboard_races(user_id,race_id) values ($1,$2)',[alice,'race-a']);
  await db.query('insert into public.dashboard_races(user_id,race_id) values ($1,$2) on conflict(user_id,race_id) do nothing',[alice,'race-a']);
  await assert.rejects(db.query('insert into public.dashboard_races(user_id,race_id) values ($1,$2)',[bob,'race-b']),/row-level security/i);
  await db.exec(`select set_config('request.jwt.claim.sub','${bob}',false);`);
  assert.equal((await db.query('select * from public.dashboard_races')).rows.length,0);
  await db.query('insert into public.dashboard_races(user_id,race_id) values ($1,$2)',[bob,'race-b']);
  assert.equal((await db.query('delete from public.dashboard_races where user_id=$1 returning *',[alice])).rows.length,0);
  await assert.rejects(db.query('update public.dashboard_races set user_id=$1',[alice]),/permission denied/i);
  await db.exec(`select set_config('request.jwt.claim.sub','${alice}',false);`);
  assert.deepEqual((await db.query('select race_id from public.dashboard_races')).rows,[{race_id:'race-a'}]);
  await db.query('delete from public.dashboard_races where race_id=$1',['race-a']);
  await db.exec('reset role;set role anon;');
  await assert.rejects(db.query('select * from public.dashboard_races'),/permission denied/i);
  await assert.rejects(db.query('insert into public.dashboard_races(user_id,race_id) values ($1,$2)',[alice,'race-c']),/permission denied/i);
 }finally{await db.close();}
});
