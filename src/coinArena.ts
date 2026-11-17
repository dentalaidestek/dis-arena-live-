export const ROUND_MS = 600_000;
export const EXTRACTION_MS = 60_000;
export const DECAY_MS = 30_000;
export const BOUQUET_COINS = 20;
export const IMPLANT_COINS = 20;
export const DECAY_COINS = 1;
export const HEAL_COINS = 1;
export const DOCTOR_CLAIM_COINS = 30;
export const TOOTH_MAX_HP = 100;
export const DECAY_DAMAGE = 10;
export const ENGAGEMENT_DAMAGE = 30;
export const BAD_DOCTOR_PAUSE_MS = 10_000;
export const POSITIONS = [7,8,24,23,6,9,25,22,5,10,26,21,4,11,27,20,3,12,28,19,2,13,29,18,1,14,30,17];
export type Procedure = 'extract' | 'implant' | 'decay' | 'heal' | 'claimBad' | 'claimGood' | 'score';
export const PROCEDURE_COINS: Record<Procedure, number> = {extract:20, implant:20, decay:1, heal:1, claimBad:30, claimGood:30, score:0};
export type ToothState = {toothId:number;hp:number;condition?:'extracted'|'decayed'};
export type Player = {userId:string;username:string;coins:number;joinedAt:number;lockedUntil:number;toothId?:number;hp?:number;condition?:'extracted'|'decayed'};
export type DoctorOwner = {userId:string;username:string;claimedAt:number;giftName?:string;giftImage?:string;giftCoins?:number;points?:number};
export type DoctorOwners = {bad?:DoctorOwner;good?:DoctorOwner};
export type DoctorScore = {userId:string;username:string;badPoints:number;goodPoints:number;giftName?:string;giftImage?:string;giftCoins?:number;updatedAt:number};
export type CoinArena = {version:2;roundId:string;startedAt:number;players:Player[];teeth?:ToothState[];doctors:DoctorOwners;doctorScores?:DoctorScore[];badPausedUntil?:number;processedIds:string[];history:string[];finishedAt?:number;winners?:Player[]};
export type Gift = {eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;procedure?:Procedure;giftImage?:string};
export type GiftResult = {state:CoinArena;accepted:boolean;message:string;action:Procedure|'blocked'|'none';targetId:number|null;targetUserId?:string};
export const newCoinArena = (now:number=0):CoinArena => ({version:2,roundId:'round-'+now,startedAt:now,players:[],teeth:POSITIONS.map(toothId=>({toothId,hp:TOOTH_MAX_HP})),doctors:{},doctorScores:[],badPausedUntil:0,processedIds:[],history:[]});
const compareId=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const ranked = (state:CoinArena) => [...state.players].sort((a,b)=>b.coins-a.coins||a.joinedAt-b.joinedAt||compareId(a.userId,b.userId));
export const isLocked = (p:Player,now:number) => p.lockedUntil>now;
export const timeLeft = (state:CoinArena,now:number) => Math.max(0,ROUND_MS-(now-state.startedAt));
export const toothOf = (state:CoinArena,userId:string) => {const player=state.players.find(p=>p.userId===userId);if(!player)return null;if(Number.isInteger(player.toothId)&&POSITIONS.includes(player.toothId!))return player.toothId!;const rank=ranked(state).findIndex(p=>p.userId===userId);return rank<0||rank>=28?null:POSITIONS[rank]};
export const hpOf = (player:Player) => Math.max(0,Math.min(TOOTH_MAX_HP,Number.isInteger(player.hp)?Number(player.hp):TOOTH_MAX_HP));
export const toothStatesOf = (state:CoinArena):ToothState[] => POSITIONS.map(toothId=>{const saved=state.teeth?.find(t=>t.toothId===toothId),owner=state.players.find(p=>p.toothId===toothId);const savedHp=Number.isInteger(saved?.hp)?Number(saved!.hp):undefined,ownerHp=Number.isInteger(owner?.hp)?Number(owner!.hp):undefined;const rawHp=savedHp!==undefined&&ownerHp!==undefined?Math.min(savedHp,ownerHp):savedHp??ownerHp??(owner?.condition==='extracted'?0:owner?.condition==='decayed'?90:TOOTH_MAX_HP);const persistedCondition=saved?.condition==='extracted'||owner?.condition==='extracted'?'extracted':saved?.condition==='decayed'||owner?.condition==='decayed'||rawHp<TOOTH_MAX_HP?'decayed':undefined;const condition=persistedCondition==='extracted'||rawHp<=0?'extracted':persistedCondition;const hp=condition==='extracted'?0:Math.max(0,Math.min(TOOTH_MAX_HP,rawHp));return {toothId,hp,...(condition?{condition}:{})};});
export const loadCoinArena = (storage:Pick<Storage,'getItem'>):CoinArena => {try{const s=JSON.parse(storage.getItem('dis-arena-coin-v2')||'null');if(s?.version===2&&Array.isArray(s.players)&&Array.isArray(s.processedIds)&&Number.isFinite(s.startedAt)){const teeth=toothStatesOf(s),players=s.players.map((p:Player)=>{const tooth=teeth.find(t=>t.toothId===p.toothId),next={...p,hp:tooth?.hp??hpOf(p)};if(tooth?.condition)next.condition=tooth.condition;else delete next.condition;return next;});return {...s,teeth,doctors:s.doctors??{},doctorScores:s.doctorScores??[],badPausedUntil:s.badPausedUntil??0,players};}}catch{}return newCoinArena();};
export const saveCoinArena = (storage:Pick<Storage,'setItem'>,s:CoinArena) => {try{storage.setItem('dis-arena-coin-v2',JSON.stringify(s));}catch{}};
const alive=(t:ToothState)=>t.hp>0&&t.condition!=='extracted';
function syncOwner(players:Player[],tooth:ToothState){const owner=players.find(p=>p.toothId===tooth.toothId);if(owner){owner.hp=tooth.hp;if(tooth.condition)owner.condition=tooth.condition;else delete owner.condition;}}
function awardDoctor(state:CoinArena,side:'bad'|'good',gift:Gift):CoinArena{
 const scores=[...(state.doctorScores??[])],i=scores.findIndex(x=>x.userId===gift.userId);
 const prior=i>=0?scores[i]:{userId:gift.userId,username:gift.username.replace(/^@+/,'').slice(0,40),badPoints:0,goodPoints:0,updatedAt:gift.timestamp};
 const next={...prior,username:gift.username.replace(/^@+/,'').slice(0,40),badPoints:prior.badPoints+(side==='bad'?1:0),goodPoints:prior.goodPoints+(side==='good'?1:0),giftName:gift.giftName,giftImage:gift.giftImage??'',giftCoins:gift.coins,updatedAt:gift.timestamp};
 if(i>=0)scores[i]=next;else scores.push(next);
 const key=side==='bad'?'badPoints':'goodPoints';
 const leader=scores.filter(x=>x[key]>0).sort((a,b)=>b[key]-a[key]||a.updatedAt-b.updatedAt||compareId(a.userId,b.userId))[0];
 const doctors={...(state.doctors??{})};
 if(leader)doctors[side]={userId:leader.userId,username:leader.username,claimedAt:leader.updatedAt,giftName:leader.giftName,giftImage:leader.giftImage,giftCoins:leader.giftCoins,points:leader[key]};
 return {...state,doctorScores:scores,doctors};
}
function mutableTeeth(state:CoinArena){const teeth=state.teeth??toothStatesOf(state);for(const tooth of teeth){const owner=state.players.find(p=>p.toothId===tooth.toothId);if(!owner)continue;const ownerHp=hpOf(owner);if(owner.condition==='extracted'||tooth.condition==='extracted'||ownerHp<=0||tooth.hp<=0){tooth.hp=0;tooth.condition='extracted';owner.hp=0;owner.condition='extracted';continue;}tooth.hp=Math.min(tooth.hp,ownerHp);if(tooth.hp<TOOTH_MAX_HP||owner.condition==='decayed'||tooth.condition==='decayed')tooth.condition='decayed';else delete tooth.condition;if(ownerHp>tooth.hp)owner.hp=tooth.hp;}return teeth;}
function weakest(state:CoinArena){return mutableTeeth(state).filter(alive).sort((a,b)=>a.hp-b.hp||POSITIONS.indexOf(a.toothId)-POSITIONS.indexOf(b.toothId))[0];}
function extracted(state:CoinArena){return mutableTeeth(state).filter(t=>!alive(t)).sort((a,b)=>POSITIONS.indexOf(a.toothId)-POSITIONS.indexOf(b.toothId))[0];}
export function finishRound(state:CoinArena,now:number):CoinArena {
 if(state.finishedAt)return state;
 const allTeethGone=toothStatesOf(state).every(t=>!alive(t));
 if(!allTeethGone&&(!state.startedAt||timeLeft(state,now)>0))return state;
 return {...state,finishedAt:allTeethGone?now:state.startedAt+ROUND_MS,winners:ranked(state).slice(0,4).map(p=>({...p}))};
}
export function applyToothDamage(state:CoinArena,toothId:number,damage:number,now:number):GiftResult{
 const fail=(message:string):GiftResult=>({state,accepted:false,message,action:'none',targetId:null});
 if(!POSITIONS.includes(toothId)||!Number.isSafeInteger(damage)||damage<1||damage>100)return fail('Geçersiz diş numarası veya hasar');
 const teeth=toothStatesOf(state),target=teeth.find(t=>t.toothId===toothId);
 if(!target||!alive(target))return fail('Bu diş zaten çekilmiş');
 const before=target.hp;target.hp=Math.max(0,before-damage);
 const action:GiftResult['action']=target.hp===0?'extract':'decay';
 if(target.hp===0)target.condition='extracted';else target.condition='decayed';
 const players=state.players.map(p=>({...p,hp:hpOf(p)}));syncOwner(players,target);
 const message=target.hp===0?'🦷 '+toothId+' numaralı diş 0 HP oldu ve çekildi':'☣ '+toothId+' numaralı diş '+before+' → '+target.hp+' HP · -'+damage;
 const next={...state,players,teeth,history:[message,...state.history].slice(0,12)};
 return {state:finishRound(next,now),accepted:true,message,action,targetId:toothId,...(players.find(p=>p.toothId===toothId)?{targetUserId:players.find(p=>p.toothId===toothId)!.userId}:{})};
}
export function applyGift(state:CoinArena,gift:Gift):GiftResult {
 const fail=(message:string):GiftResult=>({state,accepted:false,message,action:'none',targetId:null});
 if(!gift.eventId||gift.eventId.length>512||!gift.userId||gift.userId.length>128||!gift.username||gift.username.length>128||!Number.isSafeInteger(gift.coins)||gift.coins<=0||!Number.isSafeInteger(gift.timestamp)||gift.timestamp<=0)return fail('Geçersiz hediye');
 if(state.processedIds.includes(gift.eventId))return fail('Tekrarlanan hediye');
 if(state.finishedAt||(state.startedAt>0&&(gift.timestamp<state.startedAt||timeLeft(state,gift.timestamp)===0)))return fail('Tur sona erdi');
 const procedure=gift.procedure??'score';
 if(!(procedure in PROCEDURE_COINS)||(procedure!=='score'&&gift.coins!==PROCEDURE_COINS[procedure]))return fail('İşlem jeton değeri uyuşmuyor');
 if(procedure==='claimBad'||procedure==='claimGood'){
  const side=procedure==='claimBad'?'bad':'good',doctors=state.doctors??{};
  const owner={userId:gift.userId,username:gift.username.replace(/^@+/,'').slice(0,40),claimedAt:gift.timestamp,giftName:gift.giftName,giftImage:gift.giftImage??'',giftCoins:gift.coins};
  const message='@'+owner.username+' '+(side==='bad'?'kötü':'iyi')+' hekim koltuğuna oturdu';
  return {state:{...state,doctors:{...doctors,[side]:owner},processedIds:[...state.processedIds,gift.eventId],history:[message,...state.history].slice(0,12)},accepted:true,message,action:procedure,targetId:null};
 }
 const players=state.players.map(p=>({...p,hp:hpOf(p)})),teeth=toothStatesOf(state);
 let sender=players.find(p=>p.userId===gift.userId);
 if(!sender){
  if(players.length>=28)return fail('28 diş dolu; yeni katılımcı alınamaz');
  const used=new Set(players.map(p=>p.toothId).filter((id):id is number=>Number.isInteger(id)));
  const available=new Set(teeth.filter(alive).map(t=>t.toothId));
  const toothId=POSITIONS.find(id=>!used.has(id)&&available.has(id));
  if(toothId===undefined)return fail('Boş ve canlı diş kalmadı');
  sender={userId:gift.userId,username:gift.username,coins:0,joinedAt:gift.timestamp,lockedUntil:0,toothId,hp:TOOTH_MAX_HP};players.push(sender);
 }
 if(!Number.isSafeInteger(sender.coins)||sender.coins+gift.coins>Number.MAX_SAFE_INTEGER)return fail('Jeton sınırı aşıldı');
 sender.username=gift.username;sender.coins+=gift.coins;
 let action:GiftResult['action']='score',targetId:number|null=null,targetUserId:string|undefined,message='';
 const nextBase:CoinArena={...state,players,teeth,startedAt:state.startedAt||gift.timestamp,processedIds:[...state.processedIds,gift.eventId]};
 const setTarget=(tooth:ToothState,kind:'extract'|'implant'|'decay'|'heal')=>{syncOwner(players,tooth);targetId=tooth.toothId;targetUserId=players.find(p=>p.toothId===tooth.toothId)?.userId;action=kind;};
 if(procedure==='decay'){
  const target=weakest(nextBase);
  if(target){const before=target.hp;target.hp=Math.max(0,before-DECAY_DAMAGE);target.condition=target.hp===0?'extracted':'decayed';setTarget(target,target.hp===0?'extract':'decay');message=target.hp===0?'☣ '+targetId+' numaralı diş 0 HP oldu ve çekildi':'☣ '+targetId+' numaralı diş '+before+' → '+target.hp+' HP';}
  Object.assign(nextBase,awardDoctor(nextBase,'bad',gift));nextBase.badPausedUntil=gift.timestamp+BAD_DOCTOR_PAUSE_MS;
 }else if(procedure==='heal'){
  const target=weakest(nextBase);
  if(target){const before=target.hp;target.hp=Math.min(TOOTH_MAX_HP,before+10);if(target.hp===TOOTH_MAX_HP)delete target.condition;else target.condition='decayed';setTarget(target,'heal');message='✚ '+targetId+' numaralı diş '+before+' → '+target.hp+' HP · +10';}
  Object.assign(nextBase,awardDoctor(nextBase,'good',gift));nextBase.badPausedUntil=gift.timestamp+BAD_DOCTOR_PAUSE_MS;
 }else if(procedure==='extract'){
  const target=weakest(nextBase);
  if(target){target.hp=0;target.condition='extracted';setTarget(target,'extract');message='🦷 '+targetId+' numaralı diş çekildi';}
  Object.assign(nextBase,awardDoctor(nextBase,'bad',gift));
 }else if(procedure==='implant'){
  const target=extracted(nextBase);
  if(target){target.hp=TOOTH_MAX_HP;delete target.condition;setTarget(target,'implant');message='🔩 '+targetId+' numaralı dişe implant yapıldı · 100 HP';}
  Object.assign(nextBase,awardDoctor(nextBase,'good',gift));
 }else{
  message='🪙 @'+sender.username+' +'+gift.coins+' jeton';
 }
 if(procedure!=='score'&&targetId===null)message=message||'Uygun diş bulunamadı';
 const finalState={...nextBase,history:[message,...state.history].slice(0,12)};
 return {state:finishRound(finalState,gift.timestamp),accepted:true,message,action,targetId,targetUserId};
}
