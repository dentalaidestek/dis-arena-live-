import React,{useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Text} from '@react-three/drei';
import * as THREE from 'three';
import type {AnimationCue} from './ActionAnimation';
import {toothPosition} from './ActionAnimation';
import {procedurePhase,procedureProgress,procedureLabel} from './procedureTimeline';

/** Animated chair-side vignette for each accepted clinical event. */
export function TreatmentScene({cue}:{cue:AnimationCue}){
 const root=useRef<THREE.Group>(null);
 const patient=useRef<THREE.Group>(null);
 const mouth=useRef<THREE.Group>(null);
 const hand=useRef<THREE.Group>(null);
 const fx=useRef<THREE.Group>(null);
 const target=useRef<THREE.Group>(null);
 const crown=useRef<THREE.Mesh>(null);
 const drill=useRef<THREE.Group>(null);
 const damage=useRef<THREE.Mesh>(null);
 const crackMesh=useRef<THREE.Mesh>(null);
 const implant=useRef<THREE.Mesh>(null);
 const shield=useRef<THREE.Mesh>(null);
 const started=useRef<number|null>(null);
 const elapsed=useRef(0);
 const bad=['decay','fracture','extract'].includes(cue.action)&&!cue.blocked;
 const color=cue.blocked?'#72e6ff':bad?'#ff5266':'#5bf3d1';
 useFrame((_,delta)=>{
  if(started.current!==cue.id){started.current=cue.id;elapsed.current=0;}
  elapsed.current+=Math.min(delta,.06);
  const t=elapsed.current;
  const phase=procedurePhase(t);
  const progress=procedureProgress(t);
  const enter=THREE.MathUtils.smoothstep(t,0,.55);
  const leave=1-THREE.MathUtils.smoothstep(t,2.8,3.5);
  if(root.current){root.current.visible=t<3.5;root.current.scale.setScalar(Math.max(.001,enter*leave)*.9);}
  if(patient.current)patient.current.rotation.z=THREE.MathUtils.lerp(-.12,-.53,THREE.MathUtils.smoothstep(t,.3,1.05));
  if(mouth.current)mouth.current.scale.y=phase==='operate'?1.25:.85+.12*Math.sin(t*5);
  if(hand.current){const operating=THREE.MathUtils.smoothstep(t,.8,1.3)*(1-THREE.MathUtils.smoothstep(t,2.6,3.1));hand.current.rotation.z=operating*(bad?-.6:.5)+Math.sin(t*(cue.action==='fracture'?22:13))*.13*operating;hand.current.position.y=.85-operating*.33;}
  if(target.current){target.current.rotation.y=Math.sin(t*1.7)*.13;target.current.position.y=.18+Math.sin(t*2)*.025;}
  if(crown.current){const progress=THREE.MathUtils.smoothstep(t,1.1,2.5);const shrinking=cue.action==='extract'&&!cue.blocked?1-progress*.95:1;crown.current.scale.setScalar(shrinking);crown.current.position.y=cue.action==='extract'&&!cue.blocked?progress*.9:0;}
  if(drill.current){const touch=THREE.MathUtils.smoothstep(t,.85,1.5)*(1-THREE.MathUtils.smoothstep(t,2.5,3));drill.current.position.set(.36-touch*.5,.85-touch*.55,.75);drill.current.rotation.z=touch*.5;}
  if(damage.current){const amount=cue.action==='decay'?progress:cue.action==='heal'?1-progress:0;damage.current.scale.setScalar(Math.max(.001,amount));damage.current.visible=amount>.01;}
  if(crackMesh.current){crackMesh.current.scale.y=Math.max(.001,progress);crackMesh.current.visible=progress>.01;}
  if(implant.current){implant.current.scale.y=Math.max(.001,progress);implant.current.visible=progress>.01;}
  if(shield.current){shield.current.rotation.y=t*1.4;shield.current.scale.setScalar(.6+progress*.4);}
  if(fx.current){fx.current.rotation.z=t*(bad?4:-3);fx.current.scale.setScalar(.6+Math.sin(t*10)*.12);fx.current.visible=t>1.05&&t<2.8;}
 });
 const [x,y,z]=toothPosition(cue.targetId);
 const side=bad?-1:1;
 const isShield=cue.action==='decayShield'||cue.action==='fractureShield'||cue.blocked;
 const crack=cue.action==='fracture'&&!cue.blocked;
 const decay=cue.action==='decay'&&!cue.blocked;
 return <group position={[x+side*.55,y,z+1.65]} ref={root} scale={.001}>
  {/* The same numbered tooth stays centered and unobstructed in every procedure. */}
  <group ref={target} position={[-.15,.18,.9]}>
   <mesh position={[0,-.25,-.13]} scale={[.48,.2,.35]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color="#a64c62" roughness={.7}/></mesh>
   <mesh ref={crown} position={[0,0,0]}>
    <sphereGeometry args={[.27,24,20]}/><meshPhysicalMaterial color={decay?'#a88b5b':'#fff4dc'} roughness={.22} clearcoat={.7}/>
   </mesh>
   {crack&&<mesh ref={crackMesh} position={[.02,0,.275]} rotation={[0,0,.48]} scale={[.027,.37,.015]}><boxGeometry/><meshBasicMaterial color="#7a2729"/></mesh>}
   {(decay||cue.action==='heal')&&<mesh ref={damage} position={[.11,.12,.254]} scale={[.11,.1,.022]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#3b271b"/></mesh>}
   {isShield&&<mesh ref={shield}><icosahedronGeometry args={[.46,1]}/><meshBasicMaterial color="#49d9ff" wireframe transparent opacity={.65}/></mesh>}
   {cue.action==='implant'&&<mesh ref={implant} position={[0,-.35,0]}><cylinderGeometry args={[.1,.14,.52,16]}/><meshStandardMaterial color="#c4d4df" metalness={.85}/></mesh>}
   <Text position={[0,.53,.1]} fontSize={.21} color="#ffdc73" anchorX="center" outlineWidth={.012} outlineColor="#1a1010">{'DİŞ '+(cue.targetId+1)}</Text>
   <mesh position={[0,0,-.05]}><torusGeometry args={[.45,.025,8,32]}/><meshBasicMaterial color={color} transparent opacity={.85}/></mesh>
  </group>
  {/* Reclining dental chair, headrest and footrest */}
  <mesh position={[0,-.85,-.15]}><cylinderGeometry args={[.12,.21,.65,12]}/><meshStandardMaterial color="#9ca9b9" metalness={.8}/></mesh>
  <mesh position={[0,-1.16,-.15]} scale={[.75,.09,.48]}><cylinderGeometry args={[1,1,1,20]}/><meshStandardMaterial color="#4b6076" metalness={.55}/></mesh>
  <mesh position={[0,-.42,-.2]} rotation={[0,0,-.5]} scale={[.45,.16,1.05]}><boxGeometry/><meshStandardMaterial color="#2a839e" roughness={.3}/></mesh>
  <mesh position={[-.5,-.13,-.18]} rotation={[0,0,-.5]} scale={[.22,.13,.4]}><boxGeometry/><meshStandardMaterial color="#60c6d9"/></mesh>
  <mesh position={[.57,-.76,-.17]} rotation={[0,0,-.5]} scale={[.42,.09,.45]}><boxGeometry/><meshStandardMaterial color="#317f98"/></mesh>
  <group ref={patient} position={[0,-.12,.12]}>
   <mesh position={[.07,-.25,0]} rotation={[0,0,-.5]} scale={[.7,.3,.35]}><capsuleGeometry args={[.5,.4,6,12]}/><meshStandardMaterial color="#b8d2e7"/></mesh>
   <mesh position={[.58,-.55,0]} rotation={[0,0,-.5]} scale={[.17,.43,.16]}><capsuleGeometry args={[1,1,6,12]}/><meshStandardMaterial color="#3b5e7c"/></mesh>
   <mesh position={[-.51,.1,.08]} scale={[.25,.28,.24]}><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color="#dca88d"/></mesh>
   <mesh position={[-.57,.24,.06]} scale={[.24,.13,.23]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#322b34"/></mesh>
   <group ref={mouth} position={[-.61,.02,.306]}><mesh scale={[.12,.06,.015]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#54202b"/></mesh><mesh position={[0,.005,.018]} scale={[.08,.016,.008]}><boxGeometry/><meshStandardMaterial color="#fff4e7"/></mesh></group>
  </group>
  {/* Dentist working arm and action-specific instrument */}
  <group ref={hand} position={[side*.63,.85,.45]}>
   <mesh position={[0,-.25,0]} rotation={[0,0,side*.28]}><capsuleGeometry args={[.09,.46,5,10]}/><meshStandardMaterial color={bad?'#432b37':'#e6f4fc'}/></mesh>
   <mesh position={[0,-.55,0]}><sphereGeometry args={[.12,12,10]}/><meshStandardMaterial color={bad?'#a5d36a':'#58d2ee'}/></mesh>
   <mesh position={[0,-.79,.02]}><cylinderGeometry args={[.04,.065,.43,10]}/><meshStandardMaterial color="#d1dce5" metalness={.85} roughness={.2}/></mesh>
   {cue.action==='extract'?<mesh position={[0,-1.04,.02]} rotation={[0,0,.3]}><torusGeometry args={[.13,.045,8,16,Math.PI*1.6]}/><meshStandardMaterial color="#c6d1d9" metalness={.8}/></mesh>:cue.action==='fracture'?<mesh position={[0,-1.02,.02]} scale={[.18,.12,.13]}><boxGeometry/><meshStandardMaterial color="#aab9c9" metalness={.7}/></mesh>:<mesh position={[0,-1.04,.02]}><coneGeometry args={[.075,.24,12]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.6}/></mesh>}
  </group>
  <group ref={drill} position={[.36,.85,.75]}><mesh rotation={[0,0,.5]}><cylinderGeometry args={[.018,.025,.46,8]}/><meshStandardMaterial color="#c7d4dd" metalness={.8}/></mesh></group>
  <group ref={fx} position={[-.15,.18,1.15]}><mesh><torusGeometry args={[.28,.035,8,32]}/><meshBasicMaterial color={color} transparent opacity={.85}/></mesh><pointLight color={color} intensity={3} distance={2}/></group>
  <Text position={[0,1.17,.1]} fontSize={.22} color={color} outlineWidth={.014} outlineColor="#07101a" anchorX="center">{procedureLabel(cue.action,cue.blocked)}</Text>
 </group>;
}
