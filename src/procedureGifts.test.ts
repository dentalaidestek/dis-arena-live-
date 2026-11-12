import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound,ingest} from './runtime';
import {parseProcedureGiftRules,matchProcedureGift,chooseProcedureTarget} from './procedureGifts';
import type {GiftEvent} from './giftClaims';
const event=(eventId:string,userId='u1',giftName='Healing Star'):GiftEvent=>({eventId,userId,username:userId,giftName,coins:1,timestamp:1000});
test('LIVE action gifts are opt-in and validated',()=>{
 assert.equal(matchProcedureGift([],event('1')),null);
 const rules=parseProcedureGiftRules([{giftName:'Healing Star',action:'heal'},{giftName:'Healing Star',action:'fracture'},{giftName:'',action:'decay'},{giftName:'Other',action:'nonsense'}]);
 assert.equal(rules.length,1);
 assert.equal(matchProcedureGift(rules,event('1')),'heal');
 assert.equal(matchProcedureGift(rules,event('2','u1','unknown')),null);
});
test('three concurrent gift events independently heal three teeth with no animation queue',()=>{
 let state=createRound('test',0);
 for(let i=0;i<3;i++){
  const damage=ingest(state,{id:'damage'+i,user:'@attacker',teamId:i,action:'fracture',timestamp:100+i});
  assert.equal(damage.accepted,true);state=damage.snapshot;
 }
 const rules=parseProcedureGiftRules([{giftName:'Healing Star',action:'heal'}]);
 const targets=[0,1,2];
 for(let i=0;i<3;i++){
  const gift=event('heal'+i,'u'+i);
  assert.equal(matchProcedureGift(rules,gift),'heal');
  const result=ingest(state,{id:'procedure:'+gift.eventId,user:'@'+gift.username,teamId:targets[i],action:'heal',timestamp:gift.timestamp});
  assert.equal(result.accepted,true);state=result.snapshot;
 }
 assert.deepEqual(state.teeth.slice(0,3).map(t=>t.hp),[95,95,95]);
 const duplicate=ingest(state,{id:'procedure:heal0',user:'@u0',teamId:0,action:'heal',timestamp:1000});
 assert.equal(duplicate.accepted,false);
});
test('target selection is deterministic and excludes own tooth for hostile gifts',()=>{
 const state=createRound('test',0);
 state.owners[0]={userId:'u1',username:'u1',claimedAt:0};
 const gift=event('attack1');
 const a=chooseProcedureTarget(state,gift,'fracture');
 assert.notEqual(a,0);
 assert.equal(a,chooseProcedureTarget(state,gift,'fracture'));
 assert.equal(chooseProcedureTarget(state,gift,'heal'),0);
 assert.equal(chooseProcedureTarget(state,gift,'implant'),null);
});
