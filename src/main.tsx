import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DentalArenaScene} from './DentalArenaScene';
import {newCoinArena,ranked,timeLeft,isLocked,type CoinArena,type Procedure} from './coinArena';
import type {VisualEvent} from '../server/store';
import {appendVisuals,visualDuration,type VisualQueue} from './visualQueue';
import type {AnimationCue} from './ActionAnimation';
import './style.css';
const params=new URLSearchParams(location.search);
const MODE=params.get('mode')==='demo'?'demo':'live';
const OBS=params.get('view')==='obs';
const LABELS:Record<string,string>={extract:'Çekim',implant:'İmplant',decay:'Çürütme',heal:'İyileştirme'};
function App(){
 const [state,setState]=useState<CoinArena>(newCoinArena());const [now,setNow]=useState(Date.now());
 const [connection,setConnection]=useState('Sunucuya bağlanıyor');const [bridge,setBridge]=useState<any>({state:'disconnected'});
 const [queue,setQueue]=useState<VisualQueue>({waiting:[],skipped:0});const [active,setActive]=useState<(VisualEvent&{durationMs:number})|null>(null);
 const [token,setToken]=useState(()=>sessionStorage.getItem('arena-admin')??'');const [username,setUsername]=useState('');
 const [admin,setAdmin]=useState<any>(null);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [quality,setQuality]=useState<'low'|'high'>('high');const [fps,setFps]=useState(0);const [userId,setUserId]=useState('demo-1');
 const [giftId,setGiftId]=useState('');const [procedure,setProcedure]=useState<Procedure>('extract');
 const currentRound=useRef('');
 const serverOffset=useRef(0);const replay=new Set<number>();const replayRef=useRef(replay);const run=useRef(false);
 const update=useCallback((m:any)=>{
  if(m.type!=='snapshot'||m.mode!==MODE)return;
  if(currentRound.current&&currentRound.current!==m.state.roundId){setQueue({waiting:[],skipped:0});run.current=false;setActive(null);}
  currentRound.current=m.state.roundId;
  serverOffset.current=m.serverNow-Date.now();setState(m.state);setBridge(m.bridge);
  if(Array.isArray(m.visuals)){
   const fresh=m.visuals.filter((v:VisualEvent)=>{if(replayRef.current.has(v.id))return false;replayRef.current.add(v.id);return true});
   // This is a viewer-only replay cache. Durable idempotency lives in SQLite.
   if(replayRef.current.size>2000)replayRef.current=new Set([...replayRef.current].slice(-1000));
   setQueue(q=>appendVisuals(q,fresh));
  }
 },[]);
 useEffect(()=>{
  let stopped=false,ws:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,attempt=0;
  const connect=()=>{
   if(stopped)return;
   ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/arena?mode=${MODE}`);
   ws.onopen=()=>{attempt=0;setConnection('Görüntü bağlantısı açık')};
   ws.onmessage=e=>{try{update(JSON.parse(e.data))}catch{setNotice('Sunucu mesajı okunamadı')}};
   ws.onerror=()=>setConnection('Sunucu bağlantı hatası');
   ws.onclose=()=>{if(stopped)return;setConnection('Bağlantı kesildi · puanlar sunucuda korunuyor');retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5))+Math.random()*700)};
  };connect();return()=>{stopped=true;clearTimeout(retry);if(ws){ws.onclose=null;ws.close()}};
 },[update]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()+serverOffset.current),250);return()=>clearInterval(t)},[]);
 useEffect(()=>{
  if(active||run.current||!queue.waiting.length)return;
  run.current=true;const next=queue.waiting[0];setQueue(q=>({...q,waiting:q.waiting.slice(1)}));setActive({...next,durationMs:visualDuration(queue.waiting.length)});
 },[queue,active]);
 useEffect(()=>{if(!active)return;const timer=setTimeout(()=>{run.current=false;setActive(null)},active.durationMs);return()=>clearTimeout(timer)},[active]);
 async function refresh(){
  if(!token)return;
  try{const r=await fetch('/api/admin?mode='+MODE,{headers:{Authorization:'Bearer '+token}});const data=await r.json();if(!r.ok)throw Error(data.error);setAdmin(data);setBridge(data.bridge)}catch(e){setNotice(String(e))}
 }
 useEffect(()=>{if(OBS||!token)return;sessionStorage.setItem('arena-admin',token);refresh();const t=setInterval(refresh,2000);return()=>clearInterval(t)},[token]);
 async function command(path:string,body:unknown){
  if(busy)return;setBusy(true);
  try{const r=await fetch('/api/'+path+'?mode='+MODE,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error);setNotice(data.message??'İşlem tamamlandı');await refresh()}catch(e){setNotice(String(e))}finally{setBusy(false)}
 }
 const players=ranked(state);const remaining=state.finishedAt?0:state.startedAt?timeLeft(state,now):600000;
 const clock=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor(remaining%60000/1000)).padStart(2,'0');
 const cue:AnimationCue|undefined=active?{id:active.id,action:active.action,targetId:active.targetId,team:active.targetUserId,user:active.user,blocked:false,durationMs:active.durationMs}:undefined;
 // Freeze ownership to the operation's original layout during its visual playback.
 // The leaderboard continues to show the current authoritative result.
 const sceneState=active?{...active.before,players:active.before.players.map(p=>p.userId===active.targetUserId?{...p,condition:active.action==='decay'?'decayed' as const:active.action==='extract'?'extracted' as const:undefined,lockedUntil:['decay','extract'].includes(active.action)?now+5000:0}:p)}:state;
 const last=admin?.diagnostics?.recent?.[0];
 return <main className={'coin-app '+(OBS?'obs-view':'')}>
 <header className="coin-header"><div className="coin-logo">🦷 DİŞ ARENA<small>{MODE==='demo'?'DEMO · GERÇEK YARIŞTAN AYRI':'CANLI JETON YARIŞI'}</small></div><div className="coin-clock">{clock}<small>{state.finishedAt?'TUR TAMAMLANDI':'10 DAKİKA'}</small></div><div className="coin-live">{players.length} OYUNCU<small>{bridge.state==='live-connected'?'● TikTok LIVE bağlı':MODE==='demo'?'TEST SAHNESİ':'YAYIN BEKLENİYOR'}</small></div></header>
 <section className="coin-main"><aside className="coin-activity"><h2>CANLI AKIŞ</h2>{state.history.slice(0,6).map((m,i)=><div className="coin-activity-event" key={i}>{m}</div>)}</aside>
 <div className="coin-mouth"><DentalArenaScene state={sceneState} now={now} cue={cue} quality={quality} onFps={setFps}/></div>
 <aside className="coin-side"><h2>CANLI SIRALAMA</h2>{players.slice(0,28).map((p,i)=><div key={p.userId} className={'coin-rank '+(i<4?'coin-winner':'')}><span>{i+1}</span><span className="coin-user">@{p.username}{isLocked(p,now)&&<small>{p.condition==='decayed'?'ÇÜRÜK':'ÇEKİLDİ'} · {Math.ceil((p.lockedUntil-now)/1000)} sn</small>}</span><strong>{p.coins.toLocaleString('tr-TR')}</strong></div>)}{!players.length&&<p>İlk geçerli hediyeyle tur başlar.</p>}</aside></section>
 <section className="procedure-rules">{(['extract','implant','decay','heal'] as const).map((p,i)=><div key={p}><b>{['🦷','🔩','☣','✚'][i]} {LABELS[p]}</b><strong>{i<2?20:10} jeton</strong><small>{['30 sn kilit','Çekimi kaldırır','15 sn kilit','Çürüğü iyileştirir'][i]}</small></div>)}</section>
 <section className="coin-prizes"><strong>{state.finishedAt?'🏆 KAZANANLAR':'👑 İLK DÖRT'}</strong><div className="coin-prize-grid">{(state.winners??players.slice(0,4)).map((p,i)=><span key={p.userId}>{i+1}. @{p.username} <em>{p.coins.toLocaleString('tr-TR')} 🪙</em></span>)}</div></section>
 {!OBS&&<><div className="coin-notice" role="status">{connection} · {notice||bridge.error} · {fps} FPS · Animasyon kuyruğu {queue.waiting.length}{queue.skipped>0&&` · ${queue.skipped} görsel özetlendi`}</div>
 <section className="broadcaster-panel"><div className="panel-heading"><h2>Yayıncı kontrolü</h2><a href={'?view=obs&mode='+MODE} target="_blank" rel="noreferrer">OBS 9:16 görünümü ↗</a><a href={'?mode='+(MODE==='demo'?'live':'demo')}>{MODE==='demo'?'Canlı yarışa dön':'Ayrı demo alanını aç'}</a></div>
 <p>Çekim ve implant için farklı 20 jetonluk, çürütme ve iyileştirme için farklı 10 jetonluk katalog hediyeleri seçilir. İyileştirme bedeli şu an 10 jetondur.</p>
 <div className="control-row"><label>Yönetici anahtarı<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Sunucudaki admin anahtarı"/></label><label>TikTok kullanıcı adı<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@kullanici_adi"/></label><button disabled={busy||!token||!username} onClick={()=>command('connect',{username})}>Bağlan</button><button disabled={busy||!token} onClick={()=>command('disconnect',{})}>Bağlantıyı kes</button><label>Grafik kalitesi<select value={quality} onChange={e=>setQuality(e.target.value as 'low'|'high')}><option value="high">Yüksek</option><option value="low">Düşük</option></select></label></div>
 {admin&&<><div className="diagnostic-grid"><div><small>Yayın</small><b>{bridge.state}</b></div><div><small>Kalıcı olay</small><b>{admin.diagnostics.events}</b></div><div><small>İşlenen hediye adedi</small><b>{admin.diagnostics.units}</b></div><div><small>Engellenen tekrar</small><b>{admin.diagnostics.duplicates}</b></div><div><small>İnceleme / reddedilen</small><b>{admin.diagnostics.invalid}</b></div><div><small>İşlem kuyruğu</small><b>{admin.pending}</b></div><div><small>Son hediye / ID</small><b>{last?.raw?.giftName??'—'} / {last?.raw?.giftId??'—'}</b></div><div><small>Birim / çarpan / yeni adet</small><b>{last?.raw?.coins??0} / ×{last?.raw?.repeatCount??0} / +{last?.result?.delta??0}</b></div><div><small>Son sonuç</small><b>{last?.result?.message??'—'}</b></div></div>
 <details><summary>Hediye kataloğu ve işlem eşleştirmesi</summary><p>Sürüm {admin.catalog.version} · {admin.catalog.verified?new Date(admin.catalog.verified).toLocaleString('tr-TR'):'Katalog bekleniyor'}{now-admin.catalog.verified>86400000?' · ESKİ KATALOG':''}</p><div className="control-row"><label>Doğrulanmış hediye<select value={giftId} onChange={e=>setGiftId(e.target.value)}><option value="">Seçiniz</option>{admin.catalog.gifts.map((g:any)=><option key={g.giftId} value={g.giftId}>{g.name} · {g.coins} jeton · {g.giftId}</option>)}</select></label><label>İşlem<select value={procedure} onChange={e=>setProcedure(e.target.value as Procedure)}>{Object.entries(LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><button disabled={!giftId||busy} onClick={()=>command('mapping',{giftId,procedure})}>Eşleştir</button></div>{admin.mappings.map((m:any)=><p key={m.procedure}>{LABELS[m.procedure]} → {m.gift_id}</p>)}</details>
 <details><summary>Son olaylar ve arşiv ({admin.rounds.length} tur)</summary>{admin.diagnostics.recent.map((e:any)=><p key={e.seq}>#{e.seq} {e.raw.username} · {e.raw.giftName} · {e.result.message}</p>)}{admin.rounds.map((r:any)=><p key={r.id}>{r.id} · {r.finishedAt?'Tamamlandı':'Açılmış tur'}</p>)}</details></>}
 {MODE==='demo'&&<div className="demo-controls"><h3>Ayrı demo verileri</h3><label>Hedef / gönderen oyuncu<select value={userId} onChange={e=>setUserId(e.target.value)}>{players.map(p=><option value={p.userId} key={p.userId}>@{p.username}</option>)}</select></label><div className="control-row">{['populate','extract','implant','decay','heal','rose1000','burst','finish'].map(a=><button key={a} disabled={busy||!token} onClick={()=>command('demo',{action:a,userId})}>{({populate:'28 oyuncu oluştur',rose1000:'Gül ×1000',burst:'100 hediye',finish:'Tur sonu'} as Record<string,string>)[a]??LABELS[a]}</button>)}</div><p>Saldırılar seçilen oyuncunun hemen önündekini hedefler. Savunma için kilitlenen oyuncuyu seçin.</p></div>}
 <div className="control-row"><button disabled={busy||!token} onClick={()=>{if(confirm('Mevcut tur arşivde korunarak yeni tur açılsın mı?')){setQueue({waiting:[],skipped:0});run.current=false;setActive(null);command('round',{})}}}>Yeni tur aç</button>{localStorage.getItem('dis-arena-coin-v2')&&<button disabled={busy||!token} onClick={()=>command('import',JSON.parse(localStorage.getItem('dis-arena-coin-v2')!))}>Eski yerel kaydı içe aktar</button>}</div>
 </section></>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
