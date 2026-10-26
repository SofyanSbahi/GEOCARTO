/* Défi hebdomadaire : même énoncé pour tous (graine = semaine), bonus XP */
import {h,rng,fitCanvas,esc} from '../core/util.js';
import {makeDem,suggestLine,autoEq} from '../core/terrain.js';
import {state,weeklyDone,addXp,skill,chapterExo} from '../core/store.js';
import {weekKey,ORDER} from '../core/adapt.js';
import {pickExo,chapterHasExo,mountExo} from './exos.js';
import {CH} from '../data/chapters.js';
import {shared} from '../core/shared.js';
import {toast,confetti} from '../core/ui.js';
const hashStr=s=>{let x=7;for(const c of s)x=(x*31+c.charCodeAt(0))>>>0;return x};
export default async function(root){const wk=weekKey(),R=rng(hashStr(wk)),W=state().weekly[wk]||{};const types=['montagne','vallee','volcan','cuvette','bassin','complexe','plateau'];
 const type=types[Math.floor(R()*types.length)],seed=Math.floor(R()*9e5)+1,scaleN=[20000,25000,50000][Math.floor(R()*3)];
 const chs=[...ORDER.filter(c=>chapterHasExo(c))].sort(()=>R()-.5).slice(0,5);
 let assign=null;try{assign=JSON.parse(localStorage.getItem('gc_assign')||'null')}catch(e){}
 root.innerHTML=`<h1>🏁 Défi de la semaine <small class="mute">${wk}</small></h1><p class="lead">Même défi pour tous cette semaine : un profil topographique et 5 exercices tirés de 5 chapitres. Bonus : +60 XP.</p>
 <div class="card"><h3>1. Profil du défi</h3><p>Terrain « ${type} » · échelle 1/${scaleN.toLocaleString('fr')} · mode Intermédiaire. ${W.profile!=null?`<b>Score : ${W.profile}/100 ${W.profile>=65?'✅':'(≥ 65 requis)'}</b>`:''}</p><button class="btn" id="pf">Lancer le profil</button></div>
 <div class="card"><h3>2. Cinq exercices</h3><p class="mute">Chapitres : ${chs.join(', ')}. ${W.ex!=null?`<b>Résultat : ${W.ex}/5</b>`:''}</p><div id="ex"></div></div>
 ${assign?`<div class="card"><h3>📌 Défi du professeur : ${esc(assign.title||'devoir')}</h3><p>Terrain « ${esc(assign.type)} », graine ${esc(assign.seed)}, échelle 1/${esc(assign.scaleN)}. ${assign.due?`À rendre avant le ${esc(assign.due)}.`:''}</p><button class="btn blue" id="as">Lancer</button></div>`:''}
 <div class="card"><h3>Importer un devoir</h3><div class="ctrl"><input type="text" id="ic" placeholder="Code devoir de l'enseignant" style="width:min(300px,100%)"><button class="btn sm sec" id="ib">Importer</button></div></div><div id="fin"></div>`;
 root.querySelector('#ib').onclick=()=>{try{const o=JSON.parse(decodeURIComponent(escape(atob(root.querySelector('#ic').value.trim()))));if(!o.seed||!o.type)throw 0;localStorage.setItem('gc_assign',JSON.stringify(o));toast('Devoir importé');location.reload()}catch(e){toast('Code invalide')}};
 root.querySelector('#pf').onclick=()=>{const d=makeDem({type,seed,scaleN}),eq=autoEq(d),l=suggestLine(d,eq,rng(seed));shared.handoff={opts:{type,seed,scaleN},A:l.A,B:l.B};shared.returnTo='#/defi';shared.hook=r=>{if(r.stage==='profile')weeklyDone(wk,{profile:r.score})};location.hash='#/profil'};
 const a=root.querySelector('#as');if(a)a.onclick=()=>{const d=makeDem({type:assign.type,seed:assign.seed,scaleN:assign.scaleN}),eq=autoEq(d),l=suggestLine(d,eq,rng(assign.seed));shared.handoff={opts:{type:assign.type,seed:assign.seed,scaleN:assign.scaleN},A:l.A,B:l.B};location.hash='#/profil'};
 if(W.ex==null){let idx=0,ok=0;const el=root.querySelector('#ex');const next=()=>{if(idx>=5){weeklyDone(wk,{ex:ok});toast(`Exercices terminés : ${ok}/5`);location.reload();return}el.innerHTML='';const ex=pickExo(chs[idx],hashStr(wk+idx));const box=h('div',{},h('p',{class:'mute'},`Exercice ${idx+1}/5 · ${ex.title}`));el.append(box);mountFixed(box,ex,r=>{if(r)ok++;idx++;setTimeout(next,900)})};next()}
 const fin=root.querySelector('#fin');if(W.profile!=null&&W.ex!=null&&!W.done){const good=W.profile>=65&&W.ex>=3;if(good){weeklyDone(wk,{done:Date.now(),bonus:60});confetti(60)}else fin.innerHTML='<div class="box rem"><b class="t">Presque !</b>Il faut ≥ 65 au profil et ≥ 3/5 aux exercices. Tu peux relancer le profil.</div>'}
 if(W.done)fin.innerHTML='<div class="box tip"><b class="t">Défi réussi 🎉</b>Reviens la semaine prochaine pour un nouveau défi.</div>'}
function mountFixed(box,ex,done){const fb=h('div',{class:'fb',role:'status'});let cv;if(ex.visual){const w=h('div',{class:'cvw'},cv=h('canvas'));box.append(w);requestAnimationFrame(()=>{const ww=w.clientWidth||500,hh=ww*(109/159);ex.visual(fitCanvas(cv,ww,hh),ww,hh)})}
 box.append(h('p',{html:ex.prompt}));let fin=false;const end=ok=>{if(fin)return;fin=true;skill(CH[ex.ch].skill,ok);fb.className='fb '+(ok?'ok':'ko');fb.innerHTML=ok?'✅':'❌ '+ex.sol;done(ok)};
 if(ex.choices)ex.choices.o.forEach((t,i)=>box.append(h('button',{class:'opt',onclick:()=>end(i===ex.choices.a)},t)));
 else{const inp=ex.fields.map(f=>h('input',{type:'text',inputmode:'decimal','aria-label':f.l,placeholder:f.l}));box.append(...inp,h('button',{class:'btn sm',onclick:()=>{const ok=ex.fields.every((f,i)=>Math.abs(parseFloat(inp[i].value.replace(',','.'))-f.a)<=f.t);end(ok)}},'Valider'))}box.append(fb)}
