import React,{useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Text} from '@react-three/drei';
import * as THREE from 'three';
import {toothPosition,type AnimationCue} from './ActionAnimation';

/** Independent, time-bounded 3D dental procedure. Every gift gets its own scene immediately. */
export function DentalProcedureFX({cue,onDone}:{cue:AnimationCue;onDone:(id:number)=>void}){
 const root=useRef<THREE.Group>(null);
 const fragments=useRef<THREE.Group>(null);
 const drill=useRef<THREE.Group>(null);
 const clock=useRef(0);
 const ended=useRef(false);
 const [x,y,z]=toothPosition(cue.targetId);
 const hostile=!cue.blocked&&['decay','fracture','extract'].includes(cue.action);
 const fracture=!cue.blocked&&['fracture','extract'].includes(cue.action);
 const healing=!cue.blocked&&['heal','implant'].includes(cue.action);
 const shielding=cue.blocked||cue.action==='decayShield'||cue.action==='fractureShield';
 const tint=hostile?'#ff405d':shielding?'#65d8ff':'#45ffb2';
 const particles=React.useMemo(()=>Array.from({length:fracture?12:8},(_,i)=>{
  const a=i*Math.PI*2/(fracture?12:8);
  return {a,dist:.48+(i%3)*.16,scale:.075+(i%4)*.025};
 }),[fracture]);
 useFrame((_,dt)=>{
  clock.current+=Math.min(dt,.06);
  const t=clock.current;
  const phase=Math.min(t/1.7,1);
  if(root.current){
   root.current.scale.setScalar(.8+Math.sin(phase*Math.PI)*.4);
   root.current.rotation.z=Math.sin(t*12)*.045;
   root.current.visible=t<2.15;
  }
  if(fragments.current){
   fragments.current.children.forEach((child,i)=>{
    const p=particles[i];
    if(!p)return;
    const travel=fracture?phase:Math.sin(phase*Math.PI)*.7;
    child.position.set(Math.cos(p.a)*p.dist*travel,Math.sin(p.a)*p.dist*travel,.2+phase*.45);
    child.rotation.set(phase*(i%2?3:-3),phase*2,phase*4);
    child.scale.setScalar(fracture?Math.max(.02,1-phase*.7):Math.max(.02,Math.sin(phase*Math.PI)));
   });
  }
  if(drill.current){
   drill.current.rotation.z=-.3+Math.sin(t*17)*.07;
   drill.current.position.y=.4-.24*Math.sin(phase*Math.PI);
  }
  if(t>=2.15&&!ended.current){ended.current=true;onDone(cue.id);}
 });
 return <group position={[x,y,z+1.1]} renderOrder={4}>
  <group ref={root}>
   <mesh><torusGeometry args={[.55,.055,8,40]}/><meshBasicMaterial color={tint} transparent opacity={.75} depthWrite={false}/></mesh>
   <mesh position={[0,0,-.1]} scale={[.38,.45,.23]}>
    <sphereGeometry args={[1,20,16]}/>
    <meshPhysicalMaterial color={fracture?'#f5e7d2':healing?'#b9fff0':hostile?'#7d3c36':'#d7efff'} transparent opacity={.65} roughness={.26} clearcoat={.9} depthWrite={false}/>
   </mesh>
   {fracture&&<><mesh position={[-.11,.04,.17]} rotation={[0,0,-.35]} scale={[.025,.44,.025]}><boxGeometry/><meshBasicMaterial color="#4a1825"/></mesh><mesh position={[.1,-.1,.18]} rotation={[0,0,.4]} scale={[.025,.26,.025]}><boxGeometry/><meshBasicMaterial color="#4a1825"/></mesh></>}
   {healing&&<><mesh position={[0,0,.2]}><torusGeometry args={[.22,.04,8,24]}/><meshBasicMaterial color="#effff5"/></mesh><mesh position={[0,0,.2]} scale={[.065,.35,.035]}><boxGeometry/><meshBasicMaterial color="#dcfff1"/></mesh><mesh position={[0,0,.2]} scale={[.35,.065,.035]}><boxGeometry/><meshBasicMaterial color="#dcfff1"/></mesh></>}
   {shielding&&<mesh position={[0,0,.1]}><icosahedronGeometry args={[.66,1]}/><meshPhysicalMaterial color="#68caff" metalness={.3} roughness={.2} transparent opacity={.22} depthWrite={false}/></mesh>}
   {cue.action==='decay'&&!cue.blocked&&<mesh position={[.07,.05,.19]} scale={[.19,.21,.04]}><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color="#33201c"/></mesh>}
   <group ref={drill} position={[.34,.4,.45]} rotation={[0,0,-.3]}>
    <mesh><cylinderGeometry args={[.025,.055,.48,12]}/><meshStandardMaterial color="#a8c8d5" metalness={.8} roughness={.2}/></mesh>
    <mesh position={[0,-.29,0]}><coneGeometry args={[.05,.18,12]}/><meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={.5}/></mesh>
   </group>
   <group ref={fragments}>{particles.map((p,i)=><mesh key={i} scale={p.scale}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={fracture?'#f4e6d2':tint} emissive={fracture?'#703a30':tint} emissiveIntensity={.3}/></mesh>)}</group>
   <pointLight color={tint} intensity={3} distance={2.6}/>
  </group>
  <Text position={[0,.95,.2]} fontSize={.22} color="#fff" outlineColor="#10151e" outlineWidth={.02} anchorX="center">{cue.blocked?'KORUNDU':cue.action==='heal'?'ONARIM':cue.action==='implant'?'İMPLANT':cue.action==='extract'?'ÇEKİM':cue.action==='fracture'?'KIRILMA':cue.action==='decay'?'ÇÜRÜME':'KALKAN'}</Text>
 </group>;
}
