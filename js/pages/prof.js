/* Espace enseignant : import des rapports d'élèves, tableau de classe, devoirs. 
   ⚠️ Site statique : la protection par code est DISSUASIVE (le code se contourne côté client). Aucune donnée élève n'est centralisée. */
import {h,fr,esc,csvCell} from '../core/util.js';
import {sha256} from '../core/sha256.js';
import {SKILLS} from '../core/store.js';
import {CH} from '../data/chapters.js';
import {ERRORS,byId} from '../data/errors.js';
import {ORDER} from '../core/adapt.js';
import {pickExo,chapterHasExo} from './exos.js';
import {toast} from '../core/ui.js';
const cfg=()=>window.GC_CONFIG||{teacherHash:'',className:'Classe'};
const KEY='gc_class';const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}};const save=l=>{try{localStorage.setItem(KEY,JSON.stringify(l))}catch(e){}};
const decode=t=>{t=t.trim();try{return JSON.parse(t)}catch(e){}try{return JSON.parse(decodeURIComponent(escape(atob(t))))}catch(e){return null}};
export const isTeacher=()=>sessionStorage.getItem('gc_teacher')==='1';
export default async function(root){
 if(!isTeacher()){root.innerHTML=`<h1>🔐 Espace enseignant</h1><div class="card"><p>Accès réservé à l'enseignant (administrateur du site).</p><div class="ctrl"><label>Code <input type="password" id="pw" autocomplete="current-password" style="width:200px"></label><button class="btn" id="go">Entrer</button></div><div class="fb" id="r"></div><div class="box rem"><b class="t">Limite technique</b>Ce site est statique : le code est vérifié dans le navigateur et reste <b>contournable</b>. Il masque les outils aux élèves mais n'est pas une vraie sécurité. Les élèves ne peuvent de toute façon voir aucune donnée d'autres élèves : tout est local à leur appareil.</div></div>`;
  const go=()=>{const v=root.querySelector('#pw').value;if(sha256(v)===cfg().teacherHash){sessionStorage.setItem('gc_teacher','1');location.hash='#/prof';location.reload()}else{root.querySelector('#r').className='fb ko';root.querySelector('#r').textContent='Code incorrect.'}};root.querySelector('#go').onclick=go;root.querySelector('#pw').onkeydown=e=>{if(e.key==='Enter')go()};return}
 let L=load();
 const draw=()=>{const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const rows=L.map((r,i)=>{const ps=(r.profiles||[]).map(p=>p.score),chv=Object.values(r.ch||{}).filter(c=>c.ok).length;return `<tr><td>${esc(r.name||'(anonyme)')}</td><td>${esc(r.cls||'')}</td><td>${esc(r.xp)}</td><td>${chv}/${Object.keys(CH).length}</td><td>${ps.length?esc(Math.round(avg(ps))):'–'}</td><td>${r.project&&r.project.score!=null?esc(r.project.score):'–'}</td><td>${esc(new Date(r.t).toLocaleDateString('fr-FR'))}</td><td><button class="icon" data-d="${i}" aria-label="Supprimer">🗑</button></td></tr>`}).join('');
  const heat=Object.entries(SKILLS).map(([k,v])=>{const vals=L.map(r=>r.skills&&r.skills[k]?r.skills[k].m:null).filter(x=>x!=null);const m=vals.length?avg(vals):null;return `<div class="skillrow"><span>${v}</span><div class="bar"><i style="width:${m||0}%;background:${m==null?'var(--line)':m<50?'var(--ko)':m<75?'var(--gold)':'var(--ok)'}"></i></div><span>${m==null?'–':Math.round(m)+'%'} <small>(${vals.length})</small></span></div>`}).join('');
  const ec={};L.forEach(r=>Object.entries(r.errors||{}).forEach(([k,n])=>ec[k]=(ec[k]||0)+n));const top=Object.entries(ec).sort((a,b)=>b[1]-a[1]).slice(0,6);
  root.innerHTML=`<h1>👩‍🏫 Espace enseignant <small class="mute">${esc(cfg().className)}</small></h1><div class="row"><button class="btn sm ghost" id="lo">Quitter le mode enseignant</button></div>
  <div class="card"><h3>1. Importer des rapports d'élèves</h3><p class="mute">Collez les codes reçus (un par ligne) ou chargez des fichiers .json (portfolio → « Remettre mon travail »).</p><textarea id="ta" rows="3" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:8px;background:var(--bg)" placeholder="Codes rapport…"></textarea><div class="row"><button class="btn sm" id="im">Importer</button><input type="file" id="fl" accept=".json" multiple></div></div>
  <div class="card"><h3>2. Tableau de classe (${L.length} élève(s))</h3><div style="overflow:auto"><table class="tbl"><thead><tr><th>Élève</th><th>Classe</th><th>XP</th><th>Chapitres</th><th>Profils (moy.)</th><th>Projet</th><th>Rapport</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="mute">Aucun rapport importé.</td></tr>'}</tbody></table></div><button class="btn sm sec" id="csv">⬇ Export CSV</button></div>
  <div class="card"><h3>3. Compétences de la classe</h3>${heat}</div>
  <div class="card"><h3>4. Erreurs les plus fréquentes</h3>${top.length?`<ol>${top.map(([k,n])=>`<li>${esc(byId[k]?.t||k)} — ${esc(n)}</li>`).join('')}</ol>`:'<p class="mute">Pas encore de données.</p>'}</div>
  <div class="card"><h3>5. Créer un devoir (défi professeur)</h3><div class="ctrl"><label>Titre <input type="text" id="at" style="width:160px" value="TP profil"></label><label>Relief <select id="ty">${['montagne','plateau','vallee','volcan','cuvette','bassin','complexe'].map(t=>`<option>${t}</option>`).join('')}</select></label><label>Échelle 1/<select id="sc"><option>10000</option><option selected>25000</option><option>50000</option></select></label><label>Graine <input type="number" id="sd" value="${Math.floor(Math.random()*99999)+1}"></label><label>Date limite <input type="text" id="du" placeholder="jj/mm" style="width:80px"></label></div><button class="btn sm" id="mk">Générer le code devoir</button><div class="fb ok" id="cd"></div><small class="mute">Les élèves le collent dans <b>Défi → Importer un devoir</b>. Même graine = même terrain et même trait pour tous.</small></div>
  <div class="card"><h3>6. Aperçu des exercices avec corrigés</h3><div class="ctrl"><label>Chapitre <select id="pc">${ORDER.filter(chapterHasExo).map(c=>`<option>${c}</option>`).join('')}</select></label><button class="btn sm sec" id="pv">Tirer un exercice</button></div><div id="pvo"></div></div>
  <div class="card"><h3>7. Changer le code enseignant</h3><div class="ctrl"><label>Nouveau code <input type="text" id="nc" style="width:200px"></label><button class="btn sm" id="hs">Générer l'empreinte</button></div><div class="fb" id="hv"></div><small class="mute">Collez l'empreinte dans <code>config.js</code> (champ <code>teacherHash</code>) puis republiez.</small></div>`;
  const q=s=>root.querySelector(s);
  q('#lo').onclick=()=>{sessionStorage.removeItem('gc_teacher');location.reload()};
  const add=objs=>{let n=0;objs.forEach(o=>{if(o&&o.v===1){const i=L.findIndex(x=>x.name&&x.name===o.name&&x.cls===o.cls);if(i>=0)L[i]=o;else L.push(o);n++}});save(L);toast(`${n} rapport(s) importé(s)`);draw()};
  q('#im').onclick=()=>add(q('#ta').value.split(/\n+/).filter(Boolean).map(decode));
  q('#fl').onchange=async e=>{const o=[];for(const f of e.target.files)o.push(decode(await f.text()));add(o)};
  root.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{L.splice(+b.dataset.d,1);save(L);draw()});
  q('#csv').onclick=()=>{const hd=['nom','classe','xp','chapitres_valides','moy_profils','projet'],ls=[hd.join(';')];L.forEach(r=>{const ps=(r.profiles||[]).map(p=>p.score);ls.push([r.name,r.cls,r.xp,Object.values(r.ch||{}).filter(c=>c.ok).length,ps.length?Math.round(avg(ps)):'',r.project?.score??''].map(csvCell).join(';'))});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+ls.join('\n')],{type:'text/csv'}));a.download='classe.csv';a.click()};
  q('#mk').onclick=()=>{const o={title:q('#at').value,type:q('#ty').value,scaleN:+q('#sc').value,seed:+q('#sd').value,due:q('#du').value};q('#cd').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(o))))};
  q('#pv').onclick=()=>{const ex=pickExo(q('#pc').value,Math.floor(Math.random()*1e9));q('#pvo').innerHTML=`<p><b>${ex.title}</b> — ${ex.prompt}</p><div class="box tip"><b class="t">Corrigé</b>${ex.sol}<br>${ex.fields?ex.fields.map(f=>`${f.l} <b>${fr(f.a,2)}</b> ${f.u||''} (tol. ±${fr(f.t,2)})`).join(' · '):'<b>'+ex.choices.o[ex.choices.a]+'</b>'}</div>`};
  q('#hs').onclick=()=>{q('#hv').textContent=q('#nc').value?sha256(q('#nc').value):'Saisis un code.'}};
 draw()}
