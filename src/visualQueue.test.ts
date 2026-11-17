import {test} from 'node:test';import assert from 'node:assert/strict';
import {appendVisuals,VISUAL_CAPACITY,visualDuration,visualsForRound} from './visualQueue';
import type {VisualEvent} from '../server/store';
const v=(id:number)=>({id} as VisualEvent);
test('queued treatments retain order and reject pending replay',()=>{let q=appendVisuals({waiting:[],skipped:0},[v(1),v(2)]);q=appendVisuals(q,[v(2),v(3)]);assert.deepEqual(q.waiting.map(v=>v.id),[1,2,3]);assert.equal(q.skipped,0)});
test('visual overflow is explicit and bounded; journal is independent',()=>{const q=appendVisuals({waiting:[],skipped:0},Array.from({length:300},(_,i)=>v(i)));assert.equal(q.waiting.length,VISUAL_CAPACITY);assert.equal(q.skipped,44);assert.ok(visualDuration(30)<visualDuration(0))});

test('a new round rejects animations that were queued for the previous round',()=>{
 const old={...v(1),before:{roundId:'old'}} as VisualEvent;const current={...v(2),before:{roundId:'current'}} as VisualEvent;
 assert.deepEqual(visualsForRound([old,current],'current').map(v=>v.id),[2]);
});
