import type {AnimationCue} from './ActionAnimation';
import {doctorRole} from './ActionAnimation';
import {procedureLabel} from './procedureTimeline';

/** Reference-inspired live broadcast overlay; never blocks the dental arch. */
export function ProcedureBroadcast({cues}:{cues:AnimationCue[]}){
 if(cues.length===0)return null;
 return <div className="procedure-broadcast" aria-live="polite" aria-label="Canlı diş işlemleri">
  {cues.map(cue=>{
   const hostile=!cue.blocked&&['decay','fracture','extract'].includes(cue.action);
   return <div className={'procedure-broadcast-card '+(hostile?'procedure-hostile':'procedure-friendly')} key={cue.id}>
    <div className="procedure-broadcast-heading"><span>{hostile?'☣ KÖTÜ EKİP':'✚ İYİ EKİP'}</span><strong>{cue.blocked?'Dr. Periodonti':doctorRole(cue.action)}</strong></div>
    <div className="procedure-broadcast-target"><span className="procedure-target-icon">🦷</span><div><b>DİŞ {cue.targetId+1}</b><small>{cue.user}</small>{cue.beforeHp!==undefined&&cue.afterHp!==undefined&&<small className="procedure-hp">{cue.beforeHp} → {cue.afterHp} HP</small>}</div><strong className="procedure-outcome">{procedureLabel(cue.action,cue.blocked)}</strong></div>
    <div className="procedure-timeline"><span/></div>
   </div>;
  })}
 </div>;
}
