import React,{useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Text} from '@react-three/drei';
import * as THREE from 'three';
import type {Action} from './engine';

export type AnimationCue={id:number;action:Action;team:string;user:string;blocked:boolean;targetId:number;beforeHp?:number;afterHp?:number};
export function toothPosition(index:number):[number,number,number]{const upper=index<16;const slot=index%16;const angle=(slot/15-.5)*Math.PI*.92;return [Math.sin(angle)*4.4,upper?1.15:-1.15,-Math.cos(angle)*1.5];}
const GOOD=new Set<Action>(['heal','decayShield','fractureShield','implant']);
const duration=3.5;
export const doctorRole=(action:Action):string=>({decay:'Dr. Karies',fracture:'Dr. Kırık',extract:'Dr. Ekstraksiyon',heal:'Dr. Restorasyon',decayShield:'Dr. Periodonti',fractureShield:'Dr. Periodonti',implant:'Dr. İmplant'})[action];
export function ActionCharacter({cue,onComplete,laneOffset=0}:{cue:AnimationCue|null;onComplete:(id:number)=>void;laneOffset?:number}){
 const group=useRef<THREE.Group>(null);
 const tool=useRef<THREE.Group>(null);
 const progress=useRef(0);
 const lastId=useRef<number|null>(null);
 const finished=useRef<number|null>(null);
 useFrame((_,delta)=>{
  if(!cue||!group.current)return;
  if(lastId.current!==cue.id){lastId.current=cue.id;progress.current=0;}
  progress.current+=Math.min(delta,.08);
  const t=progress.current/duration;
  const good=GOOD.has(cue.action)||cue.blocked;
  const side=good?-1:1;
  const entrance=Math.min(1,t/.22);
  const exit=Math.max(0,Math.min(1,(1-t)/.18));
  group.current.visible=t<1;
  const [tx,ty,tz]=toothPosition(cue.targetId);
  const approach=Math.min(entrance,exit);
  group.current.position.x=THREE.MathUtils.lerp(side*(5.7+laneOffset),tx+side*(.85+laneOffset),approach);
  group.current.position.y=THREE.MathUtils.lerp(-.7,ty-.3,approach)+Math.sin(Math.min(t,1)*Math.PI)*.1;
  group.current.position.z=THREE.MathUtils.lerp(2.3,tz+1.2,approach);
  group.current.rotation.y=-side*.25;
  if(tool.current)tool.current.rotation.z=Math.sin(progress.current*11)*.24;
  if(t>=1&&finished.current!==cue.id){finished.current=cue.id;onComplete(cue.id);}
 });
 if(!cue)return null;
 const good=GOOD.has(cue.action)||cue.blocked;
 const coat=good?'#f0f5f9':'#392b3f';
 const trim=good?'#26b9d6':'#b5ed55';
 const skin=good?'#dba88c':'#a77964';
 const metal='#b7c9d2';
 return <group ref={group} position={[good?4.8:-4.8,-.2,2.3]}>
  {/* Sculpted torso and open laboratory coat */}
  <mesh position={[0,-.06,0]} scale={[.53,.78,.32]}><capsuleGeometry args={[.68,.72,8,16]}/><meshStandardMaterial color={coat} roughness={.78}/></mesh>
  <mesh position={[0,.15,.305]} scale={[.22,.57,.065]}><boxGeometry/><meshStandardMaterial color={good?'#67d7e4':'#5e304b'}/></mesh>
  <mesh position={[-.22,.09,.3]} rotation={[0,0,-.12]} scale={[.14,.55,.045]}><boxGeometry/><meshStandardMaterial color={good?'#fff':'#554052'}/></mesh>
  <mesh position={[.22,.09,.3]} rotation={[0,0,.12]} scale={[.14,.55,.045]}><boxGeometry/><meshStandardMaterial color={good?'#fff':'#554052'}/></mesh>
  <mesh position={[-.23,-.32,.34]} scale={[.16,.14,.03]}><boxGeometry/><meshStandardMaterial color={trim}/></mesh>
  <mesh position={[.23,-.32,.34]} scale={[.16,.14,.03]}><boxGeometry/><meshStandardMaterial color={trim}/></mesh>
  {/* Neck, face, nose, ears and hair */}
  <mesh position={[0,.68,0]}><cylinderGeometry args={[.15,.18,.27,12]}/><meshStandardMaterial color={skin}/></mesh>
  <mesh position={[0,1.08,0]} scale={[.37,.45,.32]}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={skin} roughness={.85}/></mesh>
  {[-1,1].map(s=><React.Fragment key={s}>
   <mesh position={[s*.35,1.07,0]} scale={[.095,.17,.1]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={skin}/></mesh>
   <mesh position={[s*.145,1.13,.295]} scale={[.075,.065,.025]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#f6fafb"/></mesh>
   <mesh position={[s*.145,1.13,.319]} scale={[.03,.043,.014]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color={good?'#276a87':'#7cbd3d'}/></mesh>
   <mesh position={[s*.145,1.25,.29]} rotation={[0,0,s*.12]} scale={[.12,.035,.04]}><boxGeometry/><meshStandardMaterial color={good?'#3e414c':'#29222c'}/></mesh>
  </React.Fragment>)}
  <mesh position={[0,1.02,.323]} scale={[.09,.14,.12]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={skin}/></mesh>
  <mesh position={[0,.86,.296]} scale={[.14,.022,.025]}><boxGeometry/><meshStandardMaterial color={good?'#a26a67':'#431e28'}/></mesh>
  <mesh position={[0,1.4,-.055]} scale={[.38,.18,.34]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={good?'#283849':'#1c2029'}/></mesh>
  {/* Medical mask on the good doctor, respirator on the villain */}
  <mesh position={[0,.96,.333]} scale={[.22,.115,.045]}><boxGeometry/><meshStandardMaterial color={good?'#b9f0f4':'#333c40'}/></mesh>
  <mesh position={[0,.96,.383]} scale={[.06,.055,.02]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color={trim}/></mesh>
  {/* Animated arms, gloves, legs, shoes */}
  {[-1,1].map(s=><React.Fragment key={'limb'+s}>
   <mesh position={[s*.53,.17,0]} rotation={[0,0,s*.33]}><capsuleGeometry args={[.15,.47,6,12]}/><meshStandardMaterial color={coat}/></mesh>
   <mesh position={[s*.68,-.16,.04]}><sphereGeometry args={[.14,12,10]}/><meshStandardMaterial color={good?'#61cbe5':'#8eb95b'}/></mesh>
   <mesh position={[s*.21,-.93,0]}><capsuleGeometry args={[.15,.52,6,12]}/><meshStandardMaterial color="#253343"/></mesh>
   <mesh position={[s*.21,-1.31,.14]} scale={[.19,.11,.32]}><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color="#151a25"/></mesh>
  </React.Fragment>)}
  {/* Stethoscope and chest insignia */}
  <mesh position={[-.18,.3,.33]}><torusGeometry args={[.12,.019,6,20,Math.PI]}/><meshStandardMaterial color={metal} metalness={.7}/></mesh>
  <mesh position={[-.16,.09,.34]}><sphereGeometry args={[.055,12,10]}/><meshStandardMaterial color={metal} metalness={.8}/></mesh>
  <mesh position={[.24,.28,.35]} scale={[.1,.1,.02]}><boxGeometry/><meshStandardMaterial color={trim}/></mesh>
  <group ref={tool} position={[good?-.76:.76,.24,.23]} rotation={[0,0,good?-.6:.6]}>
   <mesh><cylinderGeometry args={[.055,.085,.6,12]}/><meshStandardMaterial color={metal} metalness={.85} roughness={.22}/></mesh>
   <mesh position={[0,.37,0]}><sphereGeometry args={[.14,16,12]}/><meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={.65}/></mesh>
   <pointLight color={trim} intensity={2} distance={2}/>
  </group>
  <Text position={[0,1.77,0]} fontSize={.2} maxWidth={2.4} color={good?'#8adfff':'#ff9191'} anchorX="center" outlineWidth={.013} outlineColor="#101522">{doctorRole(cue.action)}</Text>
  <Text position={[0,-1.59,0]} fontSize={.17} maxWidth={2.7} color="#ffffff" anchorX="center" outlineWidth={.012} outlineColor="#101522">{cue.user.slice(0,22)}</Text>
 </group>;
}
export function ToothImpact({cue}:{cue:AnimationCue|null}){
 const ref=useRef<THREE.Group>(null);
 const lastId=useRef<number|null>(null);
 const age=useRef(0);
 useFrame((_,delta)=>{
  if(!cue||!ref.current)return;
  if(lastId.current!==cue.id){lastId.current=cue.id;age.current=0;}
  age.current+=Math.min(delta,.08);
  const life=Math.max(0,1-age.current/2);
  ref.current.visible=life>0;
  ref.current.scale.setScalar(1+(1-life)*1.4);
 });
 if(!cue)return null;
 const positive=GOOD.has(cue.action)||cue.blocked;
 return <group ref={ref} position={(()=>{const [x,y,z]=toothPosition(cue.targetId);return [x,y,z+1.1] as [number,number,number]})()}>
  <mesh><torusGeometry args={[.8,.07,8,36]}/><meshBasicMaterial color={cue.blocked?'#65d8ff':positive?'#4cffa9':'#ff5669'} transparent opacity={.8}/></mesh>
  <Text position={[0,1.05,0]} fontSize={.24} color="#fff" anchorX="center">{cue.blocked?'İŞLEM ENGELLENDİ':cue.action==='implant'?'İMPLANT':cue.action==='heal'?'TEDAVİ':cue.action==='decayShield'||cue.action==='fractureShield'?'KALKAN +1':cue.action==='extract'?'DİŞ ÇEKİLDİ':cue.action==='fracture'?'KIRIK −30':'ÇÜRÜK −10'}</Text>
 </group>;
}
