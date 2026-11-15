import type {Procedure} from '../coinArena';
export function ProcedureIcon({action}:{action:Procedure}) {
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {action==='extract'?<><path d="m10 5 5 8-5 14M22 5l-5 8 5 14M11 18l10-7M9 6l-3 4 5 7M23 6l3 4-5 7"/><circle cx="16" cy="14" r="2"/></>:action==='implant'?<><path d="M10 4h12l-1 7H11L10 4ZM13 12v15l3 2 3-2V12M11 16l10-2M11 21l10-2M11 26l10-2"/></>:<><path d="M8 5c3-2 5 1 8 1s5-3 8-1c4 3 1 9-1 13-2 3-1 9-4 10-2 0-1-10-3-10s-1 10-3 10c-3-1-2-7-4-10C7 14 4 8 8 5Z"/>{action==='decay'?<><path d="m14 8 3 3-3 3 4 2M20 9l2 1"/><circle cx="11" cy="11" r="1.3" fill="currentColor"/></>:<path d="M16 8v7M12.5 11.5h7M24 2v5M21.5 4.5h5"/>}</>}
 </svg>;
}
