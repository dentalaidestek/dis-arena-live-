import React from 'react';
import{ranked,isLocked,POSITIONS,type CoinArena}from'./coinArena';
type Props={state:CoinArena;now:number};
const UPPER=POSITIONS.filter(id=>id<16).sort((a,b)=>a-b);
const LOWER=POSITIONS.filter(id=>id>=16).sort((a,b)=>a-b);
function Arch({ids,state,now,lower}:{ids:number[];state:CoinArena;now:number;lower:boolean}){
 const players=ranked(state);const byId=new Map(players.slice(0,28).map((p,i)=>[POSITIONS[i],{...p,rank:i}]));
 return <div className={'show-arch '+(lower?'show-lower':'show-upper')}>
  <div className="show-gum"/>
  <div className="show-teeth">
  {ids.map((id,index)=>{const p=byId.get(id);const topFour=!!p&&p.rank<4;const locked=!!p&&isLocked(p,now);
   const edge=Math.abs(index-6.5)/6.5;const shift=(lower?1:-1)*Math.pow(edge,1.8)*25;
   return <div className={'show-slot '+(topFour?'show-champion ':'')+(locked?'show-locked':'')} key={id} style={{transform:`translateY(${shift}px) scale(${1-edge*.19})`,zIndex:topFour?3:1}}>
     {topFour&&<div className="show-crown">👑<b>{p.rank+1}</b></div>}
     <div className="show-tooth">
       <span className="show-tooth-shine"/>
       {p?<><span className="show-avatar">{p.username.slice(0,1).toUpperCase()}</span><span className="show-name">{p.username.slice(0,10)}</span><span className="show-coins">🪙{p.coins.toLocaleString('tr-TR')}</span></>:<span className="show-empty">✦</span>}
       {locked&&<div className="show-lock"><b>✕</b><small>{Math.ceil((p!.lockedUntil-now)/1000)}s</small></div>}
     </div>
   </div>
  })}
  </div>
 </div>;
}
export function ArenaShowcase({state,now}:Props){
 return <div className="show-stage"><div className="show-glow show-glow-left"/><div className="show-glow show-glow-right"/>
  <div className="show-stage-title">🏆 İLK 4 KAZANIR <small>2 ÜST · 2 ALT</small></div>
  <div className="show-jaw">
   <Arch ids={UPPER} state={state} now={now} lower={false}/>
   <div className="show-mouth-dark"><div className="show-tongue"/></div>
   <Arch ids={LOWER} state={state} now={now} lower={true}/>
  </div>
  <div className="show-floor"/>
 </div>;
}
