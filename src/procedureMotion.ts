/** Tooth coordinates are shared by the patient, optical closeup and treatment tools. */
export const MOUTH_VIEWS={
 patient:{position:[0,2.58,.61] as [number,number,number],scale:.085},
 closeup:{position:[0,-3.65,2.6] as [number,number,number],scale:1.25},
};
export function sceneToothPosition(id:number):[number,number,number]{
 const upper=id<16;const slot=upper?id-1:id-17;const normalized=(slot-6.5)/6.5;
 const arc=.12*Math.pow(Math.abs(normalized),1.6);
 return [(slot-6.5)*.48,upper?.56+arc:-.56-arc,Math.cos(normalized*1.12)*.42+.59];
}
export function toothWorldPosition(id:number,view:keyof typeof MOUTH_VIEWS):[number,number,number]{
 const transform=MOUTH_VIEWS[view];return sceneToothPosition(id).map((value,i)=>transform.position[i]+value*transform.scale) as [number,number,number];
}
export function procedurePhase(t:number){
 const clamp=(x:number)=>Math.max(0,Math.min(1,x));
 const smooth=(x:number)=>x*x*(3-2*x);
 return {reach:smooth(clamp(t/.25))*(1-smooth(clamp((t-.82)/.18))),work:smooth(clamp((t-.28)/.45)),returning:t>.82};
}
