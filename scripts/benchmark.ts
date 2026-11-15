import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {performance} from 'node:perf_hooks';import {ArenaStore} from '../server/store';
const directory=mkdtempSync(join(tmpdir(),'arena-benchmark-'));const store=new ArenaStore(join(directory,'bench.sqlite'),1000);
try{
 store.setCatalog([{giftId:'fixture',name:'Benchmark fixture',coins:1,streak:true}],'benchmark',1000);
 const times:number[]=[];const start=performance.now();
 for(let i=1;i<=10000;i++){
  const before=performance.now();const r=store.ingest({type:'gift',eventId:'e'+i,roomId:'benchmark',giftId:'fixture',giftName:'Benchmark fixture',userId:'u'+(i%28),username:'User'+(i%28),coins:1,streak:true,streakId:'s'+i,repeatCount:1,timestamp:1000+i},1000+i);
  if(!r.accepted)throw Error(r.message);times.push(performance.now()-before);
 }
 const elapsed=performance.now()-start;times.sort((a,b)=>a-b);
 console.log(JSON.stringify({fixture:'10000 packets / 28 users / disk SQLite WAL synchronous FULL',events:10000,coins:store.state().players.reduce((n,p)=>n+p.coins,0),elapsedMs:Math.round(elapsed),eventsPerSecond:Math.round(10000/elapsed*1000),p50Ms:+times[5000].toFixed(3),p95Ms:+times[9500].toFixed(3),p99Ms:+times[9900].toFixed(3)},null,2));
}finally{store.close();rmSync(directory,{recursive:true,force:true})}
