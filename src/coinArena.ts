export const ROUND_MS = 600_000;
export const EXTRACTION_MS = 60_000;
export const DECAY_MS = 30_000;
export const BOUQUET_COINS = 20;
export const IMPLANT_COINS = 20;
export const DECAY_COINS = 10;
export const HEAL_COINS = 10;
export const DOCTOR_CLAIM_COINS = 30;
export const POSITIONS = [7,8,24,23,6,9,25,22,5,10,26,21,4,11,27,20,3,12,28,19,2,13,29,18,1,14,30,17];
export type Procedure = 'extract' | 'implant' | 'decay' | 'heal' | 'claimBad' | 'claimGood' | 'score';
export const PROCEDURE_COINS: Record<Procedure, number> = {extract:20, implant:20, decay:10, heal:10, claimBad:30, claimGood:30, score:0};
export type Player = {userId:string;username:string;coins:number;joinedAt:number;lockedUntil:number;condition?:'extracted'|'decayed'};
export type DoctorOwner = {userId:string;username:string;claimedAt:number;giftName?:string;giftImage?:string;giftCoins?:number};
export type DoctorOwners = {bad?:DoctorOwner;good?:DoctorOwner};
export type CoinArena = {version:2;roundId:string;startedAt:number;players:Player[];doctors:DoctorOwners;processedIds:string[];history:string[];finishedAt?:number;winners?:Player[]};
export type Gift = {eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;procedure?:Procedure;giftImage?:string};
export type GiftResult = {state:CoinArena;accepted:boolean;message:string;action:Procedure|'blocked'|'none';targetId:number|null;targetUserId?:string};
export const newCoinArena = (now:number=0):CoinArena => ({version:2,roundId:'round-'+now,startedAt:now,players:[],doctors:{},processedIds:[],history:[]});
const compareId=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const ranked = (state:CoinArena) => [...state.players].sort((a,b)=>b.coins-a.coins||a.joinedAt-b.joinedAt||compareId(a.userId,b.userId));
export const isLocked = (p:Player,now:number) => p.lockedUntil>now;
export const timeLeft = (state:CoinArena,now:number) => Math.max(0,ROUND_MS-(now-state.startedAt));
export const toothOf = (state:CoinArena,userId:string) => {const rank=ranked(state).findIndex(p=>p.userId===userId);return rank<0||rank>=28?null:POSITIONS[rank]};
export const loadCoinArena = (storage:Pick<Storage,'getItem'>):CoinArena => {try{const s=JSON.parse(storage.getItem('dis-arena-coin-v2')||'null');if(s?.version===2&&Array.isArray(s.players)&&Array.isArray(s.processedIds)&&Number.isFinite(s.startedAt))return {...s,doctors:s.doctors??{}};}catch{}return newCoinArena();};
export const saveCoinArena = (storage:Pick<Storage,'setItem'>,s:CoinArena) => {try{storage.setItem('dis-arena-coin-v2',JSON.stringify(s));}catch{}};
export function finishRound(state:CoinArena,now:number):CoinArena {
 if(state.finishedAt||!state.startedAt||timeLeft(state,now)>0)return state;
 return {...state,finishedAt:state.startedAt+ROUND_MS,winners:ranked(state).slice(0,4).map(p=>({...p}))};
}
export function applyGift(state:CoinArena,gift:Gift):GiftResult {
 const fail=(message:string):GiftResult=>({state,accepted:false,message,action:'none',targetId:null});
 if(!gift.eventId||gift.eventId.length>512||!gift.userId||gift.userId.length>128||!gift.username||gift.username.length>128||!Number.isSafeInteger(gift.coins)||gift.coins<=0||!Number.isSafeInteger(gift.timestamp)||gift.timestamp<=0)return fail('Geçersiz hediye');
 if(state.processedIds.includes(gift.eventId))return fail('Tekrarlanan hediye');
 if(state.finishedAt||(state.startedAt>0&&(gift.timestamp<state.startedAt||timeLeft(state,gift.timestamp)===0)))return fail('Tur sona erdi');
 const existing=state.players.find(p=>p.userId===gift.userId);
 // Live gift procedures are supplied only by the server's verified gift-ID mapping.
 // Unmapped gifts are ordinary score events; names are never used as routing keys.
 const procedure=gift.procedure??'score';
 if(!(procedure in PROCEDURE_COINS)||(procedure!=='score'&&gift.coins!==PROCEDURE_COINS[procedure]))return fail('İşlem jeton değeri uyuşmuyor');
 if(procedure==='claimBad'||procedure==='claimGood'){
  const side=procedure==='claimBad'?'bad':'good',doctors=state.doctors??{};
  const owner={userId:gift.userId,username:gift.username.replace(/^@+/,'').slice(0,40),claimedAt:gift.timestamp,giftName:gift.giftName,giftImage:gift.giftImage??'',giftCoins:gift.coins};
  const message='@'+owner.username+' '+(side==='bad'?'kötü':'iyi')+' hekim koltuğuna oturdu';
  return {state:{...state,startedAt:state.startedAt||gift.timestamp,doctors:{...doctors,[side]:owner},processedIds:[...state.processedIds,gift.eventId],history:[message,...state.history].slice(0,12)},accepted:true,message,action:procedure,targetId:null};
 }
 if(existing&&(!Number.isSafeInteger(existing.coins)||existing.coins+gift.coins>Number.MAX_SAFE_INTEGER))return fail('Jeton sınırı aşıldı');
 const players=state.players.map(p=>({...p}));const order=ranked(state);
 let sender=players.find(p=>p.userId===gift.userId);
 if(!sender){sender={userId:gift.userId,username:gift.username,coins:0,joinedAt:gift.timestamp,lockedUntil:0};players.push(sender);}
 sender.username=gift.username;
 let action:GiftResult['action']='score',targetId:number|null=null,targetUserId:string|undefined;
 let message='';
 if(isLocked(sender,gift.timestamp)){
  const condition=sender.condition??'extracted';
  if((condition==='extracted'&&procedure==='implant')||(condition==='decayed'&&procedure==='heal')){
   sender.lockedUntil=0;delete sender.condition;sender.coins+=gift.coins;action=procedure;targetId=toothOf(state,sender.userId);targetUserId=sender.userId;
   message=`✚ @${sender.username} ${procedure==='heal'?'iyileşti':'implant yaptı'} · +${gift.coins} jeton`;
  }else{action='blocked';message=`⛔ @${sender.username} kilitli · hediye puan kazandırmadı`;}
 }else{
  sender.lockedUntil=0;delete sender.condition;sender.coins+=gift.coins;
  if(procedure==='extract'||procedure==='decay'){
   const index=order.findIndex(p=>p.userId===sender!.userId);
   const target=players.find(p=>p.userId===(index===0?order[1]?.userId:index>0?order[index-1]?.userId:undefined));
   if(target&&!isLocked(target,gift.timestamp)){
    target.lockedUntil=gift.timestamp+(procedure==='extract'?EXTRACTION_MS:DECAY_MS);target.condition=procedure==='extract'?'extracted':'decayed';
    action=procedure;targetId=toothOf(state,target.userId);targetUserId=target.userId;
    message=`🦷 @${sender.username} → @${target.username} · ${procedure==='extract'?'çekim 60':'çürütme 30'} sn · +${gift.coins}`;
   }
  }
  message ||= `🪙 @${sender.username} +${gift.coins} jeton`;
 }
 const next:CoinArena={...state,startedAt:state.startedAt||gift.timestamp,players,processedIds:[...state.processedIds,gift.eventId],history:[message,...state.history].slice(0,12)};
 return {state:next,accepted:true,message,action,targetId,targetUserId};
}
