import {createServer,type IncomingMessage} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {mkdirSync,existsSync,readFileSync,writeFileSync,createReadStream,statSync,unlinkSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {randomBytes,timingSafeEqual,randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ArenaStore,type Receipt} from './store';
import type {Procedure} from '../src/coinArena';
export const validUsername=(s:unknown):s is string=>typeof s==='string'&&/^@?[a-zA-Z0-9_][a-zA-Z0-9_.]{1,23}$/.test(s)&&!s.endsWith('.')&&!s.includes('..');
export const authorized=(provided:unknown,token:string)=>typeof provided==='string'&&Buffer.byteLength(provided)===Buffer.byteLength('Bearer '+token)&&timingSafeEqual(Buffer.from(provided),Buffer.from('Bearer '+token));
export function createArenaServer(options:{directory:string;adminToken:string;bridgeToken:string;port?:number;origins?:string[]}){
 mkdirSync(options.directory,{recursive:true});
 const stores={live:new ArenaStore(join(options.directory,'live.sqlite')),demo:new ArenaStore(join(options.directory,'demo.sqlite'))};
 const wss=new WebSocketServer({noServer:true,maxPayload:1024});
 let child:ChildProcess|undefined,bridge={state:'disconnected',username:'',error:''};
 let pending=0;const MAX_PENDING=128;let skippedVisuals=0;let visuals:{mode:string;receipt:Receipt}[]=[];
 const clients=new Map<WebSocket,'live'|'demo'>();
 const allowed=(req:IncomingMessage)=>!req.headers.origin||(options.origins??['http://localhost:5173','http://127.0.0.1:5173','http://localhost:8787','http://127.0.0.1:8787']).includes(req.headers.origin);
 function snapshot(mode:'live'|'demo'){return {type:'snapshot',mode,state:stores[mode].state(),bridge,skippedVisuals,serverNow:Date.now()}}
 const reply=(res:any,status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 const server=createServer(async(req,res)=>{
  req.setTimeout(15000,()=>req.destroy());
  const url=new URL(req.url??'/','http://localhost');
  const mode=url.searchParams.get('mode')==='demo'?'demo':'live';const store=stores[mode];
  if(!url.pathname.startsWith('/api/')){
   let decoded:string;try{decoded=decodeURIComponent(url.pathname)}catch{reply(res,400,{error:'Geçersiz URL'});return;}
   const path=resolve('dist','.'+decoded);const root=resolve('dist');
   if(!path.startsWith(root+'/')&&path!==root){reply(res,404,{});return;}
   const file=existsSync(path)&&statSync(path).isFile()?path:join(root,'index.html');
   if(!existsSync(file)){reply(res,503,{error:'Önce npm run build çalıştırın'});return;}
   res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'} as Record<string,string>)[extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff'});createReadStream(file).pipe(res);return;
  }
  if(!allowed(req)){reply(res,403,{error:'Origin engellendi'});return;}
  const bridgeRoute=url.pathname.startsWith('/api/bridge/');
  if(!authorized(req.headers.authorization,bridgeRoute?options.bridgeToken:options.adminToken)){reply(res,401,{error:'Yetkisiz'});return;}
  if(pending>=MAX_PENDING){reply(res,503,{error:'Kuyruk dolu; aynı olay kimliğiyle tekrar deneyin'});return;}
  pending++;let size=0;const chunks:Buffer[]=[];
  try{
   for await(const chunk of req){size+=chunk.length;if(size>1_048_576){reply(res,413,{error:'Mesaj çok büyük'});return;}chunks.push(chunk)}
   const body=size?JSON.parse(Buffer.concat(chunks).toString()):{};
   if(req.method==='GET'&&url.pathname==='/api/admin'){reply(res,200,{...snapshot(mode),catalog:store.catalog(),mappings:store.mappings(),diagnostics:store.diagnostics(),rounds:store.rounds(),pending});return;}
   if(req.method!=='POST'){reply(res,405,{});return;}
   if(bridgeRoute){
    if(url.pathname==='/api/bridge/gift'){
     const result=stores.live.ingest(body);if(result.visuals.length){if(visuals.length<500)visuals.push({mode:'live',receipt:result});else skippedVisuals+=result.visuals.length;}
     reply(res,200,result);return;
    }
    if(url.pathname==='/api/bridge/catalog'){stores.live.setCatalog(body.gifts,body.version);reply(res,200,{ok:true});return;}
    if(url.pathname==='/api/bridge/status'){bridge={state:String(body.state).slice(0,60),username:String(body.username??'').slice(0,32),error:String(body.error??'').slice(0,300)};reply(res,200,{ok:true});return;}
    reply(res,404,{});return;
   }
   if(url.pathname==='/api/round'){store.newRound();reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/import'){store.importLegacy(body);reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/mapping'){store.mapGift(String(body.giftId),body.procedure as Procedure);reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/connect'){
    if(!validUsername(body.username)){reply(res,400,{error:'Geçerli TikTok kullanıcı adı gerekli'});return;}
    if(child){reply(res,409,{error:'Önce mevcut köprüyü durdurun'});return;}
    bridge={state:'connecting',username:body.username.replace(/^@/,''),error:''};
    child=spawn(process.env.ARENA_PYTHON??'python3',['scripts/tiktok_live_bridge.py',bridge.username],{env:{...process.env,ARENA_BRIDGE_TOKEN:options.bridgeToken,ARENA_SERVER_URL:`http://127.0.0.1:${options.port??8787}`,ARENA_DATA_DIR:options.directory},stdio:['ignore','pipe','pipe']});
    child.stdout?.on('data',()=>{});child.stderr?.on('data',data=>{bridge.error=String(data).slice(-300)});
    child.once('error',e=>{bridge.state='error';bridge.error=e.message;child=undefined});
    child.once('exit',()=>{bridge.state='disconnected';child=undefined});reply(res,200,{ok:true});return;
   }
   if(url.pathname==='/api/disconnect'){child?.kill('SIGTERM');bridge.state='disconnected';reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/demo'){
    if(mode!=='demo'){reply(res,403,{error:'Testler yalnız demo veritabanına yazılır'});return;}
    const now=Date.now();
    const gifts=[{giftId:'demo-rose',name:'Demo Gül',coins:1,streak:true},{giftId:'demo-extract',name:'Demo Çekim',coins:20,streak:false},{giftId:'demo-implant',name:'Demo İmplant',coins:20,streak:false},{giftId:'demo-decay',name:'Demo Çürütme',coins:10,streak:false},{giftId:'demo-heal',name:'Demo İyileştirme',coins:10,streak:false}];
    store.setCatalog(gifts,'demo-only',now);for(const proc of ['extract','implant','decay','heal'] as Procedure[])store.mapGift('demo-'+proc,proc);
    if(body.action==='finish'){const state=store.state();if(state.startedAt)store.tick(state.startedAt+600000);reply(res,200,{ok:true});return;}
    if(body.action==='populate')store.newRound(now);
    let result:Receipt|undefined;
    const loops=body.action==='populate'?28:body.action==='burst'?100:1;
    for(let i=0;i<loops;i++){
     const procedure=['extract','implant','decay','heal'].includes(body.action)?body.action:'rose';
     const def=gifts.find(g=>g.giftId==='demo-'+procedure)!;
     const resultUser=body.action==='populate'?'demo-'+i:body.userId||'demo-1';
     result=store.ingest({type:'gift',roomId:'demo',eventId:randomUUID(),giftId:def.giftId,giftName:def.name,userId:resultUser,username:body.action==='populate'?'Oyuncu'+(i+1):resultUser,coins:def.coins,timestamp:Date.now(),streak:def.streak,streakId:randomUUID(),repeatCount:body.action==='populate'?2800-i*80:body.action==='rose1000'?1000:1});
     if(result.visuals.length){if(visuals.length<500)visuals.push({mode:'demo',receipt:result});else skippedVisuals+=result.visuals.length;}
    }
    reply(res,200,result);return;
   }
   reply(res,404,{});
  }catch(e){reply(res,400,{error:e instanceof Error?e.message:'İşlem hatası'})}finally{pending--}
 });
 server.on('upgrade',(req,socket,head)=>{
  if(!allowed(req)||clients.size>=64){socket.destroy();return;}
  const url=new URL(req.url??'/','http://localhost');if(url.pathname!=='/arena'){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{
   const mode=url.searchParams.get('mode')==='demo'?'demo':'live';clients.set(ws,mode);ws.send(JSON.stringify(snapshot(mode)));
   ws.on('message',()=>ws.close(1008,'Read only'));ws.on('close',()=>clients.delete(ws));ws.on('error',()=>clients.delete(ws));
  });
 });
 let last='';const timer=setInterval(()=>{
  stores.live.tick();stores.demo.tick();
  const hash=stores.live.digest()+stores.demo.digest()+JSON.stringify(bridge);
  const changed=hash!==last;last=hash;const events=visuals;visuals=[];
  for(const [ws,mode] of clients){
   if(ws.readyState!==WebSocket.OPEN)continue;
   if(ws.bufferedAmount>2_000_000){ws.close(1013,'Slow viewer; reconnect for snapshot');continue;}
   if(changed||events.some(e=>e.mode===mode))ws.send(JSON.stringify({...snapshot(mode),visuals:events.filter(e=>e.mode===mode).flatMap(e=>e.receipt.visuals)}));
  }
 },100);
 return {server,stores,close(){clearInterval(timer);child?.kill('SIGTERM');for(const ws of clients.keys())ws.close();wss.close();server.close();stores.live.close();stores.demo.close()}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directory=resolve(process.env.ARENA_DATA_DIR??'data');mkdirSync(directory,{recursive:true});
 const pidPath=join(directory,'server.pid');
 if(existsSync(pidPath)){
  let running=false;try{process.kill(Number(readFileSync(pidPath,'utf8')),0);running=true}catch{}
  if(running)throw Error('Bu veri dizininde bir arena sunucusu zaten çalışıyor');unlinkSync(pidPath);
 }
 writeFileSync(pidPath,String(process.pid),{flag:'wx',mode:0o600});
 process.on('exit',()=>{try{unlinkSync(pidPath)}catch{}});
 const tokenPath=join(directory,'tokens.json');
 if(!existsSync(tokenPath))writeFileSync(tokenPath,JSON.stringify({admin:randomBytes(32).toString('hex'),bridge:randomBytes(32).toString('hex')}),{mode:0o600});
 const tokens=JSON.parse(readFileSync(tokenPath,'utf8'));const port=Number(process.env.ARENA_PORT??8787);
 const app=createArenaServer({directory,adminToken:process.env.ARENA_ADMIN_TOKEN??tokens.admin,bridgeToken:process.env.ARENA_BRIDGE_TOKEN??tokens.bridge,port,origins:process.env.ARENA_ORIGINS?.split(',')});
 app.server.listen(port,process.env.ARENA_HOST??'127.0.0.1',()=>console.log(`Arena http://127.0.0.1:${port} | Admin anahtarı: ${tokenPath} (admin alanı)`));
 process.on('SIGTERM',()=>{app.close();process.exit(0)});process.on('SIGINT',()=>{app.close();process.exit(0)});
}
