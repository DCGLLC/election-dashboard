import {cameronContests,cameronCategories} from './cameron.js';
import {races,senateStates,officeOptions,filterRaces,normalizeFavorites} from './catalog.js';
import {primaryReport,forecastRange,reportingLabel,reportStatus,currentStanding} from './race-view.js';
import {newsNetworks,federalRaceKey,compareNews,freshNews} from './news-view.js';
import {createAccounts} from './account.js';

let saved;try{saved=JSON.parse(localStorage.getItem('valleyvote-watchlist'));}catch{}
const favorites=new Set(normalizeFavorites(saved));
let legacyFavorites=normalizeFavorites(saved),accountState={enabled:false,ready:false,user:null,status:'starting'},authMode='signup',authBusy=false,authMessage='';
const accounts=createAccounts({validIds:races.map(r=>r.id),onChange:ids=>{favorites.clear();ids.forEach(id=>favorites.add(id));render();if(dialog.open)detail(selected);},onState:state=>{const previousUser=accountState.user?.id;accountState=state;if(previousUser&&previousUser!==state.user?.id)document.querySelector('#account-dialog')?.close();renderAccountControls();render();},onRecovery:()=>showAccount('recovery')});
const main=document.querySelector('#main'),dialog=document.querySelector('#detail');
let snapshot={races:{},feeds:[]},view='dashboard',level='All',office='All',state='All',query='',countyCategory='All',page=1,busy=false,selected=null,failed=false;
const pageSize=18,scheduled=races.filter(r=>r.kind!=='collection');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-US'):'—';
const pct=n=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1).replace(/\.0$/,'')+'%':'—';
const time=t=>t&&Number.isFinite(Date.parse(t))?new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Chicago'})+' CT':'Not yet available';
const partyName=p=>({D:'Democrat',R:'Republican',L:'Libertarian',G:'Green',I:'Independent',W:'Write-in',O:'Other'}[p]||'Other');
const partyClass=p=>p==='D'?'dem':p==='R'?'rep':'other';
const dataFor=id=>{if(snapshot.races[id])return snapshot.races[id];const r=races.find(r=>r.id===id);return {reports:r?.scope==='cameron'?[{sourceId:'cameron-official',sourceName:'Cameron County Elections',status:'awaiting-results',scope:'cameron',scopeLabel:r.scopeLabel,voteFor:r.voteFor,candidates:r.roster.map(c=>({...c,votes:null,voteShare:null})),reporting:{votesIn:null,locationsIn:null,precinctsIn:null}}]:[],forecasts:[]};};
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
  const data=dataFor(r.id),report=primaryReport(data),standing=currentStanding(report),progress=reportingLabel(report);
  const candidates=report?.candidates||[];
  const status=r.id==='county'?'86 positions & measures':report?.status==='unavailable'?'Updates unavailable':standing.kind==='multi-seat'?r.voteFor+' seats':report?.status==='stale'?'Update delayed':standing.kind==='called'?'Winner called':standing.kind==='tied'?'Tied':standing.kind==='leading'?(standing.margin===null?'Leading':'Lead: '+number(standing.margin)+' votes'):report?.status==='not-connected'||report?.status==='not-covered'?'Counts unavailable':'Awaiting votes';
  const action=view==='dashboard'?`<button class="remove-race" data-remove="${r.id}" aria-label="Remove ${escape(r.title)}">×</button>`:`<button id="add-${r.id}" class="btn add-race ${favorites.has(r.id)?'added':''}" data-add="${r.id}" ${favorites.has(r.id)?'disabled':''}>${favorites.has(r.id)?'Added ✓':'+ Add'}</button>`;
  return `<tbody data-race="${r.id}" aria-labelledby="race-${r.id}"><tr class="table-race-heading"><th colspan="5" scope="rowgroup"><div><button id="race-${r.id}" class="card-title" data-detail="${r.id}">${escape(r.title)}</button><span class="table-race-status">${escape(status)}${r.scope==='cameron'?' · County votes only':''}</span><span class="table-race-actions"><button class="text-button" data-detail="${r.id}" aria-label="Details for ${escape(r.title)}">Details</button>${action}</span></div></th></tr>${candidates.length?candidates.map((c,i)=>{const forecast=forecastRange(data,c.id,'winProbability');return `<tr class="table-candidate-row"><th scope="row"><span class="candidate-name ${partyClass(c.party)}">${escape(c.name)} <small>${escape(c.party)}</small></span>${standing.candidateIds.includes(c.id)?`<span class="table-standing">${standing.kind==='called'?'Called':standing.kind==='tied'?'Tied':'Leading'}</span>`:''}</th><td title="${forecast?forecast.sources+' forecast sources':'No forecast data connected'}">${rangeText(forecast)}</td><td>${number(c.votes)}</td><td>${pct(c.voteShare)}</td>${i===0?`<td rowspan="${candidates.length}" class="table-reporting">${pct(progress.value)}${progress.value!==null?`<small>${escape(progress.label.replace('polling locations reporting','locations').replace('precincts reporting','precincts'))}</small>`:''}</td>`:''}</tr>`;}).join(''):`<tr class="table-empty-row"><td colspan="5">${r.id==='county'?'Open this group to see every county position and measure.':r.kind==='collection'?'Choose an individual district to monitor candidates.':busy?'Loading candidates…':'Candidate data unavailable'}</td></tr>`}</tbody>`;
}
function filtered(){const localCounty=view==='explore'&&level==='Local';const list=filterRaces(localCounty?cameronContests:view==='dashboard'?races.filter(r=>favorites.has(r.id)):scheduled,{level:localCounty?'All':level,office,state});const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);return list.filter(r=>(office!=='cameron'||countyCategory==='All'||r.category===countyCategory)&&(filterRaces([r],{query}).length||terms.every(t=>(r.title+' '+r.sub+' '+(primaryReport(dataFor(r.id))?.candidates||[]).map(c=>c.name).join(' ')).toLowerCase().includes(t))));}
function filterControls(){if(office==='cameron')return `<div class="filter-fields"><label>Category<select id="county-category"><option value="All">All positions & measures</option>${cameronCategories.map(c=>`<option value="${c}" ${countyCategory===c?'selected':''}>${c}</option>`).join('')}</select></label></div>`;return `<div class="filters" aria-label="Filter election level">${['All','Local','State','Federal'].map(f=>`<button class="chip ${level===f?'active':''}" data-filter="${f}" aria-pressed="${level===f}">${f==='All'?'All elections':f}</button>`).join('')}</div><div class="filter-fields"><label>Office<select id="office-filter">${officeOptions.map(([value,label])=>`<option value="${value}" ${office===value?'selected':''}>${label}</option>`).join('')}</select></label><label>State<select id="state-filter"><option value="All">All states</option>${senateStates.map(s=>`<option value="${s.code}" ${state===s.code?'selected':''}>${s.name}</option>`).join('')}</select></label></div>`;}
function renderCards(){
 const shown=filtered();
 document.querySelector('#match-count').textContent=`${shown.length} ${shown.length===1?'race':'races'}${view==='dashboard'?' featured':''}`;
 if(view==='explore'&&level==='Local'){
 document.querySelector('#cards').innerHTML=`<section class="local-election-list"><h2>Cameron County</h2><p>Choose individual races to add to your dashboard.</p>${shown.length?shown.map(r=>`<div class="local-election-row"><div><button class="card-title" data-detail="${r.id}">${escape(r.ballotOffice||r.title)}</button><small>${escape(r.jurisdiction)} · ${escape(r.category)}</small></div><button class="btn add-race ${favorites.has(r.id)?'added':''}" data-add="${r.id}" ${favorites.has(r.id)?'disabled':''}>${favorites.has(r.id)?'Added ✓':'+ Add'}</button></div>`).join(''):'<div class="empty">No races match your search.<button class="text-button" data-reset>Clear filters</button></div>'}</section>`;
 document.querySelector('#pagination').innerHTML='';return;
 }
 document.querySelector('#cards').innerHTML=shown.length?`<div id="election-table-scroll" class="election-table-scroll" role="region" aria-label="Scrollable election results" tabindex="0"><table class="election-table"><caption class="sr-only">Election results grouped by race. Candidate colors identify party. A dash means unavailable.</caption><thead><tr><th scope="col">Race / candidate</th><th scope="col">Chance of winning</th><th scope="col">Votes</th><th scope="col">Vote share</th><th scope="col">% reported</th></tr></thead>${shown.map(card).join('')}</table></div>`:view==='dashboard'&&!favorites.size?'<div class="empty dashboard-empty">Add the elections you want to follow.</div>':'<div class="empty">No races match these filters.<button class="text-button" data-reset>Clear filters</button></div>';
 document.querySelector('#pagination').innerHTML='';
}
function feedStatus(){return `<div class="feed-panels">${snapshot.feeds.length?snapshot.feeds.map(s=>`<section class="panel"><div class="feed-heading"><h2>${escape(s.name)}</h2><span class="feed-state ${s.status==='available'?'connected':''}">${s.status==='available'?'Connected':s.status==='not-connected'?'Not connected':'Update unavailable'}</span></div><p>${number(s.races)} races with data${s.checkedAt?' · Checked '+time(s.checkedAt):''}</p><small>${s.id==='forecasts'?'No forecast or newsroom call feed has been connected. Missing predictions are not zeros.':s.id==='cameron-official'?'86 official ballot contests. County-only counts will appear when a supported November results report is published and retrievable.':s.id==='official-via-openamerica'?'Partial state coverage. Official state counts relayed by Open America; no projections or winner calls.':'Official Texas candidate counts. Reporting progress describes polling locations, not ballots.'}</small></section>`).join(''):'<div class="empty">Checking data feeds…</div>'}</div>`;}
function render(){
  const active=document.activeElement?.id,cursor=active==='search'?document.activeElement.selectionStart:null;const previousTable=document.querySelector('#election-table-scroll');const tablePosition={top:previousTable?.scrollTop||0,left:previousTable?.scrollLeft||0};
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelector('#nav-count').textContent=favorites.size;
  main.innerHTML=`${accountBanner()}<div class="heading"><div>${view==='dashboard'?'':'<div class="eyebrow">NOVEMBER 3, 2026 · GENERAL ELECTION</div>'}<h1>${view==='dashboard'?'My elections':view==='cameron'?'Cameron County':view==='explore'?'Add elections':'Data feed status.'}</h1>${view==='dashboard'?'':`<p class="subtitle">${view==='cameron'?'Every November 3 position and measure · Cameron County voters only.':view==='explore'?'Choose races to add to your list.':'Availability of counts, forecasts, and source winner calls.'}</p>`}</div><button class="btn primary" ${view==='cameron'?'data-add-county':`data-action="${view==='dashboard'?'explore':'dashboard'}"`}>${view==='cameron'?'+ Add all 86':view==='dashboard'?'+ Add elections':'← Dashboard'}</button></div><div class="update-bar"><span class="update-indicator ${failed?'offline':''}"></span><span>${busy?'Checking official counts…':failed?'Update failed · previous data retained':snapshot.retrievedAt?'Last checked '+time(snapshot.retrievedAt):'Waiting for first update'}</span><button class="text-button" data-refresh ${busy?'disabled':''}>↻ Refresh</button></div>
  ${view==='explore'?`<div class="race-shortcuts"><button data-action="cameron"><strong>86</strong><span>Cameron County contests</span></button><button data-browse="state-house"><strong>150</strong><span>Texas representatives</span></button><button data-browse="us-house"><strong>38</strong><span>Texas congressional races</span></button><button data-browse="us-senate"><strong>35</strong><span>U.S. Senate races</span></button></div>`:''}
  ${view!=='sources'?`${(view==='explore'||view==='cameron')?`<input class="search" id="search" type="search" value="${escape(query)}" placeholder="Find a state, office, or district…" aria-label="Search elections">${filterControls()}`:''}<div id="match-count" class="match-count" role="status"></div><div id="cards" class="race-list"></div><div id="pagination" class="pagination" aria-label="Election pages"></div>`:feedStatus()}`;
  if(view!=='sources'){renderCards();const table=document.querySelector('#election-table-scroll');if(table){table.scrollTop=tablePosition.top;table.scrollLeft=tablePosition.left;}}
  if(active){const el=document.getElementById(active);if(el){el.focus({preventScroll:true});if(cursor!==null)el.setSelectionRange(cursor,cursor);}}
}
function sourcePanel(report,data,forecast=false){
  const sourceData=forecast?{...data,forecasts:[report]}: {...data,forecasts:[]};
  const call=report.calledWinnerId?report.candidates?.find(c=>c.id===report.calledWinnerId)?.name:null;
  const favorite=report.predictedWinnerId?report.candidates?.find(c=>c.id===report.predictedWinnerId)?.name:null;
  return `<section class="panel comparison-panel"><div class="feed-heading"><h3>${escape(report.sourceName)}</h3><span class="feed-state">${forecast?'Forecast':'Official count'}</span></div><p class="source-stamp">${escape(forecast?'Forecast available':reportStatus(report))}${report.updatedAt?' · Source updated '+time(report.updatedAt):report.sourceUpdated?' · Source updated '+escape(report.sourceUpdated)+' (source local time)':''}</p>${candidateRows(sourceData,{all:true,report,forecast})}${forecast?'':reporting(report)}<div class="call-line">${call?'Winner called: '+escape(call):favorite?'Predicted winner: '+escape(favorite):'No winner call from this source'}</div><small class="source-stamp">${report.retrievedAt?'Retrieved '+time(report.retrievedAt):'No count snapshot received'}</small></section>`;
}

function newsDate(date){return /^\d{4}-\d{2}-\d{2}$/.test(date||'')?new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'Date unavailable';}
function newsTable(candidates,values,average=false){
 return '<div class="news-table-scroll" role="region" aria-label="'+(average?'Average':'Source')+' polling and estimates" tabindex="0"><table class="news-table"><thead><tr><th>Candidate</th><th>Poll support</th><th>Est. final share</th><th>Win chance</th></tr></thead><tbody>'+candidates.map(c=>'<tr><th><span class="candidate-name '+partyClass(c.party)+'">'+escape(c.name)+' <small>'+escape(c.party)+'</small></span></th>'+['pollShare','finalVoteShare','winProbability'].map(metric=>{const v=values(c.id,metric);return '<td data-label="'+({pollShare:'Poll support',finalVoteShare:'Est. final share',winProbability:'Win chance'}[metric])+'">'+pct(average?v?.value:v)+(average?'<small>'+number(v?.sources||0)+' '+(metric==='pollShare'?'polls':'estimates')+'</small>':'')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
}
function newsComparison(r,data){
 if(!federalRaceKey(r))return '<section class="news-comparison"><h3 id="news-comparison-title">News coverage</h3><p class="news-missing">No verified race-specific polling from FOX News, CNN, NBC News or ABC News is connected for this local or state race.</p></section>';
 const {selected,averages}=compareNews(data.news||[]);
 const names=new Map();for(const c of averages)names.set(c.id,c);
 const candidates=[...names.values()];
 const avg=new Map(averages.map(c=>[c.id,c]));
 const averageTable=candidates.length?newsTable(candidates,(id,metric)=>avg.get(id)?.[metric],true):'<p>No verified candidate-level polling is connected for this race yet.</p>';
 const networks=newsNetworks.map(network=>{
  const reports=selected.filter(n=>n.sourceId===network.id),poll=reports.find(n=>n.kind==='poll'),estimate=reports.find(n=>n.kind==='estimate');
  const failed=(data.newsDocuments||[]).filter(d=>d.sourceId===network.id).some(d=>d.status==='unavailable');
  const stamp=reports.map(n=>n.kind==='poll'?'Poll: '+newsDate(n.fieldStart)+' – '+newsDate(n.fieldEnd):'Estimate: '+newsDate(n.publishedAt)).join(' · ');
  const notes=poll?[poll.pollster,poll.sampleSize?number(poll.sampleSize)+' likely voters':null,typeof poll.marginOfError==='number'?'±'+poll.marginOfError+' points':null].filter(Boolean).join(' · '):'';
  return '<section class="news-source"><h4>'+network.name+'</h4>'+(stamp?'<p class="source-stamp">'+escape(stamp)+'</p>':'')+(estimate?.rating?'<p class="news-rating">Race rating: <strong>'+escape(estimate.rating)+'</strong></p>':'')+(reports.some(n=>n.candidates?.length)&&candidates.length?newsTable(candidates,(id,metric)=>(metric==='pollShare'?poll:estimate)?.candidates?.find(c=>c.id===id)?.[metric]):'')+(notes?'<p class="source-stamp">'+escape(notes)+'</p>':'')+(!reports.length?'<p class="news-missing">No verified race-specific poll or estimate connected.'+(failed?' A monitored source could not be refreshed.':'')+'</p>':'')+(reports.some(n=>!freshNews(n))?'<p class="news-missing">Older than 30 days or refresh delayed · excluded from average.</p>':'')+(reports.length?'<small class="source-stamp">'+(reports.every(n=>n.status==='available')?'Article checked ':'Refresh delayed · last retrieved ')+time(reports[0].status==='available'?reports[0].checkedAt:reports[0].retrievedAt)+'</small>':'')+'</section>';
 }).join('');
 return '<section class="news-comparison" aria-labelledby="news-comparison-title"><h3 id="news-comparison-title">Polls &amp; estimates</h3>'+(r.scope==='cameron'?'<p class="data-note">Polls cover the full state or congressional district; official counts below cover Cameron County only.</p>':'')+'<section class="news-average"><h4>Average across available sources</h4>'+averageTable+'<p class="data-note">Simple mean of each network’s newest verified likely-voter poll within 30 days; duplicate polls counted once. Estimates are averaged separately. Poll support is not a chance of winning. Ratings are not converted to percentages. Candidates not covered by these polls are omitted.</p></section>'+networks+'<p class="data-note">Coverage is partial. Monitored articles are checked every 15 minutes; this does not automatically discover newly published polls. A dash means no published numeric figure is connected.</p></section>';
}

function detail(id){
  if(id==='county'){navigate('cameron');return;}selected=id;const r=races.find(r=>r.id===id);if(!r)return;
  const data=dataFor(id),scroll=dialog.scrollTop,focus=document.activeElement?.id;
  document.querySelector('#detail-content').innerHTML=`<span class="tag ${r.level}">${r.level}${r.kind==='special'?' · Special election':''}</span><h2>${escape(r.title)}</h2><p class="subtitle">${escape(r.sub)} · November 3, 2026</p>${r.scope==='cameron'?`<div class="county-scope">County voter totals only; these are separate from full statewide or district-wide results.${r.voteFor>1?` This contest elects ${r.voteFor} directors.`:''}</div>${r.description?`<details class="measure-description"><summary>Read ballot measure</summary><p>${escape(r.description)}</p></details>`:''}`:''}<nav class="detail-navigation" aria-label="Race detail sections"><button class="text-button" data-detail-section="news-comparison-title">Polls &amp; news</button><button class="text-button" data-detail-section="official-results-title">Official results</button></nav>${newsComparison(r,data)}<div class="section-bar"><h3 id="official-results-title">Official results by source</h3><button id="detail-follow" class="btn" data-${favorites.has(id)?'remove':'add'}="${r.id}">${favorites.has(id)?'Remove race':'+ Add race'}</button></div>${r.kind==='collection'?`<div class="notice">Choose an individual race for candidate counts.<button class="btn" data-browse="${r.office}">Browse districts</button></div>`:''}${data.reports?.length?data.reports.map(report=>sourcePanel(report,data)).join(''):'<div class="empty">No count source is connected for this race.</div>'}<h3 class="forecast-heading">Forecasts & predictions</h3>${data.forecasts?.length?data.forecasts.map(report=>sourcePanel(report,data,true)).join(''):'<div class="forecast-empty"><strong>No forecast feed connected</strong><p>Final vote share, chance of winning, and predicted winners will appear here when a source provides them. Current vote leaders are never treated as predicted winners.</p></div>'}<p class="data-note">Reporting locations and precincts are not the same as the percentage of ballots counted. Each source keeps its own figures and update time.</p>`;
  if(!dialog.open){dialog.showModal();dialog.scrollTop=0;}else{dialog.scrollTop=scroll;if(focus==='detail-follow')document.getElementById(focus)?.focus({preventScroll:true});}
}

function renderAccountControls(){
 const target=document.querySelector('#account-controls');if(!target)return;
 target.innerHTML=accountState.user?'<button class="account-button" data-account="profile" aria-label="Your account">My account</button>':'<button class="account-button" data-account="signin">Sign in</button><button class="account-button filled" data-account="signup">Create account</button>';
}
function accountBanner(){
 if(!accountState.enabled)return view==='dashboard'?'<div class="account-notice">Accounts are being set up. Your selections are currently saved on this device only.</div>':'';
 if(!accountState.ready)return '<div class="account-notice" role="status">Loading your account…</div>';
 if(!accountState.user)return view==='dashboard'?'<section class="account-welcome"><h2>Your elections. On every device.</h2><p>Create an account with your email and a password, then sign in on your phone to see the same dashboard.</p><button class="btn primary" data-account="signup">Create account</button><button class="text-button" data-account="signin">Sign in</button></section>':'';
 const status={starting:'Connecting…',loading:'Loading your dashboard…',saving:'Saving your changes…',synced:'Dashboard synced across your devices',offline:'Changes have not synced. They are saved on this device and will retry.'}[accountState.status]||'Connecting…';
 return '<div class="account-notice" role="status">'+escape(status)+(accountState.status==='offline'?'<button class="text-button" data-sync-account>Retry</button>':'')+'</div>'+(legacyFavorites.length?'<div class="account-notice">'+legacyFavorites.length+' elections are saved on this device.<button class="text-button" data-import-local>Add them to my account</button></div>':'');
}
function showAccount(mode='signup'){
 if(dialog.open)dialog.close();authMode=mode;authMessage='';authBusy=false;renderAccountForm();const modal=document.querySelector('#account-dialog');if(!modal.open)modal.showModal();modal.scrollTop=0;
}
function renderAccountForm(){
 const target=document.querySelector('#account-content');
 if(!accountState.enabled){target.innerHTML='<h2 id="account-title">Accounts are coming</h2><p>Account setup is not finished yet. Your current elections stay saved on this device.</p>';return;}
 if(authMode==='profile'&&accountState.user){target.innerHTML='<h2 id="account-title">Your account</h2><p>'+escape(accountState.user.email)+'</p><p>Sign in with this email on your phone to use the same dashboard.</p><button class="btn" data-sign-out>Sign out on this device</button><p id="auth-message" role="status">'+escape(authMessage)+'</p>';return;}
 const title={signup:'Create your account',signin:'Welcome back',reset:'Reset your password',recovery:'Choose a new password'}[authMode]||'Welcome back';
 const button={signup:'Create account',signin:'Sign in',reset:'Send reset link',recovery:'Save password'}[authMode];
 target.innerHTML='<h2 id="account-title">'+title+'</h2><p>'+(authMode==='signup'?'Just your email and a password. Save your elections and use the same dashboard on any device.':authMode==='signin'?'Sign in to your saved election dashboard.':authMode==='reset'?'We’ll email you a password reset link.':'Enter a new password for your account.')+'</p><form id="account-form">'+(authMode!=='recovery'?'<label>Email<input id="account-email" name="email" type="email" autocomplete="email" required></label>':'')+(authMode!=='reset'?'<label>Password<input id="account-password" name="password" type="password" autocomplete="'+(authMode==='signin'?'current-password':'new-password')+'" minlength="8" required></label>':'')+'<p id="auth-message" class="auth-message" role="status" aria-live="polite">'+escape(authMessage)+'</p><button class="btn primary" type="submit" '+(authBusy?'disabled':'')+'>'+(authBusy?'Please wait…':button)+'</button></form><div class="account-links">'+(authMode==='signup'?'<button class="text-button" data-account="signin">Already have an account? Sign in</button>':authMode==='signin'?'<button class="text-button" data-account="signup">Create account</button><button class="text-button" data-account="reset">Forgot password?</button>':'<button class="text-button" data-account="signin">Back to sign in</button>')+'</div>';
}
function accountError(error){
 const code=error?.code||'';
 if(code==='invalid_credentials')return 'That email and password do not match. Please try again.';
 if(code==='email_not_confirmed')return 'Check your email to finish creating your account.';
 if(code==='weak_password')return 'Choose a stronger password with at least 8 characters.';
 if(code==='user_already_exists')return 'Try signing in with this email, or reset your password.';
 if(/rate|limit/.test(code))return 'Please wait a moment before trying again.';
 return 'We could not connect to your account. Please try again.';
}
async function signOutAccount(){
 try{await accounts.signOut();document.querySelector('#account-dialog').close();toast('Signed out on this device');}
 catch(error){authMessage=accountError(error);renderAccountForm();}
}
document.addEventListener('submit',async e=>{
 if(e.target.id!=='account-form')return;e.preventDefault();if(authBusy||!accountState.enabled)return;
 const email=e.target.elements.email?.value.trim(),password=e.target.elements.password?.value,mode=authMode;
 if(!accountState.ready){authMessage='Still connecting. Please try again in a moment.';document.querySelector('#auth-message').textContent=authMessage;return;}
 authBusy=true;const submit=e.target.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Please wait…';
 try{
  if(mode==='reset'){await accounts.resetPassword(email);authMessage='If this email has an account, a reset link is on its way.';}
  else if(mode==='recovery'){await accounts.updatePassword(password);document.querySelector('#account-dialog').close();toast('Password updated');}
  else{const data=await (mode==='signup'?accounts.signUp(email,password):accounts.signIn(email,password));if(data.session){document.querySelector('#account-dialog').close();toast(mode==='signup'?'Your account is ready':'Signed in');}else authMessage='Check your email to finish creating your account.';}
 }catch(error){authMessage=accountError(error);}
 finally{authBusy=false;const message=document.querySelector('#auth-message');if(message)message.textContent=authMessage;const form=document.querySelector('#account-form');if(form){const input=form.elements.password;if(input)input.value='';const button=form.querySelector('[type="submit"]');button.disabled=false;button.textContent={signup:'Create account',signin:'Sign in',reset:'Send reset link',recovery:'Save password'}[mode];}}
});

function reset(){level='All';office='All';state='All';query='';countyCategory='All';page=1;}
function navigate(next){document.querySelector('#election-table-scroll')?.scrollTo(0,0);view=next;reset();if(next==='cameron'){office='cameron';state='TX';}render();window.scrollTo(0,0);}
function browse(next){if(dialog.open)dialog.close();view='explore';reset();office=next;if(next!=='us-senate')state='TX';render();}
function persist(){if(!accountState.enabled){try{localStorage.setItem('valleyvote-watchlist',JSON.stringify([...favorites]));legacyFavorites=[...favorites];}catch{}}render();if(dialog.open)detail(selected);}
function changeRace(id,selected){if(accountState.enabled){if(!accountState.ready||!accountState.user){showAccount('signup');return false;}return accounts.setSelected(id,selected);}selected?favorites.add(id):favorites.delete(id);persist();return true;}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',2000);}
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;page=1;renderCards();}});
document.addEventListener('change',e=>{if(e.target.id==='county-category'){countyCategory=e.target.value;page=1;renderCards();return;}if(e.target.id==='office-filter'||e.target.id==='state-filter'){if(e.target.id==='office-filter'){office=e.target.value;if(office==='local'){level='Local';office='All';state='All';}}else state=e.target.value;page=1;render();}});
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b){const card=e.target.closest('[data-race]');if(card)detail(card.dataset.race);return;}if(b.disabled)return;
  if(b.dataset.view||b.dataset.action)navigate(b.dataset.view||b.dataset.action);
  if(b.dataset.filter){level=b.dataset.filter;office='All';state='All';countyCategory='All';page=1;render();}
  if(b.dataset.browse)browse(b.dataset.browse);
  if(b.hasAttribute('data-reset')){reset();render();}
  if(b.dataset.page){page=Number(b.dataset.page);renderCards();document.querySelector('#match-count').scrollIntoView({block:'start'});}
  if(b.hasAttribute('data-add-county')){if(accountState.enabled&&!accountState.user){showAccount('signup');return;}if(accountState.enabled)accounts.setMany([...cameronContests.map(r=>[r.id,true]),['county',false]]);else{cameronContests.forEach(r=>favorites.add(r.id));favorites.delete('county');persist();}toast('Cameron County contests added');}
  if(b.dataset.add){if(changeRace(b.dataset.add,true))toast('Race added to your dashboard');}
  if(b.dataset.remove)changeRace(b.dataset.remove,false);
  if(b.dataset.detail)detail(b.dataset.detail);
  if(b.dataset.account)showAccount(b.dataset.account);
  if(b.hasAttribute('data-sign-out'))void signOutAccount();
  if(b.hasAttribute('data-sync-account'))void accounts.sync();
  if(b.hasAttribute('data-import-local')){if(accountState.user){accounts.setMany(legacyFavorites.map(id=>[id,true]));legacyFavorites=[];try{localStorage.removeItem('valleyvote-watchlist');}catch{}render();}}
  if(b.classList.contains('account-close'))document.querySelector('#account-dialog').close();
  if(b.dataset.detailSection)document.getElementById(b.dataset.detailSection)?.scrollIntoView({block:'start',behavior:'smooth'});
  if(b.hasAttribute('data-refresh')){refresh();void accounts.sync();}
  if(b.classList.contains('close'))dialog.close();
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
async function refresh(){
  if(busy)return;busy=true;render();
  try{const res=await fetch('/api/results',{signal:AbortSignal.timeout(18000)});if(!res.ok)throw Error();const data=await res.json();if(data.electionDate!=='2026-11-03'||!data.races||!Array.isArray(data.feeds))throw Error();snapshot=data;failed=false;}
  catch{failed=true;snapshot={...snapshot,races:Object.fromEntries(Object.entries(snapshot.races).map(([id,r])=>[id,{...r,reports:r.reports.map(report=>report.candidates?.length?{...report,status:'stale'}:report)}]))};}
  finally{busy=false;render();if(dialog.open)detail(selected);}
}
render();renderAccountControls();void accounts.init();refresh();setInterval(()=>{if(!document.hidden)refresh();},60000);
