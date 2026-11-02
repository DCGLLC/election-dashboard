// 2026 race catalog. Schedule and official source references: ELECTION-SOURCES.md.
export const senateStates = [
  {
    "code": "AL",
    "name": "Alabama",
    "url": "https://www.sos.alabama.gov/alabama-votes",
    "kind": "general"
  },
  {
    "code": "AK",
    "name": "Alaska",
    "url": "https://www.elections.alaska.gov/",
    "kind": "general"
  },
  {
    "code": "AR",
    "name": "Arkansas",
    "url": "https://www.sos.arkansas.gov/elections",
    "kind": "general"
  },
  {
    "code": "CO",
    "name": "Colorado",
    "url": "https://www.sos.state.co.us/pubs/elections/main.html",
    "kind": "general"
  },
  {
    "code": "DE",
    "name": "Delaware",
    "url": "https://elections.delaware.gov/",
    "kind": "general"
  },
  {
    "code": "FL",
    "name": "Florida",
    "url": "https://dos.myflorida.com/elections/",
    "kind": "special"
  },
  {
    "code": "GA",
    "name": "Georgia",
    "url": "https://sos.ga.gov/index.php/elections",
    "kind": "general"
  },
  {
    "code": "ID",
    "name": "Idaho",
    "url": "https://sos.idaho.gov/elections-division/",
    "kind": "general"
  },
  {
    "code": "IL",
    "name": "Illinois",
    "url": "https://www.elections.il.gov/",
    "kind": "general"
  },
  {
    "code": "IA",
    "name": "Iowa",
    "url": "https://sos.iowa.gov/",
    "kind": "general"
  },
  {
    "code": "KS",
    "name": "Kansas",
    "url": "https://www.sos.ks.gov/",
    "kind": "general"
  },
  {
    "code": "KY",
    "name": "Kentucky",
    "url": "https://elect.ky.gov/Pages/default.aspx",
    "kind": "general"
  },
  {
    "code": "LA",
    "name": "Louisiana",
    "url": "https://www.sos.la.gov/elections-voting/",
    "kind": "general"
  },
  {
    "code": "ME",
    "name": "Maine",
    "url": "https://www.maine.gov/sos/cec/elec/index.html",
    "kind": "general"
  },
  {
    "code": "MA",
    "name": "Massachusetts",
    "url": "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm",
    "kind": "general"
  },
  {
    "code": "MI",
    "name": "Michigan",
    "url": "https://www.michigan.gov/sos/0,4670,7-127-1633---,00.html",
    "kind": "general"
  },
  {
    "code": "MN",
    "name": "Minnesota",
    "url": "https://www.sos.state.mn.us/elections-voting/",
    "kind": "general"
  },
  {
    "code": "MS",
    "name": "Mississippi",
    "url": "https://www.sos.ms.gov/index.php/elections-voting",
    "kind": "general"
  },
  {
    "code": "MT",
    "name": "Montana",
    "url": "https://sosmt.gov/elections/",
    "kind": "general"
  },
  {
    "code": "NE",
    "name": "Nebraska",
    "url": "https://sos.nebraska.gov/index",
    "kind": "general"
  },
  {
    "code": "NH",
    "name": "New Hampshire",
    "url": "https://sos.nh.gov/",
    "kind": "general"
  },
  {
    "code": "NJ",
    "name": "New Jersey",
    "url": "https://www.state.nj.us/state/elections/index.shtml",
    "kind": "general"
  },
  {
    "code": "NM",
    "name": "New Mexico",
    "url": "https://www.sos.state.nm.us/",
    "kind": "general"
  },
  {
    "code": "NC",
    "name": "North Carolina",
    "url": "https://www.ncsbe.gov/",
    "kind": "general"
  },
  {
    "code": "OH",
    "name": "Ohio",
    "url": "https://www.ohiosos.gov/elections",
    "kind": "special"
  },
  {
    "code": "OK",
    "name": "Oklahoma",
    "url": "https://oklahoma.gov/elections.html",
    "kind": "general"
  },
  {
    "code": "OR",
    "name": "Oregon",
    "url": "https://sos.oregon.gov/voting-elections/Pages/default.aspx",
    "kind": "general"
  },
  {
    "code": "RI",
    "name": "Rhode Island",
    "url": "https://elections.ri.gov/",
    "kind": "general"
  },
  {
    "code": "SC",
    "name": "South Carolina",
    "url": "https://www.scvotes.gov/",
    "kind": "general"
  },
  {
    "code": "SD",
    "name": "South Dakota",
    "url": "https://sdsos.gov/elections-voting/default.aspx",
    "kind": "general"
  },
  {
    "code": "TN",
    "name": "Tennessee",
    "url": "https://sos.tn.gov/elections",
    "kind": "general"
  },
  {
    "code": "TX",
    "name": "Texas",
    "url": "https://www.sos.state.tx.us/elections/index.shtml",
    "kind": "general"
  },
  {
    "code": "VA",
    "name": "Virginia",
    "url": "https://www.elections.virginia.gov/",
    "kind": "general"
  },
  {
    "code": "WV",
    "name": "West Virginia",
    "url": "https://sos.wv.gov/elections/Pages/default.aspx",
    "kind": "general"
  },
  {
    "code": "WY",
    "name": "Wyoming",
    "url": "https://sos.wyo.gov/Elections/Default.aspx",
    "kind": "general"
  }
];
export const sourceDefinitions = [
  {
    "id": "county",
    "name": "Cameron County Elections",
    "type": "Official",
    "url": "https://www.cameroncountytx.gov/elections/results/",
    "abbr": "CC",
    "monitor": true
  },
  {
    "id": "texas",
    "name": "Texas Secretary of State",
    "type": "Official",
    "url": "https://electionresults.sos.state.tx.us/results.html",
    "abbr": "TX",
    "monitor": true
  },
  {
    "id": "krgv",
    "name": "KRGV · Channel 5",
    "type": "News",
    "url": "https://www.krgv.com/elections",
    "abbr": "5",
    "monitor": true
  },
  {
    "id": "valley",
    "name": "ValleyCentral",
    "type": "News",
    "url": "https://www.valleycentral.com/",
    "abbr": "VC",
    "monitor": true
  },
  {
    "id": "ap",
    "name": "Associated Press · U.S. elections",
    "type": "News",
    "url": "https://apnews.com/projects/elections-2026/",
    "abbr": "AP",
    "monitor": false
  },
  {
    "id": "official-al",
    "name": "Alabama election office",
    "type": "Official",
    "url": "https://www.sos.alabama.gov/alabama-votes",
    "abbr": "AL",
    "monitor": false
  },
  {
    "id": "official-ak",
    "name": "Alaska election office",
    "type": "Official",
    "url": "https://www.elections.alaska.gov/",
    "abbr": "AK",
    "monitor": false
  },
  {
    "id": "official-ar",
    "name": "Arkansas election office",
    "type": "Official",
    "url": "https://www.sos.arkansas.gov/elections",
    "abbr": "AR",
    "monitor": false
  },
  {
    "id": "official-co",
    "name": "Colorado election office",
    "type": "Official",
    "url": "https://www.sos.state.co.us/pubs/elections/main.html",
    "abbr": "CO",
    "monitor": false
  },
  {
    "id": "official-de",
    "name": "Delaware election office",
    "type": "Official",
    "url": "https://elections.delaware.gov/",
    "abbr": "DE",
    "monitor": false
  },
  {
    "id": "official-fl",
    "name": "Florida election office",
    "type": "Official",
    "url": "https://dos.myflorida.com/elections/",
    "abbr": "FL",
    "monitor": false
  },
  {
    "id": "official-ga",
    "name": "Georgia election office",
    "type": "Official",
    "url": "https://sos.ga.gov/index.php/elections",
    "abbr": "GA",
    "monitor": false
  },
  {
    "id": "official-id",
    "name": "Idaho election office",
    "type": "Official",
    "url": "https://sos.idaho.gov/elections-division/",
    "abbr": "ID",
    "monitor": false
  },
  {
    "id": "official-il",
    "name": "Illinois election office",
    "type": "Official",
    "url": "https://www.elections.il.gov/",
    "abbr": "IL",
    "monitor": false
  },
  {
    "id": "official-ia",
    "name": "Iowa election office",
    "type": "Official",
    "url": "https://sos.iowa.gov/",
    "abbr": "IA",
    "monitor": false
  },
  {
    "id": "official-ks",
    "name": "Kansas election office",
    "type": "Official",
    "url": "https://www.sos.ks.gov/",
    "abbr": "KS",
    "monitor": false
  },
  {
    "id": "official-ky",
    "name": "Kentucky election office",
    "type": "Official",
    "url": "https://elect.ky.gov/Pages/default.aspx",
    "abbr": "KY",
    "monitor": false
  },
  {
    "id": "official-la",
    "name": "Louisiana election office",
    "type": "Official",
    "url": "https://www.sos.la.gov/elections-voting/",
    "abbr": "LA",
    "monitor": false
  },
  {
    "id": "official-me",
    "name": "Maine election office",
    "type": "Official",
    "url": "https://www.maine.gov/sos/cec/elec/index.html",
    "abbr": "ME",
    "monitor": false
  },
  {
    "id": "official-ma",
    "name": "Massachusetts election office",
    "type": "Official",
    "url": "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm",
    "abbr": "MA",
    "monitor": false
  },
  {
    "id": "official-mi",
    "name": "Michigan election office",
    "type": "Official",
    "url": "https://www.michigan.gov/sos/0,4670,7-127-1633---,00.html",
    "abbr": "MI",
    "monitor": false
  },
  {
    "id": "official-mn",
    "name": "Minnesota election office",
    "type": "Official",
    "url": "https://www.sos.state.mn.us/elections-voting/",
    "abbr": "MN",
    "monitor": false
  },
  {
    "id": "official-ms",
    "name": "Mississippi election office",
    "type": "Official",
    "url": "https://www.sos.ms.gov/index.php/elections-voting",
    "abbr": "MS",
    "monitor": false
  },
  {
    "id": "official-mt",
    "name": "Montana election office",
    "type": "Official",
    "url": "https://sosmt.gov/elections/",
    "abbr": "MT",
    "monitor": false
  },
  {
    "id": "official-ne",
    "name": "Nebraska election office",
    "type": "Official",
    "url": "https://sos.nebraska.gov/index",
    "abbr": "NE",
    "monitor": false
  },
  {
    "id": "official-nh",
    "name": "New Hampshire election office",
    "type": "Official",
    "url": "https://sos.nh.gov/",
    "abbr": "NH",
    "monitor": false
  },
  {
    "id": "official-nj",
    "name": "New Jersey election office",
    "type": "Official",
    "url": "https://www.state.nj.us/state/elections/index.shtml",
    "abbr": "NJ",
    "monitor": false
  },
  {
    "id": "official-nm",
    "name": "New Mexico election office",
    "type": "Official",
    "url": "https://www.sos.state.nm.us/",
    "abbr": "NM",
    "monitor": false
  },
  {
    "id": "official-nc",
    "name": "North Carolina election office",
    "type": "Official",
    "url": "https://www.ncsbe.gov/",
    "abbr": "NC",
    "monitor": false
  },
  {
    "id": "official-oh",
    "name": "Ohio election office",
    "type": "Official",
    "url": "https://www.ohiosos.gov/elections",
    "abbr": "OH",
    "monitor": false
  },
  {
    "id": "official-ok",
    "name": "Oklahoma election office",
    "type": "Official",
    "url": "https://oklahoma.gov/elections.html",
    "abbr": "OK",
    "monitor": false
  },
  {
    "id": "official-or",
    "name": "Oregon election office",
    "type": "Official",
    "url": "https://sos.oregon.gov/voting-elections/Pages/default.aspx",
    "abbr": "OR",
    "monitor": false
  },
  {
    "id": "official-ri",
    "name": "Rhode Island election office",
    "type": "Official",
    "url": "https://elections.ri.gov/",
    "abbr": "RI",
    "monitor": false
  },
  {
    "id": "official-sc",
    "name": "South Carolina election office",
    "type": "Official",
    "url": "https://www.scvotes.gov/",
    "abbr": "SC",
    "monitor": false
  },
  {
    "id": "official-sd",
    "name": "South Dakota election office",
    "type": "Official",
    "url": "https://sdsos.gov/elections-voting/default.aspx",
    "abbr": "SD",
    "monitor": false
  },
  {
    "id": "official-tn",
    "name": "Tennessee election office",
    "type": "Official",
    "url": "https://sos.tn.gov/elections",
    "abbr": "TN",
    "monitor": false
  },
  {
    "id": "official-va",
    "name": "Virginia election office",
    "type": "Official",
    "url": "https://www.elections.virginia.gov/",
    "abbr": "VA",
    "monitor": false
  },
  {
    "id": "official-wv",
    "name": "West Virginia election office",
    "type": "Official",
    "url": "https://sos.wv.gov/elections/Pages/default.aspx",
    "abbr": "WV",
    "monitor": false
  },
  {
    "id": "official-wy",
    "name": "Wyoming election office",
    "type": "Official",
    "url": "https://sos.wyo.gov/Elections/Default.aspx",
    "abbr": "WY",
    "monitor": false
  }
];
const txSources = ['texas', 'krgv', 'valley'];
export const texasSenateDistricts = [1,2,3,4,5,9,11,13,18,19,21,22,24,26,28,31];
const txRace = (id,title,office,district,extra={}) => ({id,title,office,district,state:'TX',stateName:'Texas',level:office==='us-house'?'Federal':'State',sub:office==='us-house'?'U.S. congressional election · Texas':'State legislative election · Texas',kind:'general',sources:txSources,...extra});
export const races = [
 {id:'county',title:'Cameron County',sub:'County & local election results',level:'Local',state:'TX',stateName:'Texas',office:'local',kind:'general',sources:['county','krgv','valley']},
 {id:'governor',title:'Texas Governor',sub:'Statewide · Texas',level:'State',state:'TX',stateName:'Texas',office:'statewide',kind:'general',sources:txSources},
 ...senateStates.map(s=>({id:s.code==='TX'?'us-senate':'us-senate-'+s.code.toLowerCase(),title:'U.S. Senate · '+s.name,sub:(s.kind==='special'?'Special election · ':'Statewide · ')+s.name,state:s.code,stateName:s.name,level:'Federal',office:'us-senate',kind:s.kind,sources:s.code==='TX'?['texas','krgv','valley','ap']:['official-'+s.code.toLowerCase(),'ap']})),
 ...Array.from({length:150},(_,i)=>txRace('state-house-'+(i+1),'Texas House · District '+(i+1),'state-house',i+1)),
 ...Array.from({length:38},(_,i)=>txRace('house-'+(i+1),'U.S. House · Texas District '+(i+1),'us-house',i+1)),
 ...texasSenateDistricts.map(d=>txRace('state-senate-'+d,'Texas Senate · District '+d,'state-senate',d)),
 txRace('state-senate-22-special','Texas Senate · District 22 (special)','state-senate',22,{kind:'special',sub:'Special election · Unexpired term · Texas'}),
 {id:'state-senate',title:'Texas Senate · All races',sub:'Browse the state senate districts on the 2026 ballot',level:'State',state:'TX',stateName:'Texas',office:'state-senate',kind:'collection',sources:txSources},
 {id:'state-house',title:'Texas House · All races',sub:'Browse all 150 state representative districts',level:'State',state:'TX',stateName:'Texas',office:'state-house',kind:'collection',sources:txSources},
 {id:'statewide',title:'Texas statewide results',sub:'All statewide offices',level:'State',state:'TX',stateName:'Texas',office:'statewide',kind:'collection',sources:txSources}
];
export const officeOptions = [
 ['All','All offices'],['local','County & local'],['statewide','Texas statewide'],['state-house','Texas state representatives'],['state-senate','Texas state senators'],['us-house','U.S. House · Texas'],['us-senate','U.S. Senate · All states']
];
export function filterRaces(list,{level='All',office='All',state='All',query=''}={}) {
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return list.filter(r=>(level==='All'||r.level===level)&&(office==='All'||r.office===office)&&(state==='All'||r.state===state)&&terms.every(t=>
   (r.title+' '+r.sub+' '+r.state+' '+(r.office==='state-house'?'state representative state rep':r.office==='us-house'?'congress congressional representative':r.office==='us-senate'?'us senator federal senator':'')).toLowerCase().includes(t)));
}
export function normalizeFavorites(value) {
 return Array.isArray(value)?[...new Set(value.filter(id=>races.some(r=>r.id===id)))]:[];
}
