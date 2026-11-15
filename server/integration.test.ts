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
  assert.equal(app.stores.demo.state().players.find(p=>p.userId==='demo-27')!.coins,2360);
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
test('one-time local setup authenticates the launcher without putting admin secrets in a URL',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'arena-setup-'));const app=createArenaServer({directory:dir,adminToken:'secret-admin',bridgeToken:'bridge',setupCode:'one-time',setupExpiresAt:Date.now()+60000});
 try{await new Promise<void>(r=>app.server.listen(0,'127.0.0.1',r));const root=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`;
 const redeem=(code:string,origin?:string)=>fetch(root+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({code})});
 assert.equal((await redeem('one-time','https://evil.test')).status,403);assert.equal((await redeem('wrong')).status,401);
 const ok=await redeem('one-time');assert.equal(ok.status,200);assert.equal((await ok.json()).ok,true);assert.match(ok.headers.get('set-cookie')??'',/HttpOnly; SameSite=Strict/);assert.equal((await redeem('one-time')).status,401);
 assert.equal((await fetch(root+'/api/health')).status,200);
 }finally{app.close();rmSync(dir,{recursive:true,force:true})}
});
test('room password does not grant admin access; cookie logout revokes admin commands',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'arena-room-'));const app=createArenaServer({directory:dir,adminToken:'admin',bridgeToken:'bridge'});
 try{await new Promise<void>(r=>app.server.listen(0,'127.0.0.1',r));const root=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`;
 const post=(p:string,d:unknown,headers:Record<string,string>={})=>fetch(root+p,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(d)});
 assert.equal((await post('/api/password',{role:'admin',password:'owner-password'})).status,401);
 await post('/api/password',{role:'admin',password:'owner-password'},{Authorization:'Bearer admin'});
 await post('/api/password',{role:'viewer',password:'room-password'},{Authorization:'Bearer admin'});
 assert.equal((await (await fetch(root+'/api/access')).json()).viewer,false);
 assert.equal((await post('/api/login',{role:'admin',password:'room-password'})).status,401);
 const viewer=await post('/api/login',{role:'viewer',password:'room-password'});const roomCookie=viewer.headers.get('set-cookie')!.split(';')[0];
 assert.equal((await fetch(root+'/api/admin',{headers:{Cookie:roomCookie}})).status,401);
 assert.equal((await post('/api/round',{}, {Cookie:roomCookie})).status,401);
 const owner=await post('/api/login',{role:'admin',password:'owner-password'});const cookie=owner.headers.get('set-cookie')!.split(';')[0];
 assert.match(owner.headers.get('set-cookie')!,/HttpOnly/);assert.equal((await fetch(root+'/api/admin',{headers:{Cookie:cookie}})).status,200);
 await post('/api/logout',{}, {Cookie:cookie});assert.equal((await fetch(root+'/api/admin',{headers:{Cookie:cookie}})).status,401);
 }finally{app.close();rmSync(dir,{recursive:true,force:true})}
});
test('one hundred concurrent HTTP gifts are all journalled exactly once',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'arena-burst-'));const app=createArenaServer({directory:dir,adminToken:'admin',bridgeToken:'bridge'});
 try{await new Promise<void>(r=>app.server.listen(0,'127.0.0.1',r));const root=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`;app.stores.live.setCatalog([{giftId:'fixture',name:'Fixture',coins:1,streak:false}],'fixture');
 const responses=await Promise.all(Array.from({length:100},(_,i)=>fetch(root+'/api/bridge/gift',{method:'POST',headers:{Authorization:'Bearer bridge','Content-Type':'application/json'},body:JSON.stringify({type:'gift',eventId:'burst-'+i,roomId:'r',userId:'user',username:'User',giftId:'fixture',giftName:'Fixture',coins:1,timestamp:Date.now(),repeatCount:1,streak:false})})));
 assert.ok(responses.every(r=>r.status===200));assert.equal(app.stores.live.state().players[0].coins,100);assert.equal(app.stores.live.diagnostics().events,100);
 }finally{app.close();rmSync(dir,{recursive:true,force:true})}
});
