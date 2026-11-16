import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {applyGift,finishRound,newCoinArena,DOCTOR_CLAIM_COINS,PROCEDURE_COINS,type CoinArena,type Procedure,type GiftResult} from '../src/coinArena';
export type CatalogGift={giftId:string;name:string;coins:number;streak:boolean;streakKnown?:boolean;image?:string;region?:string};
export type Packet={type:'gift';eventId:string;roomId:string;giftId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;repeatCount?:number;streak?:boolean;streakId?:string;repeatEnd?:boolean};
export type EngagementPacket={type:'follow'|'like';eventId:string;roomId:string;userId:string;username:string;timestamp:number;count?:number};
export type VisualEvent={id:number;action:'extract'|'implant'|'decay'|'heal';targetId:number;targetUserId:string;user:string;before:CoinArena;after:CoinArena};
export type Receipt={accepted:boolean;duplicate?:boolean;delta:number;message:string;action?:GiftResult['action'];sequence?:number;visuals:VisualEvent[]};
const parse=<T>(v:unknown):T=>JSON.parse(String(v));
const text=(v:unknown,max=128):v is string=>typeof v==='string'&&v.length>0&&v.length<=max;
export class ArenaStore {
 readonly db:DatabaseSync;
 private cachedCatalog?:{version:string;verified:number;gifts:CatalogGift[]};private giftIndex=new Map<string,CatalogGift>();
 constructor(path:string,now=Date.now(),readonly experimental=false){
  this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS rounds(id TEXT PRIMARY KEY,created INTEGER NOT NULL,state TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,round_id TEXT NOT NULL,received INTEGER NOT NULL,raw TEXT NOT NULL,result TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS streaks(id TEXT PRIMARY KEY,count INTEGER NOT NULL,unit INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS legacy_ids(id TEXT PRIMARY KEY);
   CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS catalogs(version TEXT PRIMARY KEY,verified INTEGER NOT NULL,gifts TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS mappings(gift_id TEXT PRIMARY KEY,procedure TEXT UNIQUE NOT NULL);
  `);
  if(!this.db.prepare('SELECT id FROM rounds LIMIT 1').get())this.newRound(now);
 }
 state():CoinArena{return parse(this.db.prepare('SELECT state FROM rounds ORDER BY rowid DESC LIMIT 1').get()!.state)}
 private save(s:CoinArena){this.db.prepare('UPDATE rounds SET state=? WHERE id=?').run(JSON.stringify(s),s.roundId)}
 tick(now=Date.now()){const s=this.state(),next=finishRound(s,now);if(next!==s)this.save(next);return next}
 newRound(now=Date.now()){
  const s=newCoinArena();s.roundId=randomUUID();
  this.db.prepare('INSERT INTO rounds VALUES(?,?,?)').run(s.roundId,now,JSON.stringify(s));return s;
 }
 roundNumber(){return Number(this.db.prepare('SELECT count(*) AS n FROM rounds').get()!.n)}
 graphics(){return String(this.db.prepare("SELECT value FROM settings WHERE key='graphics'").get()?.value??'low')}
 setGraphics(value:string){if(!['low','high'].includes(value))throw Error('Geçersiz grafik kalitesi');this.db.prepare("INSERT INTO settings VALUES('graphics',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(value)}
 rounds(){return this.db.prepare('SELECT id,created,json_extract(state,\'$.finishedAt\') AS finishedAt FROM rounds ORDER BY rowid DESC LIMIT 100').all()}
 catalog(){const r=this.db.prepare("SELECT version,verified FROM catalogs WHERE version=(SELECT value FROM settings WHERE key='catalog-version')").get();
  if(!r)return {version:'unavailable',verified:0,gifts:[] as CatalogGift[]};
  if(this.cachedCatalog?.version===r.version&&this.cachedCatalog.verified===Number(r.verified))return this.cachedCatalog;
  const gifts=parse<CatalogGift[]>(this.db.prepare('SELECT gifts FROM catalogs WHERE version=?').get(String(r.version))!.gifts);
  this.giftIndex=new Map(gifts.map(g=>[g.giftId,g]));return this.cachedCatalog={version:String(r.version),verified:Number(r.verified),gifts};
 }
 publicGifts(){this.catalog();const mapped=this.mappings();const defaults:Record<string,string>={extract:'Bouquet',implant:'Parfüm',claimBad:'Ghostfire',claimGood:'Warm Cocoa'};return Object.fromEntries((['extract','implant','claimBad','claimGood'] as const).map(action=>{const id=String(mapped.find(m=>m.procedure===action)?.gift_id??'');const gift=this.giftIndex.get(id);return [action,gift&&gift.coins===PROCEDURE_COINS[action]?{name:gift.name,coins:gift.coins,giftId:gift.giftId,verified:true}:{name:defaults[action],coins:PROCEDURE_COINS[action],verified:false}]}))}
 setCatalog(gifts:CatalogGift[],version:string,now=Date.now()){
  if(!text(version,128)||!Array.isArray(gifts)||!gifts.length||gifts.length>10000||new Set(gifts.map(g=>g.giftId)).size!==gifts.length||gifts.some(g=>!text(g.giftId)||!text(g.name)||!Number.isSafeInteger(g.coins)||g.coins<1||typeof g.streak!=='boolean'||(g.streakKnown!==undefined&&typeof g.streakKnown!=='boolean')))throw Error('Geçersiz katalog');
  const old=this.db.prepare('SELECT gifts FROM catalogs WHERE version=?').get(version);
  if(old&&String(old.gifts)!==JSON.stringify(gifts))throw Error('Katalog sürümü farklı içerikle tekrar kullanılamaz');
  this.db.prepare('INSERT INTO catalogs VALUES(?,?,?) ON CONFLICT(version) DO UPDATE SET verified=excluded.verified,gifts=excluded.gifts').run(version,now,JSON.stringify(gifts));
  this.db.prepare("INSERT INTO settings VALUES('catalog-version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);
  const auto=[
   {procedure:'extract',matches:gifts.filter(g=>g.name.trim().toLocaleLowerCase('tr-TR')==='bouquet'&&g.coins===20)},
   {procedure:'implant',matches:gifts.filter(g=>['parfüm','parfum','perfume'].includes(g.name.trim().toLocaleLowerCase('tr-TR'))&&g.coins===20)},
   {procedure:'claimBad',matches:gifts.filter(g=>g.name.trim().toLocaleLowerCase('tr-TR')==='ghostfire'&&g.coins===DOCTOR_CLAIM_COINS)},
   {procedure:'claimGood',matches:gifts.filter(g=>g.name.trim().toLocaleLowerCase('tr-TR')==='warm cocoa'&&g.coins===DOCTOR_CLAIM_COINS)}
  ];
  for(const rule of auto){if(rule.matches.length===1)this.db.prepare('INSERT INTO mappings VALUES(?,?) ON CONFLICT(procedure) DO UPDATE SET gift_id=excluded.gift_id').run(rule.matches[0].giftId,rule.procedure);else if(rule.procedure==='claimBad'||rule.procedure==='claimGood')this.db.prepare('DELETE FROM mappings WHERE procedure=?').run(rule.procedure);}
 }
 mappings(){return this.db.prepare('SELECT gift_id,procedure FROM mappings').all()}
 mapGift(id:string,procedure:Procedure){
  if(!this.experimental&&(procedure==='decay'||procedure==='heal'))throw Error('Bu işlem yalnız demo modunda eşleştirilebilir');
  const gift=this.catalog().gifts.find(g=>g.giftId===id);
  if(!gift||!['extract','implant','decay','heal','claimBad','claimGood'].includes(procedure)||gift.coins!==PROCEDURE_COINS[procedure])throw Error('Doğrulanmış hediye ve jeton değeri gerekli');
  if(this.db.prepare('SELECT gift_id FROM mappings WHERE gift_id=? AND procedure<>?').get(id,procedure))throw Error('Her işlem farklı hediye kullanmalı');
  this.db.prepare('INSERT INTO mappings VALUES(?,?) ON CONFLICT(procedure) DO UPDATE SET gift_id=excluded.gift_id').run(id,procedure);
 }
 diagnostics(){return {units:Number(this.db.prepare("SELECT COALESCE(sum(json_extract(result,'$.delta')),0) AS n FROM events WHERE json_extract(result,'$.accepted')=1").get()!.n),events:Number(this.db.prepare('SELECT count(*) AS n FROM events').get()!.n),duplicates:Number(this.db.prepare("SELECT value FROM settings WHERE key='duplicates'").get()?.value??0),invalid:Number(this.db.prepare("SELECT count(*) AS n FROM events WHERE json_extract(result,'$.accepted')=0").get()!.n),recent:this.db.prepare('SELECT seq,received,raw,result FROM events ORDER BY seq DESC LIMIT 10').all().map(r=>({...r,raw:parse(r.raw),result:parse(r.result)}))}}
 engage(value:unknown,now=Date.now()):Receipt {
  const p=value as EngagementPacket;
  const empty=(message:string):Receipt=>({accepted:false,delta:0,message,visuals:[]});
  if(!p||!['follow','like'].includes(p.type)||!text(p.eventId,256)||!text(p.roomId,256)||!text(p.userId,128)||!text(p.username,128)||!Number.isSafeInteger(p.timestamp)||p.timestamp<=0||(p.type==='like'&&(!Number.isSafeInteger(p.count)||Number(p.count)<1||Number(p.count)>10000)))return empty('Geçersiz takip/beğeni olayı');
  const identity=JSON.stringify([p.roomId,p.type,p.eventId]);
  this.db.exec('BEGIN IMMEDIATE');
  try{
   if(this.db.prepare('SELECT seq FROM events WHERE id=?').get(identity)){this.countDuplicate();this.db.exec('COMMIT');return {...empty('Tekrarlanan etkileşim'),duplicate:true};}
   let state=this.tick(now);
   const created=Number(this.db.prepare('SELECT created FROM rounds WHERE id=?').get(state.roundId)!.created);
   if(state.finishedAt||p.timestamp<created||p.timestamp>now+5000){const result=empty(state.finishedAt?'Tur sona erdi':'Etkileşim zamanı geçersiz');this.db.prepare('INSERT INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(identity,state.roundId,now,JSON.stringify(p),JSON.stringify(result));this.db.exec('COMMIT');return result;}
   let claimCount=1;
   if(p.type==='like'){
    const key='likes-progress:'+state.roundId;
    const previous=Number(this.db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value??0);
    const total=previous+Number(p.count);
    claimCount=Math.floor(total/100);
    this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,String(total%100));
   }
   let claimed=0;let message='';
   for(let i=0;i<claimCount;i++){
    if(state.players.some(player=>player.userId===p.userId)){message='@'+p.username+' zaten bir diş sahiplenmiş';break;}
    if(state.players.length>=28){message='28 dişin tamamı sahiplenildi';break;}
    const player={userId:p.userId,username:p.username.replace(/^@+/,'').slice(0,40),coins:0,joinedAt:p.timestamp,lockedUntil:0};
    state={...state,startedAt:state.startedAt||p.timestamp,players:[...state.players,player],history:['🦷 @'+player.username+' bir diş sahiplendi · '+(p.type==='follow'?'TAKİP':'100 BEĞENİ'),...state.history].slice(0,12)};
    claimed++;message='@'+player.username+' bir diş sahiplendi';
   }
   if(!message)message=p.type==='like'?'100 beğeni tamamlandı; diş sahiplenildi':'Takip kaydedildi';
   const result:Receipt={accepted:true,delta:claimed,message,visuals:[]};
   const row=this.db.prepare('INSERT INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(identity,state.roundId,now,JSON.stringify(p),JSON.stringify(result));
   result.sequence=Number(row.lastInsertRowid);this.save(state);this.db.exec('COMMIT');return result;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 ingest(value:unknown,now=Date.now()):Receipt {
  const p=value as Packet;
  const empty=(message:string):Receipt=>({accepted:false,delta:0,message,visuals:[]});
  if(!p||p.type!=='gift'||!text(p.eventId)||!text(p.roomId)||!text(p.userId)||!text(p.username)||!text(p.giftId)||!text(p.giftName)||!Number.isSafeInteger(p.timestamp)||p.timestamp<=0){
   const raw=JSON.stringify(value&&typeof value==='object'?value:{invalid:value??null});const id='invalid:'+createHash('sha256').update(raw).digest('hex');
   const result=empty('Geçersiz olay şeması');
   const inserted=this.db.prepare('INSERT OR IGNORE INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(id,this.state().roundId,now,raw,JSON.stringify(result));
   if(!inserted.changes){this.countDuplicate();return {...result,duplicate:true};}return result;
  }
  const identity=JSON.stringify([p.roomId,p.eventId,p.streak?[p.userId,p.giftId,p.streakId,p.repeatCount??1]:null]);
  this.db.exec('BEGIN IMMEDIATE');
  try{
   if(this.db.prepare('SELECT seq FROM events WHERE id=?').get(identity)||this.db.prepare('SELECT id FROM legacy_ids WHERE id=?').get(p.eventId)){
    this.countDuplicate();this.db.exec('COMMIT');return {...empty('Tekrarlanan olay'),duplicate:true};
   }
   let state=this.tick(now);const before=state;
   let result=empty('Katalog veya seri doğrulanamadı');const catalog=this.catalog();
   const gift=this.giftIndex.get(p.giftId);
   const count=p.repeatCount??1;
   const valid=gift&&gift.coins===p.coins&&(gift.streakKnown===false||gift.streak===(p.streak===true))&&Number.isSafeInteger(count)&&count>0&&count<=100000&&(!p.streak||text(p.streakId))&&(!p.streak?count===1:true);
   const created=Number(this.db.prepare('SELECT created FROM rounds WHERE id=?').get(state.roundId)!.created);
   if(valid&&p.timestamp>=created&&p.timestamp<=now+5000&&!state.finishedAt){
    const key=JSON.stringify([p.roomId,p.userId,p.giftId,p.streakId]);
    const previous=p.streak?this.db.prepare('SELECT count,unit FROM streaks WHERE id=?').get(key):undefined;
    const delta=Math.max(0,count-Number(previous?.count??0));
    const mapped=(this.db.prepare('SELECT procedure FROM mappings WHERE gift_id=?').get(p.giftId)?.procedure??'score') as Procedure;
    const procedure=(!this.experimental&&(mapped==='decay'||mapped==='heal'))||(mapped!=='score'&&gift.coins!==PROCEDURE_COINS[mapped])?'score':mapped;
    if(previous&&Number(previous.unit)!==p.coins)result=empty('Seri birim fiyatı değişti');
    else if((procedure==='claimBad'||procedure==='claimGood')&&previous)result={accepted:true,delta,message:'Sahiplenme hediye serisi zaten işlendi',visuals:[]};
    else if(procedure!=='score'&&delta>1000)result=empty('İşlem serisi 1000 sınırını aştı; olay incelemeye alındı');
    else if(!Number.isSafeInteger(delta*p.coins))result=empty('Jeton taşması');
    else {
     result={accepted:true,delta,message:delta?'İşlendi':'Eski veya tekrarlı seri güncellemesi',visuals:[]};
     const loops=procedure==='score'||procedure==='claimBad'||procedure==='claimGood'?(delta?1:0):delta;
     for(let i=0;i<loops;i++){
      const pre=state;
      const r:GiftResult=applyGift({...state,processedIds:[]},{eventId:p.eventId+':'+i,userId:p.userId,username:p.username,giftName:gift.name,coins:procedure==='score'?delta*p.coins:p.coins,timestamp:now,procedure});
      if(!r.accepted){result=empty(r.message);break;}
      state={...r.state,processedIds:[]};result.message=r.message;result.action=r.action;
      if(['extract','implant','decay','heal'].includes(r.action)&&r.targetId!==null)result.visuals.push({id:0,action:r.action as VisualEvent['action'],targetId:r.targetId,targetUserId:r.targetUserId!,user:p.username,before:pre,after:state});
     }
     if(result.accepted&&p.streak)this.db.prepare('INSERT INTO streaks VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET count=MAX(count,excluded.count)').run(key,count,p.coins);
    }
   }else if(state.finishedAt)result=empty('Tur sona erdi');
   else if(p.timestamp<created)result=empty('Önceki tura ait gecikmiş olay');
   if(!result.accepted)state=before;
   const row=this.db.prepare('INSERT INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(identity,state.roundId,now,JSON.stringify({...p,catalogVersion:catalog.version}),JSON.stringify({...result,visuals:[],beforeCoins:before.players.find(x=>x.userId===p.userId)?.coins??0,afterCoins:state.players.find(x=>x.userId===p.userId)?.coins??0,targets:result.visuals.map(v=>({user:v.targetUserId,tooth:v.targetId,action:v.action}))}));
   result.sequence=Number(row.lastInsertRowid);result.visuals.forEach((v,i)=>v.id=result.sequence!*1000+i);
   this.save(state);this.db.exec('COMMIT');return result;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 private countDuplicate(){this.db.prepare("INSERT INTO settings VALUES('duplicates','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1").run()}
 importLegacy(state:CoinArena,now=Date.now()){
  if(!state||state.version!==2||!Array.isArray(state.players)||!Array.isArray(state.processedIds)||state.processedIds.length>100000||state.processedIds.some(id=>!text(id,512))||state.players.length>10000||state.players.some(p=>!text(p.userId)||!text(p.username)||!Number.isSafeInteger(p.coins)||p.coins<0||!Number.isSafeInteger(p.lockedUntil)||!Number.isSafeInteger(p.joinedAt))||!Number.isSafeInteger(state.startedAt)||!Array.isArray(state.history)||state.history.some(m=>typeof m!=='string')||new Set(state.players.map(p=>p.userId)).size!==state.players.length)throw Error('Geçersiz eski kayıt');
  if(this.state().players.length||this.rounds().length>1)throw Error('İçe aktarma yalnız boş veritabanında yapılabilir');
  this.db.exec('BEGIN IMMEDIATE');try{const imported={...state,roundId:this.state().roundId};this.save(finishRound(imported,now));for(const id of state.processedIds)this.db.prepare('INSERT OR IGNORE INTO legacy_ids VALUES(?)').run(id);this.db.prepare('INSERT INTO settings VALUES(?,?)').run('legacy-import',JSON.stringify(state));this.db.exec('COMMIT')}catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 digest(){return createHash('sha256').update(JSON.stringify(this.state())).digest('hex')}
 close(){this.db.close()}
}
