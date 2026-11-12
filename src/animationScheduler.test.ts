import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {emptyAnimationState,enqueueAnimation,finishAnimation,laneOf} from './animationScheduler';
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
  for(let i=0;i<3;i++)s=enqueueAnimation(s,cue(i+1,'fracture',i));
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
  for(let i=0;i<70;i++)s=enqueueAnimation(s,cue(i+1,'decay',i%32));
  assert.equal(s.active.length+s.waiting.length,70);
 });
 it('bitmiş animasyon tekrar bitirilirse durum değişmez',()=>{
  const s=enqueueAnimation(emptyAnimationState(),cue(1,'heal'));
  assert.equal(finishAnimation(s,999),s);
 });
});