import {describe,it} from 'node:test';import assert from 'node:assert/strict';import {resolveTeam} from './teamResolver';import {TEAMS} from './engine';
describe('Yayın yorumu takım eşlemesi',()=>{
 it('kısa takım kodlarını çözer',()=>{assert.equal(TEAMS[resolveTeam('GS')!],'Galatasaray');assert.equal(TEAMS[resolveTeam('FB')!],'Fenerbahçe');assert.equal(TEAMS[resolveTeam('BJK')!],'Beşiktaş');});
 it('Türkçe harfleri ve taraftar lakaplarını tanır',()=>{assert.equal(TEAMS[resolveTeam('Beşiktaş')!],'Beşiktaş');assert.equal(TEAMS[resolveTeam('cimbom')!],'Galatasaray');assert.equal(TEAMS[resolveTeam('Göztepe')!],'Göztepe');});
 it('birden çok takım veya eşleşmeyen yorumu reddeder',()=>{assert.equal(resolveTeam('GS FB'),null);assert.equal(resolveTeam('merhaba'),null);});
 it('kelime içindeki kısaltmaları takım sanmaz',()=>{assert.equal(resolveTeam('gsgsgs'),null);assert.equal(resolveTeam('fbhaber'),null);});
});