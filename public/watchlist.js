// Membership operations avoid overwriting another device's whole dashboard.
export class WatchlistSync{
 constructor({repository,storage,validIds,onChange=()=>{},onStatus=()=>{}}){
  Object.assign(this,{repository,storage,onChange,onStatus});this.validIds=new Set(validIds);
  this.userId=undefined;this.ids=new Set();this.pending=new Map();this.epoch=0;this.revision=0;this.reading=null;this.writing=null;this.writeFailed=false;
 }
 clean(ids){return [...new Set((Array.isArray(ids)?ids:[]).filter(id=>this.validIds.has(id)))];}
 read(key,fallback){try{return JSON.parse(this.storage.getItem(key))??fallback;}catch{return fallback;}}
 write(key,value){try{this.storage.setItem(key,JSON.stringify(value));}catch{}}
 cache(){if(this.userId){this.write('valleyvote:watchlist:'+this.userId,[...this.ids]);this.write('valleyvote:pending:'+this.userId,[...this.pending]);}}
 emit(){this.cache();this.onChange([...this.ids]);}
 async connect(userId){
  if(this.userId===userId)return this.refresh();
  this.epoch++;this.revision++;this.userId=userId;this.reading=null;this.writing=null;this.writeFailed=false;
  this.ids=new Set(userId?this.clean(this.read('valleyvote:watchlist:'+userId,[])):[]);
  const stored=userId?this.read('valleyvote:pending:'+userId,[]):[];
  this.pending=new Map((Array.isArray(stored)?stored:[]).filter(v=>Array.isArray(v)&&this.validIds.has(v[0])&&typeof v[1]==='boolean'));
  for(const [id,selected] of this.pending)selected?this.ids.add(id):this.ids.delete(id);
  this.emit();if(!userId){this.onStatus('signed-out');return;}
  this.onStatus('loading');await this.refresh();await this.flush();
 }
 setSelected(id,selected){
  if(!this.userId||!this.validIds.has(id))return false;
  this.revision++;selected?this.ids.add(id):this.ids.delete(id);this.pending.set(id,selected);this.emit();this.onStatus('saving');void this.flush();return true;
 }
 setMany(entries){
  if(!this.userId)return false;
  for(const [id,selected] of entries){if(!this.validIds.has(id)||typeof selected!=='boolean')continue;selected?this.ids.add(id):this.ids.delete(id);this.pending.set(id,selected);}
  this.revision++;this.emit();this.onStatus('saving');void this.flush();return true;
 }
 async flush(){
  if(!this.userId)return;if(this.writing)return this.writing;
  const epoch=this.epoch,userId=this.userId;
  const task=(async()=>{
   while(this.pending.size&&epoch===this.epoch){
    const [id,selected]=this.pending.entries().next().value;
    try{await (selected?this.repository.add(userId,id):this.repository.remove(userId,id));}
    catch{if(epoch===this.epoch){this.writeFailed=true;this.onStatus('offline');}return;}
    if(epoch!==this.epoch)return;
    this.writeFailed=false;this.revision++;if(this.pending.get(id)===selected)this.pending.delete(id);this.cache();
   }
   if(epoch===this.epoch)this.onStatus('synced');
  })();this.writing=task;try{await task;}finally{if(this.writing===task)this.writing=null;}
 }
 async refresh(){
  if(!this.userId)return;if(this.reading)return this.reading;
  const epoch=this.epoch,userId=this.userId,revision=this.revision;
  const task=(async()=>{
   try{
    const ids=await this.repository.list(userId);if(epoch!==this.epoch)return;
    // A response started before a local write must not erase that write.
    if(revision===this.revision){this.ids=new Set(this.clean(ids));for(const [id,selected] of this.pending)selected?this.ids.add(id):this.ids.delete(id);this.emit();}
    this.onStatus(this.pending.size?(this.writeFailed?'offline':'saving'):'synced');
   }catch{if(epoch===this.epoch)this.onStatus('offline');}
  })();this.reading=task;try{await task;}finally{if(this.reading===task)this.reading=null;}
 }
 async sync(){await this.flush();await this.refresh();}
}
