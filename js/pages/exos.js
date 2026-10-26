/* Générateur infini d'exercices, organisé PAR CHAPITRE : un chapitre ne reçoit que ses propres exercices */
import {h,fr,parseNum,rng,fitCanvas,DIRS16,dirName,shuffle,pick} from '../core/util.js';
import {skill,addXp,state,chapterExo,addError} from '../core/store.js';
import {CH,MODNAMES,MODICON} from '../data/chapters.js';
import {byId} from '../data/errors.js';
import {Gens,chapterHasExo,pickExo as enginePick,traps} from '../engine/pedagogy/index.js';
import {visualOf} from '../core/figures.js';
export {chapterHasExo};
/* Expérience Learning : le moteur renvoie une figure DÉCLARATIVE ; on lui ajoute ici la fonction de dessin canvas. L'aléa par défaut est choisi ici, pas dans le moteur. */
export function pickExo(ch,seed){const s=seed||Math.floor(Math.random()*1e9),ex=enginePick(ch,s);if(ex.figure)ex.visual=visualOf(ex.figure);return ex}
/* exemple résolu : énoncé + solution détaillée, sans saisie */
export function workedExample(el,ch){const draw=()=>{const ex=pickExo(ch,Math.floor(Math.random()*1e9));el.innerHTML='';const box=h('div',{},h('p',{html:`<b>${ex.title}</b> — ${ex.prompt}`}));if(ex.visual){const w=h('div',{class:'cvw'},cv=h('canvas'));box.append(w);requestAnimationFrame(()=>{const ww=w.clientWidth||500,hh=ww*(109/159);ex.visual(fitCanvas(cv,ww,hh),ww,hh)})}
  var cv;const ans=ex.fields?ex.fields.map(f=>`${f.l} <b>${fr(f.a,2)}</b> ${f.u||''}`).join(' · '):ex.choices.o[ex.choices.a];box.append(h('div',{class:'box tip'},h('b',{class:'t'},'Résolution'),h('div',{html:`${ex.sol}<br><b>Réponse : ${ans}</b>`})),h('button',{class:'btn sm sec',onclick:draw},'↻ Autre exemple résolu'));el.append(box)};draw()}
export function mountExo(el,ch,o={}){let ex,hint=false,done=false;const mixed=o.mixed;
 const render=()=>{done=false;const seed=Math.floor(Math.random()*1e9);ex=pickExo(ch,seed);ex.seed=seed;ex._tries=0;
  el.innerHTML='';const box=h('div',{},h('h3',{},h('span',{class:'tag acc'},'Exercice'),`${ex.title} `,h('small',{class:'mute'},`#${seed.toString(36)}`)),h('p',{html:ex.prompt}));
  let cv;if(ex.visual){const w=h('div',{class:'cvw'},cv=h('canvas',{role:'img','aria-label':'Figure de l\'exercice'}));box.append(w);requestAnimationFrame(()=>{const ww=w.clientWidth||500,hh=ww*(109/159);ex.visual(fitCanvas(cv,ww,hh),ww,hh)})}
  const fb=h('div',{class:'fb',role:'status','aria-live':'polite'}),sol=h('details',{},h('summary',{},'Voir la solution'),h('div',{class:'exp',html:ex.sol}));let inp=[];
  const finish=(ok,tr=[])=>{const ids=new Set(tr);if(!ok&&ex.errId)ids.add(ex.errId);ids.forEach(addError);const sk=CH[ch]?CH[ch].skill:'courbes';skill(sk,ok);if(!mixed)chapterExo(ch,ok);fb.className='fb '+(ok?'ok':'ko');fb.innerHTML=(ok?'✅ Bravo !':'❌ Regarde la solution ci-dessous.')+[...ids].map(i=>byId[i]?` <a href="#/erreurs/${i}">📚 Fiche : ${byId[i].t}</a>`:'').join('');if(ok)addXp(hint?4:8,'exercice');sol.open=!ok;if(o.session)o.session(ok);box.append(h('button',{class:'btn sm acc',onclick:render},'Exercice suivant →'))};
  if(ex.choices){const wrap=h('div',{role:'group','aria-label':'Réponses'});ex.choices.o.forEach((t,i)=>wrap.append(h('button',{class:'opt',onclick:ev=>{if(done)return;done=true;wrap.querySelectorAll('.opt').forEach(b=>b.disabled=true);const ok=i===ex.choices.a;wrap.querySelectorAll('.opt')[ex.choices.a].classList.add('ok');if(!ok)ev.currentTarget.classList.add('ko');finish(ok)}},t)));box.append(wrap)}
  else{inp=ex.fields.map(f=>h('input',{type:'text',inputmode:'decimal','aria-label':f.l,placeholder:'?'}));box.append(...ex.fields.map((f,i)=>h('p',{},f.l+' ',inp[i],' ',f.u||'')));
   box.append(h('button',{class:'btn',onclick:()=>{if(done)return;let all=true;const vals=inp.map(x=>parseNum(x.value));ex.fields.forEach((f,i)=>{const ok=!isNaN(vals[i])&&Math.abs(vals[i]-f.a)<=f.t;inp[i].className=ok?'good':'bad';all=all&&ok});if(all){done=true;finish(true)}else{ex._tries++;if(ex._tries>=2){done=true;finish(false,traps(ex,vals))}else{fb.className='fb ko';const tr=traps(ex,vals);fb.innerHTML='Pas tout à fait : vérifie l\'unité et le sens du calcul.'+(tr.length?` Indice : ${byId[tr[0]].s}`:'')}}}},'Vérifier'))}
  box.append(fb,sol);el.append(box)};render()}
const CHLABEL={def:'Définition',echelle:'Échelle',orient:'Orientation',coord:'Coordonnées',courbes:'Courbes de niveau',pente:'Pentes',formes:'Formes du relief',theorie:'Profil : théorie',methode:'Profil : méthode',echelles:'Profil : échelles',auto:'Profil : auto-évaluation',geo1:'Lire une carte géologique',geo2:'Direction et pendage',geo3:'Plis, failles, discordances',coupe1:'Construire une coupe',coupe2:'Pendage apparent'};
export {CHLABEL};
export default async function(root,{a}){let n=0,ok=0,ch=a&&Gens[a]?a:'echelle';
 const mods=Object.keys(MODNAMES);
 root.innerHTML=`<h1>🎲 Exercices infinis</h1><p class="lead">Choisis un chapitre : tu ne recevras que des exercices de ce chapitre. Chaque énoncé est généré aléatoirement.</p>${mods.map(m=>`<h3>${MODICON[m]} ${MODNAMES[m]}</h3><div class="seg" data-m="${m}">${Object.keys(CH).filter(c=>CH[c].mod===m&&Gens[c]).map(c=>`<button data-k="${c}" class="${c===ch?'on':''}">${CHLABEL[c]}</button>`).join('')}</div>`).join('')}<div class="card" id="ex"></div><p class="score" id="sc"></p><p class="mute">Les exercices faits ici comptent pour la validation du chapitre correspondant.</p>`;
 const go=()=>{n=0;ok=0;root.querySelector('#sc').textContent='';mountExo(root.querySelector('#ex'),ch,{session:r=>{n++;if(r)ok++;root.querySelector('#sc').textContent=`Cette séance : ${ok}/${n} réussis`}})};
 root.addEventListener('click',e=>{const b=e.target.closest('.seg button');if(!b)return;ch=b.dataset.k;root.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));go()});go()}
