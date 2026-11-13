/** Normalize untrusted TikTok bridge events before applying game rules.
 * Streak counters are cumulative; only final streak events are scored.
 * A bridge must supply stable eventId for replay deduplication.
 */
export type BridgeGift={type:'gift';eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;repeatCount?:number;repeatEnd?:boolean;giftId?:string|number;streak?:boolean};
export type NormalizedGift={eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number};
export function normalizeBridgeGift(value:unknown):NormalizedGift[] {
 if(!value||typeof value!=='object')return [];
 const m=value as Partial<BridgeGift>;
 if(m.type!=='gift'||typeof m.eventId!=='string'||!m.eventId||typeof m.userId!=='string'||!m.userId||typeof m.username!=='string'||!m.username||typeof m.giftName!=='string'||!m.giftName||!Number.isSafeInteger(m.coins)||Number(m.coins)<=0||!Number.isSafeInteger(m.timestamp)||Number(m.timestamp)<=0)return [];
 const count=m.repeatCount===undefined?1:m.repeatCount;
 if(!Number.isSafeInteger(count)||count<1||count>100000)return [];
 // Never score cumulative streak progress: otherwise 1,2,3...N is counted N(N+1)/2 times.
 if(m.streak===true&&m.repeatEnd!==true)return [];
 // Unspecified streak semantics are ambiguous; the bridge must identify streak updates.
 // One final event is expanded into independently deduplicated gift units.
 const result:NormalizedGift[]=[];
 for(let i=0;i<count;i++)result.push({eventId:count===1?m.eventId:m.eventId+':unit:'+i,userId:m.userId,username:m.username,giftName:m.giftName,coins:Number(m.coins),timestamp:Number(m.timestamp)});
 return result;
}
