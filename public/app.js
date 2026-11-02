import {races,senateStates,officeOptions,filterRaces,normalizeFavorites} from './catalog.js';
import {primaryReport,forecastRange,reportingLabel,reportStatus,currentStanding} from './race-view.js';

let saved;try{saved=JSON.parse(localStorage.getItem('valleyvote-watchlist'));}catch{}
const favorites=new Set(normalizeFavorites(saved));
const main=document.querySelector('#main'),dialog=document.querySelector('#detail');
let snapshot={races:{},feeds:[]},view='dashboard',level='All',office='All',state='All',query='',page=1,busy=false,selected=null,failed=false;
const pageSize=18,scheduled=races.filter(r=>r.kind!=='collection');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-US'):'—';
const pct=n=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1).replace(/\.0$/,'')+'%':'—';
const time=t=>t&&Number.isFinite(Date.parse(t))?new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Chicago'})+' CT':'Not yet available';
const partyName=p=>({D:'Democrat',R:'Republican',L:'Libertarian',G:'Green',I:'Independent',W:'Write-in',O:'Other'}[p]||'Other');
const partyClass=p=>p==='D'?'dem':p==='R'?'rep':'other';
const dataFor=id=>snapshot.races[id]||{reports:[],forecasts:[]};
const rangeText=range=>range?(range.min===range.max?pct(range.min):pct(range.min)+'–'+pct(range.max)):'—';
function forecastMetric(data,id,metric){const range=forecastRange(data,id,metric);return `<strong>${rangeText(range)}</strong><small>${range?range.sources+' forecast '+(range.sources===1?'source':'sources'):'No forecast data'}</small>`;}
function candidateRows(data,{all=false,report=null,forecast=false}={}){
  const active=report||primaryReport(data);const candidates=active?.candidates||[];
  if(!candidates.length)return `<div class="count-empty">${busy?'Loading candidate data…':active?.status==='not-covered'?'This race has no free count feed connected.':'Candidate data is not available from this feed yet.'}</div>`;
  const visible=all?candidates:candidates.filter(c=>['D','R'].includes(c.party)).slice(0,2);
  const shown=visible.length?visible:candidates.slice(0,all?candidates.length:2);
  return `<div class="candidate-list">${shown.map(c=>`<div class="candidate-row"><div class="candidate-heading"><span class="candidate-name ${partyClass(c.party)}">${escape(c.name)} <small>${escape(c.party)}</small></span><span class="candidate-count"><strong>${forecast?'':pct(c.voteShare)}</strong>${forecast?'':'<small>counted vote share</small>'}<small>${forecast?'Forecast':number(c.votes)+' votes'}</small></span></div><div class="candidate-metrics"><div><span>Final vote share</span>${forecast?`<strong>${pct(c.finalVoteShare)}</strong>`:forecastMetric(data,c.id,'finalVoteShare')}</div><div><span>Chance of winning</span>${forecast?`<strong>${pct(c.winProbability)}</strong>`:forecastMetric(data,c.id,'winProbability')}</div></div></div>`).join('')}</div>${!all&&candidates.length>shown.length?`<p class="more-candidates">+ ${candidates.length-shown.length} more ${candidates.length-shown.length===1?'candidate':'candidates'} · tap race to see all</p>`:''}`;
}
function reporting(report){const progress=reportingLabel(report);return `<div class="reporting"><div><strong>${pct(progress.value)}</strong><span>${escape(progress.label)}</span></div>${progress.value!==null?`<div class="reporting-track" role="progressbar" aria-label="${escape(progress.label)}" aria-valuenow="${progress.value}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress.value}%"></i></div>`:''}${progress.value!==null&&progress.label!=='votes counted'?'<small>Percentage of ballots counted is not published by this source.</small>':''}</div>`;}
function winnerText(data){
  const calls=(data.reports||[]).filter(r=>r.calledWinnerId).map(r=>({source:r.sourceName,id:r.calledWinnerId,name:r.candidates?.find(c=>c.id===r.calledWinnerId)?.name}));
  const predictions=(data.forecasts||[]).filter(r=>r.status==='available'&&r.predictedWinnerId).map(r=>({source:r.sourceName,name:r.candidates?.find(c=>c.id===r.predictedWinnerId)?.name}));
  if(calls.length)return `<span class="winner-call">${new Set(calls.map(c=>c.id)).size>1?'Winner calls differ by source':escape(calls[0].name||'Winner called')} · ${calls.length} ${calls.length===1?'call':'calls'}</span>`;
  if(predictions.length)return `<span>Forecast favorite: ${predictions.map(p=>escape(p.name||'Not provided')).join(' / ')}</span>`;
  return '<span>No winner call · forecasts not connected</span>';
}
function card(r){
  const data=dataFor(r.id),report=primaryReport(data),standing=currentStanding(report);
  const candidates=report?.candidates||[];
  const visible=candidates.length>3?candidates.filter(c=>['D','R'].includes(c.party)||standing.candidateIds.includes(c.id)):candidates;
  const progress=reportingLabel(report);
  const status=report?.status==='stale'?'Update delayed':standing.kind==='called'?'Winner called':standing.kind==='tied'?'Tied':standing.kind==='leading'?(standing.margin===null?'Leading':'Lead: '+number(standing.margin)+' votes'):report?.status==='not-connected'||report?.status==='not-covered'?'Counts unavailable':'Awaiting votes';
  return `<article class="race-list-item" data-race="${r.id}"><div class="race-list-heading"><button class="card-title" data-detail="${r.id}"><h3>${escape(r.title)}</h3></button>${view==='explore'?`<button id="add-${r.id}" class="btn add-race ${favorites.has(r.id)?'added':''}" data-add="${r.id}" ${favorites.has(r.id)?'disabled':''}>${favorites.has(r.id)?'Added ✓':'+ Add'}</button>`:`<button class="remove-race" data-remove="${r.id}" aria-label="Remove ${escape(r.title)}">×</button>`}</div><div class="race-list-body">${visible.length?visible.map(c=>`<div class="compact-candidate"><span class="candidate-name ${partyClass(c.party)}">${escape(c.name)} <small>${escape(c.party)}</small></span><span class="candidate-standing">${standing.candidateIds.includes(c.id)?standing.kind==='called'?'Called':standing.kind==='tied'?'Tied':'Leading':''}</span><span class="compact-votes">${number(c.votes)} <small>votes</small></span><strong class="compact-share">${pct(c.voteShare)}</strong></div>`).join(''):`<p class="compact-empty">${r.kind==='collection'?'Select a district to follow its candidates.':busy?'Loading candidates…':'Candidate counts unavailable'}</p>`}</div><div class="race-list-bottom"><span class="standing-summary">${escape(status)}</span>${progress.value!==null?`<span>${pct(progress.value)} ${escape(progress.label)}</span>`:''}${candidates.length>visible.length?`<span>+${candidates.length-visible.length} more</span>`:''}<button class="text-button" data-detail="${r.id}" aria-label="Details for ${escape(r.title)}">Details →</button></div></article>`;
}
function filtered(){const list=filterRaces(view==='dashboard'?races.filter(r=>favorites.has(r.id)):scheduled,{level,office,state});const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);return list.filter(r=>filterRaces([r],{query}).length||terms.every(t=>(r.title+' '+r.sub+' '+(primaryReport(dataFor(r.id))?.candidates||[]).map(c=>c.name).join(' ')).toLowerCase().includes(t)));}
function filterControls(){return `<div class="filters" aria-label="Filter election level">${['All','Local','State','Federal'].map(f=>`<button class="chip ${level===f?'active':''}" data-filter="${f}" aria-pressed="${level===f}">${f==='All'?'All elections':f}</button>`).join('')}</div><div class="filter-fields"><label>Office<select id="office-filter">${officeOptions.map(([value,label])=>`<option value="${value}" ${office===value?'selected':''}>${label}</option>`).join('')}</select></label><label>State<select id="state-filter"><option value="All">All states</option>${senateStates.map(s=>`<option value="${s.code}" ${state===s.code?'selected':''}>${s.name}</option>`).join('')}</select></label></div>`;}
function renderCards(){const shown=filtered(),pages=Math.max(1,Math.ceil(shown.length/pageSize));page=Math.min(page,pages);document.querySelector('#match-count').textContent=`${shown.length} ${shown.length===1?'race':'races'}${view==='dashboard'?' featured':''}`;document.querySelector('#cards').innerHTML=shown.length?shown.slice((page-1)*pageSize,page*pageSize).map(card).join(''):view==='dashboard'&&!favorites.size?'<div class="empty full dashboard-empty">Add the elections you want to follow.</div>':`<div class="empty full"><strong>No races match.</strong><button class="text-button" data-reset>Clear filters</button><button class="text-button" data-action="explore">Add races →</button></div>`;document.querySelector('#pagination').innerHTML=pages>1?`<button class="btn" data-page="${page-1}" ${page===1?'disabled':''}>← Previous</button><span>Page ${page} of ${pages}</span><button class="btn" data-page="${page+1}" ${page===pages?'disabled':''}>Next →</button>`:'';}
function feedStatus(){return `<div class="feed-panels">${snapshot.feeds.length?snapshot.feeds.map(s=>`<section class="panel"><div class="feed-heading"><h2>${escape(s.name)}</h2><span class="feed-state ${s.status==='available'?'connected':''}">${s.status==='available'?'Connected':s.status==='not-connected'?'Not connected':'Update unavailable'}</span></div><p>${number(s.races)} races with data${s.checkedAt?' · Checked '+time(s.checkedAt):''}</p><small>${s.id==='forecasts'?'No forecast or newsroom call feed has been connected. Missing predictions are not zeros.':s.id==='cameron-official'?'Local candidate counts need the county election-night feed.':s.id==='official-via-openamerica'?'Partial state coverage. Official state counts relayed by Open America; no projections or winner calls.':'Official Texas candidate counts. Reporting progress describes polling locations, not ballots.'}</small></section>`).join(''):'<div class="empty">Checking data feeds…</div>'}</div>`;}
function render(){
  const active=document.activeElement?.id,cursor=active==='search'?document.activeElement.selectionStart:null;
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelector('#nav-count').textContent=favorites.size;
  main.innerHTML=`<div class="heading"><div>${view==='dashboard'?'':'<div class="eyebrow">NOVEMBER 3, 2026 · GENERAL ELECTION</div>'}<h1>${view==='dashboard'?'My elections':view==='explore'?'Add elections':'Data feed status.'}</h1>${view==='dashboard'?'':`<p class="subtitle">${view==='explore'?'Choose races to add to your list.':'Availability of counts, forecasts, and source winner calls.'}</p>`}</div><button class="btn primary" data-action="${view==='dashboard'?'explore':'dashboard'}">${view==='dashboard'?'+ Add elections':'← Dashboard'}</button></div><div class="update-bar"><span class="update-indicator ${failed?'offline':''}"></span><span>${busy?'Checking official counts…':failed?'Update failed · previous data retained':snapshot.retrievedAt?'Last checked '+time(snapshot.retrievedAt):'Waiting for first update'}</span><button class="text-button" data-refresh ${busy?'disabled':''}>↻ Refresh</button></div>
  ${view==='explore'?`<div class="race-shortcuts"><button data-browse="state-house"><strong>150</strong><span>Texas representatives</span></button><button data-browse="us-house"><strong>38</strong><span>Texas congressional races</span></button><button data-browse="us-senate"><strong>35</strong><span>U.S. Senate races</span></button></div>`:''}
  ${view!=='sources'?`${view==='explore'?`<input class="search" id="search" type="search" value="${escape(query)}" placeholder="Find a state, office, or district…" aria-label="Search elections">${filterControls()}`:''}<div id="match-count" class="match-count" role="status"></div><div id="cards" class="race-list"></div><div id="pagination" class="pagination" aria-label="Election pages"></div>`:feedStatus()}`;
  if(view!=='sources')renderCards();
  if(active){const el=document.getElementById(active);if(el){el.focus({preventScroll:true});if(cursor!==null)el.setSelectionRange(cursor,cursor);}}
}
function sourcePanel(report,data,forecast=false){
  const sourceData=forecast?{...data,forecasts:[report]}: {...data,forecasts:[]};
  const call=report.calledWinnerId?report.candidates?.find(c=>c.id===report.calledWinnerId)?.name:null;
  const favorite=report.predictedWinnerId?report.candidates?.find(c=>c.id===report.predictedWinnerId)?.name:null;
  return `<section class="panel comparison-panel"><div class="feed-heading"><h3>${escape(report.sourceName)}</h3><span class="feed-state">${forecast?'Forecast':'Official count'}</span></div><p class="source-stamp">${escape(forecast?'Forecast available':reportStatus(report))}${report.updatedAt?' · Source updated '+time(report.updatedAt):report.sourceUpdated?' · Source updated '+escape(report.sourceUpdated)+' (source local time)':''}</p>${candidateRows(sourceData,{all:true,report,forecast})}${forecast?'':reporting(report)}<div class="call-line">${call?'Winner called: '+escape(call):favorite?'Predicted winner: '+escape(favorite):'No winner call from this source'}</div><small class="source-stamp">${report.retrievedAt?'Retrieved '+time(report.retrievedAt):'No count snapshot received'}</small></section>`;
}
function detail(id){
  selected=id;const r=races.find(r=>r.id===id);if(!r)return;
  const data=dataFor(id),scroll=dialog.scrollTop,focus=document.activeElement?.id;
  document.querySelector('#detail-content').innerHTML=`<span class="tag ${r.level}">${r.level}${r.kind==='special'?' · Special election':''}</span><h2>${escape(r.title)}</h2><p class="subtitle">${escape(r.sub)} · November 3, 2026</p><div class="section-bar"><h3>Source-by-source comparison</h3><button id="detail-follow" class="btn" data-${favorites.has(id)?'remove':'add'}="${r.id}">${favorites.has(id)?'Remove race':'+ Add race'}</button></div>${r.kind==='collection'?`<div class="notice">Choose an individual race for candidate counts.<button class="btn" data-browse="${r.office}">Browse districts</button></div>`:''}${data.reports?.length?data.reports.map(report=>sourcePanel(report,data)).join(''):'<div class="empty">No count source is connected for this race.</div>'}<h3 class="forecast-heading">Forecasts & predictions</h3>${data.forecasts?.length?data.forecasts.map(report=>sourcePanel(report,data,true)).join(''):'<div class="forecast-empty"><strong>No forecast feed connected</strong><p>Final vote share, chance of winning, and predicted winners will appear here when a source provides them. Current vote leaders are never treated as predicted winners.</p></div>'}<p class="data-note">Reporting locations and precincts are not the same as the percentage of ballots counted. Each source keeps its own figures and update time.</p>`;
  if(!dialog.open)dialog.showModal();else{dialog.scrollTop=scroll;if(focus==='detail-follow')document.getElementById(focus)?.focus({preventScroll:true});}
}
function reset(){level='All';office='All';state='All';query='';page=1;}
function navigate(next){view=next;reset();render();window.scrollTo(0,0);}
function browse(next){if(dialog.open)dialog.close();view='explore';reset();office=next;if(next!=='us-senate')state='TX';render();}
function persist(){try{localStorage.setItem('valleyvote-watchlist',JSON.stringify([...favorites]));}catch{}render();if(dialog.open)detail(selected);}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',2000);}
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;page=1;renderCards();}});
document.addEventListener('change',e=>{if(e.target.id==='office-filter'||e.target.id==='state-filter'){if(e.target.id==='office-filter')office=e.target.value;else state=e.target.value;page=1;renderCards();}});
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b){const card=e.target.closest('[data-race]');if(card)detail(card.dataset.race);return;}if(b.disabled)return;
  if(b.dataset.view||b.dataset.action)navigate(b.dataset.view||b.dataset.action);
  if(b.dataset.filter){level=b.dataset.filter;page=1;render();}
  if(b.dataset.browse)browse(b.dataset.browse);
  if(b.hasAttribute('data-reset')){reset();render();}
  if(b.dataset.page){page=Number(b.dataset.page);renderCards();document.querySelector('#match-count').scrollIntoView({block:'start'});}
  if(b.dataset.add){favorites.add(b.dataset.add);persist();toast('Race added to your dashboard');}
  if(b.dataset.remove){favorites.delete(b.dataset.remove);persist();}
  if(b.dataset.detail)detail(b.dataset.detail);
  if(b.hasAttribute('data-refresh'))refresh();
  if(b.classList.contains('close'))dialog.close();
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
async function refresh(){
  if(busy)return;busy=true;render();
  try{const res=await fetch('/api/results',{signal:AbortSignal.timeout(18000)});if(!res.ok)throw Error();const data=await res.json();if(data.electionDate!=='2026-11-03'||!data.races||!Array.isArray(data.feeds))throw Error();snapshot=data;failed=false;}
  catch{failed=true;snapshot={...snapshot,races:Object.fromEntries(Object.entries(snapshot.races).map(([id,r])=>[id,{...r,reports:r.reports.map(report=>report.candidates?.length?{...report,status:'stale'}:report)}]))};}
  finally{busy=false;render();if(dialog.open)detail(selected);}
}
render();refresh();setInterval(()=>{if(!document.hidden)refresh();},60000);
