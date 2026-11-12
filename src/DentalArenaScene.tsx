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
 const group=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(group.current){const pulse=champion?1+.035*Math.sin(clock.elapsedTime*3):1;group.current.scale.setScalar(pulse)}});
 const affected=activeCue?.targetId===id;
 return <group ref={group} position={[x,y,z]} rotation={[0,-angle*.42,0]} scale={size}>
 {champion&&<><mesh position={[0,upper?.48:-.48,-.1]}><torusGeometry args={[.31,.035,8,32]}/><meshBasicMaterial color={gold}/></mesh><pointLight color="#ffbf44" intensity={1.7} distance={1.4}/></>}
 {locked?<><mesh position={[0,upper?-.09:.09,.08]}><sphereGeometry args={[.17,16,12]}/><meshStandardMaterial color="#741a38"/></mesh><Text position={[0,0,.4]} fontSize={.24} color="#ff6685">✕</Text></>:<mesh position={[0,upper?-.1:.1,0]} scale={[.23,.37,.26]}><sphereGeometry args={[1,24,20]}/><meshPhysicalMaterial color="#fff5e9" roughness={.22} clearcoat={.8}/></mesh>}
 {name&&<group position={[0,upper?-.53:.53,.34]}><mesh scale={[.45,.19,.02]}><planeGeometry args={[1,1]}/><meshBasicMaterial color={champion?'#654117':'#172747'} transparent opacity={.94}/></mesh><Text position={[0,.055,.025]} fontSize={.13} maxWidth={.8} color="#ffffff" anchorX="center">{name.slice(0,9)}</Text><Text position={[0,-.075,.025]} fontSize={.11} color={gold}>{coins?.toLocaleString('tr-TR')}</Text></group>}
 {champion&&<Text position={[0,upper?.69:-.69,.25]} fontSize={.27} color={gold}>♛{(rank??0)+1}</Text>}
 {affected&&<mesh position={[0,0,.18]}><torusGeometry args={[.35,.035,8,32]}/><meshBasicMaterial color={activeCue?.action==='extract'?'#ff365d':'#53ffbd'}/></mesh>}
 </group>;
}
function Patient({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){
 const rankedPlayers=ranked(state);const positions=new Map(rankedPlayers.slice(0,28).map((p,i)=>[POSITIONS[i],{...p,rank:i}]));
 const teeth=useMemo(()=>POSITIONS.slice().sort((a,b)=>a-b),[]);
 const jaw=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(jaw.current)jaw.current.rotation.x=Math.sin(clock.elapsedTime*.7)*.012});
 return <group ref={jaw} position={[0,-.05,0]}>
 {/* Patient head and cheeks, viewed face-on */}
 <mesh position={[0,0,-1.18]} scale={[4.6,3.5,.83]}><sphereGeometry args={[1,56,36]}/><meshStandardMaterial color="#e9a888" roughness={.73}/></mesh>
 <mesh position={[-3.9,-.12,-.35]} scale={[.9,1.9,.9]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#df987e"/></mesh>
 <mesh position={[3.9,-.12,-.35]} scale={[.9,1.9,.9]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#df987e"/></mesh>
 <mesh position={[0,2.1,-.42]} scale={[.9,.95,.9]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#d99479"/></mesh>
 <mesh position={[0,2.45,.35]} scale={[.68,.21,.35]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e5a48b"/></mesh>
 {/* Open mouth cavity and lips */}
 <mesh position={[0,-.12,-.19]} scale={[3.68,1.64,.29]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#b84b62" roughness={.45}/></mesh>
 <mesh position={[0,-.13,.06]} scale={[3.48,1.43,.18]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#200616" roughness={.8}/></mesh>
 <mesh position={[0,-.87,.23]} scale={[2.08,.42,.23]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#c95776" roughness={.66}/></mesh>
 <mesh position={[0,.49,.15]} scale={[3.3,.35,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 <mesh position={[0,-.72,.16]} scale={[3.25,.33,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 {/* Separate anatomically arranged upper/lower rows, each 14 teeth */}
 <group position={[0,.53,.34]}>{teeth.filter(id=>id<16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 <group position={[0,-.76,.38]}>{teeth.filter(id=>id>=16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 </group>;
}
function Doctor({side,active}:{side:'bad'|'good';active:boolean}){
 const bad=side==='bad';const ref=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(ref.current){ref.current.position.y=-.8+Math.sin(clock.elapsedTime*1.8+(bad?0:1))*.065;ref.current.rotation.z=active?Math.sin(clock.elapsedTime*8)*.06:0}});
 return <group ref={ref} position={[bad?-5.55:5.55,-.8,.3]} scale={1.1}>
 <mesh position={[0,-1.55,0]} scale={[.9,1.1,.52]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'} roughness={.55}/></mesh>
 <mesh position={[0,-.2,.06]} scale={[.54,.69,.49]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e1a283"/></mesh>
 <mesh position={[0,.3,.07]} scale={[.57,.33,.5]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#27122e':'#17233f'}/></mesh>
 <mesh position={[0,-.42,.5]} scale={[.43,.19,.12]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={bad?'#4c1735':'#d9f5ff'}/></mesh>
 {[-.22,.22].map((x,i)=><mesh key={i} position={[x,-.1,.53]} scale={[.06,.06,.025]}><sphereGeometry args={[1,12,12]}/><meshBasicMaterial color="#172036"/></mesh>)}
 <mesh position={[bad?.72:-.72,-1.1,.3]} rotation={[0,0,bad?-.7:.7]} scale={[.17,.8,.18]}><capsuleGeometry args={[1,1,6,12]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'}/></mesh>
 <mesh position={[bad?1.15:-1.15,-.35,.55]} rotation={[0,0,bad?.4:-.4]} scale={[.09,.43,.09]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color="#c6e8f7" metalness={.8} roughness={.2}/></mesh>
 <mesh position={[bad?1.3:-1.3,.05,.55]} scale={[.17,.2,.12]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={bad?'#ff6b80':'#65ffd7'} emissive={bad?'#8c1530':'#0a7c65'} emissiveIntensity={active?2:.5}/></mesh>
 <Text position={[0,-2.8,.4]} fontSize={.27} color={bad?'#ff8ab6':'#8cfce7'}>{bad?'KÖTÜ HEKİM':'İYİ HEKİM'}</Text>
 <Text position={[0,-3.15,.4]} fontSize={.17} color="#ffffff">{bad?'☕ ÇEKİM':'🧴 İMPLANT'}</Text>
 </group>;
}
function Scene({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){
 return <Canvas gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} dpr={[1,1.7]} camera={{position:[0,0,13.8],fov:52}}><ambientLight intensity={1.6}/><hemisphereLight args={['#b3deff','#4b153f',2]}/><pointLight position={[-5,5,6]} intensity={95} color="#64c6ff"/><pointLight position={[5,3,5]} intensity={95} color="#ff8dd4"/>
 <group position={[0,.2,0]}><Patient state={state} now={now} cue={cue}/><Doctor side="bad" active={cue?.action==='extract'}/><Doctor side="good" active={cue?.action==='implant'}/></group>
 </Canvas>;
}
export function DentalArenaScene({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){return <div className="dental-3d-stage"><div className="dental-clinic-bg"><div className="dental-light dental-light-left"/><div className="dental-light dental-light-right"/></div><div className="dental-3d-title">🦷 DİŞ ARENA <span>2 ÜST · 2 ALT · 4 KAZANAN</span></div><Scene state={state} now={now} cue={cue}/>{cue&&<div className={'dental-action-banner '+(cue.action==='extract'?'danger':'success')}>{cue.action==='extract'?'🦷 KÖTÜ HEKİM · ÇEKİM':'🔩 İYİ HEKİM · İMPLANT'}</div>}</div>}
