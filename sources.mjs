export const sources = [
{id:'county',name:'Cameron County Elections',type:'Official',url:'https://www.cameroncountytx.gov/elections/results/'},
{id:'texas',name:'Texas Secretary of State',type:'Official',url:'https://electionresults.sos.state.tx.us/results.html'},
{id:'krgv',name:'KRGV · Channel 5',type:'News',url:'https://www.krgv.com/elections'},
{id:'valley',name:'ValleyCentral',type:'News',url:'https://www.valleycentral.com/'}];
const cache=new Map();
const decode=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
async function check(s){
const old=cache.get(s.id); if(old&&Date.now()-old.fetched<60000)return old.data;
try{const r=await fetch(s.url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'ValleyVote/1.0 (election source monitor)'}});if(!r.ok)throw Error(`Source returned ${r.status}`);const html=await r.text();
const links=[];for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){const title=decode(m[2]);if(title.length<16||title.length>200||!/(election|vot|senat|congress|results|cameron|governor)/i.test(title))continue;let url;try{url=new URL(m[1],s.url)}catch{continue}if(!['http:','https:'].includes(url.protocol))continue;if(links.some(x=>x.title===title))continue;links.push({title,url:url.href});}
const hash=JSON.stringify(links);const now=new Date().toISOString();const data={...s,status:'available',checkedAt:now,changedAt:old?.hash===hash?old.data.changedAt:now,items:links.slice(s.id==='krgv'?-12:0,s.id==='krgv'?undefined:12),note:'Source page checked. Links may include historical elections; confirm the date at the source.'};cache.set(s.id,{fetched:Date.now(),hash,data});return data;
}catch(e){return {...s,status:'unavailable',checkedAt:new Date().toISOString(),items:old?.data.items||[],note:old?'Refresh failed. Previously retrieved links may be out of date.':'Could not retrieve this source. Open it directly for the latest information.'};}}

export async function getSources(){ return Promise.all(sources.map(check)); }
