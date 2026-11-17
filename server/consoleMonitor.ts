/** Bounded, grouped console reporting; logging never creates a gift-processing queue. */
export class ConsoleMonitor{
 private pending=new Map<string,{message:string;count:number}>();private omitted=0;private timer:ReturnType<typeof setInterval>;
 constructor(private enabled=true){this.timer=setInterval(()=>this.flush(),1000);this.timer.unref()}
 write(tag:string,message:string){if(!this.enabled)return;const key=tag+':'+message;if(this.pending.has(key))this.pending.get(key)!.count++;else if(this.pending.size<60)this.pending.set(key,{message:`[${tag}] ${message}`,count:1});else this.omitted++;}
 flush(){if(!this.enabled)return;let printed=0;for(const [key,value] of this.pending){if(printed++>=20)break;console.log(value.message+(value.count>1?` (${value.count} bildirim)` :''));this.pending.delete(key)}if(this.omitted){console.log(`[INFO] ${this.omitted} ek konsol bildirimi özetlendi; hediye kayıtları SQLite içinde`);this.omitted=0}}
 close(){clearInterval(this.timer);this.flush()}
}
