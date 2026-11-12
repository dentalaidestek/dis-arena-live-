import type {AnimationCue} from './ActionAnimation';
import {doctorRole} from './ActionAnimation';
import {DoctorPortrait} from './DoctorPortrait';
import {GIFT_CATALOG} from './giftClaims';

export const OPENING_CAST=[
 {name:'Dr. Restorasyon',job:'TEDAVİ',gift:'Finger Heart',side:'good' as const},
 {name:'Dr. Periodonti',job:'KORUMA',gift:'Rose',side:'good' as const},
 {name:'Dr. İmplant',job:'İMPLANT',gift:'Doughnut',side:'good' as const},
 {name:'Dr. Karies',job:'ÇÜRÜTME',gift:'Rose',side:'bad' as const},
 {name:'Dr. Kırık',job:'KIRIK',gift:'Perfume',side:'bad' as const},
 {name:'Dr. Ekstraksiyon',job:'ÇEKİM',gift:'Doughnut',side:'bad' as const},
];
/** Stage-only gift hints; final LIVE action prices must come from server-side mapping. */
export function OpeningStage({cues=[]}:{cues?:AnimationCue[]}){
 const good=OPENING_CAST.filter(c=>c.side==='good'),bad=OPENING_CAST.filter(c=>c.side==='bad');
 const group=(items:typeof OPENING_CAST,side:'good'|'bad')=><div className={'opening-cast '+side}>
  <h2>{side==='good'?'✚ İYİ EKİP':'☣ KÖTÜ EKİP'}</h2>
  {items.map(person=>{const gift=GIFT_CATALOG.find(g=>g.name===person.gift);const current=cues.find(c=>doctorRole(c.action)===person.name);return <div className={'opening-doctor'+(current?' opening-doctor-active':'')} key={person.name}>
   <DoctorPortrait side={side} role={current?.action}/><div className="opening-activity-glow" aria-hidden="true"/><div className="opening-doctor-label"><strong>{person.name}</strong><span>{person.job}</span><small className="opening-gift">🎁 {gift?.name} · {gift?.coins} coin <em>ÖRNEK</em></small>{current&&<div className="opening-doctor-live">● DİŞ {current.targetId+1} · {current.blocked?'ENGELLENDİ':'İŞLEMDE'}</div>}</div>
  </div>})}
 </div>;
 return <section className="opening-stage" aria-label="Diş Arena canlı yayın açılış sahnesi">
  {group(good,'good')}
  <div className={'opening-patient'+(cues.length?' opening-patient-busy':'')} aria-label="Koltuğa uzanmış, ağzı açık hasta">
   <div className="opening-patient-title">DİŞ ARENA<small>SON DİŞ AYAKTA</small></div>
   <svg viewBox="0 0 230 270" role="img" aria-label="Diş koltuğunda başı geriye yaslanmış, ağzı açık hasta">
    <defs><radialGradient id="patient-skin"><stop stopColor="#f3c6a5"/><stop offset="1" stopColor="#ad6b59"/></radialGradient><linearGradient id="patient-chair" x2="1" y2="1"><stop stopColor="#4185b0"/><stop offset="1" stopColor="#112b4c"/></linearGradient></defs>
    <path d="M15 266 Q15 190 63 181 L167 181 Q215 190 215 266Z" fill="url(#patient-chair)" stroke="#5acbff" strokeWidth="5"/>
    <path d="M65 196 L87 169 L143 169 L167 196 L177 266 H53Z" fill="#bed9e6"/>
    <path d="M82 176 L87 142 L145 142 L148 178 Q115 204 82 176" fill="#b47c65"/>
    <ellipse cx="115" cy="106" rx="68" ry="82" fill="url(#patient-skin)" stroke="#d89e85" strokeWidth="3"/>
    <path d="M47 97 Q31 28 86 17 Q143 -4 178 48 L184 96 Q162 63 153 42 Q116 63 79 50Z" fill="#262331"/>
    <path d="M69 107 Q84 96 99 107 M130 107 Q145 96 160 107" stroke="#4a3132" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M109 113 L103 137 Q115 145 127 137" stroke="#a46c5c" strokeWidth="3" fill="none"/>
    <ellipse cx="115" cy="157" rx="35" ry="26" fill="#4b1022" stroke="#9a4c58" strokeWidth="5"/>
    <path d="M83 150 Q115 138 147 150 L144 159 Q115 164 86 159Z" fill="#fff4dd"/>
    <path d="M91 174 Q115 181 139 174 L137 167 Q115 165 93 167Z" fill="#fff1df"/>
    <path d="M87 163 Q115 157 143 163" stroke="#d96d83" strokeWidth="2" fill="none"/>
    <path d="M56 216 Q115 188 175 216" stroke="#69b9e5" strokeWidth="5" fill="none"/>
   </svg>
   <div className="opening-patient-caption">{cues.length?`${cues.length} HEKİM MÜDAHALE EDİYOR`:"AĞIZ AÇIK · 32 DİŞ YARIŞIYOR"}</div>
  </div>
  {group(bad,'bad')}
 </section>;
}
