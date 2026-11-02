export const newsNetworks=[{id:'fox',name:'FOX News'},{id:'cnn',name:'CNN'},{id:'nbc',name:'NBC News'},{id:'abc',name:'ABC News'}];
export function federalRaceKey(r){
 if(r?.scope==='cameron'&&r.level==='Federal'){
  if(r.ballotOffice==='United States Senator')return 'us-senate';
  const district=r.ballotOffice?.match(/^United States Representative, District (\d+)$/)?.[1];
  return district?'house-'+district:null;
 }
 return r?.level==='Federal'&&r.kind!=='collection'?r.id:null;
}
export function freshNews(report,now=Date.now()){
 const date=Date.parse(report.kind==='poll'?report.fieldEnd:report.publishedAt);
 const age=now-date;
 return report.status==='available'&&report.electionDate==='2026-11-03'&&Number.isFinite(age)&&age>=0&&age<=30*86400000;
}
export function compareNews(reports=[],now=Date.now()){
 const sources=new Set(newsNetworks.map(n=>n.id));
 const latest=new Map();
 for(const r of reports){
  if(!sources.has(r.sourceId)||r.electionDate!=='2026-11-03'||!['poll','estimate'].includes(r.kind))continue;
  const stamp=Date.parse(r.kind==='poll'?r.fieldEnd:r.publishedAt);
  if(!Number.isFinite(stamp)||stamp>now)continue;
  const key=r.sourceId+':'+r.kind,old=latest.get(key);
  if(!old||stamp>Date.parse(old.kind==='poll'?old.fieldEnd:old.publishedAt))latest.set(key,r);
 }
 const selected=[...latest.values()],candidates=new Map();
 for(const r of selected)for(const c of r.candidates||[])if(c.id&&c.name)candidates.set(c.id,{id:c.id,name:c.name,party:c.party});
 const metrics=['pollShare','finalVoteShare','winProbability'];
 const averages=[...candidates.values()].map(c=>({...c,...Object.fromEntries(metrics.map(metric=>{
  const values=new Map();
  for(const r of selected){
   if(!freshNews(r,now)||r.kind!==(metric==='pollShare'?'poll':'estimate')||(metric==='pollShare'&&r.population!=='likely-voters'))continue;
   const v=r.candidates?.find(x=>x.id===c.id)?.[metric];
   if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100)values.set(r.pollId||r.estimateId||r.sourceId,v);
  }
  return [metric,{value:values.size?[...values.values()].reduce((a,b)=>a+b,0)/values.size:null,sources:values.size}];
 }))}));
 return {selected,averages};
}
