import {claim,replaceByImplant,type ArenaSnapshot} from './runtime';
/** Reported public gift values; TikTok gift catalogue is region-dependent. */
export const GIFT_CATALOG=[
 {name:'Rose',coins:1,tier:'standard'}, {name:'GG',coins:1,tier:'standard'},
 {name:'TikTok',coins:1,tier:'standard'}, {name:'Ice Cream Cone',coins:1,tier:'standard'},
 {name:'Finger Heart',coins:5,tier:'middle'}, {name:'Perfume',coins:20,tier:'premium'},
 {name:'Doughnut',coins:30,tier:'implant'}
] as const;
export type GiftEvent={eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number};
export type GiftClaimResult={accepted:boolean;message:string;snapshot:ArenaSnapshot;toothId:number|null};
export function toothTier(id:number):'premium'|'middle'|'standard'{
 // 16 per jaw: central 4 incisor slots per arch; canines + premolars in middle tier.
 const slot=id%16;
 return slot>=6&&slot<=9?'premium':slot>=3&&slot<=12?'middle':'standard';
}
export function processGiftClaim(snapshot:ArenaSnapshot,event:GiftEvent):GiftClaimResult{
 const fail=(message:string):GiftClaimResult=>({accepted:false,message,snapshot,toothId:null});
 if(!event.eventId||event.eventId.length>128||snapshot.processedIds.includes('gift:'+event.eventId))return fail('Tekrarlanan veya geçersiz hediye olayı');
 if(!Number.isFinite(event.timestamp)||event.timestamp<0||!event.userId||!event.username)return fail('Geçersiz gönderen');
 const gift=GIFT_CATALOG.find(g=>g.name.toLocaleLowerCase('en-US')===event.giftName.trim().toLocaleLowerCase('en-US'));
 if(!gift||gift.coins!==event.coins)return fail('Tanınmayan hediye veya jeton değeri uyuşmuyor');
 if(Object.values(snapshot.owners).some(owner=>owner.userId===event.userId))return fail('Bu izleyicinin zaten bir dişi var');
 if(gift.tier==='implant'){
  const candidate=snapshot.teeth.find(t=>t.extracted&&snapshot.owners[t.id]);
  if(!candidate)return fail('Devralınabilecek çekilmiş diş yok');
  const result=replaceByImplant(snapshot,candidate.id,event.userId,event.username,'gift:'+event.eventId,event.timestamp);
  return {accepted:result.accepted,message:result.message,snapshot:result.snapshot,toothId:result.accepted?candidate.id:null};
 }
 const candidate=snapshot.teeth.find(t=>!t.extracted&&!snapshot.owners[t.id]&&toothTier(t.id)===gift.tier);
 if(!candidate)return fail('Bu hediye kategorisinde boş diş yok');
 const result=claim(snapshot,candidate.id,event.userId,event.username,event.timestamp);
 if(!result.accepted)return {accepted:false,message:result.message,snapshot,toothId:null};
 return {accepted:true,message:result.message,snapshot:{...result.snapshot,processedIds:[...result.snapshot.processedIds,'gift:'+event.eventId].slice(-10000)},toothId:candidate.id};
}
