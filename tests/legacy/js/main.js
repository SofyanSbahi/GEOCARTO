import {$,h} from './core/util.js';
import {state,on,levelOf,LEVELS,progressPct} from './core/store.js';
import {modal} from './core/ui.js';
import {setting,setWho} from './core/store.js';
import {shared} from './core/shared.js';

const NAV=[['','🏠','Parcours'],['m1','📍','M1 · Topographie'],['m2','📈','M2 · Profils'],['m3','🪨','M3 · Cartes géologiques'],['m4','🧱','M4 · Coupes géologiques'],['profil','✏️','Profil TP'],['geo','⛏️','Atelier géologique'],['cas','🇲🇦','Cas marocains'],['projet','🎓','Projet final'],['defi','🏁','Défi hebdo'],['labos','🧪','Labos'],['terrain','🌄','Terrain virtuel'],['inverse','🔄','Construction inverse'],['exos','🎲','Exercices'],['erreurs','🔎','Erreurs fréquentes'],['portfolio','📚','Portfolio'],['moi','🏆','Tableau de bord']];
const TABS=[['','🏠','Parcours'],['profil','✏️','Profil TP'],['geo','⛏️','Géologie'],['defi','🏁','Défi'],['menu','☰','Menu']];
const ROUTES={'':'home','m1':'course','m2':'course','profil':'profile','labos':'labs','labo':'labs','terrain':'terrain','inverse':'inverse','exos':'exos','moi':'me','m3':'course','m4':'course','geo':'geo','cas':'cas','projet':'projet','portfolio':'portfolio','erreurs':'erreurs','defi':'defi','prof':'prof','stage':'stage'};
/* chargeurs explicites (compatibles bundle classique : fonctionne aussi en file://) */
const LOADERS={home:()=>import('./pages/home.js'),course:()=>import('./pages/course.js'),profile:()=>import('./pages/profile.js'),labs:()=>import('./pages/labs.js'),terrain:()=>import('./pages/terrain.js'),inverse:()=>import('./pages/inverse.js'),exos:()=>import('./pages/exos.js'),me:()=>import('./pages/me.js'),geo:()=>import('./pages/geo.js'),cas:()=>import('./pages/cas.js'),projet:()=>import('./pages/projet.js'),portfolio:()=>import('./pages/portfolio.js'),erreurs:()=>import('./pages/erreurs.js'),defi:()=>import('./pages/defi.js'),prof:()=>import('./pages/prof.js'),stage:()=>import('./stage/stage.js')};
const nav=(L,cls)=>L.map(([id,i,t])=>id==='menu'?`<a href="#/menu" data-id="menu" id="menuBtn" role="button"><span class="i">${i}</span><span>${t}</span></a>`:`<a href="#/${id}" data-id="${id}"><span class="i">${i}</span><span>${t}</span></a>`).join('');
const teacherOn=()=>sessionStorage.getItem('gc_teacher')==='1';
$('#rail').innerHTML=nav(NAV)+(teacherOn()?'<a href="#/prof" data-id="prof"><span class="i">👩‍🏫</span><span>Espace enseignant</span></a>':'');$('#tabs').innerHTML=nav(TABS);
$('#menuBtn').addEventListener('click',e=>{e.preventDefault();const box=h('div',{class:'grid g2'},...NAV.concat(teacherOn()?[['prof','👩‍🏫','Espace enseignant']]:[]).map(([id,i,t])=>h('a',{class:'node',href:'#/'+id,onclick:()=>document.querySelector('.modal')&&document.querySelector('.modal').remove()},h('span',{class:'dot'},i),h('span',{},h('b',{},t)))));modal(box,{title:'Menu',wide:true})});

let cleanup=null,token=0;
async function route(){
 const my=++token,[id='',a,b]=location.hash.replace(/^#\/?/,'').split('/'),key=id in ROUTES?id:'';
 if(cleanup){try{cleanup()}catch(e){console.warn(e)}cleanup=null}
 const root=$('#view');root.innerHTML='<div class="loading">Chargement…</div>';
 document.querySelectorAll('#rail a,#tabs a').forEach(x=>x.classList.toggle('on',x.dataset.id===key||(key==='labo'&&x.dataset.id==='labos')));
 shared.page=location.hash;shared.probe=null;shared.profileHint=null;
 try{const mod=await LOADERS[ROUTES[key]]();if(my!==token)return;root.innerHTML='';cleanup=await mod.default(root,{id:key,a,b})||null}
 catch(e){console.error(e);root.innerHTML=`<div class="card"><h3>Cette page n'a pas pu se charger</h3><p>Détail technique : <code>${String(e.message).replace(/</g,'&lt;')}</code></p><p class="mute">Essaie de recharger (Ctrl+F5). Si le problème persiste, vide le cache du site.</p><a class="btn" href="#/">Retour à l'accueil</a></div>`}
 if(my===token){window.scrollTo(0,0);root.focus({preventScroll:true})}
}
addEventListener('hashchange',route);
function hud(){const s=state();$('#chipXp span').textContent=s.xp;$('#chipStreak span').textContent=s.streak.n}
on(hud);hud();
const applySettings=()=>{const st=state().settings,c=document.documentElement.classList;['fs0','fs2','fs3'].forEach(x=>c.remove(x));if(st.fs!=null&&st.fs!==1)c.add('fs'+st.fs);c.toggle('hc',!!st.contrast);c.toggle('big',!!st.big);c.toggle('rm',!!st.motion)};applySettings();
$('#setBtn').onclick=()=>{const st=state().settings,w=state().who,F=(id,l,v)=>`<label class="opt" style="display:flex;gap:10px"><input type="checkbox" id="${id}" ${v?'checked':''}> ${l}</label>`;
 const box=h('div',{html:`<p><b>Taille du texte</b></p><div class="seg" id="fs">${[[0,'A−'],[1,'A'],[2,'A+'],[3,'A++']].map(([v,t])=>`<button data-v="${v}" class="${(st.fs??1)===v?'on':''}">${t}</button>`).join('')}</div>${F('hc','Contraste élevé',st.contrast)}${F('bg','Grandes zones tactiles (smartphone / doigts / stylet)',st.big)}${F('rm','Réduire les animations',st.motion)}<p><b>Profil élève</b> (facultatif, pour le rapport)</p><div class="ctrl"><label>Prénom / pseudo <input type="text" id="wn" value="${w.name}" style="width:150px"></label><label>Classe <input type="text" id="wc" value="${w.cls}" style="width:100px"></label></div><p class="mute">Raccourcis clavier : dans le tracé du profil, Tab pour cibler la feuille, flèches pour déplacer le réticule, Entrée pour poser un point, Retour arrière pour annuler.</p>`});
 box.addEventListener('click',e=>{const b=e.target.closest('#fs button');if(b){setting('fs',+b.dataset.v);box.querySelectorAll('#fs button').forEach(x=>x.classList.toggle('on',x===b));applySettings()}});
 box.addEventListener('input',e=>{const i=e.target.id;if(i==='hc')setting('contrast',e.target.checked);if(i==='bg')setting('big',e.target.checked);if(i==='rm')setting('motion',e.target.checked);if(i==='wn'||i==='wc')setWho(box.querySelector('#wn').value,box.querySelector('#wc').value);applySettings()});modal(box,{title:'Réglages et accessibilité'})};
const th=()=>{const d=document.documentElement.dataset.theme==='dark';$('#themeBtn').textContent=d?'☀️':'🌙'};th();
$('#themeBtn').onclick=()=>{const d=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=d?'':'dark';try{localStorage.setItem('gc2_theme',d?'light':'dark')}catch(e){}th();dispatchEvent(new Event('themechange'))};
import('./pages/assistant.js').then(m=>m.initAssistant($('#drawer'),$('#fab'))).catch(e=>{console.warn('assistant indisponible',e);$('#fab').hidden=true});
window.__gcBooted=true;route();
if('serviceWorker'in navigator&&location.protocol.startsWith('http')&&!location.hostname.match(/^(localhost|127\.)/))navigator.serviceWorker.register('sw.js').catch(()=>{});
