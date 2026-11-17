import {useEffect,useRef,useState} from 'react';
import {DentalArenaScene} from './DentalArenaScene';
import {ranked,timeLeft,toothStatesOf,ROUND_MS,type CoinArena} from './coinArena';
import {useArena} from './useArena';
import {toothLabel} from './routes';
import type {AnimationCue} from './ActionAnimation';
export function Viewer({mode,obs=false,onFps}:{mode:'live'|'demo';obs?:boolean;onFps?:(value:number)=>void}){
 const [fps,setFps]=useState(0),[leaderNotice,setLeaderNotice]=useState('');
 const game=useArena(mode,true);const {state,now,metadata,active}=game;const players=ranked(state);const previousLeader=useRef('');
 useEffect(()=>{const id=players[0]?.userId??'';if(previousLeader.current&&id&&id!==previousLeader.current)setLeaderNotice(players[0].username);previousLeader.current=id;const timer=setTimeout(()=>setLeaderNotice(''),2500);return()=>clearTimeout(timer)},[players[0]?.userId]);
 const remaining=state.finishedAt?0:state.startedAt?timeLeft(state,now):ROUND_MS;
 const clock=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor(remaining%60000/1000)).padStart(2,'0');
 const cue:AnimationCue|undefined=active?{id:active.id,action:active.action,targetId:active.targetId,team:active.targetUserId,user:active.user,blocked:false,durationMs:active.durationMs}:undefined;
 // Render the latest authoritative mouth state while animations play. Replacing the whole
 // scene with active.before replayed stale 28-tooth snapshots and caused teeth to flash.
 const scene:CoinArena=state;
 const first=players[0],second=players[1];const share=first?Math.max(8,Math.min(92,first.coins/((first.coins+(second?.coins??0))||1)*100)):50;
 
 const events=metadata.events?.length?metadata.events:state.history.slice(0,3).map((message,i)=>({id:String(i),message}));const gifts=metadata.gifts??{};const giftRows=[['extract','DİŞ ÇEKİMİ'],['implant','İMPLANT'],['decay','ÇÜRÜTME'],['heal','İYİLEŞTİRME']];const aliveTeeth=toothStatesOf(state).filter(t=>t.hp>0&&t.condition!=='extracted').length;
 return <main className={'broadcast-shell '+(obs?'broadcast-obs':'')} data-mode={mode} data-fps={fps} data-round={state.roundId} data-waiting={game.waiting}>
 <header className="broadcast-header"><div className="broadcast-brand"><span>♛</span><div><h1>DİŞ ARENA</h1><p>SON DİŞ AYAKTA!</p></div><small className={mode==='demo'?'mode-demo':'mode-live'}>{mode==='demo'?'DEMO':'LIVE'}</small></div><div className="broadcast-clock"><span>TUR {String(metadata.roundNumber??1).padStart(2,'0')}</span><strong>{clock}</strong><small>{state.finishedAt?'SONUÇLAR KAYDEDİLDİ':`${players.length} OYUNCU · ${aliveTeeth}/28 CANLI DİŞ`}</small></div>
 <div className="broadcast-leaders doctor-leaders">{(['bad','good'] as const).map(side=>{const doctor=state.doctors?.[side];return <div key={side} className={'leader-card leader-doctor leader-'+side} data-user={doctor?.userId}><span>{side==='bad'?'☣':'✚'}</span>{doctor?.giftImage&&<img src={doctor.giftImage} alt="" /> }<div><b>{side==='bad'?'KÖTÜ HEKİM · EN ÇOK ÇÜRÜTEN':'İYİ HEKİM · EN ÇOK İYİLEŞTİREN'}</b><strong>{doctor?.username?'@'+doctor.username:'HEKİM BEKLENİYOR'}</strong><em>{doctor?.points??0} İŞLEM</em></div></div>})}</div></header>
 <section className="broadcast-stage" aria-label="Canlı 3D diş kliniği"><DentalArenaScene state={scene} now={now} cue={cue} quality={metadata.graphics==='high'?'high':'low'} onFps={v=>{setFps(v);onFps?.(v)}}/>
 <div className="stage-corners"><span>KÖTÜ HEKİM</span><span>İYİ HEKİM</span></div>
 {leaderNotice&&<div className="leader-alert" role="status">♛ YENİ LİDER · {leaderNotice}</div>}
 {active&&<div className="procedure-target">İŞLEM HEDEFİ <span>DİŞ {toothLabel(active.targetId)}</span></div>}
 {state.finishedAt&&<div className="round-finished">♛ TUR TAMAMLANDI <small>İLK DÖRT KAZANDI</small></div>}
 {!game.online&&<span className="viewer-connection">Yayın bağlantısı bekleniyor</span>}
 </section>
 <section className="broadcast-live"><div className="rival-heading"><b>{first?.username??'LİDER BEKLENİYOR'}</b><span>VS</span><b>{second?.username??'RAKİP BEKLENİYOR'}</b></div><div className="rival-bar"><span style={{width:share+'%'}}/><span style={{width:100-share+'%'}}/></div><div className="events-heading"><span className="live-dot connected"/>CANLI OLAYLAR</div><div className="broadcast-events" aria-live="polite">{events.slice(0,3).map((e:any)=><div className={'broadcast-event event-'+(e.action??'score')} key={e.id}>{e.giftImage&&<img className="broadcast-gift-image" src={e.giftImage} alt="" loading="lazy"/>}<span>{e.action==='extract'?'🦷':e.action==='implant'?'🔩':e.action==='decay'?'☣':e.action==='heal'?'✚':e.action==='claimBad'?'🩺':e.action==='claimGood'?'🦷':'✦'}</span><p>{e.gift?`@${e.user} · ${e.gift} ×${e.delta}`:e.message}</p>{e.action==='score'&&e.coins&&<b>+{(e.coins*e.delta).toLocaleString('tr-TR')}</b>}</div>)}{!events.length&&<div className="broadcast-event empty-event"><span>✦</span><p>İlk hediye ile katıl. Yorumuna diş numarası yaz; her 100 beğeni veya takip hedefe -30 HP verir.</p></div>}</div></section>
 <section className="broadcast-guide"><h2>NASIL OYNANIR?</h2><div className="guide-score"><span>🦷 HER DİŞ 100 HP · 28 DİŞ</span><b>SON DİŞ AYAKTA ♛</b></div><div className="guide-rules"><p><b>Hedef seç:</b> Yoruma yalnız diş numarasını yaz (ör. 11). En son yazdığın numara hedefindir.</p><p><b>Saldır:</b> Her 100 beğeni ayrı ayrı -30 HP; her yeni takip -30 HP. Beğeni ve takip ayrı sayılır.</p><p><b>Gül:</b> En hasarlı dişe +10 HP verir. <b>TikTok:</b> En hasarlı dişten -10 HP alır; 0 HP olursa diş çekilir. Gül ve TikTok kötü hekimin hareketini 10 saniye durdurur.</p><p><b>Çekim / implant:</b> Çekim hediyesi dişi çıkarır; implant hediyesi çekilmiş dişi 100 HP ile geri getirir.</p></div><div className="guide-gifts">{giftRows.map(([key,label])=>{const gift=gifts[key];return <div className="guide-gift" key={key}>{gift?.image&&<img src={gift.image} alt="" loading="lazy"/>}<span><b>{label}</b><small>{gift?.verified?gift.name:'Canlı katalog bekleniyor'} · {gift?.coins??'—'} ÇİP</small></span></div>})}</div></section>
 </main>;
}
