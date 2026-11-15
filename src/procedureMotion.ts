/** Shared scene coordinates: the tool and the tooth must use the same target. */
export function sceneToothPosition(id:number):[number,number,number]{
 const upper=id<16;const slot=upper?id-1:id-17;const angle=(slot-6.5)/6.5*1.12;
 return [Math.sin(angle)*3.32,upper?.56:-.49,Math.cos(angle)*.53+.59];
}
export function procedurePhase(t:number){
 const clamp=(x:number)=>Math.max(0,Math.min(1,x));
 const smooth=(x:number)=>x*x*(3-2*x);
 return {reach:smooth(clamp(t/.25))*(1-smooth(clamp((t-.82)/.18))),work:smooth(clamp((t-.28)/.45)),returning:t>.82};
}
