import {useEffect,useRef,useState} from 'react';
import {DentalArenaScene} from './DentalArenaScene';
import {ranked,timeLeft,toothOf,ROUND_MS,type CoinArena} from './coinArena';
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
 const scene:CoinArena=active?{...active.before,players:active.before.players.map(p=>p.userId===active.targetUserId?{...p,condition:active.action==='decay'?'decayed':active.action==='extract'?'extracted':undefined,lockedUntil:['decay','extract'].includes(active.action)?now+5000:0}:p)}:state;
 const first=players[0],second=players[1];const share=first?Math.max(8,Math.min(92,first.coins/((first.coins+(second?.coins??0))||1)*100)):50;
 const target=active?.before.players.find(p=>p.userId===active.targetUserId);
 const events=metadata.events?.length?metadata.events:state.history.slice(0,3).map((message,i)=>({id:String(i),message}));
 return <main className={'broadcast-shell '+(obs?'broadcast-obs':'')} data-mode={mode} data-fps={fps} data-round={state.roundId} data-waiting={game.waiting}>
 <header className="broadcast-header"><div className="broadcast-brand"><span>♛</span><div><h1>DİŞ ARENA</h1><p>SON DİŞ AYAKTA!</p></div><small className={mode==='demo'?'mode-demo':'mode-live'}>{mode==='demo'?'DEMO':'LIVE'}</small></div><div className="broadcast-clock"><span>TUR {String(metadata.roundNumber??1).padStart(2,'0')}</span><strong>{clock}</strong><small>{state.finishedAt?'SONUÇLAR KAYDEDİLDİ':`${players.length} OYUNCU · 28 DİŞ`}</small></div>
 <div className="broadcast-leaders">{Array.from({length:4},(_,i)=>{const p=(state.winners??players)[i];return <div key={i} className={'leader-card leader-'+i} data-user={p?.userId}><span>{i+1}</span><div><b>{p?.username??'SENİN YERİN'}</b><strong>{p?p.coins.toLocaleString('tr-TR'):'—'} <small>JETON</small></strong><em>DİŞ {p?toothLabel(toothOf(state,p.userId)):'—'}</em></div></div>})}</div></header>
 <section className="broadcast-stage" aria-label="Canlı 3D diş kliniği"><DentalArenaScene state={scene} now={now} cue={cue} quality={metadata.graphics==='high'?'high':'low'} onFps={v=>{setFps(v);onFps?.(v)}}/>
 <div className="stage-corners"><span>KÖTÜ HEKİM</span><span>İYİ HEKİM</span></div>
 {leaderNotice&&<div className="leader-alert" role="status">♛ YENİ LİDER · {leaderNotice}</div>}
 {active&&<div className="procedure-target">{target?.username??active.targetUserId} <span>DİŞ {toothLabel(active.targetId)}</span></div>}
 {state.finishedAt&&<div className="round-finished">♛ TUR TAMAMLANDI <small>İLK DÖRT KAZANDI</small></div>}
 {!game.online&&<span className="viewer-connection">Yayın bağlantısı bekleniyor</span>}
 </section>
 <section className="broadcast-live"><div className="rival-heading"><b>{first?.username??'LİDER BEKLENİYOR'}</b><span>VS</span><b>{second?.username??'RAKİP BEKLENİYOR'}</b></div><div className="rival-bar"><span style={{width:share+'%'}}/><span style={{width:100-share+'%'}}/></div><div className="events-heading"><span className="live-dot connected"/>CANLI OLAYLAR</div><div className="broadcast-events" aria-live="polite">{events.slice(0,3).map((e:any)=><div className={'broadcast-event event-'+(e.action??'score')} key={e.id}>{e.giftImage&&<img className="broadcast-gift-image" src={e.giftImage} alt="" loading="lazy"/>}<span>{e.action==='extract'?'🦷':e.action==='implant'?'🔩':e.action==='decay'?'☣':e.action==='heal'?'✚':e.action==='claimBad'?'🩺':e.action==='claimGood'?'🦷':'✦'}</span><p>{e.gift?`@${e.user} · ${e.gift} ×${e.delta}`:e.message}</p>{e.action==='score'&&e.coins&&<b>+{(e.coins*e.delta).toLocaleString('tr-TR')}</b>}</div>)}{!events.length&&<div className="broadcast-event empty-event"><span>✦</span><p>İlk hediye, takip veya 100 beğeni ile 10 dakikalık yarış başlar.</p></div>}</div></section>
 <section className="broadcast-guide"><h2>NASIL OYNANIR?</h2><div className="guide-score"><span>🦷 28 diş için yarış.</span><b>İLK 4 KAZANIR ♛</b></div><div className="guide-rules"><p><b>Boş diş varsa:</b> Herhangi bir hediye göndererek boş dişlerden birini sahiplenebilirsin.</p><p><b>28 diş doluysa:</b> Jeton kazandıran hediyelerle puanını artır; en düşük sıradaki oyuncuyu geçerek ilk 28'e gir ve dişini al.</p><p><b>Ücretsiz katılım:</b> Takip etmek 1 diş sahiplenme hakkı, her 100 beğeni 1 ek hak kazandırır. Her izleyici turda en fazla 1 diş alabilir.</p><p><b>Tur süresi:</b> İlk geçerli katılımla 10 dakika başlar. Yarış sonunda öndeki dört ön kesici dişin sahibi kazanır.</p><small>Hediyeler puanlamaya katkı sağlar; hediye göndermek zorunlu değildir.</small></div></section>
 </main>;
}
