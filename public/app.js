import { races, senateStates, sourceDefinitions, officeOptions, filterRaces, normalizeFavorites } from './catalog.js';

let sources = sourceDefinitions.map(s => ({ ...s, status: s.monitor ? 'pending' : 'link' }));
let saved;
try { saved = JSON.parse(localStorage.getItem('valleyvote-watchlist')); } catch {}
const favorites = new Set(normalizeFavorites(saved));
let view = 'dashboard', level = 'All', office = 'All', state = 'All', query = '', page = 1, busy = false, selected = null;
const pageSize = 18;
const main = document.querySelector('#main');
const dialog = document.querySelector('#detail');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = t => new Date(t).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZone:'America/Chicago' }) + ' CT';
const link = (url,title) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)}</a>`;
const scheduled = races.filter(r => r.kind !== 'collection');

function sourceRow(s) {
  const label = s.status === 'available' ? 'Checked ' + time(s.checkedAt) : s.status === 'unavailable' ? 'Retrieval unavailable' : s.monitor ? 'Checking…' : 'Open source';
  return `<a class="source-row" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer"><span class="source-icon">${escape(s.abbr || s.id.toUpperCase())}</span><span class="source-info"><strong>${escape(s.name)}</strong><small>${s.type === 'Official' ? (s.id === 'county' || s.id === 'texas' ? 'Official election returns' : 'Official state election office · choose 2026 results') : 'Independent news coverage'}${s.monitor ? '' : ' · direct link'}</small></span><span class="source-status">${label} ↗</span></a>`;
}
function feed(ids) {
  const items = sources.filter(s => (!ids || ids.includes(s.id)) && s.monitor).flatMap(s => (s.items || []).slice(0,3).map(i => ({...i, source:s.name, retrievedAt:s.retrievedAt || s.checkedAt, stale:s.status !== 'available'})));
  if (!items.length) return `<div class="empty"><strong>Read updates at the original source.</strong>${busy ? 'Checking monitored source pages…' : 'Use the official election office and news links above for current reporting.'}<br>Direct source links are not automatically retrieved. Live vote totals are not imported.</div>`;
  return items.slice(0,6).map(i => `<div class="feed-item"><small>${escape(i.source)} · retrieved ${time(i.retrievedAt)}${i.stale ? ' · refresh failed; may be outdated' : ''}</small>${link(i.url,i.title + ' ↗')}</div>`).join('');
}
function card(r) {
  return `<article class="card"><div class="card-top"><span class="tag ${r.level}">${r.level} ${r.kind === 'special' ? 'special election' : r.kind === 'collection' ? 'collection' : 'election'}</span><button class="star" data-save="${r.id}" aria-label="${favorites.has(r.id) ? 'Remove' : 'Save'} ${escape(r.title)}" aria-pressed="${favorites.has(r.id)}">${favorites.has(r.id) ? '★' : '☆'}</button></div><button class="card-title" data-detail="${r.id}"><h3>${escape(r.title)}</h3></button><p>${escape(r.sub)}</p><div class="waiting"><i></i> ${r.kind === 'collection' ? 'Choose an individual district to follow' : 'Open source for current results'}</div><div class="card-bottom"><span>${r.sources.length} sources · Nov 3, 2026</span><button data-detail="${r.id}">${r.kind === 'collection' ? 'Browse districts' : 'View election'} ↗</button></div></article>`;
}
function filtered() {
  const list = view === 'dashboard' ? races.filter(r => favorites.has(r.id)) : scheduled;
  return filterRaces(list, {level,office,state,query});
}
function filterControls() {
  return `<div class="filters" aria-label="Filter election level">${['All','Local','State','Federal'].map(f => `<button class="chip ${level === f ? 'active' : ''}" data-filter="${f}" aria-pressed="${level === f}">${f === 'All' ? 'All elections' : f}</button>`).join('')}</div><div class="filter-fields"><label>Office<select id="office-filter">${officeOptions.map(([value,label]) => `<option value="${value}" ${office === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>State<select id="state-filter"><option value="All">All states</option>${senateStates.map(s => `<option value="${s.code}" ${state === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label></div>`;
}
function renderCards() {
  const shown = filtered();
  const pages = Math.max(1,Math.ceil(shown.length/pageSize));
  page = Math.min(page,pages);
  document.querySelector('#match-count').textContent = `${shown.length} ${shown.length === 1 ? 'election' : 'elections'}${view === 'dashboard' ? ' featured' : ' found'}`;
  document.querySelector('#cards').innerHTML = shown.length ? shown.slice((page-1)*pageSize,page*pageSize).map(card).join('') : `<div class="empty full"><strong>${view === 'dashboard' ? 'No featured elections match these filters.' : 'No matching elections.'}</strong>Try another office, state, or search term. Only elections scheduled for November 3, 2026 are listed.<br><button class="text-button" data-reset>Clear filters</button>${view === 'dashboard' ? '<button class="text-button" data-action="explore">Add elections →</button>' : ''}</div>`;
  document.querySelector('#pagination').innerHTML = pages > 1 ? `<button class="btn" data-page="${page-1}" ${page === 1 ? 'disabled' : ''}>← Previous</button><span>Page ${page} of ${pages} · ${(page-1)*pageSize+1}–${Math.min(page*pageSize,shown.length)} of ${shown.length}</span><button class="btn" data-page="${page+1}" ${page === pages ? 'disabled' : ''}>Next →</button>` : '';
}
function render() {
  const focused = document.activeElement?.id;
  const cursor = focused === 'search' ? document.activeElement.selectionStart : null;
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active',b.dataset.view === view));
  document.querySelector('#nav-count').textContent = favorites.size;
  const heading = view === 'dashboard' ? 'Your election watchlist.' : view === 'explore' ? 'Find your next race.' : 'A clearer view. Every source.';
  main.innerHTML = `<div class="heading"><div><div class="eyebrow">${view === 'dashboard' ? 'LOCAL ROOTS. A BIGGER PICTURE.' : '2026 ELECTION CENTER'}</div><h1>${heading}</h1><p class="subtitle">${view === 'dashboard' ? 'The races you care about. The sources you trust.' : view === 'explore' ? 'Texas districts and every U.S. Senate election on the 2026 ballot.' : 'Official state election offices and independent news coverage.'}</p></div><button class="btn ${view === 'dashboard' ? 'primary' : ''}" data-action="${view === 'dashboard' ? 'explore' : 'dashboard'}">${view === 'dashboard' ? '+ Add elections' : '← My dashboard'}</button></div>
  ${view === 'dashboard' ? `<section class="banner"><div><div class="eyebrow">YOUR GUIDE TO ELECTION NIGHT</div><h2>From the Valley. To the Capitol.</h2><p>Follow Cameron County, every Texas House and congressional district, and all 35 U.S. Senate elections. Build your own election-night view.</p></div><div class="ballot-art" aria-hidden="true">☑</div></section>` : ''}
  ${view === 'explore' ? `<div class="race-shortcuts"><button data-browse="state-house"><strong>150</strong><span>Texas state representatives ↗</span></button><button data-browse="us-house"><strong>38</strong><span>Texas congressional districts ↗</span></button><button data-browse="us-senate"><strong>35</strong><span>U.S. Senate elections ↗</span></button></div><div class="catalog-note">November 3, 2026 · U.S. Senate includes 33 regular elections and the Florida and Ohio special elections. Texas Senate lists only districts on this ballot, including the District 22 special election.</div>` : ''}
  ${view !== 'sources' ? `<div class="section-bar"><h2>${view === 'dashboard' ? 'Featured elections' : 'Explore elections'}</h2><span class="loading">Saved on this device</span></div><input class="search" id="search" type="search" value="${escape(query)}" placeholder="Search a state, office, or district…" aria-label="Search elections">${filterControls()}<div id="match-count" class="match-count" role="status"></div><div id="cards" class="grid"></div><div id="pagination" class="pagination" aria-label="Election pages"></div>` : ''}
  ${view === 'dashboard' ? `<div class="columns"><section><div class="section-bar"><h2>From the sources</h2><button class="text-button" data-refresh ${busy ? 'disabled' : ''}>${busy ? 'Checking…' : '↻ Refresh'}</button></div><div class="panel">${feed()}<p class="subtitle" style="margin-top:16px;font-size:10px">Monitored source links refresh every 60 seconds while this page is open. Retrieval time is not publication time.</p></div></section><section><div class="section-bar"><h2>Your source desk</h2><button class="text-button" data-action="sources">View all ↗</button></div><div class="panel">${sources.slice(0,3).map(sourceRow).join('')}</div><div class="notice"><strong>Know what you’re seeing.</strong><p>This version monitors source pages and links to their reporting. Vote totals are not imported. Election-night returns are unofficial until certified.</p></div></section></div>` : view === 'sources' ? `<div class="section-bar"><h2>Monitored sources</h2><button class="btn" data-refresh ${busy ? 'disabled' : ''}>${busy ? 'Checking…' : '↻ Refresh sources'}</button></div><section class="panel">${sources.filter(s => s.monitor).map(sourceRow).join('')}</section><div class="section-bar"><h2>U.S. Senate · Official state offices & news</h2></div><p class="subtitle">Direct links for every state with a 2026 U.S. Senate election. Select the 2026 election at the source. These links are not automatically retrieved.</p><section class="panel directory">${sources.filter(s => !s.monitor).map(sourceRow).join('')}</section><div class="notice"><strong>Results stay with their source.</strong><p>County, district-wide, and statewide totals cover different voters. Check the election date and geographic scope before comparing. A source link does not mean live totals are connected.</p></div>` : ''}`;
  if (view !== 'sources') renderCards();
  if (focused) { const el = document.getElementById(focused); if (el) { el.focus({preventScroll:true}); if (cursor !== null) el.setSelectionRange(cursor,cursor); } }
}
function detail(id) {
  selected = id;
  const r = races.find(r => r.id === id);
  if (!r) return;
  document.querySelector('#detail-content').innerHTML = `<span class="tag ${r.level}">${r.level} ${r.kind === 'special' ? 'special election' : r.kind === 'collection' ? 'collection' : 'election'}</span><h2>${escape(r.title)}</h2><p class="subtitle">${escape(r.sub)} · November 3, 2026</p>${r.kind === 'special' ? '<div class="notice"><strong>Special election</strong><p>This contest fills an unexpired Senate term. It is separate from a regular election for a new term.</p></div>' : ''}${r.kind === 'collection' && r.office !== 'statewide' ? `<div class="notice"><strong>Follow individual districts</strong><p>Choose the districts you want to add to your featured elections.</p><button class="btn" data-browse="${r.office}">Browse ${r.office === 'state-house' ? 'Texas House' : 'Texas Senate'} districts →</button></div>` : ''}<div class="notice"><strong>View the latest at the original source</strong><p>Live vote totals are not connected to this dashboard yet. Open the ${r.stateName} election source for current counts and choose a newsroom for reporting. Select November 3, 2026 and the correct office${r.district ? ' and District '+r.district : ''} on the source page.</p></div><div class="section-bar"><h2>Results & coverage</h2><button class="btn" data-save="${r.id}">${favorites.has(id) ? '★ Following' : '☆ Follow election'}</button></div>${r.sources.map(id => sources.find(s => s.id === id)).filter(Boolean).map(sourceRow).join('')}<div class="section-bar"><h2>Source page links</h2></div><p class="subtitle">Retrieved links can cover multiple races or previous elections; they are not a race-specific news feed.</p>${feed(r.sources)}`;
  if (!dialog.open) dialog.showModal();
}
function resetFilters() { level='All'; office='All'; state='All'; query=''; page=1; }
function navigate(next) { view=next; resetFilters(); render(); window.scrollTo(0,0); }
function browse(nextOffice) { if(dialog.open) dialog.close(); view='explore'; resetFilters(); office=nextOffice; if(nextOffice !== 'us-senate') state='TX'; render(); }
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.style.display='block'; clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el.style.display='none',2500); }

document.addEventListener('input', e => { if(e.target.id==='search') {query=e.target.value;page=1;renderCards();} });
document.addEventListener('change', e => { if(e.target.id==='office-filter'||e.target.id==='state-filter') { if(e.target.id==='office-filter') office=e.target.value; else state=e.target.value; page=1;renderCards();} });
document.addEventListener('click', e => {
  const b=e.target.closest('button'); if(!b || b.disabled) return;
  if(b.dataset.view || b.dataset.action) navigate(b.dataset.view || b.dataset.action);
  if(b.dataset.filter) {level=b.dataset.filter;page=1;render();}
  if(b.dataset.browse) browse(b.dataset.browse);
  if(b.hasAttribute('data-reset')) {resetFilters();render();}
  if(b.dataset.page) {page=Number(b.dataset.page);renderCards();document.querySelector('#match-count').scrollIntoView({block:'start'});}
  if(b.dataset.save) {const id=b.dataset.save;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('valleyvote-watchlist',JSON.stringify([...favorites]));}catch{toast('Browser storage unavailable; saved for this visit.');}render();if(dialog.open) detail(selected);}
  if(b.dataset.detail) detail(b.dataset.detail);
  if(b.hasAttribute('data-refresh')) refresh();
  if(b.classList.contains('close')) dialog.close();
});
dialog.addEventListener('click', e => {if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
async function refresh() {
  if(busy) return; busy=true; render();
  try {
    const res=await fetch('/api/sources',{signal:AbortSignal.timeout(18000)});
    if(!res.ok) throw Error(); const data=await res.json(); if(!Array.isArray(data)) throw Error();
    sources=sourceDefinitions.map(s=>{const result=data.find(d=>d?.id===s.id);return {...s,status:result?.status|| (s.monitor?'unavailable':'link'),checkedAt:result?.checkedAt,retrievedAt:result?.retrievedAt,items:Array.isArray(result?.items)?result.items.filter(i=>typeof i?.title==='string'&&typeof i?.url==='string'&&/^https?:\/\//i.test(i.url)):[]};});
  } catch { sources=sources.map(s=>s.monitor?{...s,status:'unavailable'}:s); }
  finally {busy=false;render();}
}
render(); refresh(); setInterval(()=>{if(!document.hidden)refresh();},60000);
