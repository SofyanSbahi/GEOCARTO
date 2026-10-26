/* stage.css est chargé sur TOUTES les pages : chaque sélecteur doit être borné au mode Stage (body.stage-*, .stg, .st-*, .pv*),
   sinon il style des éléments de l'application d'origine. Régression réelle corrigée : `.st` du mode Stage recouvrait les pastilles
   `a.st` des leçons (stepper). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../css/stage.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const app=fs.readFileSync(new URL('../css/app.css',import.meta.url),'utf8');
const appClasses=new Set([...app.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m=>m[1]));
const own=c=>/^(st-|pv|stg$|stage-)/.test(c);
const selectors=[];for(const m of css.matchAll(/(?:^|[};])\s*([^{};@][^{}]*)\{/g))for(const s of m[1].split(','))selectors.push(s.trim());
test('stage.css : tous les sélecteurs sont bornés au mode Stage',()=>{
 const bad=selectors.filter(s=>s&&!/^(@|from|to|\d+%)/.test(s)&&!/body\.stage-(on|pv)/.test(s)&&![...s.matchAll(/\.([\w-]+)/g)].some(m=>own(m[1])));
 assert.deepEqual(bad,[],'sélecteurs non bornés : '+bad.join(' | '))});
