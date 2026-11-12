import React,{useEffect,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import{Canvas,useFrame}from'@react-three/fiber';
import{Text}from'@react-three/drei';
import*as THREE from'three';
import{initialTeeth}from'./engine';
import{DentalProcedureFX}from'./DentalProcedureFX';
import{ActionCharacter}from'./ActionAnimation';
import{TreatmentScene}from'./TreatmentScene';
import{ProcedureBroadcast}from'./ProcedureBroadcast';
import{DoctorPortrait}from'./DoctorPortrait';
import type{AnimationCue}from'./ActionAnimation';
import{applyGift,loadCoinArena,saveCoinArena,newCoinArena,ranked,toothOf,timeLeft,isLocked,POSITIONS,TEA_COINS,IMPLANT_COINS,type Gift,type CoinArena}from'./coinArena';
import{DentalArenaScene}from'./DentalArenaScene';
import './style.css';
const TEETH=initialTeeth();
function Tooth3D({id,username,coins,rank,locked,highlight}:{id:number;username?:string;coins?:number;rank?:number;locked:boolean;highlight:boolean}){
 const group=useRef<THREE.Group>(null);const top=id<16;const slot=top?id: id-16;
 const angle=(slot/15-.5)*Math.PI*.91;const x=Math.sin(angle)*4.55;const z=-Math.cos(angle)*1.45;
 const y=top?1.28:-1.28;
 useFrame(({clock})=>{if(group.current)group.current.scale.setScalar(highlight?1.06+.035*Math.sin(clock.elapsedTime*4):1)});
 const color=locked?'#6b3546':'#fff1d9';
 return <group ref={group} position={[x,y,z]} rotation={[0,-angle,0]}>
 {highlight&&<><mesh position={[0,0,-.1]}><torusGeometry args={[.52,.055,12,40]}/><meshBasicMaterial color="#ffcf4d"/></mesh><pointLight position={[0,0,.7]} color="#ffd263" intensity={2} distance={2}/></>}
 {locked?<><mesh scale={[.36,.17,.3]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color="#5b2638"/></mesh><Text position={[0,0,.4]} fontSize={.29} color="#ff7188">✕</Text></>:<>
 <mesh position={[0,top?.05:-.05,0]} scale={[top?.4:.34,top?.45:.35,.37]}><sphereGeometry args={[1,26,18]}/><meshPhysicalMaterial color={color} roughness={.25} clearcoat={.55}/></mesh>
 {[-1,1].map(s=><React.Fragment key={s}><mesh position={[s*.16,top?.34:-.34,.09]} scale={[.18,.18,.18]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={color}/></mesh><mesh position={[s*.13,top?-.35:.35,-.04]} rotation={[0,0,s*.13]} scale={[.14,.32,.15]}><coneGeometry args={[1,1,16]}/><meshStandardMaterial color="#e2d5bf"/></mesh></React.Fragment>)}
 </>}
 {rank!==undefined&&rank<4&&<Text position={[0,top?.8:-.8,.35]} fontSize={.3} color="#ffcd49">{'♛ '+(rank+1)}</Text>}
 <Text position={[0,top?.59:-.59,.42]} fontSize={.13} maxWidth={1.3} color={username?'#ffffff':'#8fa3b6'}>{username?'@'+username.slice(0,10):''}</Text>
 {username&&<Text position={[0,top?-.7:.7,.3]} fontSize={.12} color="#ffcf6e">{String(coins??0)+' 🪙'}</Text>}
 </group>;
}
function Mouth({state,now,cues,onEffectDone}:{state:CoinArena;now:number;cues:AnimationCue[];onEffectDone:(id:number)=>void}){
 const players=ranked(state);const positions=new Map(players.slice(0,28).map((p,i)=>[POSITIONS[i],{...p,rank:i}]));
 return <Canvas gl={{alpha:true}} camera={{position:[0,0,12],fov:51}}><ambientLight intensity={2}/><pointLight position={[-5,4,5]} color="#f44d76" intensity={65}/><pointLight position={[5,3,5]} color="#46bbff" intensity={65}/>
 
 
 
 {cues.map((c,i)=><React.Fragment key={c.id}><ActionCharacter cue={c} laneOffset={i%2===0?-.25:.25} onComplete={onEffectDone}/><TreatmentScene cue={c}/><DentalProcedureFX cue={c} onDone={()=>{}}/></React.Fragment>)}
 </Canvas>;
}
function App(){
 const[state,setState]=useState(()=>loadCoinArena(window.localStorage));const stateRef=useRef(state);const[now,setNow]=useState(Date.now());const[cues,setCues]=useState<AnimationCue[]>([]);const[latest,setLatest]=useState('Hediyeler bekleniyor');const[status,setStatus]=useState('TikTok köprüsü bekleniyor');const[demoName,setDemoName]=useState('Ahmet');const[demoGift,setDemoGift]=useState('Gül');const[demoCoins,setDemoCoins]=useState(1);const serial=useRef(0);
 const players=ranked(state);const remaining=state.startedAt?timeLeft(state,now):600000;const finished=state.startedAt>0&&remaining===0;const clock=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor(remaining%60000/1000)).padStart(2,'0');
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer)},[]);
 function receive(gift:Gift){const result=applyGift(stateRef.current,gift);setLatest(result.message);if(!result.accepted)return;stateRef.current=result.state;setState(result.state);saveCoinArena(window.localStorage,result.state);if((result.action==='extract'||result.action==='implant')&&result.targetId!==null){const cue:AnimationCue={id:++serial.current,action:result.action,team:'DİŞ '+(result.targetId+1),user:'@'+gift.username,targetId:result.targetId,blocked:false};setCues(old=>[...old.slice(-2),cue]);window.setTimeout(()=>setCues(old=>old.filter(item=>item.id!==cue.id)),4500);}}
 useEffect(()=>{let ws:WebSocket|null=null;let retry:number|undefined;let stopped=false;function connect(){if(stopped)return;try{ws=new WebSocket('ws://127.0.0.1:8765');ws.onopen=()=>setStatus('🟢 Köprü bağlı');ws.onmessage=e=>{try{const m=JSON.parse(String(e.data));if(m.type==='status'){setStatus(m.state==='live-connected'?'🟢 TikTok LIVE bağlı':'Köprü bağlı · yayın bekleniyor');return;}if(m.type!=='gift'||typeof m.eventId!=='string'||typeof m.userId!=='string'||typeof m.username!=='string'||typeof m.giftName!=='string'||typeof m.coins!=='number'||typeof m.timestamp!=='number')return;const repeat=Number.isInteger(m.repeatCount)?Math.max(1,Math.min(100,m.repeatCount)):1;for(let i=0;i<repeat;i++)receive({eventId:m.eventId+(repeat>1?':'+i:''),userId:m.userId,username:m.username,giftName:m.giftName,coins:m.coins,timestamp:m.timestamp});}catch{setStatus('Köprü mesajı okunamadı')}};ws.onclose=()=>{if(stopped)return;setStatus('🔴 Bağlantı kesildi');retry=window.setTimeout(connect,3000)};ws.onerror=()=>setStatus('🔴 Köprü bağlantı hatası')}catch{setStatus('🔴 Köprü kullanılamıyor')}}connect();return()=>{stopped=true;if(retry)clearTimeout(retry);ws?.close()}},[]);
 const demo=()=>receive({eventId:crypto.randomUUID(),userId:'demo-'+demoName.toLocaleLowerCase('tr-TR'),username:demoName,giftName:demoGift,coins:demoCoins,timestamp:Date.now()});
 const populate=()=>{const names=['Ahmet','Zeynep','Mehmet','Elif','Veli','Ali','Hasan','Cem','Deniz','Eren','Mert','Aslı','Ece','Kerem','Buse','Selin','Emre','Derya','Ayşe','Can','Ozan','İrem','Berk','Seda','Mina','Efe','Yusuf','Ada'];const now=Date.now();const next=newCoinArena(now);next.players=names.map((username,i)=>({userId:'demo-'+i,username,coins:Math.max(120,10000-Math.round(i*365)),joinedAt:now+i,lockedUntil:0}));stateRef.current=next;setState(next);saveCoinArena(window.localStorage,next);setLatest('28 oyunculu görsel demo başlatıldı');};
 const reset=()=>{if(!window.confirm('Yeni 10 dakikalık tur başlatılsın mı?'))return;const next=newCoinArena();stateRef.current=next;setState(next);saveCoinArena(window.localStorage,next);setCues([]);setLatest('Yeni tur başladı')};
 return <main className="coin-app"><header className="coin-header"><div className="coin-logo">🦷 DİŞ ARENA <small>CANLI JETON YARIŞI</small></div><div className="coin-clock">⏱ {clock} <small>/ 10:00</small></div><div className="coin-live">🔴 CANLI <small>{players.length} oyuncu</small></div></header>
 <section className="coin-main"><aside className="coin-activity"><h2>◉ CANLI AKIŞ</h2>{state.history.length?state.history.slice(0,6).map((m,i)=><div className="coin-activity-event" key={i}>{m}</div>):<p>Hediye etkinlikleri burada görünecek.</p>}</aside><div className="coin-mouth"><DentalArenaScene state={state} now={now} cue={cues[cues.length-1]}/><ProcedureBroadcast cues={cues}/></div>
 <aside className="coin-side"><h2>👑 CANLI SIRALAMA</h2>{players.slice(0,28).map((p,i)=><div key={p.userId} className={'coin-rank '+(i<4?'coin-winner':'')}><span>{i<4?'🏆':''}{i+1}</span><span className="coin-user">@{p.username}{isLocked(p,now)&&<small> 🦷 ÇEKİLDİ · {Math.ceil((p.lockedUntil-now)/1000)} sn</small>}</span><strong>{p.coins.toLocaleString('tr-TR')} 🪙</strong></div>)}{!players.length&&<p>İlk hediye geldiğinde 10 dakikalık tur başlar.</p>}</aside></section>
 <section className="coin-bottom"><div className="coin-doctor"><div><strong>⚔️ İKİ HEKİM · TEK ARENA</strong><small>🔴 Solda kötü hekim: Çekim</small><small>🟢 Sağda iyi hekim: İmplant</small><span className="doctor-active">● SAHNE AKTİF</span></div></div><div className="coin-tea"><div className="tea-icon">🫖</div><div><strong>ÇAY · {TEA_COINS} JETON</strong><span>🦷 Aktif diş → Çekim · 30 sn kilit</span></div><div className="implant-icon">🧴</div><div><strong>PARFÜM · {IMPLANT_COINS} JETON</strong><span>🔩 Çekilmiş diş → İmplant +20 puan</span></div></div><div className="coin-prizes"><strong>🏆 {finished?'KAZANANLAR':'İLK 4 ADAY'}</strong><div className="coin-prize-grid">{players.slice(0,4).map((p,i)=><span key={p.userId}><b>{i+1}. 👑</b> @{p.username} <em>{p.coins.toLocaleString('tr-TR')} 🪙</em></span>)}</div></div></section>
 <div className="coin-notice">{status} · {latest}</div><div className="coin-feed">{state.history.slice(0,5).map((m,i)=><div key={i}>{m}</div>)}</div><p className="coin-rule">28 diş · 10 dakika · tek sıralama · ilk 4 kazanır. Çekilmişken normal hediyeler puana eklenmez. Parfüm ile implant puan kazandırır. Çekim puan silmez. Hediyeler TikTok üzerinde ücretlidir.</p>
 <details className="coin-admin"><summary>⚙ Yayıncı test ve tur kontrolü</summary><div className="coin-demo"><input aria-label="Demo kullanıcı" value={demoName} onChange={e=>setDemoName(e.target.value)}/><select aria-label="Demo hediye" value={demoGift} onChange={e=>{const n=e.target.value;setDemoGift(n);setDemoCoins(n==='Çay'?50:n==='Parfüm'?20:n==='Finger Heart'?5:1)}}><option>Gül</option><option>Finger Heart</option><option>Parfüm</option><option>Çay</option></select><button onClick={demo} disabled={finished}>HEDİYE TESTİ</button><button onClick={populate}>28 OYUNCULU DEMO</button><button onClick={reset}>YENİ TUR</button></div></details>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
