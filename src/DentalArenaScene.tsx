import React,{useMemo,useRef} from 'react';
import{Canvas,useFrame}from'@react-three/fiber';
import{Text}from'@react-three/drei';
import*as THREE from'three';
import{POSITIONS,ranked,isLocked,type CoinArena}from'./coinArena';
import type{AnimationCue}from'./ActionAnimation';
const gold='#ffcf56';
function Tooth({id,rank,name,coins,locked,now,activeCue}:{id:number;rank?:number;name?:string;coins?:number;locked:boolean;now:number;activeCue?:AnimationCue}){
 const upper=id<16;const slot=upper?id:id-16;const angle=(slot-7.5)/7.5*1.13;const x=Math.sin(angle)*3.5;const z=Math.cos(angle)*.65;
 const y=upper?-.12:.12;const size=upper?1:.83;const champion=rank!==undefined&&rank<4;
 const group=useRef<THREE.Group>(null);const affected=activeCue?.targetId===id;
 useFrame(({clock})=>{if(group.current){const pulse=champion?1+.035*Math.sin(clock.elapsedTime*3):1;group.current.scale.setScalar(pulse);if(affected){const t=clock.elapsedTime;group.current.rotation.z=Math.sin(t*13)*.08;group.current.position.z=.18+.12*Math.sin(t*9)}else{group.current.rotation.z=0;group.current.position.z=0}}});
 return <group ref={group} position={[x,y,z]} rotation={[0,-angle*.42,0]} scale={size}>
 {champion&&<><mesh position={[0,upper?.48:-.48,-.1]}><torusGeometry args={[.31,.035,8,32]}/><meshBasicMaterial color={gold}/></mesh><pointLight color="#ffbf44" intensity={1.7} distance={1.4}/></>}
 {locked?<><mesh position={[0,upper?-.09:.09,.08]}><sphereGeometry args={[.17,16,12]}/><meshStandardMaterial color="#741a38"/></mesh><Text position={[0,0,.4]} fontSize={.24} color="#ff6685">✕</Text></>:<mesh position={[0,upper?-.1:.1,0]} scale={[.23,.37,.26]}><sphereGeometry args={[1,24,20]}/><meshPhysicalMaterial color="#fff5e9" roughness={.22} clearcoat={.8}/></mesh>}
 {name&&<group position={[0,upper?-.53:.53,.34]}><mesh scale={[.45,.19,.02]}><planeGeometry args={[1,1]}/><meshBasicMaterial color={champion?'#654117':'#172747'} transparent opacity={.94}/></mesh><Text position={[0,.055,.025]} fontSize={.13} maxWidth={.8} color="#ffffff" anchorX="center">{name.slice(0,9)}</Text><Text position={[0,-.075,.025]} fontSize={.11} color={gold}>{coins?.toLocaleString('tr-TR')}</Text></group>}
 {champion&&<Text position={[0,upper?.69:-.69,.25]} fontSize={.27} color={gold}>♛{(rank??0)+1}</Text>}
 {affected&&<><mesh position={[0,0,.18]}><torusGeometry args={[.35,.035,8,32]}/><meshBasicMaterial color={activeCue?.action==='extract'?'#ff365d':'#53ffbd'}/></mesh>
 {activeCue?.action==='implant'&&<group position={[0,0,.34]} rotation={[Math.PI/2,0,0]}><mesh><cylinderGeometry args={[.1,.12,.47,16]}/><meshStandardMaterial color="#a5c8d9" metalness={.95} roughness={.17}/></mesh>{[-.17,-.09,0,.09,.17].map(i=><mesh key={i} position={[0,i,0]}><torusGeometry args={[.115,.018,6,18]}/><meshStandardMaterial color="#effaff" metalness={.85}/></mesh>)}</group>}
 </>}
 </group>;
}
function Patient({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){
 const rankedPlayers=ranked(state);const positions=new Map(rankedPlayers.slice(0,28).map((p,i)=>[POSITIONS[i],{...p,rank:i}]));
 const teeth=useMemo(()=>POSITIONS.slice().sort((a,b)=>a-b),[]);
 const jaw=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(jaw.current)jaw.current.rotation.x=Math.sin(clock.elapsedTime*.7)*.012});
 return <group ref={jaw} position={[0,-.05,0]}>
 {/* Dental chair and patient's shoulders */}
 <mesh position={[0,-3.45,-2.5]} scale={[3.8,1.6,.55]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#3e7d9b" roughness={.5}/></mesh>
 <mesh position={[0,-2.8,-2.1]} scale={[2.1,1.2,.6]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e8a587"/></mesh>
 {/* Patient head and cheeks, viewed face-on */}
 <mesh position={[0,0,-1.18]} scale={[4.6,3.5,.83]}><sphereGeometry args={[1,56,36]}/><meshStandardMaterial color="#e9a888" roughness={.73}/></mesh>
 <mesh position={[-3.9,-.12,-.35]} scale={[.9,1.9,.9]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#df987e"/></mesh>
 <mesh position={[3.9,-.12,-.35]} scale={[.9,1.9,.9]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#df987e"/></mesh>
 <mesh position={[0,2.1,-.42]} scale={[.9,.95,.9]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#d99479"/></mesh>
 <mesh position={[0,2.45,.35]} scale={[.68,.21,.35]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e5a48b"/></mesh>
 {/* Hairline and hairstyle */}
 <mesh position={[0,2.9,-.84]} scale={[3.25,.9,.7]}><sphereGeometry args={[1,48,28]}/><meshStandardMaterial color="#30252b" roughness={.92}/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*3.27,1.55,-.62]} rotation={[0,0,side*.16]} scale={[.48,1.4,.48]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#33252d"/></mesh>)}
 {/* Nose and nostrils */}
 <mesh position={[0,.65,.08]} scale={[.44,.68,.45]}><sphereGeometry args={[1,28,20]}/><meshStandardMaterial color="#e5a48b"/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*.26,.31,.46]} scale={[.11,.06,.03]}><sphereGeometry args={[1,14,12]}/><meshStandardMaterial color="#9d6459"/></mesh>)}
 {/* Patient's eyes, brows and cheek details */}
 {[-1,1].map(side=><React.Fragment key={side}>
  <mesh position={[side*1.45,1.25,-.35]} scale={[.67,.28,.17]}><sphereGeometry args={[1,28,16]}/><meshStandardMaterial color="#f5f0eb"/></mesh>
  <mesh position={[side*1.45,1.25,-.16]} scale={[.16,.21,.06]}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color="#3b6175"/></mesh>
  <mesh position={[side*1.45,1.25,-.08]} scale={[.08,.12,.03]}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#111c29"/></mesh>
  <mesh position={[side*1.45,1.66,-.32]} rotation={[0,0,side*-.13]} scale={[.75,.085,.09]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#5b302d"/></mesh>
  <mesh position={[side*2.85,.03,-.03]} scale={[.55,.75,.2]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#d99480" transparent opacity={.56}/></mesh>
 </React.Fragment>)}
 {/* Mouth cavity with shaded gingival rim */}
 <mesh position={[0,-.14,-.04]} scale={[3.82,1.82,.24]}><sphereGeometry args={[1,64,32]}/><meshPhysicalMaterial color="#a63e58" roughness={.45} clearcoat={.2}/></mesh>
 {/* Open mouth cavity and lips */}
 <mesh position={[0,-.12,-.19]} scale={[3.68,1.64,.29]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#b84b62" roughness={.45}/></mesh>
 <mesh position={[0,-.13,.06]} scale={[3.48,1.43,.18]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#200616" roughness={.8}/></mesh>
 <mesh position={[0,-.87,.23]} scale={[2.08,.42,.23]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#c95776" roughness={.66}/></mesh>
 <mesh position={[0,.79,.19]} scale={[3.08,.25,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 <mesh position={[0,-1.07,.17]} scale={[3.07,.24,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 {/* Separate anatomically arranged upper/lower rows, each 14 teeth */}
 <group position={[0,.53,.48]}>{teeth.filter(id=>id<16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 <group position={[0,-.76,.48]}>{teeth.filter(id=>id>=16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 </group>;
}
function Doctor({side,active}:{side:'bad'|'good';active:boolean}){
 const bad=side==='bad';const ref=useRef<THREE.Group>(null);const arm=useRef<THREE.Group>(null);const tool=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(ref.current){ref.current.position.y=-.8+Math.sin(clock.elapsedTime*1.8+(bad?0:1))*.065;ref.current.position.x=THREE.MathUtils.lerp(ref.current.position.x,bad?(-5.55+(active?1.1:0)):(5.55-(active?1.1:0)),.08);ref.current.rotation.z=active?Math.sin(clock.elapsedTime*8)*.025:0}if(arm.current){arm.current.rotation.z=active?(bad?-.75:.75)+Math.sin(clock.elapsedTime*8)*.15:bad?-.15:.15}if(tool.current){tool.current.rotation.z=active?Math.sin(clock.elapsedTime*12)*.12:0}});
 return <group ref={ref} position={[bad?-5.55:5.55,-.8,.3]} scale={1.1}>
 <mesh position={[0,-1.55,0]} scale={[.9,1.1,.52]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'} roughness={.55}/></mesh>
 {/* Stethoscope loop and clinic gloves */}
 <mesh position={[0,-.97,.52]} rotation={[0,0,.12]}><torusGeometry args={[.3,.025,8,40,Math.PI*1.4]}/><meshStandardMaterial color="#18283b" metalness={.3}/></mesh>
 <mesh position={[0,-.2,.06]} scale={[.54,.69,.49]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e1a283"/></mesh>
 <mesh position={[0,.3,.07]} scale={[.57,.33,.5]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#27122e':'#17233f'}/></mesh>
 <mesh position={[0,-.42,.5]} scale={[.43,.19,.12]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={bad?'#4c1735':'#d9f5ff'}/></mesh>
 {/* Sculpted hair, ears, brows, eyes and face mask */}
 {[-1,1].map(side=><React.Fragment key={side}>
 <mesh position={[side*.55,-.2,.03]} scale={[.13,.23,.16]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#d59a7c"/></mesh>
 <mesh position={[side*.2,-.01,.54]} scale={[.055,.035,.02]}><sphereGeometry args={[1,12,10]}/><meshBasicMaterial color="#172438"/></mesh>
 <mesh position={[side*.2,.09,.54]} rotation={[0,0,side*.1]} scale={[.17,.035,.04]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#3d2a33"/></mesh>
 </React.Fragment>)}
 <mesh position={[0,.5,-.03]} scale={[.52,.21,.46]}><sphereGeometry args={[1,24,14]}/><meshStandardMaterial color={bad?'#351d35':'#29324b'}/></mesh>
 <mesh position={[0,-.38,.59]} scale={[.34,.18,.08]}><sphereGeometry args={[1,24,14]}/><meshStandardMaterial color="#dcebf1" roughness={.75}/></mesh>
 {/* Tailored white lab coat, collar and badge */}
 <mesh position={[0,-1.53,.36]} scale={[.77,.92,.25]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#edf5f8" roughness={.55}/></mesh>
 <mesh position={[0,-1.6,.53]} scale={[.18,.75,.035]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={bad?'#9b2554':'#118eab'}/></mesh>
 <mesh position={[bad?-.39:.39,-1.12,.55]} scale={[.24,.12,.02]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#3a5e7e"/></mesh>
 <mesh position={[bad?-.39:.39,-1.12,.57]} scale={[.16,.028,.015]}><boxGeometry args={[1,1,1]}/><meshBasicMaterial color="#a5f6ff"/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*.42,-1.7,.56]} scale={[.21,.14,.02]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#c9dce3"/></mesh>)}
 {[-.22,.22].map((x,i)=><mesh key={i} position={[x,-.1,.53]} scale={[.06,.06,.025]}><sphereGeometry args={[1,12,12]}/><meshBasicMaterial color="#172036"/></mesh>)}
 <group ref={arm} position={[bad?.68:-.68,-.96,.3]}>
 <mesh position={[bad?.27:-.27,-.12,0]} rotation={[0,0,bad?-.65:.65]} scale={[.18,.75,.2]}><capsuleGeometry args={[1,1,6,12]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'}/></mesh>
 <mesh position={[bad?.53:-.53,.3,.06]} scale={[.18,.22,.2]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#d8edf3"/></mesh>
 <group ref={tool} position={[bad?.53:-.53,.57,.14]}>
 <mesh scale={[.055,.42,.06]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color="#d9e9f0" metalness={.85} roughness={.16}/></mesh>
 {bad?<mesh position={[0,.28,0]} rotation={[0,0,.4]} scale={[.15,.045,.07]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#e3f3ff" metalness={.9}/></mesh>:<mesh position={[0,.31,0]} scale={[.09,.22,.09]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color="#c8d2e4" metalness={.9}/></mesh>}
 </group></group>
 <Text position={[0,-2.8,.4]} fontSize={.27} color={bad?'#ff8ab6':'#8cfce7'}>{bad?'KÖTÜ HEKİM':'İYİ HEKİM'}</Text>
 <Text position={[0,-3.15,.4]} fontSize={.17} color="#ffffff">{bad?'☕ ÇEKİM':'🧴 İMPLANT'}</Text>
 </group>;
}
function Scene({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){
 return <Canvas gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} dpr={[1,1.7]} camera={{position:[0,0,13.8],fov:52}}><ambientLight intensity={1.6}/><hemisphereLight args={['#b3deff','#4b153f',2]}/><pointLight position={[-5,5,6]} intensity={95} color="#64c6ff"/><pointLight position={[5,3,5]} intensity={95} color="#ff8dd4"/>
 {/* Clinical overhead lighting and room furnishings */}
 <mesh position={[0,4.4,-2.7]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.45,1.45,.14,48]}/><meshStandardMaterial color="#e5f5ff" emissive="#80c5ff" emissiveIntensity={.8}/></mesh>
 <mesh position={[0,4.45,-2.5]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.24,.11,12,64]}/><meshStandardMaterial color="#f8fdff" emissive="#c7f1ff" emissiveIntensity={1.5}/></mesh>
 <spotLight position={[0,5,4]} intensity={90} angle={.8} penumbra={.8} color="#eaf8ff"/>
 <group position={[0,.2,0]}><Patient state={state} now={now} cue={cue}/><Doctor side="bad" active={cue?.action==='extract'}/><Doctor side="good" active={cue?.action==='implant'}/></group>
 </Canvas>;
}
export function DentalArenaScene({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){return <div className="dental-3d-stage"><div className="dental-clinic-bg"><div className="dental-light dental-light-left"/><div className="dental-light dental-light-right"/></div><div className="dental-3d-title">🦷 DİŞ ARENA <span>2 ÜST · 2 ALT · 4 KAZANAN</span></div><Scene state={state} now={now} cue={cue}/>{cue&&<div className={'dental-action-banner '+(cue.action==='extract'?'danger':'success')}>{cue.action==='extract'?'🦷 KÖTÜ HEKİM · ÇEKİM':'🔩 İYİ HEKİM · İMPLANT'}</div>}</div>}
