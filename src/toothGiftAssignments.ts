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

/** Fixed assignments. Each upper tooth has a lower counterpart of equal coin price. */
export function initialToothGiftAssignments():ToothGiftAssignment[]{
 const pairs:[number,number,string,string][]=[
  [0,16,'Gül','GG'],[1,17,'Dondurma Külahı','Lale'],[2,18,'Göz kırpma','Rüzgâr gülü'],
  [3,19,'Finger Heart','Aşırı tepki'],[4,20,'Aşk Kokusu','Bir Daha Bileti'],[5,21,'Dönen Top','İsimle selamlama'],
  [6,22,'Parfüm','LOL'],[7,23,'Minik Allık','Buket'],[8,24,'Konfeti','Elle Kalp'],[9,25,'Öpücük','Sceptre'],
  [10,26,'Kalp','Meraklı Twinkle'],[11,27,'Ağır çekim','Rosa'],[12,28,'Yıldızıma Tebrikler','Bravo!'],
  [13,29,'Pasta Dilimi','Blue Bead'],[14,30,'Pati','Parlıyorsun!'],[15,31,'Karşılama Kahvesi','Denizyıldızı']
 ];
 const prices=new Map<string,number>(SCREENSHOT_GIFTS.map(g=>[g.name.toLocaleLowerCase('tr-TR'),g.coins]));
 const proposed=pairs.flatMap(([upper,lower,a,b])=>[
  {toothId:upper,giftName:a,coins:prices.get(a.toLocaleLowerCase('tr-TR'))??0},
  {toothId:lower,giftName:b,coins:prices.get(b.toLocaleLowerCase('tr-TR'))??0}
 ]);
 return validateToothGiftAssignments(proposed);
}
