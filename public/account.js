import {createClient} from './vendor/supabase.js';
import {accountConfig} from './account-config.js';
import {WatchlistSync} from './watchlist.js';

export function validAccountConfig(config){
 try{return /^https:\/\/[^/]+$/.test(config.supabaseUrl)&&new URL(config.supabaseUrl).hostname.endsWith('.supabase.co')&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.supabasePublishableKey);}catch{return false;}
}
export function createAccounts({validIds,onChange,onState,onRecovery}){
 const state={enabled:validAccountConfig(accountConfig),user:null,status:'starting',ready:false};
 let client=null,store=null;
 const emit=()=>onState({...state});
 const repository={
  async list(userId){const {data,error}=await client.from('dashboard_races').select('race_id').eq('user_id',userId);if(error)throw error;return data.map(r=>r.race_id);},
  async add(userId,raceId){const {error}=await client.from('dashboard_races').upsert({user_id:userId,race_id:raceId},{onConflict:'user_id,race_id',ignoreDuplicates:true});if(error)throw error;},
  async remove(userId,raceId){const {error}=await client.from('dashboard_races').delete().eq('user_id',userId).eq('race_id',raceId);if(error)throw error;}
 };
 async function sessionChanged(event,session){
  const next=session?.user||null,changed=state.user?.id!==next?.id;
  state.user=next;state.ready=true;emit();
  if(changed||event==='INITIAL_SESSION')await store.connect(next?.id||null);
  if(event==='PASSWORD_RECOVERY')onRecovery();
 }
 async function init(){
  if(!state.enabled){state.status='not-configured';state.ready=true;emit();return;}
  client=createClient(accountConfig.supabaseUrl,accountConfig.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
  store=new WatchlistSync({repository,storage:localStorage,validIds,onChange,onStatus:status=>{state.status=status;emit();}});
  client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{void sessionChanged(event,session);},0);});
  const {data,error}=await client.auth.getSession();if(error){state.status='offline';state.ready=true;emit();return;}
  await sessionChanged('INITIAL_SESSION',data.session);
  const sync=()=>{if(!document.hidden&&state.user)void store.sync();};
  window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);window.addEventListener('online',sync);setInterval(sync,15000);
 }
 const check=result=>{if(result.error)throw result.error;return result.data;};
 return {
  state,init,
  async signUp(email,password){const data=check(await client.auth.signUp({email,password}));if(data.session)await sessionChanged('SIGNED_IN',data.session);return data;},
  async signIn(email,password){const data=check(await client.auth.signInWithPassword({email,password}));await sessionChanged('SIGNED_IN',data.session);return data;},
  async signOut(){const data=check(await client.auth.signOut({scope:'local'}));await sessionChanged('SIGNED_OUT',null);return data;},
  async resetPassword(email){return check(await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'}));},
  async updatePassword(password){return check(await client.auth.updateUser({password}));},
  setSelected(id,selected){return store?.setSelected(id,selected)||false;},
  setMany(entries){return store?.setMany(entries)||false;},
  async sync(){if(store)return store.sync();}
 };
}
