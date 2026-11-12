import test from 'node:test';
import assert from 'node:assert/strict';
import {PROCEDURE_DURATION,procedurePhase,procedureProgress,procedureLabel} from './procedureTimeline';
test('clinical animation phases run in order and finish within duration',()=>{
 assert.equal(procedurePhase(0),'enter');
 assert.equal(procedurePhase(.7),'recline');
 assert.equal(procedurePhase(1.5),'operate');
 assert.equal(procedurePhase(2.7),'reveal');
 assert.equal(procedurePhase(PROCEDURE_DURATION),'exit');
});
test('treatment progress is bounded and monotonic',()=>{
 const times=[-.1,0,.8,1.05,1.4,1.8,2.55,3.5,9];
 const values=times.map(procedureProgress);
 assert.equal(values[0],0);assert.equal(values.at(-1),1);
 assert.ok(values.every((v,i)=>v>=0&&v<=1&&(i===0||v>=values[i-1])));
});
test('visual labels match actual game effects',()=>{
 assert.equal(procedureLabel('fracture',false),'KIRIK −30 HP');
 assert.equal(procedureLabel('heal',false),'TEDAVİ +25 HP');
 assert.equal(procedureLabel('extract',false),'DİŞ ELENDİ');
 assert.equal(procedureLabel('implant',false),'İMPLANT 50 HP');
 assert.equal(procedureLabel('decay',true),'SALDIRI ENGELLENDİ');
});
