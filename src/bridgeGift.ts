/** Stateful TikTok cumulative streak normalization.
 * Each repeatCount is the cumulative number of units in ONE streak.
 * The bridge must provide a stable streakId (or stable eventId) for all updates.
 * Never infer a streak identity from just userId/giftId: distinct streaks can overlap.
 */
export type BridgeGift={type:'gift';eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number;repeatCount?:number;repeatEnd?:boolean;giftId?:string|number;streak?:boolean;streakId?:string};
export type NormalizedGift={eventId:string;userId:string;username:string;giftName:string;coins:number;timestamp:number};
export type StreakProgress=Record<string,number>;
const valid=(m:Partial<BridgeGift>)=>m.type==='gift'&&typeof m.eventId==='string'&&m.eventId.length>0&&m.eventId.length<=128&&typeof m.userId==='string'&&m.userId.length>0&&typeof m.username==='string'&&m.username.length>0&&typeof m.giftName==='string'&&m.giftName.length>0&&Number.isSafeInteger(m.coins)&&Number(m.coins)>0&&Number.isSafeInteger(m.timestamp)&&Number(m.timestamp)>0;
export function normalizeBridgeGift(value:unknown,progress:StreakProgress={}):NormalizedGift[]{
 if(!value||typeof value!=='object')return [];
 const m=value as Partial<BridgeGift>;
 if(!valid(m))return [];
 const count=m.repeatCount===undefined?1:m.repeatCount;
 if(!Number.isSafeInteger(count)||count<1||count>100000)return [];
 const id=m.eventId!;
 const streak=m.streak===true;
 const key=streak?(typeof m.streakId==='string'&&m.streakId?m.streakId:id):id;
 // A streak needs a stable ID across cumulative progress updates.
 const seen=streak?(progress[key]??0):0;
 const from=streak?seen:0;
 if(streak&&count<=seen)return [];
 // If the bridge cannot provide a stable streak identifier, it must mark updates
 // with the same eventId. Each cumulative unit has a stable dedupe identity.
 const out:NormalizedGift[]=[];
 for(let i=from;i<count;i++)out.push({eventId:streak?key+':unit:'+i:count===1?id:id+':unit:'+i,userId:m.userId!,username:m.username!,giftName:m.giftName!,coins:m.coins!,timestamp:m.timestamp!});
 if(streak)progress[key]=count;
 return out;
}
