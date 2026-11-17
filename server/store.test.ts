import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ArenaStore} from './store';
const packet=(id='one',count=1)=>({type:'gift',eventId:id,roomId:'room',giftId:'rose',userId:'u',username:'Alice',giftName:'Rose',coins:1,timestamp:1000,repeatCount:count,streak:true,streakId:'series'});
const catalog=[{giftId:'rose',name:'Rose',coins:1,streak:true}];
test('SQLite restart preserves cumulative progress, duplicates and balances',()=>{const dir=mkdtempSync(join(tmpdir(),'arena-'));const path=join(dir,'db');try{let s=new ArenaStore(path,1000);s.setCatalog(catalog,'verified',1000);assert.equal(s.ingest(packet('x',10),1000).delta,10);s.close();s=new ArenaStore(path,1001);assert.equal(s.ingest(packet('y',15),1001).delta,5);assert.equal(s.ingest(packet('x',10),1002).duplicate,true);assert.equal(s.ingest(packet('z',12),1003).delta,0);assert.equal(s.state().players[0].coins,15);s.close();}finally{rmSync(dir,{recursive:true,force:true})}});
test('ambiguous series and catalogue price conflicts are quarantined without scoring',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);assert.equal(s.ingest({...packet(),streakId:''},1000).accepted,false);assert.equal(s.ingest({...packet('bad'),coins:2},1000).accepted,false);assert.equal(s.state().players.length,0);s.close()});
test('identity scopes include user gift and room; prototype keys are ordinary IDs',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);s.ingest(packet(),1000);s.ingest({...packet('two'),userId:'other'},1000);s.ingest({...packet('three',2),streakId:'__proto__'},1000);assert.equal(s.state().players.reduce((n,p)=>n+p.coins,0),4);s.close()});
test('round is frozen at deadline and archived; replay cannot enter the next round',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);s.ingest(packet(),1000);s.tick(601000);assert.equal(s.state().winners?.length,1);assert.equal(s.ingest(packet('late',2),601000).accepted,false);const old=s.state().roundId;s.newRound(602000);assert.notEqual(s.state().roundId,old);assert.equal(s.ingest(packet(),602000).duplicate,true);assert.equal(s.ingest(packet('delayed'),602000).accepted,false);assert.equal(s.rounds().length,2);s.close()});
test('live Bouquet extraction and implant require two different verified 20-coin gift IDs',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog([{giftId:'a',name:'Bouquet gift',coins:20,streak:false,image:'https://cdn.test/a.png'},{giftId:'b',name:'Perfume-like gift',coins:20,streak:false,image:'https://cdn.test/b.png'}], 'v',1000);s.mapGift('a','extract','Çiçek Buketi');assert.throws(()=>s.mapGift('a','implant','Yanlış hediye'));assert.throws(()=>s.mapGift('b','decay','Çürütme Hediyesi'));s.mapGift('b','implant','Gümüş Parfüm');assert.equal(s.publicGifts().extract.coins,20);assert.equal(s.publicGifts().implant.coins,20);s.close()});
test('durable dedupe still protects first event after more than ten thousand packets',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog([{...catalog[0],streak:false}],'v',1000);for(let i=0;i<10005;i++)s.ingest({...packet('e'+i),streak:false,repeatCount:1},1000);assert.equal(s.state().players[0].coins,10005);assert.equal(s.ingest({...packet('e0'),streak:false,repeatCount:1},1001).duplicate,true);assert.equal(s.state().players[0].coins,10005);s.close()});
test('refreshed catalogue becomes current even when its version was seen before',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'one',1000);s.setCatalog([{...catalog[0],coins:2}],'two',1001);s.setCatalog(catalog,'one',1002);assert.equal(s.catalog().version,'one');s.close()});
test('transaction rolls back all units and streak progress if a later unit overflows',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog([{giftId:'x',name:'X',coins:20,streak:true,image:'https://cdn.test/x.png'}],'v',1000);s.mapGift('x','extract','Çiçek Buketi');s.importLegacy({...s.state(),players:[{userId:'u',username:'u',coins:Number.MAX_SAFE_INTEGER-20,joinedAt:1000,lockedUntil:0}]},1000);const p={...packet('overflow',2),giftId:'x',coins:20};assert.equal(s.ingest(p,1001).accepted,false);assert.equal(s.state().players[0].coins,Number.MAX_SAFE_INTEGER-20);assert.equal(s.db.prepare('SELECT count(*) AS n FROM streaks').get()!.n,0);s.close()});
test('1000 cumulative packets add 1000 coins in the authoritative store',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);for(let i=1;i<=1000;i++)assert.equal(s.ingest(packet('p'+i,i),1000+i).delta,1);assert.equal(s.state().players[0].coins,1000);assert.equal(s.ingest({...packet('end',1000),repeatEnd:true},3000).delta,0);s.close()});
test('malformed and duplicate malformed packets are visible in durable diagnostics',()=>{const s=new ArenaStore(':memory:',1000);s.ingest({type:'gift',coins:-1},1000);s.ingest({type:'gift',coins:-1},1001);assert.equal(s.diagnostics().invalid,1);assert.equal(s.diagnostics().duplicates,1);s.close()});
test('imported old replay IDs remain blocked after migration',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);s.importLegacy({...s.state(),processedIds:['old-event']},1000);assert.equal(s.ingest({...packet('old-event'),streak:false},1001).duplicate,true);s.close()});
test('providers that reuse a message ID for cumulative updates still advance exactly once',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog(catalog,'v',1000);assert.equal(s.ingest(packet('same',10),1000).delta,10);assert.equal(s.ingest(packet('same',15),1001).delta,5);assert.equal(s.ingest(packet('same',15),1002).duplicate,true);assert.equal(s.state().players[0].coins,15);s.close()});
test('a retired 50-coin extraction mapping is no longer valid under the 20-coin rule',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog([{giftId:'old',name:'Old 50-coin gift',coins:50,streak:false}],'v',1000);s.db.prepare('INSERT INTO mappings VALUES(?,?)').run('old','extract');const r=s.ingest({...packet('old50'),giftId:'old',coins:50,streak:false,repeatCount:1},1000);assert.equal(r.action,'score');assert.equal(s.state().players[0].coins,50);s.close()});

test('viewer gift names follow verified mapping and refreshed catalogue prices',()=>{
 const s=new ArenaStore(':memory:',1000);
 s.setCatalog([{giftId:'bouquet',name:'Bouquet',coins:20,streak:false,image:'https://cdn.test/bouquet.png'},{giftId:'perfume',name:'Parfüm',coins:20,streak:false,image:'https://cdn.test/perfume.png'}],'one',1000);
 assert.equal(s.publicGifts().extract.verified,false);s.mapGift('bouquet','extract','Çiçek Buketi');s.mapGift('perfume','implant','Gümüş Parfüm');
 assert.equal(s.publicGifts().extract.name,'Çiçek Buketi');assert.equal(s.publicGifts().implant.verified,true);assert.equal(s.publicGifts().implant.name,'Gümüş Parfüm');
 s.setCatalog([{giftId:'bouquet',name:'Yeni fiyat',coins:25,streak:false}],'two',1001);
 assert.equal(s.publicGifts().extract.verified,false);assert.equal(s.publicGifts().implant.verified,false);
 const receipt=s.ingest({...packet('refresh'),giftId:'bouquet',coins:25,streak:false,repeatCount:1},1002);
 assert.equal(receipt.accepted,true);assert.equal(receipt.action,'score');assert.equal(s.state().players[0].coins,25);s.close();
});


test('saved LIVE gift IDs award exact catalogue coin values when streak metadata is unavailable',()=>{const s=new ArenaStore(':memory:',1000);s.setCatalog([{giftId:'17473',name:'Bouquet',coins:20,streak:false,streakKnown:false},{giftId:'1354583',name:'Energy Drop',coins:30,streak:false,streakKnown:false},{giftId:'10022',name:'Gyeongbokgung',coins:20000,streak:false,streakKnown:false}],'saved-live-catalog',1000);const p=(giftId:string,coins:number,eventId:string,userId:string)=>({type:'gift',eventId,roomId:'room',giftId,userId,username:userId,giftName:'provider payload name',coins,timestamp:1000,repeatCount:1,streak:false,streakId:''});assert.equal(s.ingest(p('17473',20,'bouquet','a'),1000).accepted,true);assert.equal(s.ingest(p('1354583',30,'energy-drop','b'),1000).accepted,true);assert.equal(s.ingest(p('10022',20000,'palace','c'),1000).accepted,true);assert.deepEqual(s.state().players.map(x=>x.coins).sort((a,b)=>a-b),[20,30,20000]);assert.equal(s.ingest(p('17473',999,'wrong-price','d'),1000).accepted,false);s.close()});




test('live catalog auto-maps exact Rose and TikTok gifts with provider IDs and images',()=>{
 const s=new ArenaStore(':memory:',1000);
 s.setCatalog([{giftId:'17473',name:'Bouquet',coins:20,streak:false,image:'https://cdn.test/bouquet.png'},{giftId:'1354581',name:'Mushroom',coins:20,streak:false,image:'https://cdn.test/mushroom.png'},{giftId:'rose-live-id',name:'Rose',coins:1,streak:false,image:'https://cdn.test/rose.png'},{giftId:'tiktok-live-id',name:'TikTok',coins:1,streak:false,image:'https://cdn.test/tiktok.png'}],'live-room',1000);
 const gifts=s.publicGifts();
 assert.equal(gifts.heal.giftId,'rose-live-id');assert.equal(gifts.heal.image,'https://cdn.test/rose.png');assert.equal(gifts.heal.coins,1);
 assert.equal(gifts.decay.giftId,'tiktok-live-id');assert.equal(gifts.decay.image,'https://cdn.test/tiktok.png');assert.equal(gifts.decay.coins,1);
 assert.equal(gifts.extract.image,'https://cdn.test/bouquet.png');assert.equal(gifts.implant.image,'https://cdn.test/mushroom.png');
 s.close();
});
test('comments select a tooth; follow and each 100 likes separately remove 30 HP',()=>{
 const s=new ArenaStore(':memory:',1000);const base=s.state();
 s.importLegacy({...base,startedAt:1000,players:[{userId:'tooth-a',username:'A',coins:10,joinedAt:1000,lockedUntil:0,toothId:11,hp:100},{userId:'tooth-b',username:'B',coins:5,joinedAt:1000,lockedUntil:0,toothId:12,hp:100}]},1000);
 const comment={type:'comment',eventId:'comment-1',roomId:'live',userId:'attacker',username:'Attacker',comment:'11',timestamp:1001};
 assert.equal(s.engage(comment,1001).accepted,true);assert.equal(s.state().players.find(p=>p.toothId===11)?.hp,100);
 const follow={type:'follow',eventId:'follow-1',roomId:'live',userId:'attacker',username:'Attacker',timestamp:1002};
 assert.equal(s.engage(follow,1002).delta,1);assert.equal(s.state().players.find(p=>p.toothId===11)?.hp,70);
 assert.equal(s.engage({...follow,eventId:'follow-2'},1003).delta,0);
 assert.equal(s.engage({type:'like',eventId:'like-1',roomId:'live',userId:'attacker',username:'Attacker',count:60,timestamp:1004},1004).delta,0);
 assert.equal(s.engage({type:'like',eventId:'like-2',roomId:'live',userId:'attacker',username:'Attacker',count:40,timestamp:1005},1005).delta,1);
 assert.equal(s.state().players.find(p=>p.toothId===11)?.hp,40);
 assert.equal(s.state().players.find(p=>p.toothId===12)?.hp,100);
 s.close();
});
test('100 likes are counted per user and invalid tooth comments are ignored',()=>{
 const s=new ArenaStore(':memory:',1000);const base=s.state();
 s.importLegacy({...base,startedAt:1000,players:[{userId:'tooth-a',username:'A',coins:1,joinedAt:1000,lockedUntil:0,toothId:11,hp:100},{userId:'tooth-b',username:'B',coins:1,joinedAt:1000,lockedUntil:0,toothId:12,hp:100}]},1000);
 assert.equal(s.engage({type:'comment',eventId:'bad-comment',roomId:'live',userId:'x',username:'X',comment:'99',timestamp:1001},1001).accepted,false);
 for(const [user,tooth] of [['x','11'],['y','12']] as const)s.engage({type:'comment',eventId:'c-'+user,roomId:'live',userId:user,username:user,comment:tooth,timestamp:1002},1002);
 assert.equal(s.engage({type:'like',eventId:'lx',roomId:'live',userId:'x',username:'x',count:100,timestamp:1003},1003).delta,1);
 assert.equal(s.engage({type:'like',eventId:'ly',roomId:'live',userId:'y',username:'y',count:100,timestamp:1004},1004).delta,1);
 assert.equal(s.state().players.find(p=>p.toothId===11)?.hp,70);assert.equal(s.state().players.find(p=>p.toothId===12)?.hp,70);
 s.close();
});
test('30 HP engagement hit extracts a zero-HP tooth and ends the arena when it is the last tooth',()=>{
 const s=new ArenaStore(':memory:',1000);const base=s.state();
 s.importLegacy({...base,startedAt:1000,teeth:base.teeth!.map(t=>t.toothId===11?t:{...t,hp:0,condition:'extracted'}),players:[{userId:'tooth-a',username:'A',coins:1,joinedAt:1000,lockedUntil:0,toothId:11,hp:30}]},1000);
 s.engage({type:'comment',eventId:'c',roomId:'live',userId:'x',username:'X',comment:'11',timestamp:1001},1001);
 const r=s.engage({type:'follow',eventId:'f',roomId:'live',userId:'x',username:'X',timestamp:1002},1002);
 assert.equal(r.action,'extract');assert.equal(s.state().players[0].hp,0);assert.ok(s.state().finishedAt);
 s.close();
});
