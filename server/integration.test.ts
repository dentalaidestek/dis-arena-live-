import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createArenaServer} from './server';
import {WebSocket} from 'ws';
test('HTTP authentication, isolated demo, read-only viewer, and recoverable gift delivery',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'arena-http-'));const app=createArenaServer({directory:dir,adminToken:'admin',bridgeToken:'bridge'});
 try{
  await new Promise<void>(r=>app.server.listen(0,'127.0.0.1',r));const address=app.server.address() as {port:number};const root=`http://127.0.0.1:${address.port}`;
  const post=(path:string,body:unknown,token='admin')=>fetch(root+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post('/api/demo?mode=demo',{action:'populate'},'wrong')).status,401);
  assert.equal((await post('/api/demo',{action:'populate'})).status,403);
  assert.equal((await post('/api/connect',{username:''})).status,400);
  assert.equal((await post('/api/demo?mode=demo',{action:'populate'})).status,200);
  assert.equal(app.stores.demo.state().players.length,28);assert.equal(app.stores.live.state().players.length,0);
  await post('/api/demo?mode=demo',{action:'rose1000',userId:'demo-27'});
  assert.equal(app.stores.demo.state().players.find(p=>p.userId==='demo-27')!.coins,1640);
  const ws=new WebSocket(root.replace('http:','ws:')+'/arena?mode=demo');
  const received=await new Promise<any>((resolve,reject)=>{ws.once('message',data=>resolve(JSON.parse(String(data))));ws.once('error',reject)});assert.equal(received.state.players.length,28);
  const closed=new Promise<number>(resolve=>ws.once('close',resolve));ws.send(JSON.stringify({type:'gift',coins:999999}));assert.equal(await closed,1008);
  const cat=[{giftId:'r',name:'Rose',coins:1,streak:true}];await post('/api/bridge/catalog',{version:'v',gifts:cat},'bridge');
  const p={type:'gift',eventId:'provider-one',roomId:'real',giftId:'r',giftName:'Rose',userId:'stable-id',username:'name',coins:1,timestamp:Date.now(),streak:true,streakId:'group',repeatCount:10};
  assert.equal((await post('/api/bridge/gift',p,'admin')).status,401);
  assert.equal((await (await post('/api/bridge/gift',p,'bridge')).json()).delta,10);
  assert.equal((await (await post('/api/bridge/gift',p,'bridge')).json()).duplicate,true);
  assert.equal(app.stores.live.state().players[0].coins,10);
 }finally{app.close();rmSync(dir,{recursive:true,force:true})}
});
