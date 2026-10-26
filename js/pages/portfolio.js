import {state,setNote,setWho,report,SKILLS,BADGES,addPortfolio} from '../core/store.js';
import {h,fr,esc} from '../core/util.js';
import {toast} from '../core/ui.js';
import {recommend} from '../core/adapt.js';
import {byId} from '../data/errors.js';
export const encodeReport=()=>btoa(unescape(encodeURIComponent(JSON.stringify(report()))));
export default async function(root){const s=state(),P=s.portfolio;
 const items=P.items.map(it=>`<div class="card"><div class="row"><b>${esc(it.title)}</b><span class="sp"></span><span class="pill ${it.score>=70?'ok':'ko'}">${it.score}/100</span></div><small class="mute">${new Date(it.t).toLocaleDateString('fr-FR')} · ${esc(it.mode||'')} ${it.code?'· '+esc(it.code):''}</small>${it.img?`<img src="${esc(it.img)}" alt="${esc(it.title)}" style="width:100%;border-radius:10px;margin-top:8px;border:2px solid var(--line)">`:''}<label class="mute" style="display:block;margin-top:8px">Réflexion : qu'ai-je appris ? Quelle difficulté ?</label><textarea data-n="${it.id}" rows="2" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:8px;background:var(--bg)">${esc(P.notes[it.id]||'')}</textarea></div>`).join('');
 const errs=Object.entries(s.errors).sort((a,b)=>b[1]-a[1]).slice(0,5);
 root.innerHTML=`<h1>📚 Mon portfolio d'apprentissage</h1><p class="lead">Mes productions, mes réflexions, mes progrès. Stocké uniquement dans ce navigateur.</p>
 <div class="card"><h3>Identité (facultatif)</h3><div class="ctrl"><label>Prénom / pseudo <input type="text" id="nm" value="${esc(s.who.name)}" style="width:160px"></label><label>Classe / groupe <input type="text" id="cl" value="${esc(s.who.cls)}" style="width:120px"></label></div><small class="mute">N'utilise pas d'information sensible : ce nom apparaît dans le rapport remis à l'enseignant.</small></div>
 <div class="card"><h3>Compétences</h3>${Object.entries(SKILLS).map(([k,v])=>{const e=s.skills[k]||{n:0,m:0};return `<div class="skillrow"><span>${v}</span><div class="bar"><i style="width:${Math.round(e.m*100)}%"></i></div><span>${e.n?Math.round(e.m*100)+'%':'–'}</span></div>`}).join('')}</div>
 <div class="card"><h3>Points à travailler</h3>${errs.length?`<ul>${errs.map(([k,n])=>`<li><a href="#/erreurs/${k}">${byId[k]?.t||k}</a> — ${n} fois</li>`).join('')}</ul>`:'<p class="mute">Aucune erreur récurrente enregistrée.</p>'}<ul>${recommend().map(r=>`<li><a href="${r.href}">${r.i} ${r.t}</a> <small class="mute">— ${r.why}</small></li>`).join('')}</ul></div>
 <h2>Mes productions</h2>${items||'<p class="mute">Aucune production pour l\'instant : termine un profil, une coupe ou le projet final.</p>'}
 <div class="card"><h3>Remettre mon travail à l'enseignant</h3><p class="mute">Copie ce code (ou télécharge le fichier) et transmets-le : l'enseignant peut l'importer dans son espace.</p><div class="row"><button class="btn" id="cp">📋 Copier mon code rapport</button><button class="btn sec" id="dl">⬇ Télécharger (.json)</button><button class="btn sec" id="pr">🖨️ Imprimer le portfolio</button></div></div>`;
 root.querySelector('#nm').oninput=root.querySelector('#cl').oninput=()=>setWho(root.querySelector('#nm').value,root.querySelector('#cl').value);
 root.addEventListener('input',e=>{if(e.target.dataset.n)setNote(e.target.dataset.n,e.target.value)});
 root.querySelector('#cp').onclick=async()=>{const t=encodeReport();try{await navigator.clipboard.writeText(t);toast('Code copié')}catch(e){prompt('Copie ce code :',t)}};
 root.querySelector('#dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report())],{type:'application/json'}));a.download=`rapport-${(s.who.name||'eleve').replace(/\W+/g,'_')}.json`;a.click()};
 root.querySelector('#pr').onclick=()=>window.print()}
