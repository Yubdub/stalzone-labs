const wait=ms=>new Promise(r=>setTimeout(r,ms));
export class Collector {
 constructor(env=process.env,fetcher=fetch){this.env=env;this.fetcher=fetcher;this.pending=0;this.queue=Promise.resolve();this.pausedUntil=0;this.nextRequest=0;this.cooldownUntil=0;this.base=env.EXBO_BASE||'https://eapi.stalcraft.net';if(!['https://eapi.stalcraft.net','https://eapi.stalzone.com','https://eapi.stalzone.net','https://dapi.stalzone.com'].includes(this.base))throw Error('EXBO_BASE must be an official host');}
 async pace(){const at=Math.max(Date.now(),this.nextRequest,this.cooldownUntil);this.nextRequest=at+Math.max(1000,Number(this.env.REQUEST_DELAY_MS)||1500);await wait(Math.max(0,at-Date.now()));if(this.cooldownUntil>Date.now())await wait(this.cooldownUntil-Date.now());}
 request(path){if(this.pending>=20)return Promise.reject(Error('EXBO queue is busy; try again later'));this.pending++;const result=this.queue.then(()=>this.performRequest(path));this.queue=result.catch(()=>{});return result.finally(()=>this.pending--);}
 async performRequest(path){
  if(Date.now()<this.pausedUntil)throw Error('EXBO requests paused after an upstream limit or access error');
  const headers={Accept:'application/json'};
  if(this.env.EXBO_TOKEN)headers.Authorization='Bearer '+this.env.EXBO_TOKEN;
  else if(this.env.EXBO_CLIENT_ID&&this.env.EXBO_CLIENT_SECRET){headers['Client-Id']=this.env.EXBO_CLIENT_ID;headers['Client-Secret']=this.env.EXBO_CLIENT_SECRET;}
  else throw Error('Live data unavailable: configure approved EXBO credentials');
  for(let attempt=0;attempt<3;attempt++){
   await this.pace();
   let r;try{r=await this.fetcher(this.base+path,{headers,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw Error('EXBO connection failed or timed out');}
   if(r.status===429||r.status===401||r.status===403){const header=r.headers.get('retry-after'),seconds=Number(header);const retry=Number.isFinite(seconds)&&seconds>0?seconds*1000:Math.max(0,Date.parse(header)-Date.now())||0;this.pausedUntil=Date.now()+Math.max(60*60000,retry);this.cooldownUntil=this.pausedUntil;this.onPause?.(this.pausedUntil);throw Error('EXBO requests paused after HTTP '+r.status);}
   if(r.status>=500){if(attempt===2)throw Error('EXBO temporarily unavailable / rate limited');const retry=Number(r.headers.get('retry-after'));const delay=Math.min(60000,Math.max(1000,Number.isFinite(retry)&&retry>0?retry*1000:2000*2**attempt));this.cooldownUntil=Math.max(this.cooldownUntil,Date.now()+delay);await wait(delay);continue;}
   if(!r.ok)throw Error(`EXBO HTTP ${r.status}${[401,403].includes(r.status)?': credentials rejected or access denied':''}`);
   try{return await r.json();}catch{throw Error('EXBO returned invalid JSON');}
  }
 }
 async collect(item,kind,options={}){
  const region=options.region||'NA';if(!['NA','EU','SEA','RU'].includes(region))throw Error('Unknown market region');const rows=[];let complete=false,windowComplete=false,total=0;const cap=Math.max(1,Math.min(100,Number(this.env.MAX_PAGES)||10));
  for(let page=0;page<cap;page++){
   const body=await this.request(`/${region}/auction/${encodeURIComponent(item)}/${kind==='lots'?'lots':'history'}?limit=200&offset=${page*200}&additional=true`);
   const batch=body[kind==='lots'?'lots':'prices'];if(!Array.isArray(batch)||!Number.isInteger(body.total)||body.total<0)throw Error('Unexpected EXBO auction response');
   total=body.total;rows.push(...batch);if(rows.length>=total||batch.length===0){complete=rows.length>=total;break;}if(kind==='sales'&&options.since&&batch.length&&batch.every(r=>Number.isFinite(Date.parse(r.time)))&&Math.min(...batch.map(r=>Date.parse(r.time)))<options.since){windowComplete=true;break;}
  }return {rows,complete,total,windowComplete};
 }
}
