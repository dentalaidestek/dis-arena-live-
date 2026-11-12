import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {emptyAnimationState,enqueueAnimation,finishAnimation,laneOf,cueLane,resetAnimations} from './animationScheduler';
import type {AnimationCue} from './ActionAnimation';
const cue=(id:number,action:AnimationCue['action'],targetId=id):AnimationCue=>({id,action,targetId,team:'Demo',user:'@demo',blocked:false});
describe('eş zamanlı iyi ve kötü hekimler',()=>{
 it('sağ ve sol karakterler aynı anda girer',()=>{
  let s=enqueueAnimation(emptyAnimationState(),cue(1,'decay',0));
  s=enqueueAnimation(s,cue(2,'heal',1));
  assert.equal(s.active.length,2);assert.deepEqual(s.active.map(c=>laneOf(c.action)),['bad','good']);
 });
 it('aynı dişe gelen karşıt işlemler görselde sıraya alınır',()=>{
  let s=enqueueAnimation(emptyAnimationState(),cue(1,'decay',0));
  s=enqueueAnimation(s,cue(2,'decayShield',0));
  assert.equal(s.active.length,1);assert.equal(s.waiting.length,1);
  s=finishAnimation(s,1);assert.deepEqual(s.active.map(c=>c.id),[2]);
 });
 it('bir tarafta iki karakter oynar üçüncü bekler',()=>{
  let s=emptyAnimationState();
  for(const x of [cue(1,'fracture',0),cue(2,'decay',1),cue(3,'extract',2)])s=enqueueAnimation(s,x);
  assert.equal(s.active.length,2);assert.equal(s.waiting.length,1);
  s=finishAnimation(s,1);assert.equal(s.active.length,2);assert.equal(s.waiting.length,0);
 });
 it('aynı dişte çoklu karşıt işlemler FIFO sırasını korur',()=>{
  let s=emptyAnimationState();
  s=enqueueAnimation(s,cue(1,'decay',4));
  s=enqueueAnimation(s,cue(2,'heal',4));
  s=enqueueAnimation(s,cue(3,'fracture',4));
  assert.deepEqual(s.waiting.map(c=>c.id),[2,3]);
  s=finishAnimation(s,1);assert.deepEqual(s.active.map(c=>c.id),[2]);
  s=finishAnimation(s,2);assert.deepEqual(s.active.map(c=>c.id),[3]);
 });
 it('kalabalık kuyruk eski animasyonları sessizce kaybetmez',()=>{
  let s=emptyAnimationState();
  for(let i=0;i<70;i++)s=enqueueAnimation(s,cue(i+1,i%2?'fracture':'decay',i%32));
  assert.equal(s.active.length+s.waiting.length,70);
 });
 it('bitmiş animasyon tekrar bitirilirse durum değişmez',()=>{
  const s=enqueueAnimation(emptyAnimationState(),cue(1,'heal'));
  assert.equal(finishAnimation(s,999),s);
 });
});
describe('savunma ve sıfırlama yarış koşulları',()=>{
 it('engellenmiş kötü saldırı iyi ekip kanalını kullanır',()=>{
  const blocked={...cue(1,'fracture',1),blocked:true};
  assert.equal(cueLane(blocked),'good');
  let s=enqueueAnimation(emptyAnimationState(),blocked);
  s=enqueueAnimation(s,cue(2,'decay',2));
  assert.equal(s.active.length,2);
  assert.deepEqual(s.active.map(cueLane),['good','bad']);
 });
 it('aynı dişe gelen engellenmiş saldırı ve tedavi üst üste binmez',()=>{
  let s=enqueueAnimation(emptyAnimationState(),{...cue(1,'decay',7),blocked:true});
  s=enqueueAnimation(s,cue(2,'heal',7));
  assert.deepEqual(s.active.map(c=>c.id),[1]);
  s=finishAnimation(s,1);
  assert.deepEqual(s.active.map(c=>c.id),[2]);
 });
 it('eski turun animasyonları sıfırlanınca geri gelmez',()=>{
  const old=enqueueAnimation(emptyAnimationState(),cue(1,'decay',0));
  const fresh=resetAnimations();
  assert.equal(fresh.active.length,0);
  assert.equal(fresh.waiting.length,0);
  assert.equal(finishAnimation(fresh,old.active[0].id),fresh);
 });
 it('dört eşzamanlı işlem farklı dişlerde çalışır, beşinci bekler',()=>{
  let s=emptyAnimationState();
  for(const c of [cue(1,'decay',1),cue(2,'fracture',2),cue(3,'heal',3),cue(4,'implant',4),cue(5,'heal',5)])s=enqueueAnimation(s,c);
  assert.equal(s.active.length,4);
  assert.deepEqual(s.waiting.map(c=>c.id),[5]);
  s=finishAnimation(s,3);
  assert.equal(s.active.length,4);
  assert.equal(s.waiting.length,0);
 });
});

describe('hekim tekilliği ve kuyruk adaleti',()=>{
 it('aynı hekim farklı iki dişe eş zamanlı müdahale etmez',()=>{
  let s=enqueueAnimation(emptyAnimationState(),cue(101,'heal',1));
  s=enqueueAnimation(s,cue(102,'heal',2));
  assert.deepEqual(s.active.map(c=>c.id),[101]);
  assert.deepEqual(s.waiting.map(c=>c.id),[102]);
  s=finishAnimation(s,101);
  assert.deepEqual(s.active.map(c=>c.id),[102]);
 });
 it('çürük ve kırık koruması aynı uzmanı aynı anda kullanmaz',()=>{
  let s=enqueueAnimation(emptyAnimationState(),cue(201,'decayShield',1));
  s=enqueueAnimation(s,cue(202,'fractureShield',2));
  assert.equal(s.active.length,1);
  assert.equal(s.waiting.length,1);
 });
 it('bekleyen eski aynı-diş işlemi daha yeni işlem tarafından geçilmez',()=>{
  let s=enqueueAnimation(emptyAnimationState(),cue(301,'decay',1));
  s=enqueueAnimation(s,cue(302,'heal',1));
  s=enqueueAnimation(s,cue(303,'fracture',1));
  s=finishAnimation(s,301);
  assert.deepEqual(s.active.map(c=>c.id),[302]);
  s=finishAnimation(s,302);
  assert.deepEqual(s.active.map(c=>c.id),[303]);
 });
});

describe('yük altında uzman bazlı işlem sırası',()=>{
 it('120 olaydan hiçbiri düşmez ve uzman eş zamanlı kopyalanmaz',()=>{
  const actions:AnimationCue['action'][]=['heal','implant','decay','fracture','extract','decayShield'];
  let s=emptyAnimationState();
  for(let i=0;i<120;i++)s=enqueueAnimation(s,cue(i+1000,actions[i%actions.length],i%32));
  let completed=0;
  while(s.active.length){
   assert.ok(s.active.length<=4);
   assert.ok(new Set(s.active.map(c=>c.action==='decayShield'||c.action==='fractureShield'?'protection':c.action)).size===s.active.length);
   assert.ok(new Set(s.active.map(c=>c.targetId)).size===s.active.length);
   s=finishAnimation(s,s.active[0].id);
   completed++;
   assert.ok(completed<=120);
  }
  assert.equal(completed,120);
  assert.equal(s.waiting.length,0);
 });
});
