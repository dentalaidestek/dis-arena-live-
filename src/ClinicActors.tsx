import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RoundedBox,Text} from '@react-three/drei';
import * as THREE from 'three';
import type {AnimationCue} from './ActionAnimation';
import {MOUTH_VIEWS,procedurePhase,toothWorldPosition} from './procedureMotion';
const sphere=new THREE.SphereGeometry(1,28,20);
const cylinder=new THREE.CylinderGeometry(1,1,1,16);
const axis=new THREE.Vector3(0,1,0);
const skin='#d4a28a',coat='#e7eeef',navy='#172a3d';
const headGeometry=(()=>{const g=new THREE.SphereGeometry(1,36,28),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(y<0?.78+.22*(y+1):1));}g.computeVertexNormals();return g})();
export function Orb({position,scale,color,roughness=.65}:{position:[number,number,number];scale:[number,number,number];color:string;roughness?:number}){
 return <mesh geometry={sphere} dispose={null} position={position} scale={scale}><meshStandardMaterial color={color} roughness={roughness}/></mesh>;
}
export function Block({position,size,color,radius=.12,metalness=0}:{position:[number,number,number];size:[number,number,number];color:string;radius?:number;metalness?:number}){
 return <RoundedBox position={position} args={size} radius={Math.min(radius,...size.map(n=>n*.4))} smoothness={3}><meshStandardMaterial color={color} roughness={metalness?.3:.6} metalness={metalness}/></RoundedBox>;
}
function Limb({from,to,radius=.13,color=coat}:{from:[number,number,number];to:[number,number,number];radius?:number;color?:string}){
 const geometry=useMemo(()=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);return {position:a.add(b).multiplyScalar(.5),quaternion:new THREE.Quaternion().setFromUnitVectors(axis,direction.clone().normalize()),length:direction.length()}},[...from,...to]);
 return <mesh geometry={cylinder} dispose={null} position={geometry.position} quaternion={geometry.quaternion} scale={[radius,geometry.length,radius]}><meshStandardMaterial color={color} roughness={.6}/></mesh>;
}
function Face({patient=false,bad=false,cue}:{patient?:boolean;bad?:boolean;cue?:AnimationCue}){
 const eyes=useRef<THREE.Group>(null),brows=useRef<THREE.Group>(null),reaction=useRef(0);
 useFrame(({clock},delta)=>{
  const target=patient&&cue?(['extract','decay'].includes(cue.action)?1:-1):0;
  reaction.current=THREE.MathUtils.damp(reaction.current,target,4,delta);
  const pain=Math.max(0,reaction.current),joy=Math.max(0,-reaction.current);
  const blink=Math.pow(Math.max(0,Math.sin(clock.elapsedTime*1.3+(bad?1:0))),48);
  if(eyes.current)eyes.current.scale.y=Math.max(.12,1-pain*.67-blink*.9);
  if(brows.current)for(const brow of brows.current.children)brow.rotation.z=Math.sign(brow.position.x)*(-.04-pain*.24+joy*.13+(bad?-.10:0));
 });
 return <>
  <mesh geometry={headGeometry} dispose={null} scale={[.55,.78,.49]}><meshStandardMaterial color={skin} roughness={.72}/></mesh>
  {[-1,1].map(side=><Orb key={side} position={[side*.52,-.04,0]} scale={[.105,.17,.105]} color={skin}/>)}
  <Orb position={[0,.54,-.09]} scale={[.56,.31,.44]} color={bad?'#30262c':patient?'#3d302b':'#293846'}/>
  {!bad&&!patient&&<Orb position={[.24,.55,-.38]} scale={[.28,.26,.24]} color="#293846"/>}
  {[-1,1].map(side=><Orb key={side} position={[side*.49,.23,-.04]} scale={[.09,.35,.34]} color={bad?'#30262c':patient?'#3d302b':'#293846'}/>)}
  <group ref={eyes} position={[0,.15,0]}>{[-1,1].map(side=><group key={side}>
   <Orb position={[side*.22,0,.462]} scale={[.145,.073,.045]} color="#e9eded"/>
   <Orb position={[side*.22,-.005,.506]} scale={[.047,.058,.014]} color={patient?'#596b5d':'#446874'}/>
   <Orb position={[side*.22,-.005,.522]} scale={[.024,.041,.009]} color="#122334"/>
   <Orb position={[side*.209,.015,.532]} scale={[.012,.015,.006]} color="#f7ffff"/>
  </group>)}</group>
  <group ref={brows} position={[0,.34,.47]}>{[-1,1].map(side=><mesh key={side} position={[side*.22,0,0]} rotation={[0,0,side*(bad?-.14:-.04)]} scale={[.17,.025,.023]} geometry={sphere} dispose={null}><meshStandardMaterial color="#47372f"/></mesh>)}</group>
  <Orb position={[0,-.07,.49]} scale={[.085,.15,.10]} color={skin}/>
  {patient?<><Orb position={[0,-.36,.454]} scale={[.335,.195,.11]} color="#a9666b"/><Orb position={[0,-.36,.548]} scale={[.308,.164,.035]} color="#33222a"/></>:<Block position={[0,-.30,.46]} size={[.57,.29,.10]} color={bad?'#c4cdd4':'#bcdfdf'} radius={.065}/>}
  {bad&&[-1,1].map(side=><mesh key={side} position={[side*.22,.15,.53]} scale={[1,.76,1]}><torusGeometry args={[.16,.012,6,28]}/><meshStandardMaterial color="#607381" metalness={.7} roughness={.3}/></mesh>)}
 </>;
}
export function PatientActor({cue,children}:{cue?:AnimationCue;children:React.ReactNode}){
 const breathing=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(breathing.current)breathing.current.scale.y=1+Math.sin(clock.elapsedTime*1.4)*.006});
 return <>
  <Block position={[0,1.16,-.66]} size={[2.48,3.25,.48]} color="#286b76" radius={.3}/>
  <Block position={[0,2.91,-.48]} size={[1.68,1.35,.36]} color="#43848b" radius={.24}/>
  <Block position={[0,-.31,-.23]} size={[2.30,.45,1.65]} color="#306b79" radius={.22}/>
  {[-1,1].map(side=><group key={side}><Block position={[side*1.28,.11,.15]} size={[.30,.24,1.76]} color="#d4e0e1"/><Limb from={[side*1.28,-.72,-.1]} to={[side*1.28,.01,-.1]} radius={.07} color="#718a95"/></group>)}
  <Block position={[0,-1.23,-.43]} size={[1.25,1.24,.95]} color="#8299a1" radius={.16} metalness={.6}/>
  <Block position={[0,-1.72,-.4]} size={[2.95,.19,2.08]} color="#627984" metalness={.5}/>
  <group ref={breathing}>
   <Orb position={[0,1.05,-.01]} scale={[1.01,1.08,.42]} color="#607886"/>
   <Block position={[0,1.15,.39]} size={[1.54,1.45,.09]} color="#a3c7c5" radius={.12}/>
   <Orb position={[0,2.02,-.02]} scale={[.27,.45,.27]} color={skin}/>
   {[-1,1].map(side=><group key={'leg'+side}><Limb from={[side*.36,.05,.03]} to={[side*.40,-.70,.72]} radius={.26} color="#314957"/><Limb from={[side*.40,-.70,.72]} to={[side*.40,-1.37,1.02]} radius={.20} color="#314957"/><Block position={[side*.4,-1.48,1.12]} size={[.43,.22,.65]} color="#728996" radius={.08}/></group>)}
   {[-1,1].map(side=><group key={side}><Limb from={[side*.79,1.57,.04]} to={[side*1.04,.83,.16]} radius={.19} color="#607886"/><Limb from={[side*1.04,.83,.16]} to={[side*1.11,.23,.58]} radius={.135} color={skin}/><Orb position={[side*1.11,.19,.63]} scale={[.15,.23,.095]} color={skin}/></group>)}
  </group>
  <group position={[0,2.95,0]} scale={1.12}><Face patient cue={cue}/></group>
  <group position={MOUTH_VIEWS.patient.position} scale={MOUTH_VIEWS.patient.scale}>{children}</group>
 </>;
}
function TreatmentArm({bad,active,cue}:{bad:boolean;active:boolean;cue?:AnimationCue}){
 const root=useRef<THREE.Group>(null),upper=useRef<THREE.Mesh>(null),forearm=useRef<THREE.Mesh>(null),hand=useRef<THREE.Group>(null),start=useRef(0),last=useRef<number|undefined>(undefined);
 const v=useMemo(()=>({shoulder:new THREE.Vector3(bad?.58:-.58,2.03,.10),elbow:new THREE.Vector3(),wrist:new THREE.Vector3(),target:new THREE.Vector3(),rest:new THREE.Vector3(bad?.82:-.82,1.03,.5),direction:new THREE.Vector3()}),[bad]);
 useFrame(({clock})=>{
  if(cue&&last.current!==cue.id){last.current=cue.id;start.current=clock.elapsedTime;}
  const t=cue?Math.min(1,(clock.elapsedTime-start.current)/((cue.durationMs??3800)/1000)):0,phase=procedurePhase(t);
  v.target.set(...toothWorldPosition(cue?.targetId??7,'patient'));v.target.z+=.32;
  if(cue?.action==='extract'){v.target.y+=(cue.targetId<16?1:-1)*phase.work*.72*MOUTH_VIEWS.patient.scale;v.target.z+=phase.work*.62*MOUTH_VIEWS.patient.scale;}
  if(root.current){root.current.updateWorldMatrix(true,false);root.current.worldToLocal(v.target)}
  v.wrist.copy(v.rest).lerp(v.target,active?phase.reach:0);v.elbow.copy(v.shoulder).lerp(v.wrist,.48);v.elbow.y-=.26;v.elbow.z+=.35;
  for(const [mesh,a,b] of [[upper.current,v.shoulder,v.elbow],[forearm.current,v.elbow,v.wrist]] as const){if(!mesh)continue;mesh.position.copy(a).add(b).multiplyScalar(.5);v.direction.copy(b).sub(a);mesh.scale.set(.13,v.direction.length(),.13);mesh.quaternion.setFromUnitVectors(axis,v.direction.normalize());}
  if(hand.current)hand.current.position.copy(v.wrist);
 });
 return <group ref={root}>
  <mesh ref={upper} geometry={cylinder} dispose={null}><meshStandardMaterial color={coat}/></mesh><mesh ref={forearm} geometry={cylinder} dispose={null}><meshStandardMaterial color={coat}/></mesh>
  <group ref={hand}><Orb position={[0,0,0]} scale={[.15,.18,.10]} color="#b7d9d8"/><mesh position={[0,.05,-.18]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.035,.30,12]}/><meshStandardMaterial color="#a1b8c3" metalness={.8} roughness={.25}/></mesh></group>
 </group>;
}
export function Clinician({bad,cue,ownerName}:{bad:boolean;cue?:AnimationCue;ownerName?:string}){
 const root=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),forceps=useRef<THREE.Group>(null),jawLeft=useRef<THREE.Group>(null),jawRight=useRef<THREE.Group>(null),last=useRef<number|undefined>(undefined),start=useRef(0);const active=!!cue&&(bad?['extract','decay']:['implant','heal']).includes(cue.action),side=bad?-1:1;
 useFrame(({clock},delta)=>{
  if(cue&&last.current!==cue.id){last.current=cue.id;start.current=clock.elapsedTime;}
  const t=cue?Math.min(1,(clock.elapsedTime-start.current)/((cue.durationMs??3800)/1000)):0,reach=active?procedurePhase(t).reach:0;
  if(root.current){root.current.position.x=side*(3.40-reach*1.75);root.current.position.y=.15+(!bad?Math.sin(clock.elapsedTime*3.4)*.10:0);root.current.rotation.z=!bad?Math.sin(clock.elapsedTime*2.5)*.035:0;}
  if(head.current){head.current.rotation.z=THREE.MathUtils.damp(head.current.rotation.z,side*.10*reach,5,delta);head.current.rotation.y=side*-.1;}
  if(forceps.current){forceps.current.position.y=bad?1.06+Math.sin(clock.elapsedTime*5.2)*.16:.88;forceps.current.rotation.z=bad?Math.sin(clock.elapsedTime*2.6)*.11:0;}
  const jaw=Math.sin(clock.elapsedTime*10)*.24;
  if(jawLeft.current)jawLeft.current.rotation.z=bad?jaw:0;
  if(jawRight.current)jawRight.current.rotation.z=bad?-jaw:0;
 });
 return <group ref={root} position={[side*3.4,.15,-.08]}>
  <Block position={[0,1.32,0]} size={[1.34,1.88,.65]} color={coat} radius={.20}/>
  <Block position={[0,1.77,.354]} size={[.37,.78,.045]} color={bad?'#844154':'#297b83'} radius={.025}/>
  {[-1,1].map(s=><group key={s}><mesh position={[s*.23,2.03,.36]} rotation={[0,0,s*.33]}><boxGeometry args={[.27,.52,.035]}/><meshStandardMaterial color="#f3f7f6"/></mesh><Block position={[s*.36,.92,.342]} size={[.32,.24,.035]} color="#d1dfe0" radius={.02}/><Limb from={[s*.31,.38,0]} to={[s*.31,-1.70,.05]} radius={.19} color={navy}/><Block position={[s*.31,-1.87,.16]} size={[.43,.23,.75]} color="#dae5e5" radius={.09}/></group>)}
  <Block position={[side*.38,1.8,.36]} size={[.25,.23,.025]} color="#648b9b" radius={.025}/>
  <Block position={[side*.38,1.8,.38]} size={[.16,.035,.015]} color="#e4eded" radius={.01}/>
  <Orb position={[0,2.39,0]} scale={[.18,.28,.19]} color={skin}/>
  <group ref={head} position={[0,3.02,0]}><Face bad={bad}/></group>
  <Limb from={[side*.62,2.01,.03]} to={[side*.88,1.37,.09]}/><Limb from={[side*.88,1.37,.09]} to={[side*.72,.94,.35]} radius={.11}/>
  {bad?<group ref={forceps} position={[side*.72,.88,.37]}><Orb position={[0,0,0]} scale={[.14,.18,.09]} color="#b7d9d8"/><mesh position={[0,.16,0]}><cylinderGeometry args={[.018,.026,.30,10]}/><meshStandardMaterial color="#c5d4d8" metalness={.9} roughness={.22}/></mesh><group ref={jawLeft} position={[-.045,.29,0]}><mesh position={[-.025,.105,0]} rotation={[0,0,-.20]}><cylinderGeometry args={[.012,.018,.23,8]}/><meshStandardMaterial color="#d9e2e4" metalness={.92} roughness={.2}/></mesh></group><group ref={jawRight} position={[.045,.29,0]}><mesh position={[.025,.105,0]} rotation={[0,0,.20]}><cylinderGeometry args={[.012,.018,.23,8]}/><meshStandardMaterial color="#d9e2e4" metalness={.92} roughness={.2}/></mesh></group></group>:<Orb position={[side*.72,.88,.37]} scale={[.14,.19,.09]} color="#b7d9d8"/>}
  {ownerName&&<Text font="/fonts/DejaVuSans.ttf" position={[0,3.82,.28]} fontSize={.23} maxWidth={3.1} anchorX="center" color={bad?'#ffcfb5':'#b9fff0'} outlineWidth={.018} outlineColor="#101f2d">@{ownerName.replace(/^@+/,'')}</Text>}
  <TreatmentArm bad={bad} active={active} cue={cue}/>
 </group>;
}
export function ClinicRoom(){return <>
 <Block position={[0,1.2,-3.1]} size={[12.8,11,.3]} color="#233c4b" radius={.04}/>
 <Block position={[0,-1.94,-.3]} size={[13,.2,7]} color="#36515d" radius={.02}/>
 {[-5.5,-2.7,2.7,5.5].map(x=><Block key={x} position={[x,1.5,-2.90]} size={[.035,8,.025]} color="#54747b" radius={.005}/>)}
 <Block position={[0,4.9,-2.7]} size={[6.7,.055,.05]} color="#9dd2ce" radius={.01}/>
 <group position={[-4.65,.35,-2.45]}><Block position={[0,0,0]} size={[1.75,2.7,.65]} color="#9cb8bf"/>{[-.8,0,.8].map(y=><group key={y}><Block position={[0,y,.34]} size={[1.63,.72,.05]} color="#bfd0d1" radius={.025}/><Block position={[.47,y,.39]} size={[.26,.04,.03]} color="#62858d" radius={.01}/></group>)}</group>
 <group position={[4.50,2.8,-2.65]}><Block position={[0,0,0]} size={[2.05,1.5,.16]} color="#172c3b" radius={.08}/><Block position={[0,0,.10]} size={[1.83,1.27,.02]} color="#4c7a86" radius={.04}/>{[-.5,-.2,.1,.4].map(x=><Orb key={x} position={[x,.05,.15]} scale={[.09,.24,.015]} color="#c7e4df"/>)}</group>
 <group position={[4.5,-.6,.7]}><Block position={[0,.65,0]} size={[1.65,.14,.90]} color="#b9ced1" radius={.06} metalness={.5}/><Limb from={[0,-.9,0]} to={[0,.6,0]} radius={.055} color="#8aa6ad"/><Block position={[0,-.9,0]} size={[1.35,.08,.8]} color="#688a95" radius={.02}/>{[-.48,0,.48].map(x=><mesh key={x} position={[x,.76,0]} rotation={[0,0,.35]}><cylinderGeometry args={[.025,.025,.62,8]}/><meshStandardMaterial color="#e0eded" metalness={.8} roughness={.25}/></mesh>)}</group>
 <Limb from={[1.1,5.15,-2]} to={[.35,4.75,.1]} radius={.07} color="#aec3c7"/>
 <group position={[.1,4.55,.16]} rotation={[.2,0,-.1]}><Block position={[0,0,0]} size={[1.8,.68,.22]} color="#a8c6cc" radius={.18}/>{[-.5,0,.5].map(x=><mesh key={x} position={[x,0,.15]}><sphereGeometry args={[.18,18,12]}/><meshStandardMaterial color="#ebffff" emissive="#a5e0df" emissiveIntensity={.9}/></mesh>)}</group>
 </>}
