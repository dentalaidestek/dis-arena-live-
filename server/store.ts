import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {applyGift,applyToothDamage,finishRound,newCoinArena,ranked,POSITIONS,toothStatesOf,ENGAGEMENT_DAMAGE,PROCEDURE_COINS,type CoinArena,type Procedure,type GiftResult} from '../src/coinArena';
export type CatalogGift={giftId:string;name:string;coins:number;streak:boolean;streakKnown?:boolean;image?:string;region?:string};
export type Packet={type:'gift';eventId:string;roomId:string;giftId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;repeatCount?:number;streak?:boolean;streakId?:string;repeatEnd?:boolean};
export type EngagementPacket={type:'comment'|'follow'|'like';eventId:string;roomId:string;userId:string;username:string;timestamp:number;count?:number;comment?:string};
export type VisualEvent={id:number;action:'extract'|'implant'|'decay'|'heal';targetId:number;targetUserId?:string;user:string;before:CoinArena;after:CoinArena};
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
  this.db.exec("DELETE FROM mappings WHERE procedure IN ('decay','heal','claimBad','claimGood') OR NOT EXISTS (SELECT 1 FROM settings WHERE key='mapping-name:'||mappings.procedure)");
  if(!this.db.prepare('SELECT id FROM rounds LIMIT 1').get())this.newRound(now);
 }
 state():CoinArena{const s=parse<CoinArena>(this.db.prepare('SELECT state FROM rounds ORDER BY rowid DESC LIMIT 1').get()!.state);let changed=false;const used=new Set<number>();for(const p of ranked(s)){if(!Number.isInteger(p.hp)){p.hp=s.teeth?.find(t=>t.toothId===p.toothId)?.hp??(p.condition==='extracted'?0:p.condition==='decayed'?90:100);changed=true;}if(Number.isInteger(p.toothId)&&POSITIONS.includes(p.toothId!)){used.add(p.toothId!);continue;}const id=POSITIONS.find(x=>!used.has(x));if(id!==undefined){p.toothId=id;used.add(id);changed=true;}}const teeth=toothStatesOf(s);if(JSON.stringify(s.teeth??[])!==JSON.stringify(teeth)){s.teeth=teeth;changed=true;}if(!Array.isArray(s.doctorScores)){s.doctorScores=[];s.doctors={};changed=true;}if(!Number.isSafeInteger(s.badPausedUntil)){s.badPausedUntil=0;changed=true;}if(changed)this.save(s);return s}
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
 publicGifts(){this.catalog();const mapped=this.mappings();const actions=['extract','implant','decay','heal'] as const;return Object.fromEntries(actions.map(action=>{const mapping=mapped.find(m=>m.procedure===action);const gift=this.giftIndex.get(String(mapping?.gift_id??''));return [action,gift&&mapping?.display_name&&gift.coins===PROCEDURE_COINS[action]&&/^https:\/\//i.test(gift.image??'')?{name:mapping.display_name,coins:gift.coins,giftId:gift.giftId,image:gift.image??'',verified:true}:{name:'Eşleştirme bekleniyor',coins:PROCEDURE_COINS[action],giftId:'',image:'',verified:false}]}))}
 mappedGift(id:string){const mapping=this.mappings().find(m=>m.gift_id===id);const gift=this.catalog().gifts.find(g=>g.giftId===id);return mapping&&gift&&mapping.display_name&&/^https:\/\//i.test(gift.image??'')?{name:String(mapping.display_name),image:String(gift.image),coins:gift.coins,giftId:id,procedure:mapping.procedure}:undefined}
 setCatalog(gifts:CatalogGift[],version:string,now=Date.now()){
  if(!text(version,128)||!Array.isArray(gifts)||!gifts.length||gifts.length>10000||new Set(gifts.map(g=>g.giftId)).size!==gifts.length||gifts.some(g=>!text(g.giftId)||!text(g.name)||!Number.isSafeInteger(g.coins)||g.coins<1||typeof g.streak!=='boolean'||(g.streakKnown!==undefined&&typeof g.streakKnown!=='boolean')))throw Error('Geçersiz katalog');
  const old=this.db.prepare('SELECT gifts FROM catalogs WHERE version=?').get(version);
  if(old&&String(old.gifts)!==JSON.stringify(gifts))throw Error('Katalog sürümü farklı içerikle tekrar kullanılamaz');
  this.db.prepare('INSERT INTO catalogs VALUES(?,?,?) ON CONFLICT(version) DO UPDATE SET verified=excluded.verified,gifts=excluded.gifts').run(version,now,JSON.stringify(gifts));
  this.db.prepare("INSERT INTO settings VALUES('catalog-version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);
  this.db.exec("DELETE FROM mappings WHERE procedure IN ('decay','heal','claimBad','claimGood')");
  const defaults=[{giftId:'17473',procedure:'extract',coins:20,name:'Buket'},{giftId:'1354581',procedure:'implant',coins:20,name:'Mantar'}] as const;
  for(const item of defaults){const gift=gifts.find(g=>g.giftId===item.giftId&&g.coins===item.coins&&/^https:\/\//i.test(g.image??''));if(!gift||this.db.prepare('SELECT gift_id FROM mappings WHERE procedure=? OR gift_id=?').get(item.procedure,item.giftId))continue;this.db.prepare('INSERT INTO mappings VALUES(?,?)').run(item.giftId,item.procedure);this.db.prepare("INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run('mapping-name:'+item.procedure,item.name);}
  for(const [name,procedure,label] of [['Rose','heal','Gül · İyileştirme'],['TikTok','decay','TikTok · Çürütme']] as const){const gift=gifts.find(g=>g.name.trim().toLowerCase()===name.toLowerCase()&&g.coins===1&&/^https:\/\//i.test(g.image??''));if(gift&&!this.db.prepare('SELECT gift_id FROM mappings WHERE procedure=? OR gift_id=?').get(procedure,gift.giftId)){this.db.prepare('INSERT INTO mappings VALUES(?,?)').run(gift.giftId,procedure);this.db.prepare("INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run('mapping-name:'+procedure,label);}}
 }
 mappings(){return this.db.prepare("SELECT m.gift_id,m.procedure,(SELECT value FROM settings WHERE key='mapping-name:'||m.procedure) AS display_name FROM mappings m").all()}
 mapGift(id:string,procedure:Procedure,displayName:string){
  const gift=this.catalog().gifts.find(g=>g.giftId===id);
  if(!gift||!['extract','implant','decay','heal'].includes(procedure)||gift.coins!==PROCEDURE_COINS[procedure]||!text(displayName,64)||!displayName.trim()||(!this.experimental&&!/^https:\/\//i.test(gift.image??'')))throw Error('Bu işlem için aynı jeton değerinde, TikTok görselli bir hediye ve Türkçe adı gerekli');
  if(this.db.prepare('SELECT gift_id FROM mappings WHERE gift_id=? AND procedure<>?').get(id,procedure))throw Error('Her işlem farklı hediye kullanmalı');
  this.db.prepare('DELETE FROM mappings WHERE procedure=?').run(procedure);
  this.db.prepare('INSERT INTO mappings VALUES(?,?)').run(id,procedure);
  this.db.prepare("INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run('mapping-name:'+procedure,displayName.trim());
 }
 diagnostics(){return {units:Number(this.db.prepare("SELECT COALESCE(sum(json_extract(result,'$.delta')),0) AS n FROM events WHERE json_extract(result,'$.accepted')=1 AND json_extract(raw,'$.type')='gift'").get()!.n),events:Number(this.db.prepare('SELECT count(*) AS n FROM events').get()!.n),engagementEvents:Number(this.db.prepare("SELECT count(*) AS n FROM events WHERE json_extract(raw,'$.type') IN ('comment','follow','like')").get()!.n),claimedTeeth:Number(this.db.prepare("SELECT COALESCE(sum(json_extract(result,'$.delta')),0) AS n FROM events WHERE json_extract(result,'$.accepted')=1 AND json_extract(raw,'$.type') IN ('follow','like')").get()!.n),duplicates:Number(this.db.prepare("SELECT value FROM settings WHERE key='duplicates'").get()?.value??0),invalid:Number(this.db.prepare("SELECT count(*) AS n FROM events WHERE json_extract(result,'$.accepted')=0").get()!.n),recent:this.db.prepare("SELECT seq,received,raw,result FROM events WHERE json_extract(raw,'$.type')='gift' ORDER BY seq DESC LIMIT 10").all().map(r=>({...r,raw:parse(r.raw),result:parse(r.result)}))}}
 engage(value:unknown,now=Date.now()):Receipt {
  const p=value as EngagementPacket;
  const empty=(message:string):Receipt=>({accepted:false,delta:0,message,visuals:[]});
  if(!p||!['comment','follow','like'].includes(p.type)||!text(p.eventId,256)||!text(p.roomId,256)||!text(p.userId,128)||!text(p.username,128)||!Number.isSafeInteger(p.timestamp)||p.timestamp<=0||(p.type==='like'&&(!Number.isSafeInteger(p.count)||Number(p.count)<1||Number(p.count)>10000))||(p.type==='comment'&&!text(p.comment,500)))return empty('Geçersiz yorum/takip/beğeni olayı');
  const identity=JSON.stringify([p.roomId,p.type,p.eventId]);
  this.db.exec('BEGIN IMMEDIATE');
  try{
   if(this.db.prepare('SELECT seq FROM events WHERE id=?').get(identity)){this.countDuplicate();this.db.exec('COMMIT');return {...empty('Tekrarlanan etkileşim'),duplicate:true};}
   let state=this.tick(now);
   const created=Number(this.db.prepare('SELECT created FROM rounds WHERE id=?').get(state.roundId)!.created);
   if(state.finishedAt||p.timestamp<created||p.timestamp>now+5000){const result=empty(state.finishedAt?'Tur sona erdi':'Etkileşim zamanı geçersiz');this.db.prepare('INSERT INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(identity,state.roundId,now,JSON.stringify(p),JSON.stringify(result));this.db.exec('COMMIT');return result;}
   let result:Receipt={accepted:true,delta:0,message:'',visuals:[]};
   if(p.type==='comment'){
    const match=p.comment!.trim().match(/^(\d{1,2})$/),tooth=match?Number(match[1]):0;
    if(!POSITIONS.includes(tooth))result=empty('Yorumuna 1–30 arasındaki geçerli diş numarasını tek başına yaz');
    else{this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('comment-target:'+state.roundId+':'+p.userId,String(tooth));result.message='Diş '+tooth+' hedef olarak kaydedildi';}
   }else{
    const targetRaw=this.db.prepare('SELECT value FROM settings WHERE key=?').get('comment-target:'+state.roundId+':'+p.userId)?.value;
    const target=Number(targetRaw??0);
    if(!POSITIONS.includes(target))result.message='Önce yorum olarak hedef diş numaranı yaz';
    else{
     let hits=0;
     if(p.type==='follow'){
      const key='follow-used:'+state.roundId+':'+p.userId;
      if(this.db.prepare('SELECT value FROM settings WHERE key=?').get(key))result.message='Takip hakkın bu turda kullanıldı';
      else{this.db.prepare('INSERT INTO settings VALUES(?,?)').run(key,'1');hits=1;}
     }else{
      const key='likes-progress:'+state.roundId+':'+p.userId;
      const previous=Number(this.db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value??0);
      const total=previous+Number(p.count);hits=Math.min(100,Math.floor(total/100));
      this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,String(total%100));
     }
     for(let i=0;i<hits;i++){
      if(state.finishedAt)break;
      const before=state,r=applyToothDamage(state,target,ENGAGEMENT_DAMAGE,now);
      if(!r.accepted){result.message=r.message;break;}
      state=r.state;result.delta++;result.action=r.action;result.message=r.message;
      if(r.targetId!==null)result.visuals.push({id:0,action:r.action==='extract'?'extract':'decay',targetId:r.targetId,...(r.targetUserId?{targetUserId:r.targetUserId}:{}),user:p.username,before,after:state});
     }
     if(!hits&&!result.message)result.message=p.type==='like'?'100 beğeniye kalan ilerleme kaydedildi':'Takip işlendi';
    }
   }
   const row=this.db.prepare('INSERT INTO events(id,round_id,received,raw,result) VALUES(?,?,?,?,?)').run(identity,state.roundId,now,JSON.stringify(p),JSON.stringify({...result,visuals:[]}));
   result.sequence=Number(row.lastInsertRowid);result.visuals.forEach((v,i)=>v.id=result.sequence!*1000+i);
   this.save(state);this.db.exec('COMMIT');return result;
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
    const mapping=this.db.prepare('SELECT procedure FROM mappings WHERE gift_id=?').get(p.giftId) as {procedure:Procedure}|undefined;
    const mapped=(mapping?.procedure??'score') as Procedure;
    const procedure=mapped!=='score'&&gift.coins!==PROCEDURE_COINS[mapped]?'score':mapped;
    const displayName=String(this.db.prepare('SELECT value FROM settings WHERE key=?').get('mapping-name:'+procedure)?.value??gift.name);
    if(previous&&Number(previous.unit)!==p.coins)result=empty('Seri birim fiyatı değişti');
    else if((procedure==='claimBad'||procedure==='claimGood')&&previous)result={accepted:true,delta,message:'Sahiplenme hediye serisi zaten işlendi',visuals:[]};
    else if(procedure!=='score'&&delta>1000)result=empty('İşlem serisi 1000 sınırını aştı; olay incelemeye alındı');
    else if(!Number.isSafeInteger(delta*p.coins))result=empty('Jeton taşması');
    else {
     result={accepted:true,delta,message:delta?'İşlendi':'Eski veya tekrarlı seri güncellemesi',visuals:[]};
     const loops=procedure==='score'||procedure==='claimBad'||procedure==='claimGood'?(delta?1:0):delta;let processed=0;
     for(let i=0;i<loops;i++){
      if(state.finishedAt)break;
      const pre=state;
      const r:GiftResult=applyGift({...state,processedIds:[]},{eventId:p.eventId+':'+i,userId:p.userId,username:p.username,giftName:displayName,coins:procedure==='score'?delta*p.coins:p.coins,timestamp:now,procedure,giftImage:gift.image??''});
      if(!r.accepted){result=empty(r.message);break;}
      state={...r.state,processedIds:[]};processed++;result.message=r.message;result.action=r.action;
      if(['extract','implant','decay','heal'].includes(r.action)&&r.targetId!==null)result.visuals.push({id:0,action:r.action as VisualEvent['action'],targetId:r.targetId,...(r.targetUserId?{targetUserId:r.targetUserId}:{}),user:p.username,before:pre,after:state});
     }
     if(result.accepted&&procedure!=='score'&&procedure!=='claimBad'&&procedure!=='claimGood')result.delta=processed;
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
  if(!state||state.version!==2||!Array.isArray(state.players)||!Array.isArray(state.processedIds)||state.processedIds.length>100000||state.processedIds.some(id=>!text(id,512))||state.players.length>10000||state.players.some(p=>!text(p.userId)||!text(p.username)||!Number.isSafeInteger(p.coins)||p.coins<0||!Number.isSafeInteger(p.lockedUntil)||!Number.isSafeInteger(p.joinedAt)||(p.hp!==undefined&&(!Number.isInteger(p.hp)||p.hp<0||p.hp>100)))||!Number.isSafeInteger(state.startedAt)||!Array.isArray(state.history)||state.history.some(m=>typeof m!=='string')||new Set(state.players.map(p=>p.userId)).size!==state.players.length)throw Error('Geçersiz eski kayıt');
  if(this.state().players.length||this.rounds().length>1)throw Error('İçe aktarma yalnız boş veritabanında yapılabilir');
  this.db.exec('BEGIN IMMEDIATE');try{const imported={...state,roundId:this.state().roundId};this.save(finishRound(imported,now));for(const id of state.processedIds)this.db.prepare('INSERT OR IGNORE INTO legacy_ids VALUES(?)').run(id);this.db.prepare('INSERT INTO settings VALUES(?,?)').run('legacy-import',JSON.stringify(state));this.db.exec('COMMIT')}catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 digest(){return createHash('sha256').update(JSON.stringify(this.state())).digest('hex')}
 close(){this.db.close()}
}
