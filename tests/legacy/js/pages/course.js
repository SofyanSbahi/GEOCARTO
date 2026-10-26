/* Page chapitre : Théorie → Exemple → Activité → Exercices → Quiz → Validation */
import {MODS as BASE} from '../content/lessons.js';
import {GEO_MODS} from '../content/geo_lessons.js';
import {EX} from '../content/examples.js';
import {state,chapter,chapterSet,criteria,validateChapter,on} from '../core/store.js';
import {CH,MODNAMES,MODICON,EXO_GOAL} from '../data/chapters.js';
import {BANK} from '../data/quizbank.js';
import {lightbox,confetti,toast} from '../core/ui.js';
import {h} from '../core/util.js';
export const MODS={...BASE,...GEO_MODS};
export async function mountWidgets(root){const {W}=await import('../widgets/basic.js');await import('../widgets/relief.js');await import('../widgets/quiz.js');await import('../widgets/profilew.js');await import('../widgets/geow.js');const cl=[];
 root.querySelectorAll('.widget[data-w]').forEach(el=>{const f=W[el.dataset.w];if(f)try{const c=f(el);if(c)cl.push(c)}catch(e){console.error(el.dataset.w,e);el.innerHTML='<p class="mute">Activité indisponible.</p>'}});
 root.querySelectorAll('figure img').forEach(i=>{i.addEventListener('click',()=>lightbox(i.src,i.alt));i.addEventListener('error',()=>{const f=i.closest('figure');if(f)f.innerHTML=`<div class="box rem"><b class="t">Figure indisponible</b>${i.alt||'Image manquante'}</div>`},{once:true});if(i.complete&&i.naturalWidth===0)i.dispatchEvent(new Event('error'))});return()=>cl.forEach(f=>{try{f()}catch(e){}})}
/* leçon de secours générée automatiquement si le contenu demandé est introuvable */
export function fallbackLesson(modId,lessonId){return{id:lessonId||'x',icon:'🧩',title:`Leçon de secours : ${String(lessonId).replace(/[-_<]/g,' ')}`,goal:'Contenu temporairement indisponible.',fallback:1,theory:`<div class="box rem"><b class="t">Contenu introuvable</b>La leçon « ${String(lessonId).replace(/</g,'&lt;')} » n'a pas pu être chargée. Voici un rappel minimal et des outils pour continuer.</div><ul><li>Échelle : D = d × N · Pente : P = H/D × 100.</li><li>Courbes serrées = pente forte ; talweg = V vers le haut ; crête = V vers le bas.</li><li>Profil : plan vertical ; origine sous le point le plus bas ; main levée.</li></ul><a class="btn acc" href="#/exos">🎲 Exercices</a> <a class="btn sec" href="#/${modId}">Sommaire</a>`}}
const DEFACT={def:['legend'],methode:['order']};
function split(L,ch){if(L.theory!==undefined)return{theory:L.theory,example:L.example||EX[ch],acts:L.act?[{n:L.act,a:L.actArgs||''}]:[]};
 const t=document.createElement('div');t.innerHTML=L.html;const acts=[];t.querySelectorAll('.widget[data-w]').forEach(w=>{const n=w.dataset.w;if(n!=='quiz'&&n!=='exo')acts.push({n,a:w.dataset.skill?'':[...w.attributes].filter(x=>x.name!=='class'&&x.name!=='data-w').map(x=>`${x.name}="${x.value}"`).join(' ')});w.remove()});
 if(!acts.length&&DEFACT[ch])DEFACT[ch].forEach(n=>acts.push({n,a:''}));return{theory:t.innerHTML,example:EX[ch],acts}}
const status=id=>{const c=chapter(id);return c.ok?'✅':(c.theory||c.exo)?'🟡':'⬜'};
export default async function(root,{id,a}){const M=MODS[id],s=state();
 if(!M){location.hash='#/';return}
 if(!a){root.innerHTML=`<div class="crumb">Cours</div><h1>${M.icon} Module ${id[1]} · ${M.title}</h1><p class="mute">Chaque chapitre suit le même parcours : théorie, exemple, activité, exercices, quiz, validation.</p><div class="path">${M.lessons.map(l=>`<a class="node ${chapter(l.id).ok?'done':''}" href="#/${id}/${l.id}"><span class="dot">${chapter(l.id).ok?'✓':l.icon}</span><span><b>${l.title}</b><small>${l.goal}</small></span></a>`).join('')}
 ${id==='m1'?`<a class="node tool" href="#/exos"><span class="dot">🎲</span><span><b>Exercices par chapitre</b><small>Générateur illimité</small></span></a>`:id==='m2'?`<a class="node tool" href="#/profil"><span class="dot">✏️</span><span><b>Simulateur de profil</b><small>Papier millimétré interactif</small></span></a><a class="node blue" href="#/terrain"><span class="dot">🌄</span><span><b>Terrain virtuel</b><small>Explore en 3D puis trace</small></span></a><a class="node blue" href="#/inverse"><span class="dot">🔄</span><span><b>Construction inverse</b><small>Relief ↔ courbes ↔ profil</small></span></a>`:id==='m3'?`<a class="node tool" href="#/geo"><span class="dot">🪨</span><span><b>Atelier géologique</b><small>Cartes générées et coupes à dessiner</small></span></a>`:`<a class="node tool" href="#/geo"><span class="dot">✂️</span><span><b>Dessiner une coupe</b><small>Correction automatique</small></span></a><a class="node blue" href="#/projet"><span class="dot">🎓</span><span><b>Projet final</b><small>Cas d'étude marocain complet</small></span></a>`}</div>`;return}
 let i=M.lessons.findIndex(l=>l.id===a),L=M.lessons[i];if(!L){L=fallbackLesson(id,a);i=-1}
 const ch=L.id,real=!!CH[ch]&&!L.fallback,P=split(L,ch),cleanups=[];
 const sec=(n,ic,t,body)=>`<section id="s${n}" class="card"><h2 style="margin-top:0">${ic} ${n}. ${t}</h2>${body}</section>`;
 root.innerHTML=`<div class="crumb"><a href="#/${id}">Module ${id[1]} · ${M.title}</a> › ${L.title}</div><div class="row"><h1 style="margin-right:auto">${L.icon} ${L.title}</h1>${ch==='courbes'?'<a class="btn acc" href="#/stage/courbes">🎞️ Mode Stage (projection)</a>':''}</div><p class="lead mute">Objectif : ${L.goal}</p>
 <nav class="stepper" id="stp" aria-label="Étapes du chapitre"></nav>
 ${sec(1,'📖','Théorie',`<div class="lesson">${P.theory}</div>${real?'<button class="btn sm" id="bt">✓ J\'ai lu la théorie</button>':''}`)}
 ${real&&P.example?sec(2,'🧪','Exemple travaillé',`<div class="lesson">${P.example}</div><div id="gen"></div><button class="btn sm" id="be">✓ J'ai compris l'exemple</button>`):''}
 ${real?sec(3,'🎮','Activité interactive',`<div id="act">${P.acts.map(x=>`<div class="widget" data-w="${x.n}" ${x.a}></div>`).join('')||'<p class="mute">Pas d\'activité pour ce chapitre.</p>'}</div>`):''}
 ${real?sec(4,'✏️','Exercices du chapitre',`<p class="mute">Objectif : ${EXO_GOAL} exercices réussis. Uniquement des exercices de ce chapitre.</p><div id="ex"></div>`):''}
 ${real&&BANK[ch]?sec(5,'❓','Quiz du chapitre',`<div class="widget" data-w="quiz" data-bank="${ch}" data-n="5"></div>`):''}
 ${real?sec(6,'✅','Validation',`<div id="val"></div>`):''}
 <div class="lnav">${i>0?`<a class="btn sec" href="#/${id}/${M.lessons[i-1].id}">← ${M.lessons[i-1].title}</a>`:'<span></span>'}${i>=0&&i<M.lessons.length-1?`<a class="btn" href="#/${id}/${M.lessons[i+1].id}">${M.lessons[i+1].title} →</a>`:`<a class="btn" href="#/${id}">Sommaire du module</a>`}</div>`;
 const q=s=>root.querySelector(s);
 if(real){
  const wi=import('./exos.js');
  const stp=()=>{const c=chapter(ch);const items=[['theory','Théorie',c.theory],['example','Exemple',c.example||!P.example],['act','Activité',c.act>=3],['exo','Exercices',c.exoOk>=EXO_GOAL],['quiz','Quiz',c.quiz>=.8],['ok','Validé',c.ok]];q('#stp').innerHTML=items.map(([k,t,ok],n)=>`<a class="st ${ok?'done':''}" href="#s${n+1>5?6:n+1}"><b>${ok?'✓':n+1}</b>${t}</a>`).join('')};
  const val=()=>{const c=criteria(ch),all=c.every(x=>x.ok),c0=chapter(ch);const ex=P.example?c:c.filter(x=>x.k!=='example');q('#val').innerHTML=`<ul class="checks">${ex.map(x=>`<li class="${x.ok?'ok':''}">${x.ok?'✅':'⬜'} ${x.t}</li>`).join('')}</ul>${c0.ok?'<div class="box tip"><b class="t">Chapitre validé 🎉</b>Bravo ! Tu peux passer au chapitre suivant.</div>':`<button class="btn acc" id="bv" ${all?'':'disabled'}>Valider le chapitre</button>`}`;const b=q('#bv');if(b)b.onclick=()=>{if(validateChapter(ch)){confetti(60);toast('🎓 Chapitre validé : +40 XP')}val();stp()}};
  if(!P.example)chapterSet(ch,'example',1);
  q('#bt').onclick=()=>{chapterSet(ch,'theory',1);toast('Théorie marquée comme lue')};const be=q('#be');if(be)be.onclick=()=>{chapterSet(ch,'example',1);toast('Exemple validé')};
  wi.then(m=>{if(q('#gen')&&m.chapterHasExo(ch))m.workedExample(q('#gen'),ch);m.mountExo(q('#ex'),ch)});
  let last=0;q('#act')&&q('#act').addEventListener('input',()=>{if(Date.now()-last>500){last=Date.now();chapterSet(ch,'act')}});q('#act')&&q('#act').addEventListener('click',e=>{if(e.target.closest('button,canvas,select')&&Date.now()-last>500){last=Date.now();chapterSet(ch,'act')}});
  const off=on(t=>{if(t==='chapter'||t==='progress'){val();stp()}});cleanups.push(off);val();stp()}
 cleanups.push(await mountWidgets(root));return()=>cleanups.forEach(f=>f&&f())}
