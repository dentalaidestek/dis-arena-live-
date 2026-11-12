import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {createRound,ingest,roundPhase,winner} from './runtime';
describe('Final ve şampiyonluk kuralları',()=>{
 it('32 aktif diş ile normal tur başlar',()=>assert.equal(roundPhase(createRound('r').teeth),'open'));
 it('son iki dişte implant kilitlenir',()=>{
  const s=createRound('r');s.teeth=s.teeth.map((t,i)=>({...t,extracted:i>=2}));
  assert.equal(roundPhase(s.teeth),'final');
  const result=ingest(s,{id:'x',user:'@demo',teamId:2,action:'implant',timestamp:1});
  assert.equal(result.accepted,false);assert.equal(result.snapshot.teeth[2].extracted,true);
 });
 it('tek kalan diş şampiyon olur ve yeni olaylar reddedilir',()=>{
  const s=createRound('r');s.teeth=s.teeth.map((t,i)=>({...t,extracted:i!==7}));
  assert.equal(roundPhase(s.teeth),'finished');assert.equal(winner(s.teeth)?.id,7);
  assert.equal(ingest(s,{id:'x',user:'@demo',teamId:7,action:'decay',timestamp:1}).accepted,false);
 });
 it('bilinmeyen işlem reddedilir',()=>{
  const s=createRound('r');const result=ingest(s,{id:'x',user:'@demo',teamId:0,action:'invalid' as never,timestamp:1});
  assert.equal(result.accepted,false);
 });
});