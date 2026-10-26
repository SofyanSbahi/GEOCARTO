import {h,norm} from '../core/util.js';
import {KB} from '../data/kb.js';
import {shared} from '../core/shared.js';
import {slopeClass} from '../widgets/basic.js';
import {svgVrule,svgEqEc,svgProfilePlane,svgSlope} from '../widgets/svgs.js';
const VIZ={vrule:svgVrule,eqec:svgEqEc,plane:svgProfilePlane,slope:()=>svgSlope(80,400)};
const SUG=['Comment reconnaître un talweg ?','Pourquoi les courbes sont-elles serrées ici ?','Comment tracer correctement un profil ?','Pourquoi le profil remonte-t-il ?','Comment calculer une pente ?'];
function contextual(q){const n=norm(q),p=shared.probe;
 if(/\b(ici|ce point|cet endroit)\b/.test(n)&&p&&p.slope!=null){const c=slopeClass(p.slope);return `Ici la pente est d'environ <b>${p.slope.toFixed(0)} %</b> (${(Math.atan(p.slope/100)*180/Math.PI).toFixed(0)}°) : <b>${c[0].toLowerCase()}</b>. ${p.eq?`Avec Éq = ${p.eq} m, l'écartement correspondant est ≈ ${(p.eq/p.slope*100).toFixed(0)} m sur le terrain : `:''}${p.slope>25?'les courbes sont donc <b>serrées</b> (peu de distance pour franchir 1 équidistance).':p<8?'':'les courbes sont moyennement espacées.'} ${c[2]}`}
 if(/(profil).*(monte|remonte|descend|redescend)/.test(n)&&shared.profileHint){const r=shared.profileHint();if(r)return 'Sur ton trait A→B : '+r.map(x=>`${x.dir>0?'montée':'descente'} de ${x.from} m à ${x.to} m`).join(', puis ')+'. Le profil change de sens à chaque crête (sommet) ou talweg traversé, entre deux courbes de même altitude.'}
 return null}
export function answer(q){const c=contextual(q);if(c)return{html:c};const n=norm(q);let best=null,bs=0;for(const e of KB){let s=0;for(const k of e.k){const kk=norm(k);if(kk&&n.includes(kk))s+=kk.length}if(s>bs){bs=s;best=e}}
 if(best&&bs>=3)return{html:best.a,v:best.v};return{html:'Je n\'ai pas bien compris. Essaie avec un mot-clé : <i>talweg, crête, col, échelle, pente, équidistance, profil, azimut, latitude…</i>'}}
export function initAssistant(dr,fab){dr.innerHTML=`<div class="sheet-h" style="padding:10px 14px;border-bottom:2px solid var(--line);display:flex;justify-content:space-between"><b>🧭 Assistant pédagogique</b><button class="icon" id="x" aria-label="Fermer">✕</button></div><div class="msgs" id="m"></div><div class="sugg" id="s"></div><form id="f"><input type="text" id="i" placeholder="Pose ta question…" autocomplete="off" aria-label="Question"><button class="btn sm">Envoyer</button></form>`;
 const m=dr.querySelector('#m'),add=(html,me)=>{const d=h('div',{class:'msg'+(me?' me':''),html});m.append(d);m.scrollTop=m.scrollHeight;return d};
 add('Bonjour ! Je réponds à tes questions de cartographie. Je suis un assistant <b>local hors-ligne</b> (base de connaissances du cours), pas un modèle de langage : formule ta question avec les mots du cours. Sur une carte ou un profil, dis « <i>ici</i> » pour que j\'utilise le dernier point touché.');
 const ask=t=>{if(!t.trim())return;add(t.replace(/</g,'&lt;'),1);const r=answer(t);add(r.html+(r.v?`<div class="svgw">${VIZ[r.v]()}</div>`:''))};
 dr.querySelector('#s').innerHTML=SUG.map(s=>`<button>${s}</button>`).join('');dr.querySelector('#s').onclick=e=>{if(e.target.tagName==='BUTTON')ask(e.target.textContent)};
 dr.querySelector('#f').onsubmit=e=>{e.preventDefault();const i=dr.querySelector('#i');ask(i.value);i.value=''};
 const toggle=o=>{dr.classList.toggle('open',o);if(o)dr.querySelector('#i').focus()};fab.onclick=()=>toggle(!dr.classList.contains('open'));dr.querySelector('#x').onclick=()=>toggle(false)}
export default async function(){}
