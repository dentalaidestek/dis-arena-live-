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
 it('bozuk kayıt reddedilir',()=>{
  assert.equal(validateSnapshot({version:1,teeth:[]}),false);
  assert.equal(loadSnapshot({getItem:()=>'{bozuk'}),null);
 });
});