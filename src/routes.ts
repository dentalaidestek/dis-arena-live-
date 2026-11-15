export type ArenaRoute={page:'admin'|'viewer';mode:'live'|'demo';obs:boolean};
export function arenaRoute(path:string,query:string):ArenaRoute{
 const q=new URLSearchParams(query);return {page:path==='/admin'?'admin':'viewer',mode:path==='/demo'||q.get('mode')==='demo'?'demo':'live',obs:path==='/obs'||q.get('view')==='obs'};
}
export function toothLabel(id:number|null){if(id===null)return '—';const fdi=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,38,37,36,35,34,33,32,31,41,42,43,44,45,46,47,48];return String(fdi[id]??'—')}
