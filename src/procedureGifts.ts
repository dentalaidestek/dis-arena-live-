import type {Action} from './engine';
import type {ArenaSnapshot} from './runtime';
import type {GiftEvent} from './giftClaims';

export type ProcedureGiftRule={giftName:string;action:Action;coins?:number};
export const PROCEDURE_ACTIONS:Action[]=['heal','decayShield','implant','decay','fracture','extract'];
export const ACTION_LABELS:Record<Action,string>={heal:'Dr. Restorasyon',decayShield:'Dr. Periodonti',fractureShield:'Dr. Periodonti',implant:'Dr. İmplant',decay:'Dr. Karies',fracture:'Dr. Kırık',extract:'Dr. Ekstraksiyon'};
const key=(s:string)=>s.trim().toLocaleLowerCase('tr-TR');
/** No default paid LIVE gift mapping: the broadcaster must explicitly configure it. */
export function parseProcedureGiftRules(input:unknown):ProcedureGiftRule[]{
 if(!Array.isArray(input))return [];
 const result:ProcedureGiftRule[]=[];const used=new Set<string>();
 for(const raw of input.slice(0,32)){
  if(!raw||typeof raw!=='object')continue;
  const rule=raw as Record<string,unknown>;
  if(typeof rule.giftName!=='string'||!rule.giftName.trim()||rule.giftName.length>100||!PROCEDURE_ACTIONS.includes(rule.action as Action))continue;
  const name=key(rule.giftName);
  if(used.has(name))continue;
  if(rule.coins!==undefined&&(!Number.isInteger(rule.coins)||Number(rule.coins)<1))continue;
  used.add(name);result.push({giftName:rule.giftName.trim(),action:rule.action as Action,...(rule.coins===undefined?{}:{coins:Number(rule.coins)})});
 }
 return result;
}
export function matchProcedureGift(rules:ProcedureGiftRule[],event:GiftEvent):Action|null{
 const rule=rules.find(r=>key(r.giftName)===key(event.giftName)&& (r.coins===undefined||r.coins===event.coins));
 return rule?.action??null;
}
/** Owner receives supportive procedures; hostile procedures target an active opponent.
 * Without an owner, choose a deterministic eligible tooth rather than the broadcaster's selected tooth.
 */
export function chooseProcedureTarget(snapshot:ArenaSnapshot,event:GiftEvent,action:Action):number|null{
 const owned=Object.entries(snapshot.owners).find(([,owner])=>owner.userId===event.userId);
 const ownId=owned?Number(owned[0]):null;
 if(action==='implant'){
  if(ownId!==null&&snapshot.teeth[ownId]?.extracted)return ownId;
  return null;
 }
 if(['heal','decayShield','fractureShield'].includes(action)&&ownId!==null&&!snapshot.teeth[ownId].extracted)return ownId;
 const eligible=snapshot.teeth.filter(t=>!t.extracted&&(action!=='extract'||t.hp<=20)&&(action!=='heal'||t.hp<100)&&(ownId===null||['heal','decayShield','fractureShield'].includes(action)||t.id!==ownId));
 if(!eligible.length)return null;
 const seed=event.eventId+'|'+event.userId;
 let hash=2166136261;
 for(let i=0;i<seed.length;i++)hash=Math.imul(hash^seed.charCodeAt(i),16777619)>>>0;
 return eligible[hash%eligible.length].id;
}
