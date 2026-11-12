import test from 'node:test';
import assert from 'node:assert/strict';
import {initialToothGiftAssignments,findAssignedTooth} from './toothGiftAssignments';
import {claimPrice} from './toothEconomy';
test('assigned teeth have distinct gifts with exact mirrored price bands',()=>{
 const assignments=initialToothGiftAssignments();
 assert.ok(assignments.length>0);
 assert.equal(new Set(assignments.map(a=>a.giftName.toLocaleLowerCase('tr-TR'))).size,32);
 for(let id=0;id<32;id++){
  const gift=assignments.find(a=>a.toothId===id);
  if(!gift)continue;
  assert.equal(gift.coins,claimPrice(id));
  assert.equal(findAssignedTooth(assignments,gift.giftName,gift.coins),id);
 }
});
