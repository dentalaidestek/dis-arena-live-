import {describe,it} from 'node:test';import assert from 'node:assert/strict';import {claim,createRound,ingest,loadSnapshot,saveSnapshot} from './runtime';import {ownerCount,ownerLabel} from './ownership';
describe('Kullanıcı adıyla diş sahiplenme',()=>{
 it('bir izleyici tek diş sahiplenir ve ikinci dişi alamaz',()=>{
  const first=claim(createRound('r',0),0,'uid-1','@Ali',1);
  assert.equal(first.accepted,true);assert.equal(ownerLabel(first.snapshot.owners,0),'@ali');
  assert.equal(claim(first.snapshot,1,'uid-1','Ali',2).accepted,false);
  assert.equal(claim(first.snapshot,0,'uid-2','Veli',2).accepted,false);
  assert.equal(ownerCount(first.snapshot.owners),1);
 });
 it('çekim sonrası implant aynı sahibin dişini geri getirir',()=>{
  let s=claim(createRound('r',0),0,'uid-1','@ali',1).snapshot;
  s={...s,teeth:s.teeth.map((t,i)=>i===0?{...t,hp:20}:t)};
  const extracted=ingest(s,{id:'ex',user:'@mod',teamId:0,action:'extract',timestamp:2});
  assert.equal(extracted.snapshot.teeth[0].extracted,true);
  assert.equal(claim(extracted.snapshot,0,'uid-2','@veli',3).accepted,false);
  const implant=ingest(extracted.snapshot,{id:'imp',user:'@mod',teamId:0,action:'implant',timestamp:4});
  assert.equal(implant.accepted,true);
  assert.equal(implant.snapshot.teeth[0].hp,50);
  assert.equal(ownerLabel(implant.snapshot.owners,0),'@ali');
 });
 it('son sekizde implant yasak ve sahiplik korunur',()=>{
  let s=claim(createRound('r',0),0,'uid-1','Ali',1).snapshot;
  s={...s,teeth:s.teeth.map((t,i)=>({...t,extracted:i>=8}))};
  assert.equal(ingest(s,{id:'imp',user:'@mod',teamId:8,action:'implant',timestamp:3}).accepted,false);
  assert.equal(ownerLabel(s.owners,0),'@ali');
 });
 it('eski kayıt sahiplik eklenerek kayıpsız yüklenir',()=>{
  const old=createRound('r',0) as any;delete old.owners;
  const loaded=loadSnapshot({getItem:()=>JSON.stringify(old)});
  assert.ok(loaded);assert.equal(ownerCount(loaded.owners),0);assert.equal(loaded.teeth.length,32);
 });
 it('sahiplik kaydedilip geri yüklenir',()=>{
  const s=claim(createRound('r',0),2,'uid-2','Ayşe',1).snapshot;
  let json='';saveSnapshot({setItem:(_k,v)=>{json=v;}},s);
  assert.equal(ownerLabel(loadSnapshot({getItem:()=>json})!.owners,2),'@ayşe');
 });
});