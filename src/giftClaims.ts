import {findAssignedTooth,type ToothGiftAssignment} from './toothGiftAssignments';
import {toothPriceBand,claimPrice,SCREENSHOT_GIFTS} from './toothEconomy';
import {claim,replaceByImplant,type ArenaSnapshot} from './runtime';
/** Reported public gift values; TikTok gift catalogue is region-dependent. */
export const GIFT_CATALOG=[
 {name:'Rose',coins:1,tier:'standard'}, {name:'GG',coins:1,tier:'standard'},
 {name:'TikTok',coins:1,tier:'standard'}, {name:'Ice Cream Cone',coins:1,tier:'standard'},
 {name:'Finger Heart',coins:5,tier:'middle'}, {name:'Perfume',coins:20,tier:'premium'},
 {name:'Doughnut',coins:30,tier:'implant'},
 {name:'Gül',coins:1,tier:'standard'}, {name:'Dondurma Külahı',coins:1,tier:'standard'},
 {name:'Aşırı tepki',coins:5,tier:'middle'}, {name:'Kalp',coins:10,tier:'middle'},
 {name:'Ağır çekim',coins:10,tier:'middle'}, {name:'Yıldızıma Tebrikler',coins:15,tier:'middle'},
 {name:'Parfüm',coins:20,tier:'premium'}, {name:'LOL',coins:20,tier:'premium'},
 {name:'Minik Allık',coins:20,tier:'premium'}, {name:'Donat',coins:30,tier:'implant'}
] as const;
export type GiftEvent={eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number};
export type GiftClaimResult={accepted:boolean;message:string;snapshot:ArenaSnapshot;toothId:number|null};
export function toothTier(id:number):'premium'|'middle'|'standard'{const band=toothPriceBand(id);return band==='front'?'premium':band==='middle'?'middle':'standard';}
export function processGiftClaim(snapshot:ArenaSnapshot,event:GiftEvent,assignments?:ToothGiftAssignment[]):GiftClaimResult{
 const fail=(message:string):GiftClaimResult=>({accepted:false,message,snapshot,toothId:null});
 if(!event.eventId||event.eventId.length>128||snapshot.processedIds.includes('gift:'+event.eventId))return fail('Tekrarlanan veya geçersiz hediye olayı');
 if(!Number.isFinite(event.timestamp)||event.timestamp<0||!event.userId||!event.username)return fail('Geçersiz gönderen');
 const aliases:Record<string,string>={'gül':'Rose','rose':'Rose','gg':'GG','tiktok':'TikTok','dondurma külahı':'Ice Cream Cone','ice cream cone':'Ice Cream Cone','parmak kalp':'Finger Heart','finger heart':'Finger Heart','parfüm':'Perfume','perfume':'Perfume','donut':'Doughnut','doughnut':'Doughnut'};
 const canonical=aliases[event.giftName.trim().toLocaleLowerCase('tr-TR')]??event.giftName.trim();
 const gift=GIFT_CATALOG.find(g=>g.name.toLocaleLowerCase('en-US')===canonical.toLocaleLowerCase('en-US'))??SCREENSHOT_GIFTS.find(g=>g.name.toLocaleLowerCase('tr-TR')===event.giftName.trim().toLocaleLowerCase('tr-TR'));
 if(!gift||gift.coins!==event.coins)return fail('Tanınmayan hediye veya jeton değeri uyuşmuyor');
 if(Object.values(snapshot.owners).some(owner=>owner.userId===event.userId))return fail('Bu izleyicinin zaten bir dişi var');
 if(!assignments&&'tier' in gift&&gift.tier==='implant'){
  const candidate=snapshot.teeth.find(t=>t.extracted&&snapshot.owners[t.id]);
  if(!candidate)return fail('Devralınabilecek çekilmiş diş yok');
  const result=replaceByImplant(snapshot,candidate.id,event.userId,event.username,'gift:'+event.eventId,event.timestamp);
  return {accepted:result.accepted,message:result.message,snapshot:result.snapshot,toothId:result.accepted?candidate.id:null};
 }
 const assigned=assignments?findAssignedTooth(assignments,event.giftName,event.coins):null;
 const candidate=assignments?(assigned===null?undefined:snapshot.teeth[assigned]&&!snapshot.teeth[assigned].extracted&&!snapshot.owners[assigned]?snapshot.teeth[assigned]:undefined):snapshot.teeth.find(t=>!t.extracted&&!snapshot.owners[t.id]&&('tier' in gift?toothTier(t.id)===gift.tier:true)&&event.coins>=claimPrice(t.id));
 if(!candidate)return fail(assignments?'Bu hediyeye atanmış boş diş yok':'Bu hediye kategorisinde boş diş yok');
 const result=claim(snapshot,candidate.id,event.userId,event.username,event.timestamp);
 if(!result.accepted)return {accepted:false,message:result.message,snapshot,toothId:null};
 return {accepted:true,message:result.message,snapshot:{...result.snapshot,processedIds:[...result.snapshot.processedIds,'gift:'+event.eventId].slice(-10000)},toothId:candidate.id};
}
