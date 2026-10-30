import fs from 'node:fs';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
const MAX_HISTORY=5000,MAX_LEGACY_ITEM=8*1024*1024;
export function boundedHistory(rows,now=Date.now()){
 const groups=new Map(),cutoff=now-30*86400000;
 for(const row of rows){
  const at=Date.parse(row.time);if(!Number.isFinite(at)||at<cutoff||at>now||typeof row.variant!=='string'||row.variant.length>4096||!(Number(row.unit)>0)||!(Number(row.quantity)>0))continue;
  let cohort;try{const v=JSON.parse(row.variant);cohort=String(v.qlt)+':'+String(v.ptn??0);}catch{continue;}
  if(!groups.has(cohort))groups.set(cohort,[]);
  groups.get(cohort).push({variant:row.variant,quantity:Number(row.quantity),unit:Number(row.unit),time:row.time});
 }
 const cohorts=[...groups.values()].map(rows=>rows.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time)).slice(0,256));
 const selected=[];for(let round=0;round<256&&selected.length<MAX_HISTORY;round++)for(const group of cohorts){if(group[round])selected.push(group[round]);if(selected.length===MAX_HISTORY)break;}
 return selected;
}
function compactItem(item){return{unclassified:Number(item.unclassified)||0,groups:Array.isArray(item.groups)?item.groups.slice(0,128):[],...(item.collectedAt?{collectedAt:item.collectedAt}:{}),complete:!!item.complete};}
export class MarketStore{
 constructor(root){this.root=root;fs.mkdirSync(root,{recursive:true});}
 historyFile(region,id){if(!/^[A-Za-z0-9_-]+$/.test(id)||!['NA','EU','SEA','RU'].includes(region))throw Error('Invalid market key');return path.join(this.root,'history',region,id+'.json.gz');}
 writeHistory(region,id,rows){const file=this.historyFile(region,id);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',gzipSync(JSON.stringify(boundedHistory(rows))));fs.renameSync(file+'.tmp',file);}
 readHistory(region,id){const file=this.historyFile(region,id);try{return boundedHistory(JSON.parse(gunzipSync(fs.readFileSync(file),{maxOutputLength:8*1024*1024}).toString()));}catch{return[];}}
 save(region,market){const file=path.join(this.root,region+'.summary.json');const summary={cacheFormat:2,region,items:Object.fromEntries(Object.entries(market.items).map(([id,item])=>[id,compactItem(item)])),...(market.generatedAt?{generatedAt:market.generatedAt}:{})};fs.writeFileSync(file+'.tmp',JSON.stringify(summary));fs.renameSync(file+'.tmp',file);}
 async load(region,fallback){
  const file=path.join(this.root,region+'.summary.json');
  try{if(fs.statSync(file).size>16*1024*1024)throw Error('Oversized summary');const value=JSON.parse(fs.readFileSync(file));return{...value,region,items:Object.fromEntries(Object.entries(value.items||{}).map(([id,item])=>[id,compactItem(item)]))};}catch{}
  const old=path.join(this.root,region+'.json');let market={region,items:{}};
  if(fs.existsSync(old)){
   console.log('Migrating '+region+' market cache without loading full regional history.');
   try{for await(const {id,item} of legacyItems(old)){if(Array.isArray(item.history))this.writeHistory(region,id,item.history);market.items[id]=compactItem(item);}}
   catch(error){console.warn('Market migration retained completed items: '+error.message);}
   // Keep the original cache untouched for recovery; subsequent boots load only the compact summary.
   const fd=fs.openSync(old,'r');try{const size=fs.fstatSync(fd).size,tail=Buffer.alloc(Math.min(size,16384));fs.readSync(fd,tail,0,tail.length,size-tail.length);const at=tail.toString().match(/"generatedAt"\s*:\s*"([^"]+)"/);if(at)market.generatedAt=at[1];}finally{fs.closeSync(fd);}
  }else if(fallback){const value=JSON.parse(fs.readFileSync(fallback));market={...value,region,items:Object.fromEntries(Object.entries(value.items||{}).map(([id,item])=>[id,compactItem(item)]))};}
  this.save(region,market);return market;
 }
}
// Stream the legacy items object, holding at most one bounded artifact value at a time.
async function* legacyItems(file){
 let mode='seek',seek='',key='',keyEsc=false,id='',depth=0,string=false,escaped=false,parts=[],piece='',length=0,oversize=false;
 for await(const chunk of fs.createReadStream(file,{encoding:'utf8',highWaterMark:65536}))for(const ch of chunk){
  if(mode==='seek'){seek=(seek+ch).slice(-128);if(/"items"\s*:\s*\{$/.test(seek))mode='keyWait';continue;}
  if(mode==='keyWait'){if(ch==='}')return;if(ch==='"'){key='"';keyEsc=false;mode='key';}continue;}
  if(mode==='key'){key+=ch;if(keyEsc){keyEsc=false;continue;}if(ch==='\\'){keyEsc=true;continue;}if(ch==='"'){id=JSON.parse(key);mode='colon';}continue;}
  if(mode==='colon'){if(ch===':')mode='valueWait';continue;}
  if(mode==='valueWait'){if(/\s/.test(ch))continue;if(ch!=='{')throw Error('Unexpected legacy artifact record');mode='value';depth=0;string=false;escaped=false;parts=[];piece='';length=0;oversize=false;}
  if(mode==='value'){
   length++;if(length<=MAX_LEGACY_ITEM){piece+=ch;if(piece.length>=4096){parts.push(Buffer.from(piece,'utf8').toString('utf8'));piece='';}}else oversize=true;
   if(string){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')string=false;}
   else if(ch==='"')string=true;else if(ch==='{'||ch==='[')depth++;else if(ch==='}'||ch===']')depth--;
   if(!depth){
    const text=parts.join('')+piece;let item;
    if(!oversize)item=JSON.parse(text);
    else{const history=text.search(/,\s*"history"\s*:/);if(history>=0){item=JSON.parse(text.slice(0,history)+'}');console.warn('Retained summary for oversized legacy artifact '+id+'; raw source remains on disk.');}}
    parts=[];piece='';mode='keyWait';if(item)yield{id,item};
   }
  }
 }
 if(mode==='value')throw Error('Incomplete legacy cache');
}
