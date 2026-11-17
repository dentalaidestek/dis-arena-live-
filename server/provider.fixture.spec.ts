import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {ArenaStore} from './store';
test('real provider protobuf → Python adapter → SQLite: ×1..×1000 totals exactly 1000',()=>{
 const packets=JSON.parse(execFileSync('python3',['scripts/provider_fixture.py'],{encoding:'utf8',maxBuffer:2_000_000}));
 const store=new ArenaStore(':memory:',1000);
 try{store.setCatalog([{giftId:'9',name:'Fixture Rose',coins:1,streak:true}],'fixture-only',1000);for(const p of packets)assert.equal(store.ingest(p,p.receivedAt).delta,1);assert.equal(store.state().players[0].coins,1000);for(const p of packets)assert.equal(store.ingest(p,3000).duplicate,true);assert.equal(store.state().players[0].coins,1000)}finally{store.close()}
});
