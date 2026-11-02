// Public primary-source reports, not a licensed nationwide newsroom feed.
// These monitored articles are rechecked; discovering new publications requires registry updates.
const DATE='2026-11-03';
const key=(name,p)=>p+':'+name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const candidate=(name,party,pollShare)=>({id:key(name,party),name,party,pollShare});
function plain(html){return html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;|&rsquo;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function checkDate(html,date){if(!html.includes(date)&&!plain(html).includes(date.replaceAll('-','/')))throw Error('Publication date changed');}
function poll(sourceId,raceId,fieldStart,fieldEnd,publishedAt,candidates,extras={}){return {sourceId,raceId,kind:'poll',status:'available',electionDate:DATE,population:'likely-voters',fieldStart,fieldEnd,publishedAt,pollId:sourceId+':'+raceId+':'+fieldEnd,candidates,...extras};}
function estimate(sourceId,raceId,publishedAt,rating){return {sourceId,raceId,kind:'estimate',status:'available',electionDate:DATE,publishedAt,estimateId:sourceId+':'+raceId+':'+publishedAt,rating,candidates:[]};}
export function parseFoxTexas(html){
 checkDate(html,'2026-10-21');const t=plain(html);
 const m=t.match(/Democrat James Talarico and Republican Ken Paxton tied at (\d+(?:\.\d+)?)% each among Texas likely voters/);
 if(!m)throw Error('FOX Texas poll format changed');
 return [poll('fox','us-senate','2026-10-15','2026-10-19','2026-10-21',[candidate('James Talarico','D',Number(m[1])),candidate('Ken Paxton','R',Number(m[1]))],{sampleSize:1398,marginOfError:2.5,pollster:'Beacon Research / Shaw & Company Research'})];
}
export function parseCnnSenate(html){
 // The transcript's air date must match; do not accept a sidebar mentioning this date.
 const t=plain(html);if(!/Aired October 29, 2026/.test(t))throw Error('CNN air date changed');
 const out=[];
 const tx=t.match(/top-line number, (\d+) percent for Talarico, (\d+) percent for Ken Paxton/);
 if(tx)out.push(poll('cnn','us-senate','2026-10-20','2026-10-27','2026-10-29',[candidate('James Talarico','D',+tx[1]),candidate('Ken Paxton','R',+tx[2])],{sampleSize:923,marginOfError:4.2,pollster:'SSRS'}));
 const ks=t.match(/In deep red Kansas, Democrat Adam Hamilton is at (\d+) percent to (\d+) percent for Republican incumbent Roger Marshall/);
 if(ks)out.push(poll('cnn','us-senate-ks','2026-10-20','2026-10-27','2026-10-29',[candidate('Adam Hamilton','D',+ks[1]),candidate('Roger Marshall','R',+ks[2])],{sampleSize:838,marginOfError:4.5,pollster:'SSRS'}));
 const me=t.match(/in Maine, Democrat Troy Jackson is at (\d+) percent\. The incumbent Republican, Susan Collins, is at (\d+) percent/i);
 if(me)out.push(poll('cnn','us-senate-me','2026-10-20','2026-10-27','2026-10-29',[candidate('Troy Jackson','D',+me[1]),candidate('Susan Collins','R',+me[2])],{sampleSize:783,marginOfError:4.5,pollster:'SSRS'}));
 const mi=t.match(/in Michigan[\s\S]{0,250}What we're seeing here in this (\d+)-(\d+) race is that El- Sayed/);
 if(mi)out.push(poll('cnn','us-senate-mi','2026-10-20','2026-10-27','2026-10-29',[candidate('Abdul El-Sayed','D',+mi[1]),candidate('Mike Rogers','R',+mi[2])],{sampleSize:768,marginOfError:4.7,pollster:'SSRS'}));
 if(!tx||out.length!==4)throw Error('CNN poll format changed');return out;
}
export function parseNbcTexas(html){
 checkDate(html,'2026-09-21');const t=plain(html);
 const m=t.match(/NBC5 Dallas\/Telemundo Station Group poll shows Talarico at (\d+)% and Paxton at (\d+)%/);
 if(!m||!/broader survey of 625 likely voters in Texas Sept\. 8-10/.test(t))throw Error('NBC Texas poll format changed');
 return [poll('nbc','us-senate','2026-09-08','2026-09-10','2026-09-21',[candidate('James Talarico','D',+m[1]),candidate('Ken Paxton','R',+m[2])],{sampleSize:625,marginOfError:4,pollster:'NBC5 Dallas / Telemundo / Mason-Dixon'})];
}
export function parseAbcSenate(html){
 checkDate(html,'2026-10-26');
 const states={Michigan:'mi',Texas:'tx',Alaska:'ak',Ohio:'oh',Kansas:'ks',Maine:'me',Iowa:'ia'},out=[];
 for(const section of html.split(/<h3\b/gi).slice(1)){
  const t=plain('<h3'+section),m=t.match(/^(Michigan|Texas|Alaska|Ohio|Kansas|Maine|Iowa):[^]*?ABC News rating:\s*(Lean Democrat|Lean Republican|Likely Democrat|Likely Republican|Solid Democrat|Solid Republican|Tossup)\b/);
  if(m)out.push(estimate('abc',m[1]==='Texas'?'us-senate':'us-senate-'+states[m[1]],'2026-10-26',m[2]==='Tossup'?'Toss-up':m[2]));
 }
 if(out.length!==7)throw Error('ABC ratings format changed');return out;
}
export function parseFoxRatings(html){
 checkDate(html,'2026-10-29');const t=plain(html),out=[];
 if(/Ohio moves from Toss-up to Lean D/.test(t))out.push(estimate('fox','us-senate-oh','2026-10-29','Lean Democrat'));
 if(/South Carolina moves from Lean R to Toss-up/.test(t))out.push(estimate('fox','us-senate-sc','2026-10-29','Toss-up'));
 if(out.length!==2)throw Error('FOX ratings format changed');return out;
}
export const newsDocuments=[
 {id:'fox-texas-poll',sourceId:'fox',url:'https://www.foxnews.com/politics/fox-news-poll-texas-senate-race-galloping-toward-photo-finish',parse:parseFoxTexas},
 {id:'cnn-senate-polls',sourceId:'cnn',url:'https://transcripts.cnn.com/show/cnc/date/2026-10-29/segment/01',parse:parseCnnSenate},
 {id:'nbc-texas-poll',sourceId:'nbc',url:'https://www.nbcnews.com/politics/2026-election/texas-poll-james-talarico-holds-narrow-advantage-senate-greg-abbott-le-rcna598432',parse:parseNbcTexas,
  // Factual baseline verified from this primary article; explicitly delayed if live retrieval fails.
  verifiedAt:'2026-11-02T23:20:34.156Z',verifiedReports:[poll('nbc','us-senate','2026-09-08','2026-09-10','2026-09-21',[candidate('James Talarico','D',46),candidate('Ken Paxton','R',43)],{sampleSize:625,marginOfError:4,pollster:'NBC5 Dallas / Telemundo / Mason-Dixon'})]},
 {id:'abc-senate-ratings',sourceId:'abc',url:'https://abcnews.com/amp/Politics/key-senate-races-determine-party-controls-body-year/story?id=137301095',parse:parseAbcSenate},
 {id:'fox-senate-ratings',sourceId:'fox',url:'https://www.foxnews.com/politics/fox-news-power-rankings-south-carolina-moves-toss-up.amp',parse:parseFoxRatings}
];
const cache=new Map(),inflight=new Map();
async function loadDocument(doc){
 const old=cache.get(doc.id);if(old&&old.expires>Date.now())return old.value;
 if(inflight.has(doc.id))return inflight.get(doc.id);
 const task=(async()=>{
  const checkedAt=new Date().toISOString();let value;
  try{
   const response=await fetch(doc.url,{signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('News source unavailable');
   const html=await response.text();if(html.length>3000000)throw Error('Document too large');
   const reports=doc.parse(html);
   if(reports.some(r=>r.candidates.some(c=>!Number.isFinite(c.pollShare)||c.pollShare<0||c.pollShare>100)||r.candidates.reduce((n,c)=>n+c.pollShare,0)>100))throw Error('Invalid poll values');
   value={id:doc.id,sourceId:doc.sourceId,status:'available',checkedAt,reports:reports.map(r=>({...r,sourceUrl:doc.url,checkedAt,retrievedAt:checkedAt}))};
  }catch{
   value={id:doc.id,sourceId:doc.sourceId,status:'unavailable',checkedAt,reports:(old?.value.reports||doc.verifiedReports||[]).map(r=>({...r,sourceUrl:doc.url,retrievedAt:r.retrievedAt||doc.verifiedAt,status:'stale',checkedAt}))};
  }
  cache.set(doc.id,{expires:Date.now()+15*60000,value});return value;
 })();inflight.set(doc.id,task);try{return await task;}finally{inflight.delete(doc.id);}
}
export async function getNews(){
 const documents=await Promise.all(newsDocuments.map(loadDocument));
 return {reports:documents.flatMap(d=>d.reports),documents:documents.map(({reports,...d})=>({...d,reports:reports.length}))};
}
