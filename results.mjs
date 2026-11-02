import {races} from './public/catalog.js';

const DATE='2026-11-03';
const cache=new Map();
const ongoing=new Map();
const OA_STATES=new Set(['AR','AZ','CO','CT','FL','GA','IA','ID','IN','LA','MI','MN','NC','PA','RI','SC','TX','UT','VA','VT','WA','WV']);
const text=html=>html.replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const percent=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?n:null;
const votes=s=>/^\d[\d,]*$/.test(s)&&Number.isSafeInteger(Number(s.replaceAll(',','')))?Number(s.replaceAll(',','')):null;
const party=p=>({DEMOCRATIC:'D',DEMOCRAT:'D',REPUBLICAN:'R',LIBERTARIAN:'L',GREEN:'G','WRITE-IN':'W',INDEPENDENT:'I'}[p.toUpperCase()]||(['D','R','L','G','I','W'].includes(p.toUpperCase())?p.toUpperCase():'O'));
export const candidateKey=(name,p)=>party(p)+':'+name.replace(/\s*\(I\)\s*$/i,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function withShares(candidates){const complete=candidates.every(c=>c.votes!==null);const total=complete?candidates.reduce((n,c)=>n+c.votes,0):null;return {total,candidates:candidates.map(c=>({...c,voteShare:total>0?100*c.votes/total:null}))};}
function txRaceId(title,special){
  const d=Number(title.match(/DISTRICT\s+(\d+)/i)?.[1]);
  if(special)return /SENAT/i.test(title)&&d===22?'state-senate-22-special':null;
  if(/^U\.?\s*S\.?\s*SENATOR\b/i.test(title))return 'us-senate';
  if(/^U\.?\s*S\.?\s*REPRESENTATIVE\b/i.test(title))return d>=1&&d<=38?'house-'+d:null;
  if(/^STATE SENATOR\b/i.test(title))return 'state-senate-'+d;
  if(/^STATE REPRESENTATIVE\b/i.test(title))return d>=1&&d<=150?'state-house-'+d:null;
  if(title==='GOVERNOR')return 'governor';
  return null;
}
export function parseTexas(html){
  if(!/Election Results\s*-\s*Tuesday, November 3, 2026/i.test(html))throw Error('Unexpected Texas election date');
  const sections=[...html.matchAll(/<button\b[^>]*data-target=["']#collapse[^"']*["'][^>]*>[\s\S]*?<\/button>/gi)];
  const parsed={};let generalFound=false;
  for(let i=0;i<sections.length;i++){
    const heading=text(sections[i][0]);
    const general=/2026 NOVEMBER GENERAL ELECTION/i.test(heading);
    const special=/2026 SPECIAL ELECTION SENATE DISTRICT 22/i.test(heading);
    if(!general&&!special)continue;
    generalFound ||= general;
    const sourceUpdated=heading.match(/\(Updated\s+([^)]*)\)/i)?.[1]||null;
    const body=html.slice(sections[i].index+sections[i][0].length,sections[i+1]?.index??html.length);
    for(const m of body.matchAll(/<div\b[^>]*class=["']election["'][^>]*>([\s\S]*?)<\/div>([\s\S]*?)<table\b[^>]*class=["']election["'][^>]*>([\s\S]*?)<\/table>/gi)){
      const title=text(m[1]);const id=txRaceId(title,special);if(!id||!races.some(r=>r.id===id))continue;
      const candidates=[];
      for(const row of m[3].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
        const cells={};for(const cell of row[1].matchAll(/<td\b([^>]*?)(?:\/>|>([\s\S]*?)<\/td>)/gi)){const key=cell[1].match(/class=["']([^"']+)["']/i)?.[1];if(key)cells[key]=text(cell[2]||'');}
        if(!cells.candidate)continue;
        const p=party(cells.party||'');candidates.push({id:candidateKey(cells.candidate,p),name:cells.candidate.replace(/\s*\(I\)\s*$/i,''),party:p,votes:votes(cells.ballot||'')});
      }
      if(!candidates.length)continue;
      const count=withShares(candidates);
      parsed[id]={sourceId:'texas-official',sourceName:'Texas Secretary of State',type:'official',electionDate:DATE,sourceUpdated,updatedAt:null,status:'available',...count,reporting:{votesIn:null,locationsIn:percent(Number(m[2].match(/Polling Locations Reporting:\s*([\d.]+)%/i)?.[1]??NaN)),precinctsIn:null},calledWinnerId:null};
    }
  }
  if(!generalFound||!Object.keys(parsed).length)throw Error('Texas results format not recognized');
  return {reports:parsed};
}
export function parseOpenAmerica(payload){
  if(payload?.api!==1||payload.year!==2026||payload.office!=='Senate'||!payload.races||typeof payload.races!=='object'||Array.isArray(payload.races))throw Error('Unexpected national feed contract or election');
  const reports={};
  for(const race of races.filter(r=>r.office==='us-senate')){
    const key=race.state+(race.kind==='special'?'-special':'');const row=payload.races[key];if(!row||!Array.isArray(row.cands)||!row.cands.length)continue;
    const candidates=row.cands.map(c=>({id:candidateKey(String(c.n||''),String(c.p||'')),name:String(c.n||''),party:party(String(c.p||'')),votes:typeof c.v==='number'&&Number.isSafeInteger(c.v)&&c.v>=0?c.v:null}));
    if(candidates.some(c=>!c.name||c.votes===null))continue;
    const sum=candidates.reduce((n,c)=>n+c.votes,0);
    if(row.total!==undefined&&(!Number.isSafeInteger(row.total)||row.total<sum))continue;
    const total=row.total??sum;
    const count={total,candidates:candidates.map((c,i)=>({...c,voteShare:total>0?(percent(row.cands[i].pct)??100*c.votes/total):null}))};
    reports[race.id]={sourceId:'official-via-openamerica',sourceName:'Official state election offices via Open America (openamerica.io)',type:'official',electionDate:DATE,status:payload.stale?'stale':'available',sourceUpdated:null,updatedAt:typeof payload.as_of==='string'&&Number.isFinite(Date.parse(payload.as_of))?payload.as_of:null,...count,reporting:{votesIn:null,precinctsIn:percent(row.pct_in),locationsIn:null},calledWinnerId:null};
  }
  return {reports,live:payload.live===true,etag:null};
}
async function fetchCached(id,url,parser){
  const old=cache.get(id);if(old&&Date.now()<old.expires)return old.value;
  if(ongoing.has(id))return ongoing.get(id);
  const task=(async()=>{
    const checkedAt=new Date().toISOString();
    try{
      const headers={'User-Agent':'ValleyVote/1.0 (election dashboard; official source attribution retained)','Accept-Encoding':'gzip'};
      if(old?.etag)headers['If-None-Match']=old.etag;
      const response=await fetch(url,{headers,signal:AbortSignal.timeout(12000)});
      if(response.status===304&&old){const value={...old.value,checkedAt,status:'available'};cache.set(id,{...old,value,expires:Date.now()+(old.ttl||60000)});return value;}
      if(!response.ok)throw Error('Source unavailable');
      const raw=id==='texas-official'?await response.text():await response.json();
      const parsed=parser(raw);const value={...parsed,status:'available',checkedAt,retrievedAt:checkedAt};
      const ttl=id==='official-via-openamerica'&&!parsed.live?600000:60000;
      cache.set(id,{value,expires:Date.now()+ttl,ttl,etag:response.headers.get('ETag')});return value;
    }catch{
      const value={reports:old?.value.reports||{},status:'unavailable',checkedAt,retrievedAt:old?.value.retrievedAt||null};
      cache.set(id,{value,expires:Date.now()+60000,ttl:60000});return value;
    }finally{ongoing.delete(id);}
  })();ongoing.set(id,task);return task;
}
function expectedReports(r,tx,national){
  const reports=[];
  const add=(data,id,name,coverage)=>{
    const report=data.reports[r.id];
    reports.push(report?{...report,status:data.status==='unavailable'?'stale':report.status,retrievedAt:data.retrievedAt,checkedAt:data.checkedAt}:{sourceId:id,sourceName:name,type:'official',status:coverage?(data.status==='unavailable'?'unavailable':'awaiting-results'):'not-covered',candidates:[],total:null,reporting:{votesIn:null,locationsIn:null,precinctsIn:null},calledWinnerId:null,checkedAt:data.checkedAt,retrievedAt:null});
  };
  if(r.state==='TX'&&r.office!=='local'&&r.kind!=='collection')add(tx,'texas-official','Texas Secretary of State',true);
  if(r.office==='us-senate')add(national,'official-via-openamerica','Official state election offices via Open America (openamerica.io)',OA_STATES.has(r.state));
  if(r.office==='local')reports.push({sourceId:'cameron-official',sourceName:'Cameron County Elections',type:'official',status:'not-connected',candidates:[],total:null,reporting:{votesIn:null,locationsIn:null,precinctsIn:null},calledWinnerId:null});
  return reports;
}
export async function getResults(){
  const [tx,national]=await Promise.all([
    fetchCached('texas-official','https://electionresults.sos.state.tx.us/results.html',parseTexas),
    fetchCached('official-via-openamerica','https://openamerica.io/elections/results.json?year=2026&office=Senate',parseOpenAmerica)
  ]);
  const results={};for(const r of races)results[r.id]={id:r.id,reports:expectedReports(r,tx,national),forecasts:[]};
  return {electionDate:DATE,retrievedAt:new Date().toISOString(),races:results,feeds:[{id:'texas-official',name:'Texas Secretary of State',status:tx.status,races:Object.keys(tx.reports).length,checkedAt:tx.checkedAt},{id:'official-via-openamerica',name:'Official state election offices via Open America',status:national.status,races:Object.keys(national.reports).length,checkedAt:national.checkedAt},{id:'forecasts',name:'Forecasts & newsroom winner calls',status:'not-connected',races:0},{id:'cameron-official',name:'Cameron County local results',status:'not-connected',races:0}]};
}
