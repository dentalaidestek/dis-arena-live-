import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DentalArenaScene} from './DentalArenaScene';
import {newCoinArena,ranked,timeLeft,isLocked,type CoinArena,type Procedure} from './coinArena';
import type {VisualEvent} from '../server/store';
import {appendVisuals,visualDuration,type VisualQueue} from './visualQueue';
import type {AnimationCue} from './ActionAnimation';
import {ProcedureIcon} from './ui/ProcedureIcon';
import './style.css';
import './presentation.css';
const params=new URLSearchParams(location.search);
const MODE=params.get('mode')==='demo'?'demo':'live';
const OBS=params.get('view')==='obs';
const SETUP=new URLSearchParams(location.hash.slice(1)).get('setup');
if(SETUP)history.replaceState(null,'',location.pathname+location.search);
const LABELS:Record<string,string>={extract:'Çekim',implant:'İmplant',decay:'Çürütme',heal:'İyileştirme'};
const ACTIONS=['extract','implant','decay','heal'] as const;
const effects=['Rakibi 30 sn durdur','Çekilen dişini geri getir','Rakibi 15 sn durdur','Çürüğünü hemen iyileştir'];
function wait(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{const cancel=()=>{clearTimeout(timer);reject(Error('Demo turu durduruldu'))};const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve()},ms);signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel()})}
function App(){
 const [state,setState]=useState<CoinArena>(newCoinArena());const [now,setNow]=useState(Date.now());
 const [connection,setConnection]=useState('Bağlanıyor');const [online,setOnline]=useState(false);const [bridge,setBridge]=useState<any>({state:'disconnected'});
 const [queue,setQueue]=useState<VisualQueue>({waiting:[],skipped:0});const [active,setActive]=useState<(VisualEvent&{durationMs:number})|null>(null);const [serverSkipped,setServerSkipped]=useState(0);
 const [token,setToken]=useState(()=>sessionStorage.getItem('arena-admin')??'');const [setup,setSetup]=useState('');const [username,setUsername]=useState('');
 const [admin,setAdmin]=useState<any>(null);const [notice,setNotice]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const busyRef=useRef(false);
 const [quality,setQuality]=useState<'low'|'high'>(()=>matchMedia('(max-width:800px)').matches?'low':'high');const [fps,setFps]=useState(0);const [userId,setUserId]=useState('demo-1');
 const [giftId,setGiftId]=useState('');const [procedure,setProcedure]=useState<Procedure>('extract');const [tourStep,setTourStep]=useState('');const tourAbort=useRef<AbortController|null>(null);
 const currentRound=useRef('');const serverOffset=useRef(0);const replayRef=useRef(new Set<number>());const run=useRef(false);
 const update=useCallback((m:any)=>{
  if(m.type!=='snapshot'||m.mode!==MODE)return;
  if(currentRound.current&&currentRound.current!==m.state.roundId){setQueue({waiting:[],skipped:0});run.current=false;setActive(null);}
  currentRound.current=m.state.roundId;serverOffset.current=m.serverNow-Date.now();setState(m.state);setBridge(m.bridge);setServerSkipped(m.skippedVisuals??0);
  if(Array.isArray(m.visuals)){
   const fresh=m.visuals.filter((v:VisualEvent)=>{if(replayRef.current.has(v.id))return false;replayRef.current.add(v.id);return true});
   if(replayRef.current.size>2000)replayRef.current=new Set([...replayRef.current].slice(-1000));
   setQueue(q=>appendVisuals(q,fresh));
  }
 },[]);
 useEffect(()=>{
  let stopped=false,ws:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,attempt=0;
  const connect=()=>{
   if(stopped)return;
   ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/arena?mode=${MODE}`);
   ws.onopen=()=>{attempt=0;setOnline(true);setConnection('Sunucu bağlı')};
   ws.onmessage=e=>{try{update(JSON.parse(e.data))}catch{setError('Sunucu mesajı okunamadı')}};
   ws.onerror=()=>{setOnline(false);setConnection('Sunucuya ulaşılamadı')};
   ws.onclose=()=>{if(stopped)return;setOnline(false);setConnection('Yeniden bağlanıyor · puanlar korunuyor');retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5))+Math.random()*700)};
  };connect();return()=>{stopped=true;clearTimeout(retry);if(ws){ws.onclose=null;ws.close()}};
 },[update]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()+serverOffset.current),250);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(active||run.current||!queue.waiting.length)return;run.current=true;const next=queue.waiting[0];setQueue(q=>({...q,waiting:q.waiting.slice(1)}));setActive({...next,durationMs:visualDuration(queue.waiting.length)})},[queue,active]);
 useEffect(()=>{if(!active)return;const timer=setTimeout(()=>{run.current=false;setActive(null)},active.durationMs);return()=>clearTimeout(timer)},[active]);
 useEffect(()=>()=>tourAbort.current?.abort(),[]);
 async function redeem(code:string){
  try{const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const data=await r.json();if(!r.ok)throw Error(data.error);setToken(data.token);sessionStorage.setItem('arena-admin',data.token);setNotice('Yayıncı kontrolleri hazır');setError('')}catch(e){setError(String(e instanceof Error?e.message:e))}
 }
 useEffect(()=>{if(SETUP&&!OBS)redeem(SETUP)},[]);
 async function refresh(){if(!token)return;try{const r=await fetch('/api/admin?mode='+MODE,{headers:{Authorization:'Bearer '+token}});const data=await r.json();if(!r.ok){if(r.status===401){setToken('');sessionStorage.removeItem('arena-admin');setAdmin(null);}throw Error(data.error);}setAdmin(data);setBridge(data.bridge)}catch(e){setError(String(e instanceof Error?e.message:e))}}
 useEffect(()=>{if(OBS||!token)return;sessionStorage.setItem('arena-admin',token);refresh();const t=setInterval(refresh,3000);return()=>clearInterval(t)},[token]);
 async function send(path:string,body:unknown){
  const r=await fetch('/api/'+path+'?mode='+MODE,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error);setNotice(data.message??'İşlem tamamlandı');setError('');await refresh();return data;
 }
 async function command(path:string,body:any){if(busyRef.current)return;busyRef.current=true;setBusy(true);try{await send(path,body);if(path==='demo'&&ACTIONS.includes(body.action))document.querySelector('.coin-mouth')?.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){setError(String(e instanceof Error?e.message:e))}finally{busyRef.current=false;setBusy(false)}}
 async function demoTour(){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);const abort=new AbortController();tourAbort.current=abort;
  try{await send('demo',{action:'populate'});document.querySelector('.coin-mouth')?.scrollIntoView({behavior:'smooth',block:'center'});for(const action of ACTIONS){setTourStep(LABELS[action]);await send('demo',{action,autoTarget:true});await wait(4200,abort.signal)}setNotice('Dört işlem tamamlandı. Puanlar ve kilitler demo alanında test edildi.')}catch(e){setError(String(e instanceof Error?e.message:e))}finally{setTourStep('');setBusy(false);busyRef.current=false;tourAbort.current=null}
 }
 const players=ranked(state);const remaining=state.finishedAt?0:state.startedAt?timeLeft(state,now):600000;
 const clock=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor(remaining%60000/1000)).padStart(2,'0');
 const cue:AnimationCue|undefined=active?{id:active.id,action:active.action,targetId:active.targetId,team:active.targetUserId,user:active.user,blocked:false,durationMs:active.durationMs}:undefined;
 const sceneState=active?{...active.before,players:active.before.players.map(p=>p.userId===active.targetUserId?{...p,condition:active.action==='decay'?'decayed' as const:active.action==='extract'?'extracted' as const:undefined,lockedUntil:['decay','extract'].includes(active.action)?now+5000:0}:p)}:state;
 const last=admin?.diagnostics?.recent?.[0];const target=active?.before.players.find(p=>p.userId===active.targetUserId);
 const ready=online&&!!token;const skipped=queue.skipped+serverSkipped;
 return <main className={'coin-app '+(OBS?'obs-view':'')} data-mode={MODE}>
 <header className="coin-header"><div className="coin-logo"><span className="brand-mark">♛</span><div>DİŞ ARENA<small>{MODE==='demo'?'DEMO STÜDYOSU':'CANLI JETON YARIŞI'}</small></div></div><div className="coin-clock" aria-label="Tur süresi">{clock}<small>{state.finishedAt?'TUR TAMAMLANDI':'10 DAKİKALIK TUR'}</small></div><div className="coin-live"><span className={'live-dot '+(MODE==='demo'?'demo-dot':bridge.state==='live-connected'?'connected':'')}/>{MODE==='demo'?'DEMO':'LIVE'}<small>{players.length} oyuncu · 28 diş</small></div></header>
 {!OBS&&<nav className="arena-toolbar" aria-label="Görünüm seçimi"><span className={online?'connection-ok':'connection-wait'}>{online?'●':'○'} {connection}</span><div><a className={MODE==='live'?'selected':''} href="?mode=live">Canlı yarış</a><a className={MODE==='demo'?'selected':''} href="?mode=demo">Demo stüdyosu</a><a href={'?view=obs&mode='+MODE} target="_blank" rel="noreferrer">Yayın ekranı ↗</a></div></nav>}
 <section className="coin-main">
 <div className="coin-mouth" data-fps={fps}><DentalArenaScene state={sceneState} now={now} cue={cue} quality={quality} onFps={setFps}/>
 {!active&&<div className="scene-caption"><span>28 DİŞ · 2 HEKİM · TEK ARENA</span><strong>{state.finishedAt?'Bu turun şampiyonları belli oldu':players.length?'Sahne hazır. Sıradaki hamle sende.':'İlk hediyeyle yarış başlar.'}</strong></div>}
 </div>
 <aside className="coin-side"><div className="leaderboard-heading"><span>CANLI SIRALAMA</span><small>TOPLAM JETON</small></div><div className="leaderboard-list">{players.slice(0,28).map((p,i)=>{const locked=isLocked(p,now);return <div key={p.userId} className={'coin-rank '+(i<4?'coin-winner':'')+(locked?' rank-locked':'')} data-user={p.userId}><span className="rank-number">{i+1}</span><span className={'player-avatar avatar-'+i%4}>{p.username.slice(0,1).toLocaleUpperCase('tr-TR')}</span><span className="coin-user">{p.username}{locked&&<small>{p.condition==='decayed'?'ÇÜRÜK':'ÇEKİLDİ'} · {Math.ceil((p.lockedUntil-now)/1000)} sn</small>}</span><strong>{p.coins.toLocaleString('tr-TR')}<small>jeton</small></strong></div>})}{!players.length&&<div className="empty-ranking"><span>♛</span><strong>Yerini almaya hazır mısın?</strong><p>İlk geçerli hediyeyle sıralama ve 10 dakikalık tur başlar.</p></div>}</div></aside>
 </section>
 <section className="procedure-rules" aria-label="Dört işlem">{ACTIONS.map((p,i)=><div className={'rule-card rule-'+p} key={p}><span className="rule-icon"><ProcedureIcon action={p}/></span><div><b>{LABELS[p]}</b><small>{effects[i]}</small></div><strong>{i<2?20:10}<small>JETON</small></strong></div>)}</section>
 <section className={'coin-prizes '+(state.finishedAt?'final-podium':'')}><div className="podium-heading"><span>♛</span><div><strong>{state.finishedAt?'TURUN KAZANANLARI':'İLK DÖRT · ZİRVE YARIŞI'}</strong><small>{state.finishedAt?'Sonuçlar kaydedildi':'İki üst, iki alt merkezi kesici'}</small></div></div><div className="coin-prize-grid">{(state.winners??players.slice(0,4)).map((p,i)=><div className={'podium-card podium-'+i} key={p.userId}><span className="podium-place">{i+1}</span><b>{p.username}</b><em>{p.coins.toLocaleString('tr-TR')} <small>jeton</small></em></div>)}{!players.length&&<p>İlk dört oyuncu burada yer alacak.</p>}</div></section>
 {!OBS&&<>
 {MODE==='demo'&&<section className="quick-test"><div className="test-heading"><div><span className="eyebrow">GÜVENLİ DEMO ALANI</span><h2>Dört işlemi sahnede dene</h2><p>Gerçek yarışın puanları değişmez. Hedef otomatik seçilir.</p></div><button className="primary-button" disabled={!ready||busy} onClick={demoTour}>{tourStep?'Oynatılıyor…':'▶ Dört işlemi oynat'}</button>{tourStep&&<button className="quiet-button" onClick={()=>tourAbort.current?.abort()}>Durdur</button>}</div><div className="quick-procedures">{ACTIONS.map(p=><button key={p} className={'quick-procedure rule-'+p} data-testid={'quick-'+p} disabled={!ready||busy||!players.length||!!state.finishedAt} onClick={()=>command('demo',{action:p,autoTarget:true})}><ProcedureIcon action={p}/><span>{LABELS[p]}</span><small>{p==='extract'||p==='implant'?20:10} jeton</small></button>)}</div><div className="quick-extras"><button disabled={!ready||busy} onClick={()=>command('demo',{action:'populate'})}>↻ 28 oyuncuyu hazırla</button><button disabled={!ready||busy||!players.length} onClick={()=>command('demo',{action:'rose1000',autoTarget:true})}>Gül ×1000</button><button disabled={!ready||busy||!players.length} onClick={()=>command('demo',{action:'burst',autoTarget:true})}>100 hediye</button><button disabled={!ready||busy||!players.length} onClick={()=>command('demo',{action:'finish'})}>Tur sonunu göster</button></div>{tourStep&&<div className="tour-progress" role="status">Sahnede: <b>{tourStep}</b></div>}</section>}
 <div className={'coin-notice '+(error?'notice-error':'')} role="status">{error||notice||(MODE==='demo'?'Çekim → İmplant veya Çürütme → İyileştirme sırasıyla deneyebilirsin.':'Yayıncı kontrolünden TikTok bağlantısını başlatın.')}</div>
 {!token&&<form className="setup-card" onSubmit={e=>{e.preventDefault();redeem(setup)}}><div><strong>Yayıncı kontrollerini aç</strong><p>Termux başlatıcısı normalde otomatik açar. Gerekirse terminaldeki tek kullanımlık kurulum kodunu gir.</p></div><label>Kurulum kodu<input value={setup} autoComplete="off" onChange={e=>setSetup(e.target.value)} placeholder="Termux’taki kurulum kodu"/></label><button className="primary-button" disabled={!setup||!online}>Kontrolleri aç</button></form>}
 <details className="broadcaster-panel"><summary><span>⚙ Yayıncı kontrolü</span><small>Bağlantı, katalog ve ayrıntılı testler</small><b>⌄</b></summary><div className="panel-body">
 <div className="control-row"><label>TikTok kullanıcı adı<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@kullanici_adi"/></label><button disabled={busy||!ready||!username} onClick={()=>command('connect',{username})}>Bağlan</button><button disabled={busy||!ready} onClick={()=>command('disconnect',{})}>Bağlantıyı kes</button><label>Grafik kalitesi<select value={quality} onChange={e=>setQuality(e.target.value as 'low'|'high')}><option value="high">Yüksek</option><option value="low">Telefon / düşük</option></select></label></div>
 <div className="status-strip"><span>{fps} FPS</span><span>{queue.waiting.length} bekleyen animasyon</span><span>{players.length} oyuncu</span>{skipped>0&&<span>{skipped} görsel özetlendi</span>}<span>TikTok: {bridge.state}</span></div>{bridge.error&&<p className="provider-warning">{bridge.error}</p>}
 {admin&&<><div className="diagnostic-grid"><div><small>Kalıcı olay</small><b>{admin.diagnostics.events}</b></div><div><small>İşlenen hediye</small><b>{admin.diagnostics.units}</b></div><div><small>Engellenen tekrar</small><b>{admin.diagnostics.duplicates}</b></div><div><small>İnceleme / red</small><b>{admin.diagnostics.invalid}</b></div><div><small>Son hediye / ID</small><b>{last?.raw?.giftName??'—'} / {last?.raw?.giftId??'—'}</b></div><div><small>Birim / çarpan / yeni adet</small><b>{last?.raw?.coins??0} / ×{last?.raw?.repeatCount??0} / +{last?.result?.delta??0}</b></div></div>
 <details><summary>Hediye kataloğu ve dört ayrı eşleştirme</summary><p>Çekim / implant: farklı 20 jetonluk hediyeler. Çürütme / iyileştirme: farklı 10 jetonluk hediyeler.</p><p>Sürüm {admin.catalog.version} · {admin.catalog.verified?new Date(admin.catalog.verified).toLocaleString('tr-TR'):'Katalog bekleniyor'}{now-admin.catalog.verified>86400000?' · ESKİ KATALOG':''}</p><div className="control-row"><label>Doğrulanmış hediye<select value={giftId} onChange={e=>setGiftId(e.target.value)}><option value="">Seçiniz</option>{admin.catalog.gifts.map((g:any)=><option key={g.giftId} value={g.giftId}>{g.name} · {g.coins} jeton · {g.giftId}</option>)}</select></label><label>İşlem<select value={procedure} onChange={e=>setProcedure(e.target.value as Procedure)}>{ACTIONS.map(v=><option key={v} value={v}>{LABELS[v]}</option>)}</select></label><button disabled={!giftId||busy||!ready} onClick={()=>command('mapping',{giftId,procedure})}>Eşleştir</button></div>{admin.mappings.map((m:any)=><p key={m.procedure}>{LABELS[m.procedure]} → {m.gift_id}</p>)}</details>
 <details><summary>Son olaylar ve arşiv ({admin.rounds.length} tur)</summary>{admin.diagnostics.recent.map((e:any)=><p key={e.seq}>#{e.seq} {e.raw?.username} · {e.raw?.giftName} · {e.result.message}</p>)}{admin.rounds.map((r:any)=><p key={r.id}>{r.id} · {r.finishedAt?'Tamamlandı':'Açılmış tur'}</p>)}</details></>}
 {MODE==='demo'&&<details><summary>Belirli oyuncuyla test</summary><div className="control-row"><label>Gönderen oyuncu<select value={userId} onChange={e=>setUserId(e.target.value)}>{players.map(p=><option value={p.userId} key={p.userId}>{p.username}</option>)}</select></label>{ACTIONS.map(a=><button key={a} disabled={busy||!ready} onClick={()=>command('demo',{action:a,userId})}>{LABELS[a]}</button>)}</div></details>}
 <details><summary>Yönetici erişimi ve tur yönetimi</summary><div className="control-row"><label>Yönetici anahtarı<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="İsteğe bağlı manuel erişim"/></label><button disabled={busy||!ready} onClick={()=>{if(confirm('Mevcut tur arşivde korunarak yeni tur açılsın mı?'))command('round',{})}}>Yeni tur aç</button>{localStorage.getItem('dis-arena-coin-v2')&&<button disabled={busy||!ready} onClick={()=>command('import',JSON.parse(localStorage.getItem('dis-arena-coin-v2')!))}>Eski yerel kaydı içe aktar</button>}</div></details>
 </div></details><footer className="arena-footer">Diş Arena · {MODE==='demo'?'Test verileri canlı yarıştan ayrıdır.':'Hediyeler TikTok üzerinde ücretlidir. Kilitliyken normal hediyeler puan kazandırmaz.'}</footer>
 </>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
