import type {Action} from './engine';
const hues:Record<Action,string>={decay:'#85ff42',heal:'#70e7ff',decayShield:'#57caff',fractureShield:'#57caff',fracture:'#ff8c5b',extract:'#ff6b7a',implant:'#78eeb5'};
export function ProcedureArt({action}:{action:Action}){
 const color=hues[action];const isShield=action==='decayShield'||action==='fractureShield';
 return <svg viewBox="0 0 120 92" className="procedure-art" aria-hidden="true">
 <defs><radialGradient id={'proc-bg-'+action}><stop stopColor={color} stopOpacity=".32"/><stop offset="1" stopColor="#08101c" stopOpacity="0"/></radialGradient><linearGradient id={'proc-enamel-'+action} x2=".5" y2="1"><stop stopColor="#fffaf1"/><stop offset="1" stopColor="#b6c5cb"/></linearGradient></defs>
 <rect width="120" height="92" fill={'url(#proc-bg-'+action+')'}/>
 <path d="M0 78 Q25 63 60 73 Q92 63 120 78 L120 92 H0Z" fill="#aa4a66" stroke="#ed8fa1" strokeWidth="2"/>
 {action==='implant'?<><path d="M44 52 L76 52 L72 79 L48 79Z" fill="#92a6b9" stroke="#dceaf4" strokeWidth="2"/>{[58,65,72].map(y=><path key={y} d={`M47 ${y} H73`} stroke="#3a4b5b" strokeWidth="2"/>)}</>:<path d="M38 31 Q25 16 32 10 Q42 4 57 14 Q65 18 73 13 Q92 3 96 15 Q101 28 87 49 L78 73 Q72 83 65 64 L59 52 Q53 53 49 69 Q43 85 37 66Z" fill={'url(#proc-enamel-'+action+')'} stroke="#fff4e7" strokeWidth="2"/>}
 {action==='implant'&&<path d="M36 29 Q27 8 42 7 Q52 3 60 12 Q73 3 85 8 Q95 14 83 31 L78 49 H43Z" fill="#fff7e9" stroke="#f5fbff" strokeWidth="2"/>}
 {action==='decay'&&<><path d="M46 19 Q60 14 73 24 L77 37 L65 44 L49 34Z" fill="#3e3a16"/><circle cx="59" cy="30" r="13" fill={color} opacity=".45"/></>}
 {action==='heal'&&<><circle cx="61" cy="31" r="14" fill="#78eaff" opacity=".55"/><path d="M61 16 V46 M46 31 H76" stroke="#fff" strokeWidth="4"/></>}
 {action==='fracture'&&<path d="M49 14 L64 28 L55 36 L72 49 L67 63" stroke="#5b2528" strokeWidth="4" fill="none"/>}
 {action==='extract'&&<><path d="M45 10 L52 31 M81 10 L73 31" stroke="#7b8c9c" strokeWidth="8" strokeLinecap="round"/><path d="M45 10 L34 2 M81 10 L92 2" stroke="#dce9f2" strokeWidth="7" strokeLinecap="round"/><path d="M37 52 L85 52" stroke="#f16d77" strokeWidth="3" strokeDasharray="5 4"/></>}
 {isShield&&<path d="M60 4 L93 17 L90 46 Q81 68 60 79 Q39 68 30 46 L27 17Z" fill="#45c8ff" fillOpacity=".16" stroke={color} strokeWidth="3"/>}
 {isShield&&<path d="M60 19 V52 M44 35 H76" stroke="#c8f7ff" strokeWidth="6"/>}
 <circle cx="60" cy="43" r="38" fill="none" stroke={color} strokeWidth="1" strokeOpacity=".35"/>
 </svg>;
}
