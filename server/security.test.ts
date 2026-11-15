import {test} from 'node:test';import assert from 'node:assert/strict';
import {validUsername,authorized} from './server';
test('username rejected before spawning any provider connection',()=>{for(const v of ['',null,'https://tiktok.com/@a','--demo','x;rm','a b','a..b','user.'])assert.equal(validUsername(v),false);assert.equal(validUsername('@dental_arena'),true)});
test('bridge and admin require the exact bearer token',()=>{assert.equal(authorized(undefined,'secret'),false);assert.equal(authorized('Bearer secreT','secret'),false);assert.equal(authorized('Bearer secret','secret'),true)});
