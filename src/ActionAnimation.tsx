import React,{useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Text} from '@react-three/drei';
import * as THREE from 'three';
import type {Action} from './engine';

export type AnimationCue={id:number;action:Action;team:string;user:string;blocked:boolean;targetId:number};
export function toothPosition(index:number):[number,number,number]{const upper=index<16;const slot=index%16;const angle=(slot/15-.5)*Math.PI*.92;return [Math.sin(angle)*4.4,upper?1.15:-1.15,-Math.cos(angle)*1.5];}
const GOOD=new Set<Action>(['heal','decayShield','fractureShield','implant']);
const duration=3.5;
export function ActionCharacter({cue,onComplete}:{cue:AnimationCue|null;onComplete:(id:number)=>void}){
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
  const good=GOOD.has(cue.action);
  const side=good?1:-1;
  const entrance=Math.min(1,t/.22);
  const exit=Math.max(0,Math.min(1,(1-t)/.18));
  group.current.visible=t<1;
  const [tx,ty,tz]=toothPosition(cue.targetId);
  const approach=Math.min(entrance,exit);
  group.current.position.x=THREE.MathUtils.lerp(side*5.7,tx+side*.85,approach);
  group.current.position.y=THREE.MathUtils.lerp(-.7,ty-.3,approach)+Math.sin(Math.min(t,1)*Math.PI)*.1;
  group.current.position.z=THREE.MathUtils.lerp(2.3,tz+1.2,approach);
  group.current.rotation.y=-side*.25;
  if(tool.current)tool.current.rotation.z=Math.sin(progress.current*11)*.24;
  if(t>=1&&finished.current!==cue.id){finished.current=cue.id;onComplete(cue.id);}
 });
 if(!cue)return null;
 const good=GOOD.has(cue.action);
 const coat=good?'#eaf5ff':'#25202c';
 const accent=good?'#54d5ff':'#8be344';
 return <group ref={group} position={[good?4.8:-4.8,-.2,2.3]}>
  <mesh position={[0,-.05,0]}><capsuleGeometry args={[.36,.82,6,12]}/><meshStandardMaterial color={coat}/></mesh>
  <mesh position={[0,.92,0]}><sphereGeometry args={[.32,16,12]}/><meshStandardMaterial color={good?'#dba985':'#a57b65'}/></mesh>
  <mesh position={[0,1.2,-.02]} scale={[.34,.16,.34]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={good?'#283b4b':'#343039'}/></mesh>
  <mesh position={[-.18,-.77,0]}><capsuleGeometry args={[.13,.48,4,8]}/><meshStandardMaterial color="#2e3746"/></mesh>
  <mesh position={[.18,-.77,0]}><capsuleGeometry args={[.13,.48,4,8]}/><meshStandardMaterial color="#2e3746"/></mesh>
  <group ref={tool} position={[good?-.46:.46,.35,.12]} rotation={[0,0,good?-.45:.45]}>
   <mesh><capsuleGeometry args={[.1,.6,4,8]}/><meshStandardMaterial color={accent} metalness={.6} roughness={.25} emissive={accent} emissiveIntensity={.35}/></mesh>
   <pointLight color={accent} intensity={2} distance={2}/>
  </group>
  <Text position={[0,1.68,0]} fontSize={.22} maxWidth={2.4} color={good?'#8adfff':'#ff9191'} anchorX="center">{good?'İYİ HEKİM':'KÖTÜ HEKİM'}</Text>
  <Text position={[0,-1.35,0]} fontSize={.18} maxWidth={2.7} color="#ffffff" anchorX="center">{cue.user.slice(0,22)}</Text>
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
  <Text position={[0,1.05,0]} fontSize={.24} color="#fff" anchorX="center">{cue.blocked?'KALKAN ENGELLEDİ':positive?'TEDAVİ / KORUMA':'SALDIRI'}</Text>
 </group>;
}
