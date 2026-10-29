import assert from 'node:assert/strict';import fs from 'node:fs';import {Collector} from '../collector.mjs';
let calls=0,inflight=0,max=0;const times=[];
const collector=new Collector({EXBO_TOKEN:'test',REQUEST_DELAY_MS:1000},async()=>{calls++;times.push(Date.now());inflight++;max=Math.max(max,inflight);await new Promise(r=>setTimeout(r,15));inflight--;return new Response('{}');});
await Promise.all([collector.request('/test'),collector.request('/test')]);assert.equal(max,1);assert(times[1]-times[0]>=950);
let limitedCalls=0,savedPause=0;const limited=new Collector({EXBO_TOKEN:'test'},async()=>{limitedCalls++;return new Response('',{status:429,headers:{'Retry-After':'7200'}});});limited.onPause=value=>savedPause=value;
const outcomes=await Promise.allSettled([limited.request('/test'),limited.request('/test')]);assert(outcomes.every(x=>x.status==='rejected'));assert.equal(limitedCalls,1);assert(savedPause>=Date.now()+7199000);
const app=fs.readFileSync('public/app.js','utf8');assert(!app.includes("fetch(auctionBase()+'/api/refresh'"));
const server=fs.readFileSync('server.mjs','utf8');assert(server.includes('control.attempts[region]=Date.now();saveControl()'));assert(server.includes('collector.pausedUntil=control.pausedUntil'));
console.log('Market protections passed: serialized requests, minimum spacing, 429 stops queued calls, Retry-After respected, persisted schedule/pause, no browser refresh requests.');
