import type {Action} from './engine';
/** Lightweight vector portraits, designed to replace emoji placeholders without external assets. */
export function DoctorPortrait({side,role}:{side:'good'|'bad';role?:Action}){
 const good=side==='good';const coat=good?'#e4f3ff':'#d8c4c5';const glow=good?'#4ddaff':'#f54a4f';const face=good?'#d99b7b':'#bd8067';
 return <svg className={'doctor-art '+(good?'doctor-art-good':'doctor-art-bad')} viewBox="0 0 170 170" role="img" aria-label={good?'Dr. Restorasyon':'Dr. Karies'}>
 <defs><radialGradient id={'halo-'+side}><stop stopColor={glow} stopOpacity=".7"/><stop offset="1" stopColor={glow} stopOpacity="0"/></radialGradient><linearGradient id={'coat-'+side} x2="1" y2="1"><stop stopColor={coat}/><stop offset="1" stopColor={good?'#508ab1':'#62202e'}/></linearGradient></defs>
 <circle cx="85" cy="80" r="79" fill={'url(#halo-'+side+')'}/>
 <path d="M28 170 Q33 114 70 110 L101 110 Q140 115 147 170" fill={'url(#coat-'+side+')'} stroke={glow} strokeWidth="2"/>
 <path d="M69 108 L85 143 L102 108" fill={good?'#225f8c':'#48222d'}/><path d="M78 130 L85 143 L92 130 L88 165 L82 165" fill={good?'#174f8d':'#b62e38'}/>
 <path d="M61 70 Q60 31 85 29 Q112 30 111 70 L108 100 Q96 121 84 118 Q68 114 62 99Z" fill={face} stroke="#3a1b23" strokeWidth="2"/>
 <path d="M59 76 Q42 34 68 22 Q93 5 113 30 Q124 41 113 76 Q106 46 98 41 Q78 56 60 48Z" fill={good?'#392e35':'#24232b'} stroke="#17151c" strokeWidth="2"/>
 <path d="M67 76 Q76 70 82 76 M89 76 Q98 70 105 76" fill="none" stroke={good?'#25354a':'#a41927'} strokeWidth="3"/>
 {good?<><path d="M63 83 Q85 90 109 83 L105 104 Q86 114 66 104Z" fill="#9de6f7" stroke="#d8fbff" strokeWidth="2"/><path d="M63 88 L52 84 M109 88 L120 84" stroke="#e3f7ff" strokeWidth="2"/></>:<><path d="M68 91 Q85 100 102 91" fill="none" stroke="#5e101d" strokeWidth="4"/><circle cx="74" cy="76" r="7" fill="#ff363b" opacity=".8"/><circle cx="99" cy="76" r="7" fill="#ff363b" opacity=".8"/></>}
 <path d="M125 138 L143 73" stroke="#abbecb" strokeWidth="7" strokeLinecap="round"/><path d="M143 73 L151 42" stroke={glow} strokeWidth="3" strokeLinecap="round"/><path d="M121 143 Q128 128 137 134" stroke={good?'#6ee6ff':'#25232b'} strokeWidth="12" fill="none" strokeLinecap="round"/>
 <circle cx="140" cy="72" r="5" fill={glow}/><path d="M34 167 Q60 143 75 164" fill="none" stroke={glow} strokeWidth="2" opacity=".5"/>
 </svg>;
}
