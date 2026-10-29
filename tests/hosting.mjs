import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'stalzone-hosting-'));
process.env.MARKET_CACHE_DIR=folder;process.env.RENDER='true';process.env.RENDER_EXTERNAL_HOSTNAME='stalzone-test.onrender.com';
fs.writeFileSync(path.join(folder,'EU.json'),JSON.stringify({region:'EU',items:{test:{groups:[],history:[{private:true}]}},generatedAt:'2026-10-28T00:00:00Z'}));
const {server}=await import('../server.mjs');await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const request=(url,headers={})=>new Promise((resolve,reject)=>{http.get(base+url,{headers:{Host:'stalzone-test.onrender.com',...headers}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,json:async()=>JSON.parse(text)}));}).on('error',reject);});
try{
 assert.equal((await request('/healthz')).status,200);
 assert.equal((await request('/')).status,200);
 assert.equal((await request('/app.js')).status,200);
 const prices=await (await request('/api/prices?region=EU')).json();assert.equal(prices.market.generatedAt,'2026-10-28T00:00:00Z');assert.equal(prices.market.items.test.history,undefined);
 assert.equal((await request('/api/prices?region=NO')).status,400);
 assert.equal((await request('/healthz',{Host:'unknown.example'})).status,403);
 assert.equal((await request('/healthz',{Origin:'https://evil.example'})).status,403);
 assert.equal((await request('/healthz',{Origin:'https://stalzone-test.onrender.com'})).status,200);
 assert.equal((await request('/.env')).status,404);
 console.log('Hosting checks passed: health, website, Render host/origin, disk cache restore, private history exclusion and invalid request handling.');
}finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(folder,{recursive:true,force:true});}
