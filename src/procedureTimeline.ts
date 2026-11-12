import type {Action} from './engine';
export const PROCEDURE_DURATION=3.5;
export type ProcedurePhase='enter'|'recline'|'operate'|'reveal'|'exit';
export function procedurePhase(seconds:number):ProcedurePhase{
 if(seconds<.45)return 'enter';
 if(seconds<1.05)return 'recline';
 if(seconds<2.55)return 'operate';
 if(seconds<3.05)return 'reveal';
 return 'exit';
}
export function procedureProgress(seconds:number):number{
 return Math.min(1,Math.max(0,(seconds-1.05)/1.5));
}
export function procedureLabel(action:Action,blocked:boolean):string{
 if(blocked)return 'SALDIRI ENGELLENDİ';
 return ({decay:'ÇÜRÜK −10 HP',fracture:'KIRIK −30 HP',heal:'TEDAVİ +25 HP',decayShield:'ÇÜRÜK KALKANI +1',fractureShield:'KIRIK KALKANI +1',extract:'DİŞ ELENDİ',implant:'İMPLANT 50 HP'} as const)[action];
}
