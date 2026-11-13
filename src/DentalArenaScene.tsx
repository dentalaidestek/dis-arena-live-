import React,{useMemo,useRef} from 'react';
import{Canvas,useFrame}from'@react-three/fiber';
import{Text}from'@react-three/drei';
import*as THREE from'three';
import{POSITIONS,ranked,isLocked,type CoinArena}from'./coinArena';
import type{AnimationCue}from'./ActionAnimation';
const gold='#ffcf56';
function Tooth({id,rank,name,coins,locked,now,activeCue}:{id:number;rank?:number;name?:string;coins?:number;locked:boolean;now:number;activeCue?:AnimationCue}){
 const upper=id<16;const slot=id<16?id:id-16;const centered=Math.abs(slot-7.5);
 const angle=(slot-7.5)/7.5*1.12;const x=Math.sin(angle)*3.32;const z=Math.cos(angle)*.53;
 const posterior=centered>4.5;const canine=centered>2.8&&!posterior;
 const width=posterior?.32:canine?.25:.235;const height=posterior?.27:canine?.40:.36;
 const champion=rank!==undefined&&rank<4;const affected=activeCue?.targetId===id;
 const root=useRef<THREE.Group>(null);const tooth=useRef<THREE.Group>(null);const screw=useRef<THREE.Group>(null);
 const start=useRef(0);const cueId=useRef<number|null>(null);
 useFrame(({clock},delta)=>{
  if(root.current)root.current.scale.setScalar(champion?1+.02*Math.sin(clock.elapsedTime*2.8):1);
  if(affected&&activeCue&&cueId.current!==activeCue.id){cueId.current=activeCue.id;start.current=clock.elapsedTime;}
  const t=affected?Math.min(1,(clock.elapsedTime-start.current)/2.6):0;
  const smooth=t*t*(3-2*t);
  if(tooth.current){
   const extracting=affected&&activeCue?.action==='extract';
   tooth.current.position.y=extracting?(upper?1:-1)*smooth*.72:0;
   tooth.current.position.z=extracting?smooth*.62:0;
   tooth.current.rotation.z=extracting?Math.sin(t*14)*.13*(1-t):0;
   tooth.current.scale.setScalar(extracting?Math.max(.05,1-smooth*.85):1);
   tooth.current.visible=!locked||extracting;
  }
  if(screw.current){
   const implanting=affected&&activeCue?.action==='implant';
   screw.current.visible=!!implanting;
   screw.current.position.y=implanting?(upper?-1:1)*(.72-smooth*.72):0;
   screw.current.rotation.y+=delta*(implanting?13:0);
  }
 });
 return <group ref={root} position={[x,upper?-.12:.12,z]} rotation={[0,-angle*.35,0]}>
 {champion&&<><mesh position={[0,upper?.56:-.56,-.05]}><torusGeometry args={[.29,.028,8,32]}/><meshBasicMaterial color={gold}/></mesh><pointLight color="#ffd56a" intensity={.7} distance={1.3}/></>}
 <mesh position={[0,upper?-.12:.12,-.07]} scale={[width*1.33,.23,.27]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#b84c68" roughness={.58}/></mesh>
 <group ref={tooth}>
 <mesh position={[0,upper?-.04:.04,.11]} scale={[width,height,.23]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial color="#fff9ed" roughness={.18} clearcoat={.85} clearcoatRoughness={.13}/></mesh>
 {posterior?[-1,1].map(side=><mesh key={side} position={[side*.13,upper?-.18:.18,.19]} scale={[.145,.15,.16]}><sphereGeometry args={[1,22,18]}/><meshPhysicalMaterial color="#fffdf6" roughness={.2} clearcoat={.9}/></mesh>):<mesh position={[0,upper?-.27:.27,.15]} scale={[width*.91,.09,.19]}><boxGeometry args={[1,1,1]}/><meshPhysicalMaterial color="#fffdf6" roughness={.17} clearcoat={.9}/></mesh>}
 {canine&&<mesh position={[0,upper?-.38:.38,.15]} rotation={[0,0,Math.PI]}><coneGeometry args={[.13,.2,20]}/><meshPhysicalMaterial color="#fffaf0" roughness={.2}/></mesh>}
 <mesh position={[0,upper?.29:-.29,-.09]} rotation={[upper?0:Math.PI,0,0]} scale={[.12,.28,.13]}><coneGeometry args={[1,1,20]}/><meshStandardMaterial color="#dfd1bb" roughness={.55}/></mesh>
 </group>
 {locked&&!affected&&<mesh position={[0,0,.19]} scale={[width*.9,.13,.14]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#7b2e48"/></mesh>}
 <group ref={screw} visible={false} position={[0,0,.32]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.105,.085,.38,20]}/><meshStandardMaterial color="#b8c7d2" metalness={.86} roughness={.2}/></mesh>{[-.14,-.07,0,.07,.14].map(v=><mesh key={v} position={[0,v,.02]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.108,.014,6,20]}/><meshStandardMaterial color="#e1eaf1" metalness={.85}/></mesh>)}</group>
 {name&&<group position={[0,upper?-.52:.52,.46]}><mesh scale={[.46,.18,.02]}><planeGeometry args={[1,1]}/><meshBasicMaterial color={champion?'#664313':'#142b42'} transparent opacity={.93}/></mesh><Text position={[0,.052,.025]} fontSize={.12} maxWidth={.82} color="#fff">{name.slice(0,9)}</Text><Text position={[0,-.067,.025]} fontSize={.105} color={gold}>{coins?.toLocaleString('tr-TR')}</Text></group>}
 {champion&&<Text position={[0,upper?.73:-.73,.32]} fontSize={.26} color={gold}>♛{(rank??0)+1}</Text>}
 </group>;
}
function Patient({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){
 const rankedPlayers=ranked(state);const positions=new Map(rankedPlayers.slice(0,28).map((p,i)=>[POSITIONS[i],{...p,rank:i}]));
 const teeth=useMemo(()=>POSITIONS.slice().sort((a,b)=>a-b),[]);
 const jaw=useRef<THREE.Group>(null);
 const eyebrows=useRef<THREE.Group>(null);
 const expression=useRef<THREE.Group>(null);
 const lowerLip=useRef<THREE.Mesh>(null);
 const eyeLids=useRef<THREE.Group>(null);
 const reaction=useRef(0);
 useFrame(({clock},delta)=>{
  if(jaw.current)jaw.current.rotation.x=Math.sin(clock.elapsedTime*.7)*.012;
  const target=cue?.action==='extract'?-1:cue?.action==='implant'?1:0;
  reaction.current=THREE.MathUtils.damp(reaction.current,target,3.4,delta);
  const pain=Math.max(0,-reaction.current),joy=Math.max(0,reaction.current);
  if(eyebrows.current){eyebrows.current.position.y=pain*.16+joy*.07;eyebrows.current.scale.y=1+pain*.42;}
  if(expression.current){expression.current.position.y=joy*.13-pain*.08;expression.current.scale.x=1+joy*.16-pain*.12;expression.current.scale.y=1+joy*.08+pain*.18;}
  if(lowerLip.current){lowerLip.current.position.y=-1.07-pain*.17+joy*.09;lowerLip.current.scale.x=3.07+joy*.2;}
  if(eyeLids.current)eyeLids.current.scale.y=1+pain*.9-joy*.25;
 });
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
 {/* Facial expression is driven by the real extraction / implant event */}
 <group ref={eyebrows}>
 {[-1,1].map(side=><mesh key={side} position={[side*1.45,1.66,-.25]} rotation={[0,0,side*-.13]} scale={[.75,.085,.09]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#5b302d"/></mesh>)}
 </group>
 <group ref={eyeLids}>
 {[-1,1].map(side=><mesh key={side} position={[side*1.45,1.42,-.12]} scale={[.64,.055,.07]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color="#d99480"/></mesh>)}
 </group>
 {/* Patient's eyes, brows and cheek details */}
 {[-1,1].map(side=><React.Fragment key={side}>
  <mesh position={[side*1.45,1.25,-.35]} scale={[.67,.28,.17]}><sphereGeometry args={[1,28,16]}/><meshStandardMaterial color="#f5f0eb"/></mesh>
  <mesh position={[side*1.45,1.25,-.16]} scale={[.16,.21,.06]}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color="#3b6175"/></mesh>
  <mesh position={[side*1.45,1.25,-.08]} scale={[.08,.12,.03]}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#111c29"/></mesh>

  <mesh position={[side*2.85,.03,-.03]} scale={[.55,.75,.2]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#d99480" transparent opacity={.56}/></mesh>
 </React.Fragment>)}
 {/* Mouth cavity with shaded gingival rim */}
 <mesh position={[0,-.14,-.04]} scale={[3.82,1.82,.24]}><sphereGeometry args={[1,64,32]}/><meshPhysicalMaterial color="#a63e58" roughness={.45} clearcoat={.2}/></mesh>
 {/* Open mouth cavity and lips */}
 <mesh position={[0,-.12,-.19]} scale={[3.68,1.64,.29]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#b84b62" roughness={.45}/></mesh>
 <mesh position={[0,-.13,.06]} scale={[3.48,1.43,.18]}><sphereGeometry args={[1,64,32]}/><meshStandardMaterial color="#200616" roughness={.8}/></mesh>
 <group ref={expression}>
 <mesh position={[0,-.87,.23]} scale={[2.08,.42,.23]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#c95776" roughness={.66}/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*2.72,-.61,.3]} rotation={[0,0,side*-.45]} scale={[.35,.055,.07]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#c26b70"/></mesh>)}
 </group>
 <mesh position={[0,.79,.19]} scale={[3.08,.25,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 <mesh ref={lowerLip} position={[0,-1.07,.17]} scale={[3.07,.24,.27]}><sphereGeometry args={[1,48,20]}/><meshStandardMaterial color="#f18da0"/></mesh>
 {/* Separate anatomically arranged upper/lower rows, each 14 teeth */}
 <group position={[0,.53,.48]}>{teeth.filter(id=>id<16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 <group position={[0,-.76,.48]}>{teeth.filter(id=>id>=16).map(id=>{const p=positions.get(id);return <Tooth key={id} id={id} rank={p?.rank} name={p?.username} coins={p?.coins} locked={!!p&&isLocked(p,now)} now={now} activeCue={cue}/>})}</group>
 </group>;
}
function Doctor({side,active}:{side:'bad'|'good';active:boolean}){
 const bad=side==='bad';const ref=useRef<THREE.Group>(null);const arm=useRef<THREE.Group>(null);const tool=useRef<THREE.Group>(null);const support=useRef<THREE.Group>(null);const wrist=useRef<THREE.Group>(null);const blink=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(ref.current){ref.current.position.y=-.8+Math.sin(clock.elapsedTime*1.8+(bad?0:1))*.065;ref.current.position.x=bad?-5.55:5.55;ref.current.rotation.z=0}if(arm.current){arm.current.rotation.z=active?(bad?-.75:.75)+Math.sin(clock.elapsedTime*8)*.15:bad?-.15:.15}if(tool.current){tool.current.rotation.z=active?Math.sin(clock.elapsedTime*12)*.12:0}if(support.current){support.current.rotation.z=active?(bad?.42:-.42):0;}if(wrist.current){wrist.current.rotation.z=active?(bad?-.45:.45)+Math.sin(clock.elapsedTime*9)*.14:0;}if(blink.current){const phase=clock.elapsedTime*1.3+(bad?0:1.4);blink.current.scale.y=Math.max(.08,1-.94*Math.pow(Math.max(0,Math.sin(phase)),40));}});
 return <group ref={ref} position={[bad?-5.55:5.55,-.8,.3]} scale={1.45}>
 <mesh position={[0,-1.55,0]} scale={[.9,1.1,.52]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'} roughness={.55}/></mesh>
 {/* Stethoscope loop and clinic gloves */}
 <mesh position={[0,-.97,.52]} rotation={[0,0,.12]}><torusGeometry args={[.3,.025,8,40,Math.PI*1.4]}/><meshStandardMaterial color="#18283b" metalness={.3}/></mesh>
 <mesh position={[0,-.2,.06]} scale={[.54,.69,.49]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#e1a283"/></mesh>
 <mesh position={[0,.3,.07]} scale={[.57,.33,.5]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color={bad?'#27122e':'#17233f'}/></mesh>
 <mesh position={[0,-.42,.5]} scale={[.43,.19,.12]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={bad?'#4c1735':'#d9f5ff'}/></mesh>
 {/* Articulated eyelids, eyelashes, cheeks and expression */}
 <group ref={blink}>{[-1,1].map(k=><React.Fragment key={k}><mesh position={[k*.2,-.015,.555]} scale={[.145,.085,.04]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#f8fafb"/></mesh><mesh position={[k*.2,-.015,.594]} scale={[.053,.065,.022]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={bad?'#764335':'#37748a'}/></mesh><mesh position={[k*.2,-.015,.615]} scale={[.025,.035,.015]}><sphereGeometry args={[1,12,10]}/><meshBasicMaterial color="#101823"/></mesh>{[-1,0,1].map(j=><mesh key={j} position={[k*.2+j*.07,.065,.594]} rotation={[0,0,j*.32]} scale={[.012,.046,.012]}><capsuleGeometry args={[1,1,3,6]}/><meshStandardMaterial color="#25202b"/></mesh>)}</React.Fragment>)}</group>
 {[-1,1].map(k=><mesh key={k} position={[k*.2,.115,.555]} rotation={[0,0,k*(bad?-.2:.08)]} scale={[.19,.038,.035]}><capsuleGeometry args={[1,1,4,12]}/><meshStandardMaterial color={bad?'#251321':'#2b3441'}/></mesh>)}
 <mesh position={[0,-.13,.61]} scale={[.13,.21,.12]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#dca185"/></mesh>
 <mesh position={[0,-.26,.601]} scale={[bad?.19:.23,.045,.02]}><sphereGeometry args={[1,20,10]}/><meshStandardMaterial color={bad?'#793c45':'#9e6268'}/></mesh>
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
 {/* Second hand stays near the patient's head while the instrument hand operates. */}
 <group ref={support} position={[bad?-.66:.66,-.95,.32]}>
 <mesh position={[bad?-.30:.30,.25,0]} rotation={[0,0,bad?.48:-.48]} scale={[.17,.65,.19]}><capsuleGeometry args={[1,1,6,12]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'}/></mesh>
 <mesh position={[bad?-.59:.59,.65,.12]} rotation={[0,0,bad?-.25:.25]} scale={[.23,.16,.12]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#d8edf3"/></mesh>
 </group>
 <group ref={arm} position={[bad?.68:-.68,-.96,.3]}>
 <mesh position={[bad?.27:-.27,-.12,0]} rotation={[0,0,bad?-.65:.65]} scale={[.18,.75,.2]}><capsuleGeometry args={[1,1,6,12]}/><meshStandardMaterial color={bad?'#711c5a':'#0d9cba'}/></mesh>
 <mesh position={[bad?.53:-.53,.3,.06]} scale={[.18,.22,.2]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#d8edf3"/></mesh>
 <group ref={wrist} position={[bad?.53:-.53,.57,.14]}><group ref={tool}>
 <mesh scale={[.055,.42,.06]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color="#d9e9f0" metalness={.85} roughness={.16}/></mesh>
 {bad?<mesh position={[0,.28,0]} rotation={[0,0,.4]} scale={[.15,.045,.07]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#e3f3ff" metalness={.9}/></mesh>:<mesh position={[0,.31,0]} scale={[.09,.22,.09]}><cylinderGeometry args={[1,1,1,12]}/><meshStandardMaterial color="#c8d2e4" metalness={.9}/></mesh>}
 </group></group></group>
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
 <mesh position={[-6.1,-.2,-3.1]} scale={[4.8,7,.12]}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#731a30" transparent opacity={.28}/></mesh>
 <mesh position={[6.1,-.2,-3.1]} scale={[4.8,7,.12]}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#0b8b66" transparent opacity={.28}/></mesh>
 <group position={[0,.2,0]}><Patient state={state} now={now} cue={cue}/><Doctor side="bad" active={cue?.action==='extract'}/><Doctor side="good" active={cue?.action==='implant'}/></group>
 </Canvas>;
}
export function DentalArenaScene({state,now,cue}:{state:CoinArena;now:number;cue?:AnimationCue}){return <div className="dental-3d-stage"><div className="dental-clinic-bg"><div className="dental-light dental-light-left"/><div className="dental-light dental-light-right"/></div><div className="dental-3d-title">🦷 DİŞ ARENA <span>2 ÜST · 2 ALT · 4 KAZANAN</span></div><Scene state={state} now={now} cue={cue}/>{cue&&<div className={'dental-action-banner '+(cue.action==='extract'?'danger':'success')}>{cue.action==='extract'?'🦷 KÖTÜ HEKİM · ÇEKİM':'🔩 İYİ HEKİM · İMPLANT'}</div>}</div>}
