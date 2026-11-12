import {SCREENSHOT_GIFTS,claimPrice,toothPriceBand} from './toothEconomy';
/** Explicit one-gift-to-one-tooth mapping. No random assignment or reused gift names. */
export type ToothGiftAssignment={toothId:number;giftName:string;coins:number};
export function validateToothGiftAssignments(input:unknown):ToothGiftAssignment[]{
 if(!Array.isArray(input))return [];
 const seenTeeth=new Set<number>(),seenGifts=new Set<string>();
 const known=new Map<string,number>(SCREENSHOT_GIFTS.map(g=>[g.name.toLocaleLowerCase('tr-TR'),g.coins]));
 const output:ToothGiftAssignment[]=[];
 for(const raw of input){
  if(!raw||typeof raw!=='object')continue;
  const r=raw as Record<string,unknown>;
  if(!Number.isInteger(r.toothId)||Number(r.toothId)<0||Number(r.toothId)>=32||typeof r.giftName!=='string'||typeof r.coins!=='number')continue;
  const toothId=Number(r.toothId),name=r.giftName.trim(),key=name.toLocaleLowerCase('tr-TR');
  if(seenTeeth.has(toothId)||seenGifts.has(key)||known.get(key)!==r.coins||r.coins<claimPrice(toothId))continue;
  seenTeeth.add(toothId);seenGifts.add(key);output.push({toothId,giftName:name,coins:r.coins});
 }
 return output;
}
export function findAssignedTooth(assignments:ToothGiftAssignment[],giftName:string,coins:number):number|null{
 const a=assignments.find(x=>x.giftName.toLocaleLowerCase('tr-TR')===giftName.trim().toLocaleLowerCase('tr-TR')&&x.coins===coins);
 return a?.toothId??null;
}

/** Symmetric jaw pricing: each mirrored upper/lower tooth has the same gift price.
 * There are fewer verified distinct gifts at the exact low-price bands than 32
 * unique slots. Leave unmatched slots unassigned rather than overcharging.
 */
export function initialToothGiftAssignments():ToothGiftAssignment[]{
 const front=['Parfüm','LOL','Minik Allık','Buket'];
 const middle=['Finger Heart','Aşırı tepki','Aşk Kokusu','Dondurma','Tamam','Şeftali'];
 const back=['Gül','GG','Dondurma Külahı','TikTok','Lale','Göz kırpma'];
 const catalog=new Map<string,number>(SCREENSHOT_GIFTS.map(g=>[g.name,g.coins]));
 const counters={front:0,middle:0,back:0};
 const names={front,middle,back};
 const proposed=Array.from({length:32},(_,toothId)=>{
  const band=toothPriceBand(toothId);
  const giftName=names[band][counters[band]++];
  return giftName?{toothId,giftName,coins:catalog.get(giftName)??0}:null;
 }).filter((x):x is ToothGiftAssignment=>x!==null);
 return validateToothGiftAssignments(proposed.filter(x=>x.coins===claimPrice(x.toothId)));
}
