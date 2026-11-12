import test from 'node:test';
import assert from 'node:assert/strict';
import {initialToothGiftAssignments,findAssignedTooth} from './toothGiftAssignments';
import {claimPrice} from './toothEconomy';
test('assigned teeth have distinct gifts with exact mirrored price bands',()=>{
 const assignments=initialToothGiftAssignments();
 assert.equal(assignments.length,27);
 assert.equal(new Set(assignments.map(a=>a.giftName.toLocaleLowerCase('tr-TR'))).size,32);
 for(let id=0;id<32;id++){
  const gift=assignments.find(a=>a.toothId===id);
  if(!gift){assert.ok([0,8,15,16,23,24,31].includes(id),'unexpected unassigned tooth '+id);continue;}
  assert.equal(gift.coins,claimPrice(id));
  assert.ok(gift.coins<=50);
  if(id<16)assert.equal(claimPrice(id),claimPrice(id+16));
  assert.equal(findAssignedTooth(assignments,gift.giftName,gift.coins),id);
 }
});
