import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
export type Role='admin'|'viewer';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:1},(error,key)=>error?reject(error):resolve(key)));
export const cookieToken=(header:string|undefined,role:Role)=>header?.split(';').map(p=>p.trim()).find(p=>p.startsWith('arena_'+role+'='))?.split('=')[1]??'';
export function sessionCookie(role:Role,token:string,secure=false){return `arena_${role}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?(role==='admin'?28800:86400):0}${secure?'; Secure':''}`}
export class AccessStore {
 readonly db:DatabaseSync;private checking=0;
 constructor(path:string){this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;
 CREATE TABLE IF NOT EXISTS passwords(role TEXT PRIMARY KEY,salt TEXT NOT NULL,hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,role TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,failures INTEGER NOT NULL,blocked INTEGER NOT NULL,started INTEGER NOT NULL);`)}
 configured(role:Role){return !!this.db.prepare('SELECT role FROM passwords WHERE role=?').get(role)}
 async setPassword(role:Role,password:string){
  if(typeof password!=='string'||password.length<8||password.length>128)throw Error('Şifre 8–128 karakter olmalı');
  const salt=randomBytes(16).toString('hex'),hash=(await derive(password,salt)).toString('hex');
  this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('INSERT INTO passwords VALUES(?,?,?) ON CONFLICT(role) DO UPDATE SET salt=excluded.salt,hash=excluded.hash').run(role,salt,hash);this.db.prepare('DELETE FROM sessions WHERE role=?').run(role);this.db.exec('COMMIT')}catch(e){this.db.exec('ROLLBACK');throw e}
 }
 issue(role:Role,now=Date.now()){
  this.db.prepare('DELETE FROM sessions WHERE expires<=?').run(now);const token=randomBytes(32).toString('hex');
  this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),role,now+(role==='admin'?8:24)*3600000);return token;
 }
 valid(token:string,role:Role,now=Date.now()){
  if(!/^[a-f0-9]{64}$/.test(token))return false;
  const row=this.db.prepare('SELECT expires FROM sessions WHERE hash=? AND role=?').get(digest(token),role);return !!row&&Number(row.expires)>now;
 }
 async login(role:Role,password:unknown,ip:string,now=Date.now()){
  const id=digest(ip+':'+role);const old=this.db.prepare('SELECT * FROM attempts WHERE id=?').get(id);
  if(old&&Number(old.blocked)>now)throw Error('Çok fazla hatalı giriş. 15 dakika sonra tekrar deneyin');
  if(this.checking>=2)throw Error('Giriş kontrolü yoğun. Biraz sonra tekrar deneyin');
  const row=this.db.prepare('SELECT salt,hash FROM passwords WHERE role=?').get(role);
  this.checking++;let valid=false;
  try{if(row&&typeof password==='string'&&password.length<=128){const candidate=await derive(password,String(row.salt));valid=timingSafeEqual(candidate,Buffer.from(String(row.hash),'hex'))}}finally{this.checking--}
  if(!valid){const failures=old&&now-Number(old.started)<15*60000?Number(old.failures)+1:1;this.db.prepare('INSERT INTO attempts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET failures=excluded.failures,blocked=excluded.blocked,started=excluded.started').run(id,failures,failures>=5?now+15*60000:0,old&&now-Number(old.started)<15*60000?Number(old.started):now);return null;}
  this.db.prepare('DELETE FROM attempts WHERE id=?').run(id);return this.issue(role,now);
 }
 logout(token:string){this.db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token))}
 close(){this.db.close()}
}
