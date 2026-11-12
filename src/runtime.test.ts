import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {createRound,ingest,validateSnapshot,saveSnapshot,loadSnapshot} from './runtime';
describe('Kalıcı oyun akışı',()=>{
 it('geçerli olay işlenir ve tekrar uygulanmaz',()=>{
  const event={id:'gift-1',user:'@oyuncu',teamId:0,action:'decay' as const,timestamp:123};
  const first=ingest(createRound('r1'),event);
  assert.equal(first.accepted,true);assert.equal(first.snapshot.teeth[0].hp,90);
  const again=ingest(first.snapshot,event);
  assert.equal(again.accepted,false);assert.equal(again.snapshot.teeth[0].hp,90);
 });
 it('hatalı takım indeksi reddedilir',()=>{
  const result=ingest(createRound('r1'),{id:'bad',user:'@u',teamId:99,action:'decay',timestamp:1});
  assert.equal(result.accepted,false);assert.equal(result.snapshot.processedIds.length,0);
 });
 it('snapshot depolanır ve geri yüklenir',()=>{
  let value='';const store={getItem:()=>value||null,setItem:(_k:string,v:string)=>{value=v;}};
  const round=createRound('round-test');
  assert.equal(saveSnapshot(store,round),true);
  assert.equal(loadSnapshot(store)?.roundId,'round-test');
 });
 it('aynı dişe gelen ardışık savunma ve saldırı sırası belirleyicidir',()=>{
  const start=createRound('concurrent',0);
  const shield=ingest(start,{id:'a',user:'@iyi',teamId:0,action:'decayShield',timestamp:1});
  const attack=ingest(shield.snapshot,{id:'b',user:'@kotu',teamId:0,action:'decay',timestamp:2});
  assert.equal(attack.snapshot.teeth[0].hp,100);
  assert.equal(attack.snapshot.teeth[0].decayShields,0);
  assert.equal(attack.snapshot.history[0].blocked,true);
  const fracture=ingest(attack.snapshot,{id:'c',user:'@kotu2',teamId:0,action:'fracture',timestamp:3});
  assert.equal(fracture.snapshot.teeth[0].hp,70);
 });
 it('geçersiz ve aşırı büyük olay kimlikleri reddedilir',()=>{
  const s=createRound('r',0);
  assert.equal(ingest(s,{id:'x'.repeat(200),user:'@test',teamId:0,action:'heal',timestamp:1}).accepted,false);
  assert.equal(ingest(s,{id:'x',user:'@test',teamId:-1,action:'heal',timestamp:1}).accepted,false);
 });
 it('bozuk kayıt reddedilir',()=>{
  assert.equal(validateSnapshot({version:1,teeth:[]}),false);
  assert.equal(loadSnapshot({getItem:()=>'{bozuk'}),null);
 });
});