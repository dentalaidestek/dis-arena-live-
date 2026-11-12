import test from 'node:test';
import assert from 'node:assert/strict';
import {initialToothGiftAssignments,findAssignedTooth} from './toothGiftAssignments';
import {claimPrice} from './toothEconomy';
test('all 32 teeth have distinct gifts with sufficient coins',()=>{
 const assignments=initialToothGiftAssignments();
 assert.equal(assignments.length,32);
 assert.equal(new Set(assignments.map(a=>a.giftName.toLocaleLowerCase('tr-TR'))).size,32);
 for(let id=0;id<32;id++){
  const gift=assignments.find(a=>a.toothId===id);
  assert.ok(gift,'missing tooth '+id);
  assert.ok(gift.coins>=claimPrice(id));
  assert.equal(findAssignedTooth(assignments,gift.giftName,gift.coins),id);
 }
});
