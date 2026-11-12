import {claimTooth,type Ownership,type ClaimResult} from './ownership';
import {initialTeeth,processEvent,getLeader,type GameEvent,type Tooth} from './engine';

export type ArenaSnapshot={
 version:1;
 roundId:string;
 teeth:Tooth[];
 owners:Ownership;
 leaderId:number|null;
 processedIds:string[];
 history:{id:string;user:string;team:string;message:string;blocked:boolean;at:number}[];
 lastEliminationAt:number;
 lastPressureAt:number;
 pressureEnabled:boolean;
};
export function roundPhase(teeth:Tooth[]):'open'|'final'|'finished'{
 const active=teeth.filter(t=>!t.extracted).length;
 return active<=1?'finished':active===2?'final':'open';
}
export function winner(teeth:Tooth[]):Tooth|null{
 return roundPhase(teeth)==='finished'?teeth.find(t=>!t.extracted)??null:null;
}
export type IngestResult={accepted:boolean;message:string;snapshot:ArenaSnapshot};
const MAX_IDS=10000;
const MAX_HISTORY=100;
const MAX_EVENT_ID=128;
const MAX_USER=80;
const ALLOWED_ACTIONS=new Set(['decay','fracture','heal','decayShield','fractureShield','extract','implant']);
export const PRESSURE_DELAY_MS=10*60*1000;
export const PRESSURE_INTERVAL_MS=60*1000;
export const PRESSURE_DAMAGE=2;
export function implantLocked(teeth:Tooth[]):boolean{return teeth.filter(t=>!t.extracted).length<=8;}
export function pressureTick(snapshot:ArenaSnapshot,now:number):ArenaSnapshot{
 if(!snapshot.pressureEnabled||roundPhase(snapshot.teeth)==='finished'||!Number.isFinite(now)||now<snapshot.lastEliminationAt+PRESSURE_DELAY_MS||now<snapshot.lastPressureAt+PRESSURE_INTERVAL_MS)return snapshot;
 const teeth=snapshot.teeth.map(t=>t.extracted? t:{...t,hp:Math.max(0,t.hp-PRESSURE_DAMAGE)});
 const leader=getLeader(teeth,snapshot.leaderId);
 return {...snapshot,teeth,leaderId:leader?.id??null,lastPressureAt:now,history:[{id:'pressure-'+now,user:'SİSTEM',team:'TÜM AKTİF TAKIMLAR',message:'Otomatik baskı −2 HP (çekim yok)',blocked:false,at:now},...snapshot.history].slice(0,MAX_HISTORY)};
}
export function createRound(roundId:string,now=Date.now()):ArenaSnapshot{
 return {version:1,roundId,teeth:initialTeeth(),owners:{},leaderId:null,processedIds:[],history:[],lastEliminationAt:now,lastPressureAt:now,pressureEnabled:true};
}
export function claim(snapshot:ArenaSnapshot,toothId:number,userId:string,username:string,now=Date.now()):{snapshot:ArenaSnapshot}&ClaimResult{
 if(roundPhase(snapshot.teeth)==='finished')return {snapshot,accepted:false,message:'Tur tamamlandı',owners:snapshot.owners,toothId:null};
 const result=claimTooth(snapshot.owners,toothId,userId,username,now,snapshot.teeth[toothId]?.extracted??true);
 if(!result.accepted)return {snapshot,...result};
 return {snapshot:{...snapshot,owners:result.owners,history:[{id:'claim-'+userId+'-'+now,user:'@'+result.owners[toothId].username,team:'DİŞ '+(toothId+1),message:'Diş sahiplenildi',blocked:false,at:now},...snapshot.history].slice(0,MAX_HISTORY)},...result};
}
export function ingest(snapshot:ArenaSnapshot,event:GameEvent):IngestResult{
 if(typeof event.id!=='string'||event.id.length===0||event.id.length>MAX_EVENT_ID||typeof event.user!=='string'||!event.user.trim()||event.user.length>MAX_USER||!Number.isInteger(event.teamId)||event.teamId<0||event.teamId>=32||!Number.isFinite(event.timestamp)||event.timestamp<0){
  return {accepted:false,message:'Geçersiz olay',snapshot};
 }
 if(!ALLOWED_ACTIONS.has(event.action))return {accepted:false,message:'Bilinmeyen işlem',snapshot};
 if(snapshot.processedIds.includes(event.id))return {accepted:false,message:'Tekrarlanan olay',snapshot};
 if(roundPhase(snapshot.teeth)==='finished')return {accepted:false,message:'Tur tamamlandı',snapshot};
 if(event.action==='implant'&&implantLocked(snapshot.teeth))return {accepted:false,message:'Son 8 aşamasında implant kapalı',snapshot};
 const result=processEvent(snapshot.teeth,event,new Set<string>());
 if(result.message==='Geçersiz diş')return {accepted:false,message:result.message,snapshot};
 const lead=getLeader(result.teeth,snapshot.leaderId);
 const eliminated=result.teeth.filter(t=>t.extracted).length>snapshot.teeth.filter(t=>t.extracted).length;
 const next:ArenaSnapshot={
  ...snapshot,teeth:result.teeth,leaderId:lead?.id??null,lastEliminationAt:eliminated?event.timestamp:snapshot.lastEliminationAt,lastPressureAt:eliminated?event.timestamp:snapshot.lastPressureAt,
  processedIds:[...snapshot.processedIds,event.id].slice(-MAX_IDS),
  history:[{id:event.id,user:event.user.slice(0,80),team:snapshot.teeth[event.teamId].team,message:result.message,blocked:result.blocked,at:event.timestamp},...snapshot.history].slice(0,MAX_HISTORY)
 };
 return {accepted:true,message:result.message,snapshot:next};
}
export function validateSnapshot(input:unknown):input is ArenaSnapshot{
 if(!input || typeof input!=='object')return false;
 const s=input as Partial<ArenaSnapshot>;
 return s.version===1&&typeof s.roundId==='string'&&Array.isArray(s.teeth)&&s.teeth.length===32&&s.teeth.every((t,i)=>t.id===i&&Number.isFinite(t.hp)&&t.hp>=0&&t.hp<=100&&Number.isInteger(t.decayShields)&&t.decayShields>=0&&Number.isInteger(t.fractureShields)&&t.fractureShields>=0&&typeof t.team==='string'&&t.team.length>0&&typeof t.extracted==='boolean'&&Number.isInteger(t.decayHits)&&t.decayHits>=0&&Number.isInteger(t.fractureHits)&&t.fractureHits>=0)&&typeof s.owners==='object'&&s.owners!==null&&!Array.isArray(s.owners)&&Object.entries(s.owners).every(([key,owner])=>{const o=owner as {userId?:unknown;username?:unknown;claimedAt?:unknown};return /^(?:[0-9]|[12][0-9]|3[01])$/.test(key)&&typeof o.userId==='string'&&o.userId.length>0&&o.userId.length<=128&&typeof o.username==='string'&&o.username.length>0&&o.username.length<=40&&Number.isFinite(o.claimedAt);})&&new Set(Object.values(s.owners).map(o=>(o as {userId:string}).userId)).size===Object.keys(s.owners).length&&Array.isArray(s.processedIds)&&s.processedIds.length<=MAX_IDS&&s.processedIds.every(x=>typeof x==='string'&&x.length>0&&x.length<=MAX_EVENT_ID)&&Array.isArray(s.history)&&s.history.length<=MAX_HISTORY&&Number.isFinite(s.lastEliminationAt)&&Number.isFinite(s.lastPressureAt)&&typeof s.pressureEnabled==='boolean';
}
export function loadSnapshot(storage:{getItem(key:string):string|null},key='dis-arena-snapshot'):ArenaSnapshot|null{
 try{const raw=storage.getItem(key);if(!raw)return null;const parsed:unknown=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&!('owners' in parsed))return validateSnapshot({...parsed,owners:{}})?{...parsed,owners:{}}:null;return validateSnapshot(parsed)?parsed:null;}catch{return null;}
}
export function saveSnapshot(storage:{setItem(key:string,value:string):void},snapshot:ArenaSnapshot,key='dis-arena-snapshot'):boolean{
 try{storage.setItem(key,JSON.stringify(snapshot));return true;}catch{return false;}
}
