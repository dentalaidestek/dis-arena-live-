import {test} from 'node:test';import assert from 'node:assert/strict';
import {sceneToothPosition,procedurePhase} from './procedureMotion';import {POSITIONS} from './coinArena';
test('every playable target has finite coordinates and separate upper/lower arches',()=>{for(const id of POSITIONS){const [x,y,z]=sceneToothPosition(id);assert.ok([x,y,z].every(Number.isFinite));assert.ok(id<16?y>0:y<0)}assert.notDeepEqual(sceneToothPosition(7),sceneToothPosition(8))});
test('instrument reaches before treatment and returns after completion',()=>{assert.equal(procedurePhase(0).reach,0);assert.equal(procedurePhase(.25).reach,1);assert.equal(procedurePhase(.25).work,0);assert.equal(procedurePhase(1).work,1);assert.equal(procedurePhase(1).reach,0)});

test('patient and optical closeup use the same tooth transform in two scales',async()=>{
 const {toothWorldPosition,MOUTH_VIEWS}=await import('./procedureMotion');
 for(const id of POSITIONS){
  const core=sceneToothPosition(id);
  for(const name of ['patient','closeup'] as const){
   const view=MOUTH_VIEWS[name],mapped=toothWorldPosition(id,name);
   assert.deepEqual(mapped,core.map((value,i)=>view.position[i]+value*view.scale));
  }
 }
 assert.ok(toothWorldPosition(7,'patient')[1]>2);
 assert.ok(toothWorldPosition(7,'closeup')[1]<0);
});
