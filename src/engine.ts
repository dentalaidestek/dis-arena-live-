export type Action = 'decay'|'fracture'|'heal'|'decayShield'|'fractureShield'|'extract'|'implant';
export type Tooth = {id:number;team:string;hp:number;decayShields:number;fractureShields:number;extracted:boolean;decayHits:number;fractureHits:number};
export type GameEvent={id:string;user:string;teamId:number;action:Action;timestamp:number};
export type EventResult={tooth:Tooth;message:string;blocked:boolean};
export const TEAMS=['Galatasaray','Fenerbahçe','Beşiktaş','Trabzonspor','Başakşehir','Samsunspor','Göztepe','Konyaspor','Rizespor','Antalyaspor','Kasımpaşa','Alanyaspor','Kayserispor','Gaziantep FK','Eyüpspor','Gençlerbirliği','Amedspor','Ankaragücü','Sakaryaspor','Kocaelispor','Erzurumspor','Boluspor','Bandırmaspor','Çorum FK','Iğdır FK','Sivasspor','Adana Demirspor','Hatayspor','Pendikspor','Ümraniyespor','Manisa FK','İstanbulspor'];
export const initialTeeth=():Tooth[]=>TEAMS.map((team,id)=>({id,team,hp:100,decayShields:0,fractureShields:0,extracted:false,decayHits:0,fractureHits:0}));
export function applyAction(original:Tooth,action:Action):EventResult{
 const tooth={...original};let blocked=false;let message='';
 if(action==='implant'){if(!tooth.extracted)return {tooth,blocked:true,message:'Diş henüz çekilmedi'};tooth.extracted=false;tooth.hp=50;tooth.decayHits=0;tooth.fractureHits=0;tooth.decayShields=0;tooth.fractureShields=0;return {tooth,blocked:false,message:'İmplantla geri döndü'};}
 if(tooth.extracted)return {tooth,blocked:true,message:'Çekilmiş dişe işlem yapılamaz'};
 switch(action){
 case 'decayShield':tooth.decayShields++;message='Çürük kalkanı +1';break;
 case 'fractureShield':tooth.fractureShields++;message='Kırık kalkanı +1';break;
 case 'decay':if(tooth.decayShields){tooth.decayShields--;blocked=true;message='Çürük kalkanı saldırıyı engelledi';}else{tooth.hp=Math.max(0,tooth.hp-10);tooth.decayHits++;message='Çürük saldırısı −10 HP';}break;
 case 'fracture':if(tooth.fractureShields){tooth.fractureShields--;blocked=true;message='Kırık kalkanı saldırıyı engelledi';}else{tooth.hp=Math.max(0,tooth.hp-30);tooth.fractureHits++;message='Kırık saldırısı −30 HP';}break;
 case 'heal':tooth.hp=Math.min(100,tooth.hp+25);message='Tedavi +25 HP';break;
 case 'extract':if(tooth.hp>20){blocked=true;message='Çekim için sağlık 20 HP veya altında olmalı';}else{tooth.extracted=true;message='Diş çekildi';}break;
 }
 return {tooth,blocked,message};
}
export function processEvent(teeth:Tooth[],event:GameEvent,seen:Set<string>){if(seen.has(event.id))return {teeth,message:'Tekrarlanan olay atlandı',blocked:true};const current=teeth[event.teamId];if(!current)return {teeth,message:'Geçersiz diş',blocked:true};seen.add(event.id);const result=applyAction(current,event.action);return {teeth:teeth.map(t=>t.id===event.teamId?result.tooth:t),message:result.message,blocked:result.blocked};}
export function getLeader(teeth:Tooth[],previousId:number|null):Tooth|null{const active=teeth.filter(t=>!t.extracted);if(!active.length)return null;const max=Math.max(...active.map(t=>t.hp));const tied=active.filter(t=>t.hp===max);return tied.length===1?tied[0]:tied.find(t=>t.id===previousId)??null;}
