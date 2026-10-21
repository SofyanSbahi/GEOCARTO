/* Propriétés des moteurs (indépendantes du golden) : déterminisme, cohérence, bornes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {ENGINE_VERSION,math,terrain,contour,profile,pedagogy} from '../js/engine/index.js';
const {rng}=math;

test('version du moteur',()=>assert.match(ENGINE_VERSION,/^\d+\.\d+\.\d+$/));
test('un code de terrain redonne exactement le même MNT',()=>{
 const a=terrain.makeDem({type:'volcan',seed:1234,scaleN:25000}),b=terrain.makeDem({type:'volcan',seed:1234,scaleN:25000});
 assert.deepEqual(Array.from(a.z),Array.from(b.z));assert.notDeepEqual(Array.from(a.z),Array.from(terrain.makeDem({type:'volcan',seed:1235}).z))});
test('les courbes de niveau sont mises en cache et stables',()=>{
 const d=terrain.makeDem({type:'montagne',seed:9}),eq=terrain.autoEq(d),c1=contour.contours(d,eq),c2=contour.contours(d,eq);assert.equal(c1,c2);assert.ok(c1.length>4)});
test('suggestLine exige un générateur injecté et est reproductible',()=>{
 const d=terrain.makeDem({type:'complexe',seed:7}),eq=terrain.autoEq(d);
 assert.throws(()=>profile.suggestLine(d,eq));   // pas de Math.random caché
 assert.deepEqual(profile.suggestLine(d,eq,rng(5)),profile.suggestLine(d,eq,rng(5)))});
test('profil exact : un tracé parfait obtient un score élevé, un tracé plat un score faible',()=>{
 const d=terrain.makeDem({type:'vallee',seed:2}),eq=terrain.autoEq(d),{A,B}=profile.suggestLine(d,eq,rng(15)),P=profile.profileAlong(d,A,B,300),cross=profile.crossings(d,A,B,eq);
 const ch=profile.paperChoices({dem:d,A,B,eq,mode:'intermediaire'}),S=profile.makeSetup({dem:d,A,B,eq,vm:ch.vm,z0:ch.z0});
 const marks=cross.map((c,i)=>({i,t:c.t,s:c.s,z:c.z,zs:c.z}));
 const good=profile.evaluateProfile(S,{pts:P.filter((_,i)=>i%5===0).map(p=>({s:p.s,z:p.z})),smooth:true,marks,cross,hints:0});
 const flat=profile.evaluateProfile(S,{pts:[{s:0,z:ch.z0},{s:P.at(-1).s,z:ch.z0}],smooth:true,marks:[],cross,hints:0});
 assert.ok(good.score>=95,'score parfait '+good.score);assert.ok(flat.score<good.score-40,'score plat '+flat.score);
 const goodPts=P.filter((_,i)=>i%5===0).map(p=>({s:p.s,z:p.z}));
 assert.equal(profile.diagnoseProfile(S,good,{pts:goodPts,smooth:true,marks}).findings.length,0);
 assert.ok(profile.diagnoseProfile(S,flat,{pts:[{s:0,z:0},{s:1,z:0}],smooth:true,marks:[]}).errorIds.includes('p-points'))});
test('profil : moins de 2 points → pas d\'évaluation (null) plutôt qu\'une exception',()=>{
 const d=terrain.makeDem({type:'plateau',seed:4}),eq=terrain.autoEq(d),{A,B}=profile.suggestLine(d,eq,rng(1))||{A:{x:20,y:30},B:{x:130,y:80}};
 const S=profile.makeSetup({dem:d,A,B,eq,vm:50,z0:0});assert.equal(profile.evaluateProfile(S,{pts:[{s:0,z:0}],smooth:true,marks:[],cross:[]}),null)});
test('papier : vérification et choix cohérents',()=>{
 const d=terrain.makeDem({type:'montagne',seed:3}),eq=terrain.autoEq(d),{A,B}=profile.suggestLine(d,eq,rng(2)),ch=profile.paperChoices({dem:d,A,B,eq,mode:'intermediaire'});
 assert.ok(ch.opts.includes(ch.rec));
 assert.equal(profile.checkPaper(profile.makeSetup({dem:d,A,B,eq,vm:ch.vm,z0:ch.z0})).ok,true);
 assert.equal(profile.checkPaper(profile.makeSetup({dem:d,A,B,eq,vm:ch.vm,z0:ch.lo+5*eq})).reason,'originAbove')});
test('conversion papier ↔ données : aller-retour',()=>{
 const d=terrain.makeDem({type:'bassin',seed:8}),eq=terrain.autoEq(d),{A,B}=profile.suggestLine(d,eq,rng(3)),ch=profile.paperChoices({dem:d,A,B,eq,mode:'intermediaire'}),S=profile.makeSetup({dem:d,A,B,eq,vm:ch.vm,z0:ch.z0}),g=S.geometry();
 const m=S.toMm(500,ch.lo+30,g),b=S.fromMm(m.x,m.y,g);assert.ok(Math.abs(b.s-500)<1e-9&&Math.abs(b.z-(ch.lo+30))<1e-9)});
test('exercices : même graine → même énoncé, mêmes choix, même ordre',()=>{
 for(const ch of ['def','orient','geo1','geo3','methode','auto'])for(const seed of [3,77,4242]){
  const strip=e=>{const{figure,...r}=e;return JSON.stringify(r)};
  assert.equal(strip(pedagogy.pickExo(ch,seed)),strip(pedagogy.pickExo(ch,seed)),`${ch}/${seed}`)}});
test('exercices : la bonne réponse figure parmi les choix et les champs ont une tolérance',()=>{
 for(const ch of Object.keys(pedagogy.Gens))for(let s=1;s<=25;s++){const e=pedagogy.pickExo(ch,s*101);
  if(e.choices){assert.ok(e.choices.a>=0&&e.choices.a<e.choices.o.length,`${ch}/${s} index`);assert.equal(new Set(e.choices.o).size,e.choices.o.length,`${ch}/${s} doublons`)}
  else{assert.ok(e.fields&&e.fields.length,`${ch}/${s}`);for(const f of e.fields)assert.ok(f.t>0&&Number.isFinite(f.a),`${ch}/${s} champ`)}
  if(e.figure)assert.ok(['map','geomap'].includes(e.figure.kind))}});
test('exercices : vérification des pièges (traps)',()=>{
 let e,f;for(let s=1;s<200&&!f;s++){e=pedagogy.pickExo('echelle',s);f=e.fields&&e.fields[0].traps?e.fields[0]:null}assert.ok(f,'aucun exercice à pièges trouvé');assert.deepEqual(pedagogy.traps(e,[f.traps[0].v]),['t-unite']);assert.deepEqual(pedagogy.traps(e,[f.a]),[])});
test('maîtrise : moyenne mobile bornée dans [0,1], horloge injectée',()=>{
 let e;for(const ok of [1,0,1,1,0,0,1,1,1])e=pedagogy.updateSkill(e,!!ok,1000);assert.ok(e.m>=0&&e.m<=1);assert.equal(e.last,1000);assert.equal(e.n,9)});
test('recommandations : horloge injectée, 4 maximum, tri par priorité',()=>{
 const s={ch:{},skills:{echelle:{n:5,ok:1,m:.2,last:0}},errors:{'t-unite':3},profiles:[],weekly:{}};
 const r=pedagogy.recommendations(s,{now:864e5*30,week:'2026-W43'});assert.ok(r.length<=4);assert.deepEqual(r.map(x=>x.p),[...r.map(x=>x.p)].sort((a,b)=>b-a))});
test('semaine ISO',()=>assert.equal(pedagogy.weekKey(new Date(2026,9,21)),'2026-W43'));
test('paperAdvice : critère absolu sur la hauteur du profil (checkPaper ne dépend pas de vm)',()=>{
 const d=terrain.makeDem({type:'montagne',seed:3}),eq=terrain.autoEq(d),{A,B}=profile.suggestLine(d,eq,rng(2)),ch=profile.paperChoices({dem:d,A,B,eq,mode:'intermediaire'});
 const mk=vm=>profile.makeSetup({dem:d,A,B,eq,vm,z0:ch.z0});
 assert.equal(profile.checkPaper(mk(ch.opts[0])).fill.toFixed(6),profile.checkPaper(mk(ch.opts.at(-1))).fill.toFixed(6),'fill indépendant de vm');
 assert.equal(profile.paperAdvice(mk(ch.rec)).ok,true);
 assert.equal(profile.paperAdvice(mk((ch.hi-ch.lo)/1.5)).reason,'tooSmall');
 assert.equal(profile.paperAdvice(mk((ch.hi-ch.lo)/40)).reason,'tooTall')});

test('pickLine : trait court, croisements bornés, points non tassés, déterministe',()=>{
 let found=0;
 for(const type of ['vallee','complexe','montagne'])for(let sd=1;sd<=8;sd++){
  const d=terrain.makeDem({type,seed:sd,scaleN:25000}),eq=terrain.niceEq(d.zmax-d.zmin);
  const a=profile.pickLine(d,eq,rng(sd*13+5)),b=profile.pickLine(d,eq,rng(sd*13+5));
  assert.deepEqual(a&&[a.A,a.B],b&&[b.A,b.B]);
  if(!a)continue;found++;
  assert.ok(a.cross.length>=8&&a.cross.length<=14);
  const L=Math.hypot(a.B.x-a.A.x,a.B.y-a.A.y);assert.ok(L>=40&&L<=75);
  a.cross.forEach((c,i)=>{if(i){assert.ok(Math.hypot(c.x-a.cross[i-1].x,c.y-a.cross[i-1].y)>=3);}
   if(i>1)assert.ok(!(c.z===a.cross[i-1].z&&c.z===a.cross[i-2].z))});
 }
 assert.ok(found>=6,'trop peu de terrains admettent un trait pédagogique : '+found);
});
