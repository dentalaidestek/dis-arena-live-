import type {VisualEvent} from '../server/store';
export const VISUAL_CAPACITY=256;
export type VisualQueue={waiting:VisualEvent[];skipped:number};
export function appendVisuals(queue:VisualQueue,events:VisualEvent[]):VisualQueue{
 const ids=new Set(queue.waiting.map(e=>e.id));const fresh=events.filter(e=>!ids.has(e.id));
 const all=[...queue.waiting,...fresh];const overflow=Math.max(0,all.length-VISUAL_CAPACITY);
 // Only pending visuals may be summarized. Scores and the durable journal are untouched.
 return {waiting:all.slice(overflow),skipped:queue.skipped+overflow};
}
export const visualDuration=(waiting:number)=>waiting>20?1600:waiting>5?2400:3800;
