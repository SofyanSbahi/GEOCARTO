/* Contrat des moteurs (ADR 0001) : dépendances à sens unique, pas de navigateur, pas d'aléa ni d'horloge cachés, pas de rendu. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=new URL('../js/engine/',import.meta.url).pathname;
const files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);fs.statSync(p).isDirectory()?walk(p):p.endsWith('.js')&&files.push(p)}})(ROOT);
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"`\\])\/\/[^\n]*/g,'$1');   // sans commentaires
const FORBIDDEN=[
 [/\bdocument\b/,'document'],[/\bwindow\b/,'window'],[/\blocalStorage\b|\bsessionStorage\b/,'stockage navigateur'],
 [/\bcreateElement\b|\bgetContext\b|\bgetImageData\b|\bcreateImageData\b|\bputImageData\b/,'canvas / DOM'],
 [/\bperformance\b|\brequestAnimationFrame\b|\bsetTimeout\b|\bsetInterval\b/,'temps / animation'],
 [/Math\.random\s*\(|Math\.random\b/,'Math.random (injecter un rng)'],[/Date\.now\b|new Date\(\s*\)/,'horloge (passer now en paramètre)'],
 [/\bnavigator\b|\blocation\b|\bfetch\s*\(/,'environnement navigateur']];
for(const f of files){
 const rel=path.relative(ROOT,f),src=strip(fs.readFileSync(f,'utf8'));
 test(`moteur · ${rel} · aucun accès navigateur / aléa / horloge`,()=>{
  for(const[re,label]of FORBIDDEN)assert.ok(!re.test(src),`${rel} : ${label}`)});
 test(`moteur · ${rel} · imports autorisés`,()=>{
  const imps=[...src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
  for(const i of imps){
   assert.ok(i.startsWith('.'),`${rel} : import non relatif ${i}`);
   const target=path.resolve(path.dirname(f),i);
   const ok=target.startsWith(ROOT)||/\/js\/data\//.test(target);
   assert.ok(ok,`${rel} importe ${i} (hors engine/ et data/)`)}})}
test('moteur · les couches ne remontent pas : pedagogy peut dépendre de terrain/geology, pas l\'inverse',()=>{
 const layer=f=>path.relative(ROOT,f).split(path.sep)[0];
 const rank={math:0,'math.js':0,terrain:1,contour:2,profile:3,geology:4,pedagogy:5};
 for(const f of files){const src=strip(fs.readFileSync(f,'utf8')),me=layer(f);
  for(const m of src.matchAll(/from\s*['"](\.[^'"]+)['"]/g)){const t=path.resolve(path.dirname(f),m[1]);if(!t.startsWith(ROOT))continue;const other=layer(t);
   if(other===me)continue;assert.ok((rank[other]??-1)<(rank[me]??99),`${me} importe ${other} (dépendance montante interdite)`)}}});
