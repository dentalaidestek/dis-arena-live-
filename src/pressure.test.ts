import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {createRound,implantLocked,ingest,pressureTick,PRESSURE_DELAY_MS,PRESSURE_INTERVAL_MS} from './runtime';
describe('Son sekiz ve otomatik baskı',()=>{
 it('9 takımda implant açık, 8 takımda kilitli',()=>{
  const s=createRound('r',0);s.teeth=s.teeth.map((t,i)=>({...t,extracted:i>=9}));
  assert.equal(implantLocked(s.teeth),false);
  s.teeth[8].extracted=true;assert.equal(implantLocked(s.teeth),true);
  assert.equal(ingest(s,{id:'implant-1',user:'@test',teamId:8,action:'implant',timestamp:1}).accepted,false);
 });
 it('10 dakika öncesi baskı yok, sonra tüm aktif dişlerde 2 HP azalır',()=>{
  const s=createRound('r',0);
  assert.equal(pressureTick(s,PRESSURE_DELAY_MS-1),s);
  const next=pressureTick(s,PRESSURE_DELAY_MS);
  assert.equal(next.teeth[0].hp,98);assert.equal(next.teeth[31].hp,98);
  assert.equal(pressureTick(next,PRESSURE_DELAY_MS+1000),next);
  assert.equal(pressureTick(next,PRESSURE_DELAY_MS+PRESSURE_INTERVAL_MS).teeth[0].hp,96);
 });
 it('baskı çekim yapmaz, kalkanı harcamaz, çekilmiş dişe işlemez',()=>{
  const s=createRound('r',0);s.teeth[0].hp=1;s.teeth[0].decayShields=2;s.teeth[1].extracted=true;
  const next=pressureTick(s,PRESSURE_DELAY_MS);
  assert.equal(next.teeth[0].hp,0);assert.equal(next.teeth[0].extracted,false);assert.equal(next.teeth[0].decayShields,2);
  assert.equal(next.teeth[1].hp,100);
 });
 it('çekim baskı süresini sıfırlar',()=>{
  const s=createRound('r',0);s.teeth[0].hp=20;
  const result=ingest(s,{id:'extract',user:'@test',teamId:0,action:'extract',timestamp:500});
  assert.equal(result.accepted,true);assert.equal(result.snapshot.lastEliminationAt,500);
  assert.equal(pressureTick(result.snapshot,PRESSURE_DELAY_MS),result.snapshot);
 });
});