export function primaryReport(data){
  const reports=data?.reports||[];
  return reports.find(r=>r.status==='available'&&r.candidates?.length)||reports.find(r=>r.candidates?.length)||reports[0]||null;
}
export function forecastRange(data,candidateId,metric){
  const bySource=new Map();
  for(const report of data?.forecasts||[]){
    if(report.status!=='available'||!report.sourceId||report.electionDate!=='2026-11-03')continue;
    const c=report.candidates?.find(c=>c.id===candidateId);const v=c?.[metric];
    if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100)bySource.set(report.sourceId,v);
  }
  const values=[...bySource.values()];return values.length?{min:Math.min(...values),max:Math.max(...values),sources:values.length}:null;
}
export function reportingLabel(report){
  const r=report?.reporting;
  if(typeof r?.votesIn==='number')return {value:r.votesIn,label:'votes counted'};
  if(typeof r?.locationsIn==='number')return {value:r.locationsIn,label:'polling locations reporting'};
  if(typeof r?.precinctsIn==='number')return {value:r.precinctsIn,label:'precincts reporting'};
  return {value:null,label:'reporting progress unavailable'};
}
export function reportStatus(report){
  if(!report)return 'No count feed connected';
  if(report.status==='stale')return 'Update delayed · previous counts';
  if(report.status==='unavailable')return 'Count feed temporarily unavailable';
  if(report.status==='not-connected')return 'Count feed not connected';
  if(report.status==='not-covered')return 'No coverage from this feed';
  if(report.status==='awaiting-results')return 'Awaiting official results';
  return report.total>0?'Unofficial count':'Awaiting first votes';
}
