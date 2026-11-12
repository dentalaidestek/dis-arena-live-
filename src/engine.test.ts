import {describe,it} from 'node:test';import assert from 'node:assert/strict';import {initialTeeth,applyAction,processEvent,getLeader} from './engine';
describe('Diş Arena kuralları',()=>{
 it('32 bağımsız diş başlatır',()=>{const t=initialTeeth();assert.equal(t.length,32);assert.ok(t.every(x=>x.hp===100));});
 it('çürük kalkanı bir saldırı tüketir',()=>{const t=applyAction(initialTeeth()[0],'decayShield').tooth;const r=applyAction(t,'decay');assert.equal(r.tooth.hp,100);assert.equal(r.tooth.decayShields,0);assert.equal(r.blocked,true);});
 it('kırık kalkanı çürük saldırısını engellemez',()=>{const t=applyAction(initialTeeth()[0],'fractureShield').tooth;const r=applyAction(t,'decay');assert.equal(r.tooth.hp,90);assert.equal(r.tooth.fractureShields,1);});
 it('çekim eşik kontrolü',()=>{const t=initialTeeth()[0];assert.equal(applyAction(t,'extract').blocked,true);const critical={...t,hp:20};assert.equal(applyAction(critical,'extract').tooth.extracted,true);});
 it('implant çekilmiş dişi geri getirir',()=>{const t={...initialTeeth()[0],hp:0,extracted:true};const r=applyAction(t,'implant');assert.equal(r.tooth.extracted,false);assert.equal(r.tooth.hp,50);});
 it('aynı olay iki kez işlenmez',()=>{const seen=new Set<string>();const e={id:'unique',user:'@test',teamId:0,action:'decay' as const,timestamp:1};const first=processEvent(initialTeeth(),e,seen);const second=processEvent(first.teeth,e,seen);assert.equal(second.teeth[0].hp,90);});
 it('eşit liderlikte önceki lider korunur',()=>{assert.equal(getLeader(initialTeeth(),null),null);assert.equal(getLeader(initialTeeth(),2)?.id,2);});
});
