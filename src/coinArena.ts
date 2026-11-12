export const ROUND_MS=600_000;
export const EXTRACTION_MS=30_000;
export const TEA_COINS=50;
export const IMPLANT_COINS=20;
export const IMPLANT_NAMES=['parfüm','perfume'];
export const TEA_NAMES=['çay','tea'];
export const POSITIONS=[7,8,24,23,6,9,25,22,5,10,26,21,4,11,27,20,3,12,28,19,2,13,29,18,1,14,30,17];
export type Player={userId:string;username:string;coins:number;joinedAt:number;lockedUntil:number};
export type CoinArena={version:2;roundId:string;startedAt:number;players:Player[];processedIds:string[];history:string[]};
export type Gift={eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number};
export type GiftResult={state:CoinArena;accepted:boolean;message:string;action:'extract'|'implant'|'score'|'blocked'|'none';targetId:number|null};
export const newCoinArena=(now:number=0):CoinArena=>({version:2,roundId:'round-'+now,startedAt:now,players:[],processedIds:[],history:[]});
export const ranked=(state:CoinArena)=>[...state.players].sort((a,b)=>b.coins-a.coins||a.joinedAt-b.joinedAt||a.userId.localeCompare(b.userId));
export const isLocked=(p:Player,now:number)=>p.lockedUntil>now;
export const timeLeft=(state:CoinArena,now:number)=>Math.max(0,ROUND_MS-(now-state.startedAt));
export const toothOf=(state:CoinArena,userId:string)=>{const rank=ranked(state).findIndex(p=>p.userId===userId);return rank<0||rank>=28?null:POSITIONS[rank]};
export const loadCoinArena=(storage:Pick<Storage,'getItem'>):CoinArena=>{try{const s=JSON.parse(storage.getItem('dis-arena-coin-v2')||'null');if(s?.version===2&&Array.isArray(s.players)&&Array.isArray(s.processedIds)&&Number.isFinite(s.startedAt))return s;}catch{}return newCoinArena();};
export const saveCoinArena=(storage:Pick<Storage,'setItem'>,s:CoinArena)=>{try{storage.setItem('dis-arena-coin-v2',JSON.stringify(s));}catch{}};
export function applyGift(state:CoinArena,gift:Gift):GiftResult{
 const fail=(message:string):GiftResult=>({state,accepted:false,message,action:'none',targetId:null});
 if(!gift.eventId||gift.eventId.length>128||!gift.userId||!gift.username||!Number.isSafeInteger(gift.coins)||gift.coins<=0||!Number.isFinite(gift.timestamp))return fail('Geçersiz hediye');
 if(state.processedIds.includes(gift.eventId))return fail('Tekrarlanan hediye');
 if(state.startedAt>0&&(gift.timestamp<state.startedAt||timeLeft(state,gift.timestamp)===0))return fail('Tur sona erdi');
 const name=gift.giftName.trim().toLocaleLowerCase('tr-TR');
 const tea=TEA_NAMES.includes(name)&&gift.coins===TEA_COINS;
 const implant=IMPLANT_NAMES.includes(name)&&gift.coins===IMPLANT_COINS;
 const startedAt=state.startedAt||gift.timestamp;const players=state.players.map(p=>({...p}));let sender=players.find(p=>p.userId===gift.userId);
 if(!sender){sender={userId:gift.userId,username:gift.username,coins:0,joinedAt:gift.timestamp,lockedUntil:0};players.push(sender);}
 sender.username=gift.username;
 let action:GiftResult['action']='score',targetId:number|null=null;
 let message='';
 if(isLocked(sender,gift.timestamp)){
  if(implant){sender.lockedUntil=0;sender.coins+=gift.coins;action='implant';targetId=toothOf({...state,players},sender.userId);message='🔩 @'+sender.username+' Parfüm ile implant yaptı, +20 jeton';}
  else{action='blocked';message='⛔ @'+sender.username+' çekilmiş durumda: normal hediye puan kazandırmadı';}
 }else{
  sender.coins+=gift.coins;
  if(tea){
   const order=ranked({...state,players});
   const senderIndex=order.findIndex(p=>p.userId===sender!.userId);
   // Anlık sıralamaya göre önündeki oyuncu hedeflenir; lider ikinciyi hedefler.
   const targets=senderIndex===0?order.slice(1):order.slice(0,senderIndex).reverse();
   const target=targets.find(p=>p.lockedUntil<=gift.timestamp);
   if(target){target.lockedUntil=gift.timestamp+EXTRACTION_MS;action='extract';targetId=toothOf({...state,players},target.userId);message='🦷 @'+sender.username+' Çay ile @'+target.username+' dişini 30 sn çekti (+50 jeton)';}
   else message='☕ @'+sender.username+' +50 jeton (çekilebilecek rakip yok)';
  }else message='🪙 @'+sender.username+' +'+gift.coins+' jeton';
 }
 const next={...state,startedAt,players,processedIds:[...state.processedIds,gift.eventId].slice(-10000),history:[message,...state.history].slice(0,12)};
 return {state:next,accepted:true,message,action,targetId};
}
