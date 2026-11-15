import {useEffect,useRef,useState} from 'react';
import {newCoinArena,type CoinArena} from './coinArena';
import {appendVisuals,visualDuration,type VisualQueue} from './visualQueue';
import type {VisualEvent} from '../server/store';
export function useArena(mode:'live'|'demo',enabled=true,onDenied?:()=>void){
 const [state,setState]=useState<CoinArena>(newCoinArena());const [now,setNow]=useState(Date.now());const [online,setOnline]=useState(false);const [metadata,setMetadata]=useState<any>({roundNumber:1,events:[],graphics:'low'});
 const [queue,setQueue]=useState<VisualQueue>({waiting:[],skipped:0});const [active,setActive]=useState<(VisualEvent&{durationMs:number})|null>(null);
 const round=useRef(''),offset=useRef(0),replay=useRef(new Set<number>()),playing=useRef(false);const denied=useRef(onDenied);denied.current=onDenied;
 useEffect(()=>{
  if(!enabled)return;let stopped=false,ws:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,attempt=0;
  const connect=()=>{
   if(stopped)return;ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/arena?mode=${mode}`);
   ws.onopen=()=>{attempt=0;setOnline(true)};
   ws.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type!=='snapshot'||m.mode!==mode||m.state?.version!==2)return;
    if(round.current!==m.state.roundId){round.current=m.state.roundId;setQueue({waiting:[],skipped:0});setActive(null);playing.current=false;}offset.current=m.serverNow-Date.now();setState(m.state);setMetadata(m);
    const fresh=(m.visuals??[]).filter((v:VisualEvent)=>{if(replay.current.has(v.id))return false;replay.current.add(v.id);return true});if(replay.current.size>2000)replay.current=new Set([...replay.current].slice(-1000));setQueue(q=>appendVisuals(q,fresh));
   }catch{setOnline(false)}};
   ws.onerror=()=>setOnline(false);ws.onclose=e=>{setOnline(false);if(stopped)return;if(e.code===1008){denied.current?.();return;}retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5))+Math.random()*500)};
  };connect();return()=>{stopped=true;clearTimeout(retry);if(ws){ws.onclose=null;ws.close()}};
 },[mode,enabled]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()+offset.current),250);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(active||playing.current||!queue.waiting.length)return;playing.current=true;const next=queue.waiting[0];setQueue(q=>({...q,waiting:q.waiting.slice(1)}));setActive({...next,durationMs:visualDuration(queue.waiting.length)})},[queue,active]);
 useEffect(()=>{if(!active)return;const timer=setTimeout(()=>{playing.current=false;setActive(null)},active.durationMs);return()=>clearTimeout(timer)},[active]);
 return {state,now,metadata,online,active,waiting:queue.waiting.length,skipped:queue.skipped+(metadata.skippedVisuals??0)};
}
