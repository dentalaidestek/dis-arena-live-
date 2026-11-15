#!/usr/bin/env node
import {existsSync,readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('Diş Arena: bash termux-preview.sh [--demo | --live] [--check] [--no-open]\nVarsayılan: 28 oyunculu ayrı demo; canlı yayın veya Python gerekmez.');process.exit(0)}
const allowed=['--demo','--live','--check','--no-open'];
if(args.some(a=>!allowed.includes(a))||(args.includes('--demo')&&args.includes('--live'))){console.error('Geçersiz seçenek. Yardım: bash termux-preview.sh --help');process.exit(1)}
const mode=args.includes('--live')?'live':'demo';const termux=process.env.PREFIX?.includes('com.termux');
function fail(message){console.error('\n✗ '+message);process.exit(1)}
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<13))fail('Node 22.13 veya üzeri gerekli. Termux: pkg install nodejs-lts -y');
try{await import('node:sqlite')}catch{fail('Bu Node sürümünde SQLite yok. Termux nodejs-lts paketini güncelleyin: pkg upgrade nodejs-lts -y')}
function run(command,values){const r=spawnSync(command,values,{cwd:root,stdio:'inherit'});if(r.error||r.status!==0)fail(`${command} ${values.join(' ')} başarısız. Verileriniz korunuyor. ${r.error?.message??''}`)}
function hash(paths){const h=createHash('sha256');function add(path){if(!existsSync(path))return;const entry=readFileSync;for(const name of readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=join(path,name.name);if(name.isDirectory())add(p);else{h.update(p.slice(root.length));h.update(entry(p))}}}for(const p of paths){const path=join(root,p);if(p==='src'||p==='public'||p==='server')add(path);else if(existsSync(path)){h.update(p);h.update(readFileSync(path))}}return h.digest('hex')}
console.log(`\n🦷 DİŞ ARENA · ${mode==='demo'?'DEMO STÜDYOSU':'CANLI YAYIN'}\nNode ${process.versions.node} · ${process.platform}/${process.arch}`);
const dependencyHash=createHash('sha256').update(readFileSync('package-lock.json')).update(process.platform+process.arch).digest('hex');
const depStamp='node_modules/.arena-dependencies';
const installedOk=!existsSync(depStamp)&&existsSync('node_modules/.package-lock.json')&&spawnSync('npm',['ls','--depth=0'],{stdio:'ignore'}).status===0&&spawnSync(process.execPath,['-e',"require('esbuild').transformSync('const ok=1')"],{stdio:'ignore'}).status===0;
if(installedOk)writeFileSync(depStamp,dependencyHash);
if(!existsSync(depStamp)||readFileSync(depStamp,'utf8')!==dependencyHash){console.log('Bağımlılıklar hazırlanıyor (yalnız değiştiğinde)…');run('npm',['ci','--include=dev','--no-audit','--no-fund']);writeFileSync(depStamp,dependencyHash)}
if(mode==='live'){
 const python=process.env.ARENA_PYTHON??'python3';let ready=spawnSync(python,['-c','import TikTokLive'],{stdio:'ignore'});
 if(ready.error&&termux){run('pkg',['install','python','-y']);ready=spawnSync(python,['-c','import TikTokLive'],{stdio:'ignore'})}
 if(ready.error)fail('Python bulunamadı. Canlı için Python gerekli; demo için --demo kullanın.');
 if(ready.status!==0){console.log('Canlı yayın bağımlılıkları hazırlanıyor…');const install=()=>spawnSync(python,['-m','pip','install','-r','scripts/requirements.txt'],{stdio:'inherit'});let r=install();if(r.status!==0&&termux){console.log('Termux derleme araçları hazırlanıyor…');run('pkg',['install','rust','clang','make','pkg-config','-y']);r=install()}if(r.status!==0)fail('TikTok bağımlılığı kurulamadı. --demo seçeneği Python gerektirmeden çalışır.')}
}
if(args.includes('--check'))run('npm',['test']);
const buildHash=hash(['src','public','server','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts']);const stamp='dist/.arena-build';
if(!existsSync('dist/index.html')||!existsSync(stamp)||readFileSync(stamp,'utf8')!==buildHash){console.log('Güncel oyun görünümü derleniyor…');run('npm',['run','build']);mkdirSync('dist',{recursive:true});writeFileSync(stamp,buildHash)}
if(args.includes('--check')){console.log('\n✓ Motor, SQLite ve derleme kontrolleri geçti. Başlatmak için: bash termux-preview.sh');process.exit(0)}
const child=spawn(process.execPath,['--import','tsx','server/server.ts'],{cwd:root,stdio:'inherit',env:{...process.env,ARENA_OPEN_BROWSER:mode,ARENA_DEMO_SEED:mode==='demo'?'1':'0',ARENA_LAUNCH_NO_OPEN:args.includes('--no-open')?'1':'0'}});
child.on('error',e=>fail(e.message));child.on('exit',code=>{process.exitCode=code??1});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
