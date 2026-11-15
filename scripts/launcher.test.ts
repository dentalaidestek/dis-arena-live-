import {test} from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('Termux launcher help works from a different directory without installing anything',()=>{const root=process.cwd();const r=spawnSync('bash',[root+'/termux-preview.sh','--help'],{cwd:'/tmp',encoding:'utf8'});assert.equal(r.status,0);assert.match(r.stdout,/28 oyunculu ayrı demo/)});
test('invalid launch arguments fail before installing or starting a server',()=>{const r=spawnSync('node',['scripts/launch.mjs','--invalid'],{encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/Geçersiz seçenek/)});
test('both Termux shell entrypoints have valid shell syntax',()=>{assert.equal(spawnSync('bash',['-n','termux-preview.sh','scripts/termux-check.sh']).status,0)});

test('plain npm start exposes a short-lived local setup code without launcher flags',async()=>{
 const {spawn}=await import('node:child_process');const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const directory=mkdtempSync(join(tmpdir(),'arena-cli-'));const child=spawn(process.execPath,['--import','tsx','server/server.ts'],{env:{...process.env,ARENA_OPEN_BROWSER:'',ARENA_PORT:'0',ARENA_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
 const exited=new Promise<void>(resolve=>child.once('exit',()=>resolve()));
 try{const output=await new Promise<string>((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Setup code was not printed')),5000);child.stdout.on('data',data=>{text+=data;if(text.includes('Tek kullanımlık kurulum kodu')){clearTimeout(timer);resolve(text)}});child.once('error',e=>{clearTimeout(timer);reject(e)})});assert.match(output,/Tek kullanımlık kurulum kodu.*[a-f0-9]{36}/)}finally{child.kill('SIGTERM');await exited;rmSync(directory,{recursive:true,force:true})}
});
