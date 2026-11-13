import {test} from 'node:test';import assert from 'node:assert/strict';import {normalizeBridgeGift} from './bridgeGift';
const base={type:'gift',eventId:'evt',userId:'u',username:'Alice',giftName:'Gül',coins:1,timestamp:1000};
test('ordinary gift produces one event',()=>assert.deepEqual(normalizeBridgeGift(base).map(g=>g.eventId),['evt']));
test('cumulative streak progress is not counted',()=>{for(let i=1;i<100;i++)assert.equal(normalizeBridgeGift({...base,streak:true,repeatCount:i,repeatEnd:false}).length,0);assert.equal(normalizeBridgeGift({...base,streak:true,repeatCount:100,repeatEnd:true}).length,100)});
test('streak replay produces stable per-unit ids',()=>assert.deepEqual(normalizeBridgeGift({...base,streak:true,repeatCount:3,repeatEnd:true}),normalizeBridgeGift({...base,streak:true,repeatCount:3,repeatEnd:true})));
test('invalid count and malformed payload are rejected',()=>{assert.deepEqual(normalizeBridgeGift({...base,repeatCount:-1}),[]);assert.deepEqual(normalizeBridgeGift({...base,repeatCount:1.5}),[]);assert.deepEqual(normalizeBridgeGift({...base,coins:Infinity}),[]);assert.deepEqual(normalizeBridgeGift({}),[])});
