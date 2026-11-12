import {initialTeeth,processEvent,getLeader,type GameEvent,type Tooth} from './engine';

export type ArenaSnapshot={
 version:1;
 roundId:string;
 teeth:Tooth[];
 leaderId:number|null;
 processedIds:string[];
 history:{id:string;user:string;team:string;message:string;blocked:boolean;at:number}[];
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
export function createRound(roundId:string):ArenaSnapshot{
 return {version:1,roundId,teeth:initialTeeth(),leaderId:null,processedIds:[],history:[]};
}
export function ingest(snapshot:ArenaSnapshot,event:GameEvent):IngestResult{
 if(!event.id || !event.user || !Number.isInteger(event.teamId) || !Number.isFinite(event.timestamp)){
  return {accepted:false,message:'Geçersiz olay',snapshot};
 }
 if(!['decay','fracture','heal','decayShield','fractureShield','extract','implant'].includes(event.action))return {accepted:false,message:'Bilinmeyen işlem',snapshot};
 if(roundPhase(snapshot.teeth)==='finished')return {accepted:false,message:'Tur tamamlandı',snapshot};
 if(event.action==='implant'&&roundPhase(snapshot.teeth)==='final')return {accepted:false,message:'Finalde implant kapalı',snapshot};
 if(snapshot.processedIds.includes(event.id))return {accepted:false,message:'Tekrarlanan olay',snapshot};
 const result=processEvent(snapshot.teeth,event,new Set<string>());
 if(result.message==='Geçersiz diş')return {accepted:false,message:result.message,snapshot};
 const lead=getLeader(result.teeth,snapshot.leaderId);
 const next:ArenaSnapshot={
  ...snapshot,teeth:result.teeth,leaderId:lead?.id??null,
  processedIds:[...snapshot.processedIds,event.id].slice(-MAX_IDS),
  history:[{id:event.id,user:event.user.slice(0,80),team:snapshot.teeth[event.teamId].team,message:result.message,blocked:result.blocked,at:event.timestamp},...snapshot.history].slice(0,MAX_HISTORY)
 };
 return {accepted:true,message:result.message,snapshot:next};
}
export function validateSnapshot(input:unknown):input is ArenaSnapshot{
 if(!input || typeof input!=='object')return false;
 const s=input as Partial<ArenaSnapshot>;
 return s.version===1&&typeof s.roundId==='string'&&Array.isArray(s.teeth)&&s.teeth.length===32&&s.teeth.every((t,i)=>t.id===i&&Number.isFinite(t.hp)&&t.hp>=0&&t.hp<=100&&Number.isInteger(t.decayShields)&&t.decayShields>=0&&Number.isInteger(t.fractureShields)&&t.fractureShields>=0&&typeof t.extracted==='boolean'&&Number.isInteger(t.decayHits)&&t.decayHits>=0&&Number.isInteger(t.fractureHits)&&t.fractureHits>=0)&&Array.isArray(s.processedIds)&&Array.isArray(s.history);
}
export function loadSnapshot(storage:{getItem(key:string):string|null},key='dis-arena-snapshot'):ArenaSnapshot|null{
 try{const raw=storage.getItem(key);if(!raw)return null;const parsed:unknown=JSON.parse(raw);return validateSnapshot(parsed)?parsed:null;}catch{return null;}
}
export function saveSnapshot(storage:{setItem(key:string,value:string):void},snapshot:ArenaSnapshot,key='dis-arena-snapshot'):boolean{
 try{storage.setItem(key,JSON.stringify(snapshot));return true;}catch{return false;}
}
