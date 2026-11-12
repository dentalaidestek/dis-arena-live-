import test from 'node:test';
import assert from 'node:assert/strict';
import {claimPrice,procedurePrice,toothPriceBand,SCREENSHOT_GIFTS} from './toothEconomy';
import {createRound} from './runtime';
import {chooseProcedureTarget} from './procedureGifts';
test('front incisors cost more than middle and posterior teeth',()=>{
 assert.equal(toothPriceBand(7),'front');
 assert.equal(toothPriceBand(4),'middle');
 assert.equal(toothPriceBand(0),'back');
 assert.ok(claimPrice(7)>claimPrice(4));
 assert.ok(claimPrice(4)>claimPrice(0));
 assert.equal(procedurePrice(7,'heal'),20);
 assert.equal(procedurePrice(0,'heal'),1);
 assert.equal(procedurePrice(7,'extract'),40);
});
test('cheap gifts cannot heal expensive owned incisors',()=>{
 const s=createRound('prices',0);
 s.owners[7]={userId:'owner',username:'owner',claimedAt:0};
 const gift={eventId:'gift',userId:'owner',username:'owner',giftName:'GG',coins:1,timestamp:1};
 assert.equal(chooseProcedureTarget(s,gift,'heal'),null);
 assert.equal(chooseProcedureTarget(s,{...gift,coins:20},'heal'),7);
});
test('screenshot gift names have unique consistent prices',()=>{
 const names=new Set(SCREENSHOT_GIFTS.map(g=>g.name));
 assert.equal(names.size,SCREENSHOT_GIFTS.length);
 assert.equal(SCREENSHOT_GIFTS.find(g=>g.name==='Donat')?.coins,30);
 assert.equal(SCREENSHOT_GIFTS.find(g=>g.name==='Parfüm')?.coins,20);
 assert.equal(SCREENSHOT_GIFTS.find(g=>g.name==='GG')?.coins,1);
});
