import {cameronContests} from './public/cameron.js';

const INDEX='https://www.cameroncountytx.gov/elections/results/';
const DATE='2026-11-03';
const allowedHosts=new Set(['www.cameroncountytx.gov','cameroncountytx.gov']);
const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
let stored=null,pending=null;

export function discoverCameronResults(html){
  const headers=[...html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  const current=headers.find(h=>/2026\s+November\s+3|November\s+3,?\s+2026/i.test(clean(h[1])));
  if(!current)throw Error('Current November election section unavailable');
  const next=headers.find(h=>h.index>current.index&&(/Elections Archives/i.test(clean(h[1]))||(/202[0-9].*Election|Election.*202[0-9]/i.test(clean(h[1]))&&!/November\s+3|2026-11-03|11\/03\/2026/i.test(clean(h[1])))));
  const section=html.slice(current.index,next?.index??html.length);
  const links=[];
  for(const a of section.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const label=clean(a[2]);const recent=section.slice(0,a.index);const headings=[...recent.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];const context=clean(headings.at(-1)?.[1]||'');
    if(/turnout|roster|sample|reconcil|audit|polling|early voting/i.test(label))continue;
    if(!/election.?night|summary.*results|unofficial.*results|general election results/i.test(label+' '+a[1])&&!/Election Night Results|Canvass/i.test(context))continue;
    const url=new URL(a[1],INDEX);
    if(url.protocol!=='https:'||!allowedHosts.has(url.hostname)||!url.pathname.toLowerCase().endsWith('.pdf'))continue;
    if(!links.some(l=>l.url===url.href))links.push({url:url.href,label});
  }
  return links.slice(0,12);
}
function identifyContest(line,hint){
  const value=norm(line.replace(/\bVote For\s*\d+.*/i,''));
  const matching=cameronContests.filter(c=>c.resultAliases.some(a=>norm(a)===value));
  if(matching.length===1)return matching[0];
  return matching.find(c=>norm(hint).includes(norm(c.jurisdiction)))||null;
}
function candidateMatch(line,name){
  const words=name.match(/[\p{L}\p{N}]+/gu)||[];
  const escaped=words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^\\p{L}\\p{N}]*');
  return line.match(new RegExp('^\\s*(?:(?:REP|DEM|LIB|GRN|NP|IND)\\s+)?'+escaped+'(?:\\b|$)','iu'));
}
function integer(s){const n=Number(s.replaceAll(',',''));return Number.isSafeInteger(n)&&n>=0?n:null;}
export function parseCameronRows(rows,{hint='',sourceUpdated=null}={}){
  const entire=rows.map(r=>typeof r==='string'?r:r.text).join('\n');
  if(!/November\s+3,?\s*2026|11\s*\/\s*0?3\s*\/\s*2026|2026-11-03/i.test(entire))throw Error('Wrong county election date');
  if(!/Summary Results Report|Election Night Results|Unofficial Results|Official Results|Canvass/i.test(entire)||/Sample Ballot|Boleta de Muestra|Precinct.by.Precinct/i.test(entire))throw Error('Not a county summary results report');
  const collected=new Map();let current=null,totalFirst=false;
  for(const row of rows){
    const line=typeof row==='string'?row:row.text;
    const match=identifyContest(line,hint);
    if(match){current=match;totalFirst=false;if(!collected.has(current.id))collected.set(current.id,{counts:new Map(),total:null});continue;}
    if(!current)continue;
    if(/^TOTAL(?:\s+VOTE\s*%|\s+(?:MAIL|EV|ED)\b|\s*$)/i.test(line)){totalFirst=true;continue;}
    if(!totalFirst)continue;
    const entry=collected.get(current.id);
    const total=line.match(/^Total Votes Cast\s+(\d[\d,]*)(?:\s|$)/i);
    if(total){entry.total=integer(total[1]);continue;}
    for(const c of current.roster){
      const m=candidateMatch(line,c.name);if(!m)continue;
      const value=line.slice(m[0].length).match(/^\s*(?:(?:REP|DEM|LIB|GRN|NP|IND)\s+)?(\d[\d,]*)(?:\s|$)/i);
      if(!value)continue;
      const n=integer(value[1]);if(n===null)continue;
      if(entry.counts.has(c.id)&&entry.counts.get(c.id)!==n)throw Error('Conflicting county candidate rows');
      entry.counts.set(c.id,n);
    }
  }
  const reports={};
  for(const [id,entry] of collected){
    const contest=cameronContests.find(c=>c.id===id);
    if(!entry.counts.size)continue;
    const complete=contest.roster.every(c=>entry.counts.has(c.id));
    const sum=[...entry.counts.values()].reduce((a,b)=>a+b,0);
    if(!Number.isSafeInteger(sum)||entry.total!==null&&entry.total<sum)continue;
    const total=entry.total??(complete?sum:null);
    reports[id]={sourceId:'cameron-official',sourceName:'Cameron County Elections',type:'official',electionDate:DATE,scope:'cameron',scopeLabel:'Cameron County voters only',voteFor:contest.voteFor,status:'available',total,sourceUpdated,updatedAt:null,calledWinnerId:null,reporting:{votesIn:null,locationsIn:null,precinctsIn:null},candidates:contest.roster.map(c=>({...c,votes:entry.counts.get(c.id)??null,voteShare:total>0&&entry.counts.has(c.id)?100*entry.counts.get(c.id)/total:null}))};
  }
  return reports;
}
async function pdfRows(response){
  const length=Number(response.headers.get('Content-Length')||0);if(length>5*1024*1024)throw Error('County report too large');
  const reader=response.body.getReader();const parts=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5*1024*1024){await reader.cancel();throw Error('County report too large');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  const {getDocumentProxy,extractTextItems}=await import('unpdf');
  const pdf=await getDocumentProxy(bytes,{maxImageSize:1048576,isEvalSupported:false});
  try{
    if(pdf.numPages>60)throw Error('Too many report pages');
    const result=await extractTextItems(pdf);const rows=[];
    for(const page of result.items){const lines=[];for(const item of [...page].sort((a,b)=>b.y-a.y||a.x-b.x)){let line=lines.find(l=>Math.abs(l.y-item.y)<2);if(!line){line={y:item.y,items:[]};lines.push(line);}line.items.push(item);}for(const line of lines)rows.push(line.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim());}
    return rows;
  }finally{await pdf.destroy();}
}
export async function getCameronResults(){
  if(stored&&Date.now()<stored.expires)return stored.value;
  if(pending)return pending;
  const previous=stored?.value;
  pending=(async()=>{
    const checkedAt=new Date().toISOString();
    try{
      const response=await fetch(INDEX,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('County source unavailable');
      const links=discoverCameronResults(await response.text());const reports={};let unsupported=false;
      for(const link of links){try{const r=await fetch(link.url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const parsed=parseCameronRows(await pdfRows(r),{hint:link.label});if(!Object.keys(parsed).length)unsupported=true;Object.assign(reports,parsed);}catch{unsupported=true;}}
      const status=links.length?(unsupported?'partial':'available'):'awaiting-results';
      const value={reports:{...(unsupported?previous?.reports:{}),...reports},status,checkedAt,retrievedAt:Object.keys(reports).length?checkedAt:previous?.retrievedAt||null};
      if(unsupported)for(const [id,r] of Object.entries(value.reports))if(!reports[id])value.reports[id]={...r,status:'stale'};
      stored={value,expires:Date.now()+60000};return value;
    }catch{
      const value={reports:previous?.reports||{},status:'unavailable',checkedAt,retrievedAt:previous?.retrievedAt||null};stored={value,expires:Date.now()+60000};return value;
    }finally{pending=null;}
  })();return pending;
}
