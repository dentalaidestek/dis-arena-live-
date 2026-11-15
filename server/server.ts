import {createServer,type IncomingMessage} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {mkdirSync,existsSync,readFileSync,writeFileSync,createReadStream,statSync,unlinkSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {randomBytes,timingSafeEqual,randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ArenaStore,type Receipt} from './store';
import {timeLeft,type Procedure} from '../src/coinArena';
import {toothLabel} from '../src/routes';
import {runDemo} from './demo';
import {AccessStore,cookieToken,sessionCookie,type Role} from './access';
import {ConsoleMonitor} from './consoleMonitor';
export const validUsername=(s:unknown):s is string=>typeof s==='string'&&/^@?[a-zA-Z0-9_][a-zA-Z0-9_.]{1,23}$/.test(s)&&!s.endsWith('.')&&!s.includes('..');
export const authorized=(provided:unknown,token:string)=>typeof provided==='string'&&Buffer.byteLength(provided)===Buffer.byteLength('Bearer '+token)&&timingSafeEqual(Buffer.from(provided),Buffer.from('Bearer '+token));
export function createArenaServer(options:{directory:string;adminToken:string;bridgeToken:string;port?:number;origins?:string[];setupCode?:string;setupExpiresAt?:number;demoSeed?:boolean;secureCookies?:boolean;consoleLogs?:boolean}){
 mkdirSync(options.directory,{recursive:true});
 const stores={live:new ArenaStore(join(options.directory,'live.sqlite')),demo:new ArenaStore(join(options.directory,'demo.sqlite'),Date.now(),true)};
 if(options.demoSeed&&(!stores.demo.state().players.length||stores.demo.state().finishedAt))runDemo(stores.demo,{action:'populate'});
 const access=new AccessStore(join(options.directory,'access.sqlite'));const monitor=new ConsoleMonitor(options.consoleLogs===true);
 let setupUsed=false;
 const feeds:{live:any[];demo:any[]}={live:[],demo:[]};
 const wss=new WebSocketServer({noServer:true,maxPayload:1024});
 let child:ChildProcess|undefined,bridge={state:'disconnected',username:'',error:''};
 let pending=0;const MAX_PENDING=128;let skippedVisuals=0;let visuals:{mode:string;receipt:Receipt}[]=[];
 const clients=new Map<WebSocket,'live'|'demo'>();const clientRequests=new Map<WebSocket,IncomingMessage>();
 const allowed=(req:IncomingMessage)=>!req.headers.origin||(options.origins??['http://localhost:5173','http://127.0.0.1:5173',`http://localhost:${options.port??8787}`,`http://127.0.0.1:${options.port??8787}`]).includes(req.headers.origin);
 function snapshot(mode:'live'|'demo'){return {type:'snapshot',mode,state:stores[mode].state(),roundNumber:stores[mode].roundNumber(),graphics:stores[mode].graphics(),gifts:stores[mode].publicGifts(),events:feeds[mode],bridge,skippedVisuals,serverNow:Date.now()}}
 function isAdmin(req:IncomingMessage){return authorized(req.headers.authorization,options.adminToken)||access.valid(cookieToken(req.headers.cookie,'admin'),'admin')}
 function mayView(req:IncomingMessage){return !access.configured('viewer')||isAdmin(req)||access.valid(cookieToken(req.headers.cookie,'viewer'),'viewer')}
 function publish(mode:'live'|'demo',result:Receipt|undefined,packet?:any){
  if(!result)return;if(result.visuals.length){if(visuals.length<500)visuals.push({mode,receipt:result});else skippedVisuals+=result.visuals.length;}
  if(result.accepted&&result.delta>0){feeds[mode]=[{id:String(result.sequence),action:result.action,message:result.message,delta:result.delta,...(packet?{user:packet.username,gift:packet.giftName,coins:packet.coins}:{}),targetId:result.visuals[0]?.targetId},...feeds[mode]].slice(0,6);monitor.write((result.action??'GIFT').toUpperCase(),result.message+(result.visuals[0]?' · Diş '+toothLabel(result.visuals[0].targetId):''));if(packet)monitor.write('GIFT',`@${packet.username} — ${packet.giftName} ×${result.delta}`);}
  else if(!result.accepted&&!result.duplicate)monitor.write('ERROR',result.message);
 }

 const reply=(res:any,status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 const server=createServer(async(req,res)=>{
  req.setTimeout(15000,()=>req.destroy());
  const url=new URL(req.url??'/','http://localhost');
  const mode=url.searchParams.get('mode')==='demo'?'demo':'live';const store=stores[mode];
  if(!url.pathname.startsWith('/api/')){
   if(url.pathname==='/'){const mode=url.searchParams.get('mode')==='demo'?'demo':'live';res.writeHead(302,{Location:url.searchParams.get('view')==='obs'?'/obs?mode='+mode:mode==='demo'?'/demo':'/arena'});res.end();return;}

   let decoded:string;try{decoded=decodeURIComponent(url.pathname)}catch{reply(res,400,{error:'Geçersiz URL'});return;}
   const path=resolve('dist','.'+decoded);const root=resolve('dist');
   if(!path.startsWith(root+'/')&&path!==root){reply(res,404,{});return;}
   const file=existsSync(path)&&statSync(path).isFile()?path:join(root,'index.html');
   if(!existsSync(file)){reply(res,503,{error:'Önce npm run build çalıştırın'});return;}
   res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'} as Record<string,string>)[extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff'});createReadStream(file).pipe(res);return;
  }
  if(!allowed(req)){reply(res,403,{error:'Origin engellendi'});return;}
  if(req.method==='GET'&&url.pathname==='/api/health'){reply(res,200,{ready:true});return;}
  if(req.method==='GET'&&url.pathname==='/api/access'){reply(res,200,{adminConfigured:access.configured('admin'),roomProtected:access.configured('viewer'),admin:isAdmin(req),viewer:mayView(req)});return;}
  const setupRoute=req.method==='POST'&&url.pathname==='/api/session';
  const loginRoute=req.method==='POST'&&url.pathname==='/api/login';
  const logoutRoute=req.method==='POST'&&url.pathname==='/api/logout';
  const bridgeRoute=url.pathname.startsWith('/api/bridge/');
  if(!setupRoute&&!loginRoute&&!logoutRoute&&!(bridgeRoute?authorized(req.headers.authorization,options.bridgeToken):isAdmin(req))){reply(res,401,{error:'Yetkisiz'});return;}
  if(pending>=MAX_PENDING){reply(res,503,{error:'Kuyruk dolu; aynı olay kimliğiyle tekrar deneyin'});return;}
  pending++;let size=0;const chunks:Buffer[]=[];
  try{
   for await(const chunk of req){size+=chunk.length;if(size>1_048_576){reply(res,413,{error:'Mesaj çok büyük'});return;}chunks.push(chunk)}
   const body=size?JSON.parse(Buffer.concat(chunks).toString()):{};
   if(setupRoute){
    const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'');
    if(!local||setupUsed||!options.setupCode||Date.now()>(options.setupExpiresAt??0)||!authorized('Bearer '+body.code,options.setupCode)){reply(res,401,{error:'Kurulum kodu geçersiz veya süresi dolmuş; başlatıcıyı yeniden açın'});return;}
    setupUsed=true;res.setHeader('Set-Cookie',sessionCookie('admin',access.issue('admin'),options.secureCookies));reply(res,200,{ok:true});return;
   }
   if(loginRoute){
    const role:Role=body.role==='viewer'?'viewer':'admin';
    try{const session=await access.login(role,body.password,req.socket.remoteAddress??'local');if(!session){reply(res,401,{error:'Şifre yanlış veya bu giriş henüz yapılandırılmadı'});return;}res.setHeader('Set-Cookie',sessionCookie(role,session,options.secureCookies));reply(res,200,{ok:true,role});}catch(e){reply(res,429,{error:e instanceof Error?e.message:'Giriş sınırlandı'});}return;
   }
   if(logoutRoute){for(const role of ['admin','viewer'] as const)access.logout(cookieToken(req.headers.cookie,role));res.setHeader('Set-Cookie',[sessionCookie('admin','',options.secureCookies),sessionCookie('viewer','',options.secureCookies)]);reply(res,200,{ok:true});return;}
   if(req.method==='GET'&&url.pathname==='/api/admin'){reply(res,200,{...snapshot(mode),catalog:store.catalog(),mappings:store.mappings(),diagnostics:store.diagnostics(),rounds:store.rounds(),pending,adminConfigured:access.configured('admin'),roomProtected:access.configured('viewer')});return;}
   if(req.method!=='POST'){reply(res,405,{});return;}
   if(url.pathname==='/api/password'){
    const role:Role=body.role==='viewer'?'viewer':'admin';await access.setPassword(role,body.password);
    if(role==='admin')res.setHeader('Set-Cookie',sessionCookie('admin',access.issue('admin'),options.secureCookies));reply(res,200,{ok:true});return;
   }
   if(url.pathname==='/api/room'&&body.enabled===false){access.db.prepare("DELETE FROM passwords WHERE role='viewer'").run();access.db.prepare("DELETE FROM sessions WHERE role='viewer'").run();reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/graphics'){store.setGraphics(body.quality);reply(res,200,{ok:true});return;}
   if(bridgeRoute){
    if(url.pathname==='/api/bridge/gift'){
     const result=stores.live.ingest(body);publish('live',result,body);
     reply(res,200,result);return;
    }
    if(url.pathname==='/api/bridge/catalog'){stores.live.setCatalog(body.gifts,body.version);last='';reply(res,200,{ok:true});return;}
    if(url.pathname==='/api/bridge/status'){bridge={state:String(body.state).slice(0,60),username:String(body.username??'').slice(0,32),error:String(body.error??'').slice(0,300)};monitor.write(bridge.state==='live-connected'?'LIVE':bridge.state==='connecting'?'RECONNECT':'WARN',bridge.state+' '+bridge.error);reply(res,200,{ok:true});return;}
    reply(res,404,{});return;
   }
   if(url.pathname==='/api/round'){store.newRound();feeds[mode]=[];monitor.write('ROUND','Yeni tur: '+store.roundNumber());reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/import'){store.importLegacy(body);reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/mapping'){store.mapGift(String(body.giftId),body.procedure as Procedure);last='';reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/connect'){
    if(!validUsername(body.username)){reply(res,400,{error:'Geçerli TikTok kullanıcı adı gerekli'});return;}
    if(child){reply(res,409,{error:'Önce mevcut köprüyü durdurun'});return;}
    bridge={state:'connecting',username:body.username.replace(/^@/,''),error:''};
    child=spawn(process.env.ARENA_PYTHON??'python3',['scripts/tiktok_live_bridge.py',bridge.username],{env:{...process.env,ARENA_BRIDGE_TOKEN:options.bridgeToken,ARENA_SERVER_URL:`http://127.0.0.1:${(server.address() as {port:number})?.port??options.port??8787}`,ARENA_DATA_DIR:options.directory},stdio:['ignore','pipe','pipe']});
    child.stdout?.on('data',()=>{});child.stderr?.on('data',data=>{bridge.error=String(data).slice(-300)});
    child.once('error',e=>{bridge.state='error';bridge.error=e.message;child=undefined});
    child.once('exit',()=>{bridge.state='disconnected';child=undefined});reply(res,200,{ok:true});return;
   }
   if(url.pathname==='/api/disconnect'){child?.kill('SIGTERM');bridge.state='disconnected';reply(res,200,{ok:true});return;}
   if(url.pathname==='/api/demo'){
    if(mode!=='demo'){reply(res,403,{error:'Testler yalnız demo veritabanına yazılır'});return;}
    const result=runDemo(store,body);
    publish('demo',result);
    reply(res,200,result??{message:body.action==='finish'?'Demo tur tamamlandı':'Demo hazır'});return;
   }
   reply(res,404,{});
  }catch(e){reply(res,400,{error:e instanceof Error?e.message:'İşlem hatası'})}finally{pending--}
 });
 server.on('upgrade',(req,socket,head)=>{
  if(!allowed(req)||!mayView(req)||clients.size>=64){socket.destroy();return;}
  const url=new URL(req.url??'/','http://localhost');if(url.pathname!=='/arena'){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{
   const mode=url.searchParams.get('mode')==='demo'?'demo':'live';clients.set(ws,mode);clientRequests.set(ws,req);ws.send(JSON.stringify(snapshot(mode)));
   ws.on('message',()=>ws.close(1008,'Read only'));ws.on('close',()=>{clients.delete(ws);clientRequests.delete(ws)});ws.on('error',()=>{clients.delete(ws);clientRequests.delete(ws)});
  });
 });
 let last='',nextReport=Date.now()+30000;const timer=setInterval(()=>{
  if(Date.now()>=nextReport){nextReport=Date.now()+30000;const s=stores.live.state();if(s.startedAt)monitor.write('ROUND',String(stores.live.roundNumber())+' — Kalan '+Math.ceil(timeLeft(s,Date.now())/1000)+' sn');}
  stores.live.tick();stores.demo.tick();
  const hash=stores.live.digest()+stores.demo.digest()+stores.live.graphics()+stores.demo.graphics()+JSON.stringify(bridge);
  const changed=hash!==last;last=hash;const events=visuals;visuals=[];
  for(const [ws,mode] of clients){
   if(ws.readyState!==WebSocket.OPEN)continue;
   if(!mayView(clientRequests.get(ws)!)){ws.close(1008,'Room login required');continue;}
   if(ws.bufferedAmount>2_000_000){ws.close(1013,'Slow viewer; reconnect for snapshot');continue;}
   if(changed||events.some(e=>e.mode===mode))ws.send(JSON.stringify({...snapshot(mode),visuals:events.filter(e=>e.mode===mode).flatMap(e=>e.receipt.visuals)}));
  }
 },100);
 return {server,stores,access,close(){monitor.close();access.close();clearInterval(timer);child?.kill('SIGTERM');for(const ws of clients.keys())ws.close();wss.close();server.close();stores.live.close();stores.demo.close()}};
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
 const openMode=['demo','live'].includes(process.env.ARENA_OPEN_BROWSER??'')?process.env.ARENA_OPEN_BROWSER:undefined;
 const setupCode=randomBytes(18).toString('hex');
 const app=createArenaServer({consoleLogs:true,secureCookies:process.env.ARENA_SECURE_COOKIES==='1',setupCode,setupExpiresAt:Date.now()+120000,demoSeed:process.env.ARENA_DEMO_SEED==='1',directory,adminToken:process.env.ARENA_ADMIN_TOKEN??tokens.admin,bridgeToken:process.env.ARENA_BRIDGE_TOKEN??tokens.bridge,port,origins:process.env.ARENA_ORIGINS?.split(',')});
 app.server.listen(port,process.env.ARENA_HOST??'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}/admin?mode=${openMode??'live'}`;
  console.log(`🦷 Arena hazır: ${url}\nDurdurmak için Ctrl+C`);
  if(setupCode){
   console.log(`Tek kullanımlık kurulum kodu (2 dakika): ${setupCode}`);
   if(openMode&&process.env.PREFIX?.includes('com.termux')&&process.env.ARENA_LAUNCH_NO_OPEN!=='1'){const opener=spawn('termux-open-url',[url+'#setup='+setupCode],{stdio:'ignore'});opener.once('error',()=>console.log('Tarayıcıyı açıp yukarıdaki kurulum kodunu girin'));}
  }else console.log(`Admin anahtarı: ${tokenPath} (admin alanı)`);
 });
 process.on('SIGTERM',()=>{app.close();process.exit(0)});process.on('SIGINT',()=>{app.close();process.exit(0)});
}
