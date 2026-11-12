import test from 'node:test';
import assert from 'node:assert/strict';
import {initialToothGiftAssignments,findAssignedTooth} from './toothGiftAssignments';
import {claimPrice} from './toothEconomy';
test('assigned teeth have distinct gifts with exact mirrored price bands',()=>{
 const assignments=initialToothGiftAssignments();
 assert.equal(assignments.length,32);
 assert.equal(new Set(assignments.map(a=>a.giftName.toLocaleLowerCase('tr-TR'))).size,32);
 for(let id=0;id<32;id++){
  const gift=assignments.find(a=>a.toothId===id);
  assert.ok(gift,'missing gift for tooth '+id);
  assert.ok(gift.coins>=claimPrice(id));
  if(id<16)assert.equal(gift.coins,assignments.find(a=>a.toothId===id+16)?.coins);
  assert.equal(findAssignedTooth(assignments,gift.giftName,gift.coins),id);
 }
});
