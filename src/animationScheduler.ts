import type {AnimationCue} from './ActionAnimation';
export type Lane='good'|'bad';
export const MAX_PER_SIDE=2;
export const MAX_WAITING=60;
export const laneOf=(action:AnimationCue['action']):Lane=>['heal','decayShield','fractureShield','implant'].includes(action)?'good':'bad';
export type AnimationState={active:AnimationCue[];waiting:AnimationCue[]};
export const emptyAnimationState=():AnimationState=>({active:[],waiting:[]});
export function enqueueAnimation(state:AnimationState,cue:AnimationCue):AnimationState{
 const lane=laneOf(cue.action);
 const occupied=state.active.filter(c=>laneOf(c.action)===lane).length;
 const conflicts=state.active.some(c=>c.targetId===cue.targetId)||state.waiting.some(c=>c.targetId===cue.targetId);
 if(occupied<MAX_PER_SIDE&&!conflicts&&state.waiting.length===0)return {...state,active:[...state.active,cue]};
 return {...state,waiting:state.waiting.length>=MAX_WAITING?state.waiting:[...state.waiting,cue]};
}
export function finishAnimation(state:AnimationState,id:number):AnimationState{
 if(!state.active.some(c=>c.id===id))return state;
 const active=state.active.filter(c=>c.id!==id);
 const waiting=[...state.waiting];
 // FIFO among compatible cues; do not allow two characters on the same tooth.
 for(let i=0;i<waiting.length;){
  const cue=waiting[i];
  if(active.filter(c=>laneOf(c.action)===laneOf(cue.action)).length<MAX_PER_SIDE&&!active.some(c=>c.targetId===cue.targetId)&&!waiting.slice(0,i).some(c=>c.targetId===cue.targetId)){
   active.push(cue);waiting.splice(i,1);
  }else i++;
 }
 return {active,waiting};
}
