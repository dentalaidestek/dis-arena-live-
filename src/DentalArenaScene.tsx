import React,{useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {RoundedBox,Text} from '@react-three/drei';
import * as THREE from 'three';
import {POSITIONS,ranked,type CoinArena} from './coinArena';
import type {AnimationCue} from './ActionAnimation';
import {MOUTH_VIEWS,sceneToothPosition,procedurePhase} from './procedureMotion';
import {createCrownGeometry} from './toothGeometry';
import {toothLabel} from './routes';
import {ClinicRoom,PatientActor,Clinician} from './ClinicActors';
const gold='#d7b773',teal='#80d8cd';
const crowns={incisor:createCrownGeometry('incisor'),canine:createCrownGeometry('canine'),premolar:createCrownGeometry('premolar'),molar:createCrownGeometry('molar')};
const sphere=new THREE.SphereGeometry(1,24,16),rootGeometry=new THREE.ConeGeometry(1,1,16),cariesColor=new THREE.Color('#8c783e');
type ToothProps={id:number;rank?:number;username?:string;condition?:'decayed'|'extracted';cue?:AnimationCue;mini?:boolean;selected?:boolean;onPick?:(id:number)=>void};
function Tooth({id,rank,username,locked,condition,cue,mini=false,selected=false,onPick}:ToothProps){
 const upper=id<16,slot=upper?id-1:id-17,centered=Math.abs(slot-6.5),angle=(slot-6.5)/6.5*1.12;
 const kind=centered>4.5?'molar':centered>2.5?'premolar':centered>1.5?'canine':'incisor';
 const width=kind==='molar'?.235:kind==='premolar'?.222:kind==='canine'?.208:.20,height=kind==='molar'?.28:kind==='premolar'?.31:kind==='canine'?.37:.35;
 const champion=rank!==undefined&&rank<4,affected=cue?.targetId===id;
 const tooth=useRef<THREE.Group>(null),root=useRef<THREE.Mesh>(null),screw=useRef<THREE.Group>(null),lesion=useRef<THREE.Mesh>(null),healing=useRef<THREE.Mesh>(null),enamel=useRef<THREE.MeshPhysicalMaterial>(null),start=useRef(0),last=useRef<number|undefined>(undefined);
 useFrame(({clock},delta)=>{
  if(affected&&cue&&last.current!==cue.id){last.current=cue.id;start.current=clock.elapsedTime;}
  const t=affected&&cue?Math.min(1,(clock.elapsedTime-start.current)/((cue.durationMs??3800)/1000)):0,work=procedurePhase(t).work;
  const extracting=affected&&cue?.action==='extract',implanting=affected&&cue?.action==='implant';
  const disease=affected&&cue?.action==='decay'?work:affected&&cue?.action==='heal'?1-work:condition==='decayed'?1:0;
  if(enamel.current)enamel.current.color.set('#e9e4d7').lerp(cariesColor,disease*.82);
  if(lesion.current){lesion.current.visible=disease>.04;lesion.current.scale.set(width*.62*disease,.13*disease,.025);}
  if(healing.current){healing.current.visible=affected&&cue?.action==='heal'&&t>.2&&t<.9;healing.current.rotation.z+=delta*1.7;}
  if(tooth.current){tooth.current.position.y=extracting?(upper?1:-1)*work*.72:0;tooth.current.position.z=extracting?work*.62:0;tooth.current.rotation.z=extracting?Math.sin(t*15)*.06:0;tooth.current.scale.setScalar(implanting?Math.max(.001,work):1);tooth.current.visible=implanting?work>.18:extracting?t<.86:condition!=='extracted';}
  if(root.current)root.current.visible=!!extracting&&work>.18;
  if(screw.current){screw.current.visible=!!implanting&&t>.12&&t<.8;screw.current.position.y=(upper?-1:1)*(.75-work*.75);screw.current.rotation.y+=delta*12;}
 });
 return <group position={sceneToothPosition(id)} rotation={[0,-angle*.42,0]} onPointerOver={mini?undefined:e=>{e.stopPropagation();onPick?.(id)}} onClick={mini?undefined:e=>{e.stopPropagation();onPick?.(id)}}>
  <mesh geometry={sphere} dispose={null} position={[0,upper?.25:-.25,-.13]} scale={[width*1.26,.17,.25]}><meshStandardMaterial color="#b8777f" roughness={.6}/></mesh>
  <group ref={tooth}>
   <mesh rotation={[0,0,upper?0:Math.PI]} scale={[width,height,.27]} dispose={null} geometry={crowns[kind]}><meshPhysicalMaterial ref={enamel} color="#e9e4d7" roughness={.28} clearcoat={.35} clearcoatRoughness={.3}/></mesh>
   {(kind==='molar'||kind==='premolar')&&[-1,1].map(side=><mesh key={side} geometry={sphere} dispose={null} position={[side*.105,upper?-.17:.17,.13]} scale={[.10,.105,.10]}><meshStandardMaterial color="#e9e4d7" roughness={.3}/></mesh>)}
   <mesh ref={root} visible={false} geometry={rootGeometry} dispose={null} position={[0,upper?.34:-.34,-.10]} rotation={[upper?0:Math.PI,0,0]} scale={[.10,.37,.11]}><meshStandardMaterial color="#d6cbb7" roughness={.65}/></mesh>
   <mesh ref={lesion} visible={false} geometry={sphere} dispose={null} position={[0,upper?-.08:.08,.24]}><meshStandardMaterial color="#493322" roughness={.98}/></mesh>
   {!mini&&<mesh ref={healing} visible={false} position={[0,0,.35]}><torusGeometry args={[.28,.018,8,32]}/><meshBasicMaterial color={teal}/></mesh>}
  </group>
  {condition==='extracted'&&!affected&&<mesh geometry={sphere} dispose={null} position={[0,.04,.0]} scale={[width*.8,.18,.08]}><meshStandardMaterial color="#663740" roughness={.8}/></mesh>}
  <group ref={screw} visible={false} position={[0,0,.11]}><mesh><cylinderGeometry args={[.07,.065,.38,16]}/><meshStandardMaterial color="#a9bcc3" metalness={.9} roughness={.28}/></mesh>{[-.14,-.07,0,.07,.14].map(v=><mesh key={v} position={[0,v,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.075,.01,6,16]}/><meshStandardMaterial color="#d3dfe0" metalness={.8} roughness={.25}/></mesh>)}</group>
  {!mini&&<>
   <mesh position={[0,upper?.72:-.72,.0]}><circleGeometry args={[.16,20]}/><meshBasicMaterial color={selected||affected?'#376e77':champion?'#6e6241':'#29414f'}/></mesh>
   <Text font="/fonts/DejaVuSans.ttf" position={[0,upper?.72:-.72,.02]} fontSize={.20} color={champion?'#f5d58c':'#d5e2e4'}>{toothLabel(id)}</Text>
   {username&&<Text font="/fonts/DejaVuSans.ttf" position={[0,upper?1.19:-1.19,.02]} fontSize={.14} maxWidth={1.25} color="#f2f7f8" anchorX="center" outlineWidth={.012} outlineColor="#142a38">@{username.replace(/^@+/,"").slice(0,10)}</Text>}
   {champion&&<mesh position={[0,upper?.96:-.96,0]} rotation={[0,0,Math.PI/4]}><planeGeometry args={[.075,.075]}/><meshBasicMaterial color={gold}/></mesh>}
   {(selected||affected)&&<mesh position={[0,0,.25]}><torusGeometry args={[.27,.016,8,32]}/><meshBasicMaterial color={cue?.action==='extract'?'#e5a1a4':teal}/></mesh>}
  </>}
 </group>;
}
function DentalModel({state,now,cue,mini=false,selected,onPick}:{state:CoinArena;now:number;cue?:AnimationCue;mini?:boolean;selected?:number;onPick?:(id:number)=>void}){
 const people=ranked(state),owners=new Map(people.slice(0,28).map((p,i)=>[p.toothId??POSITIONS[i],{...p,rank:i}]));
 return <>{!mini&&<>
  <mesh geometry={sphere} dispose={null} scale={[3.70,1.44,.22]} position={[0,0,.20]}><meshStandardMaterial color="#a9747e" roughness={.58}/></mesh>
  <mesh geometry={sphere} dispose={null} scale={[3.45,1.09,.16]} position={[0,0,.38]}><meshStandardMaterial color="#4a2c35" roughness={.82}/></mesh>
  <mesh geometry={sphere} dispose={null} scale={[1.55,.20,.10]} position={[0,-.28,.59]}><meshStandardMaterial color="#8a535e" roughness={.68}/></mesh>
 </>}{POSITIONS.map(id=>{const p=owners.get(id);return <Tooth key={id} id={id} rank={p?.rank} username={p?.username} condition={p?.condition} cue={cue} mini={mini} selected={id===selected} onPick={onPick}/>})}</>;
}
function OpticalInstrument({cue}:{cue?:AnimationCue}){
 const root=useRef<THREE.Group>(null),last=useRef<number|undefined>(undefined),start=useRef(0),pos=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(({clock})=>{
  if(cue&&last.current!==cue.id){last.current=cue.id;start.current=clock.elapsedTime;}
  if(!root.current)return;root.current.visible=!!cue;if(!cue)return;
  const t=Math.min(1,(clock.elapsedTime-start.current)/((cue.durationMs??3800)/1000)),phase=procedurePhase(t),side=['extract','decay'].includes(cue.action)?-1:1;
  const target=sceneToothPosition(cue.targetId);pos.set(...target);pos.z+=.32;
  if(cue.action==='extract'){pos.y+=(cue.targetId<16?1:-1)*phase.work*.72;pos.z+=phase.work*.62;}
  root.current.position.set(side*4.5,2.4,1.6).lerp(pos,phase.reach);root.current.rotation.z=side*-.55+(cue.action==='extract'?Math.sin(t*20)*.025:0);
 });
 const extract=cue?.action==='extract',heal=cue?.action==='heal';
 return <group ref={root} visible={false}>
  <mesh position={[0,.60,.05]}><cylinderGeometry args={[.055,.07,1.06,16]}/><meshStandardMaterial color="#9bb3bf" metalness={.85} roughness={.24}/></mesh>
  <mesh position={[0,1.04,.05]}><cylinderGeometry args={[.09,.09,.35,16]}/><meshStandardMaterial color={heal?'#75c6b9':'#3b6577'} roughness={.5}/></mesh>
  {extract?[-1,1].map(side=><mesh key={side} position={[side*.07,.09,-.14]} rotation={[side*.2,0,side*-.13]}><boxGeometry args={[.035,.22,.055]}/><meshStandardMaterial color="#d1dfe1" metalness={.85} roughness={.23}/></mesh>):<mesh position={[0,.03,-.16]} rotation={[0,0,.10]}><cylinderGeometry args={[.015,.025,.22,12]}/><meshStandardMaterial color={heal?teal:'#c9d7dc'} metalness={.7} roughness={.3}/></mesh>}
 </group>;
}
function CameraFit({onFps}:{onFps:(fps:number)=>void}){
 const {camera,size}=useThree(),frames=useRef(0),elapsed=useRef(0);
 useFrame((_,delta)=>{frames.current++;elapsed.current+=delta;if(elapsed.current>=2){onFps(Math.round(frames.current/elapsed.current));frames.current=0;elapsed.current=0;}});
 React.useEffect(()=>{const cam=camera as THREE.OrthographicCamera;cam.position.set(0,.8,20);cam.lookAt(0,0,0);cam.zoom=Math.min(size.width/11.9,size.height/12.4);cam.updateProjectionMatrix()},[camera,size.width,size.height]);return null;
}
function Scene({state,now,cue,quality,onFps,selected,onPick}:{state:CoinArena;now:number;cue?:AnimationCue;quality:'low'|'high';onFps:(fps:number)=>void;selected?:number;onPick:(id:number)=>void}){
 return <Canvas orthographic fallback={<SceneFallback/>} gl={{antialias:true,alpha:false,powerPreference:quality==='high'?'high-performance':'low-power'}} dpr={quality==='high'?[1,1.75]:1} camera={{position:[0,.8,20],zoom:32,near:.1,far:60}}>
  <color attach="background" args={['#18303e']}/><CameraFit onFps={onFps}/>
  <ambientLight intensity={.45}/><hemisphereLight args={['#e3f1f3','#304451',1.1]}/><directionalLight position={[-4,8,8]} intensity={2.4} color="#fff1d9"/><directionalLight position={[5,4,5]} intensity={1.6} color="#a4e4e5"/>
  <ClinicRoom/>
  <PatientActor cue={cue}><DentalModel state={state} now={now} cue={cue} mini/></PatientActor>
  <Clinician bad cue={cue} ownerName={state.doctors?.bad?.username} giftImage={state.doctors?.bad?.giftImage} giftName={state.doctors?.bad?.giftName} giftCoins={state.doctors?.bad?.giftCoins}/><Clinician bad={false} cue={cue} ownerName={state.doctors?.good?.username} giftImage={state.doctors?.good?.giftImage} giftName={state.doctors?.good?.giftName} giftCoins={state.doctors?.good?.giftCoins}/>
  <group position={[0,-3.65,1.7]}><RoundedBox args={[10.55,4.42,.22]} radius={.26} smoothness={4}><meshStandardMaterial color="#101f2d" roughness={.48} metalness={.1}/></RoundedBox><RoundedBox position={[0,0,.13]} args={[10.27,4.14,.04]} radius={.20} smoothness={4}><meshStandardMaterial color="#263e4c" roughness={.75}/></RoundedBox></group>
  <group position={MOUTH_VIEWS.closeup.position} scale={MOUTH_VIEWS.closeup.scale}><DentalModel state={state} now={now} cue={cue} selected={selected} onPick={onPick}/><OpticalInstrument cue={cue}/></group>
 </Canvas>;
}
function SceneFallback(){return <div className="scene-fallback"><strong>3D görünüm açılamadı</strong><p>Chrome’da donanım hızlandırmayı açıp sayfayı yeniden yükleyin. Puanlar sunucuda korunur.</p></div>}
class SceneBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<SceneFallback/>:this.props.children}}
const ACTION_LABELS:Record<string,string>={extract:'ÇEKİM UYGULANIYOR',decay:'ÇÜRÜTME UYGULANIYOR',implant:'İMPLANT YERLEŞTİRİLİYOR',heal:'RESTORASYON TAMAMLANIYOR'};
export function DentalArenaScene({state,now,cue,quality='high',onFps=()=>{}}:{state:CoinArena;now:number;cue?:AnimationCue;quality?:'low'|'high';onFps?:(fps:number)=>void}){
 const [selected,setSelected]=useState<number|undefined>(undefined),people=ranked(state),chosen=selected??POSITIONS[0],owner=people.slice(0,28).find((p,i)=>(p.toothId??POSITIONS[i])===chosen);
 return <div className={'dental-3d-stage clinic-edition '+(cue?'is-treating':'')}>
  <SceneBoundary><React.Suspense fallback={<div className="scene-fallback"><strong>Klinik hazırlanıyor…</strong></div>}><Scene state={state} now={now} cue={cue} quality={quality} onFps={onFps} selected={chosen} onPick={setSelected}/></React.Suspense></SceneBoundary>
  <div className="clinic-edition-label"><span/>DENTAL STUDIO <small>CANLI ARENA</small></div>
  <div className="optical-label">AĞIZ YAKIN PLANI <span>28 DİŞ · DOKUN</span></div>
  {!cue&&<div className="dental-focus-card" data-testid="tooth-inspector"><span>DİŞ {toothLabel(chosen)}</span><b>{owner?.username??'Katılımcı bekleniyor'}</b><strong>{owner?owner.coins.toLocaleString('tr-TR')+' JETON':'Dişe dokun, oyuncuyu gör'}</strong></div>}
  {cue&&<div className={'dental-action-banner '+(['extract','decay'].includes(cue.action)?'danger':'success')}>{ACTION_LABELS[cue.action]}<small>@{cue.user}</small></div>}
 </div>;
}
