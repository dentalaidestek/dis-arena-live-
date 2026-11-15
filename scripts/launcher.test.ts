import {test} from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('Termux launcher help works from a different directory without installing anything',()=>{const root=process.cwd();const r=spawnSync('bash',[root+'/termux-preview.sh','--help'],{cwd:'/tmp',encoding:'utf8'});assert.equal(r.status,0);assert.match(r.stdout,/28 oyunculu ayrı demo/)});
test('invalid launch arguments fail before installing or starting a server',()=>{const r=spawnSync('node',['scripts/launch.mjs','--invalid'],{encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/Geçersiz seçenek/)});
test('both Termux shell entrypoints have valid shell syntax',()=>{assert.equal(spawnSync('bash',['-n','termux-preview.sh','scripts/termux-check.sh']).status,0)});
