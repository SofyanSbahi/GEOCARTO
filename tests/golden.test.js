/* Les moteurs extraits doivent se comporter EXACTEMENT comme le code historique (golden figé par tools/make-golden.mjs). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {api} from './helpers/engine-api.js';
import {compute} from './golden-cases.js';
const gold=JSON.parse(fs.readFileSync(new URL('./golden/engines.json',import.meta.url),'utf8'));
const got=JSON.parse(JSON.stringify(compute(api)));
for(const section of Object.keys(gold)){
 test(`golden · ${section}`,()=>{
  assert.deepEqual(Object.keys(got[section]),Object.keys(gold[section]),'clés différentes');
  const bad=[];for(const k of Object.keys(gold[section]))try{assert.deepEqual(got[section][k],gold[section][k])}catch(e){bad.push(k)}
  assert.equal(bad.length,0,`${bad.length} cas différents, p. ex. ${bad.slice(0,5).join(', ')}`)})}
