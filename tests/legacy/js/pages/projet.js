/* Projet final : cas d'étude marocain → profil topographique → carte géologique → coupe → synthèse */
import {h,fr,fitCanvas,dirName,shuffle,pick} from '../core/util.js';
import {state,setProject,addXp,addPortfolio,on} from '../core/store.js';
import {CASES,caseById} from '../data/cases.js';
import {caseModel} from './cas.js';
import {KINDS} from '../core/geol.js';
import {drawGeoMap,legendHtml} from '../core/geodraw.js';
import {suggestLine,crossings} from '../core/terrain.js';
import {shared} from '../core/shared.js';
import {confetti,toast,ring} from '../core/ui.js';
const TERMS={all:['relief','courbe','profil','pente','altitude','échelle'],granite:['intrusion','granite','recoup','plus récent','contact'],monoclinal:['pendage','direction','couche','contact','plong'],synclinal:['synclinal','pli','plus récent','axe','flanc'],anticlinal:['anticlinal','pli','plus ancien','axe','flanc'],discordance:['discordance','érosion','plus récent','plus ancien','incliné'],tabulaire:['horizontal','tabulaire','courbe de niveau','plus ancien','contact']};
export default async function(root,{a}){const P=()=>state().project;
 if(a&&caseById[a]&&P().caseId!==a)setProject({caseId:a,stage:1,profile:null,map:null,section:null,report:null,score:0,done:0});
 const c=P().caseId&&caseById[P().caseId];
 if(!c){root.innerHTML=`<h1>🎓 Projet final</h1><p class="lead">Un dossier complet sur un cas d'étude marocain : profil topographique, lecture de la carte géologique, coupe géologique, synthèse.</p><div class="grid g2">${CASES.map(x=>`<a class="node" href="#/projet/${x.id}"><span class="dot">${x.em}</span><span><b>${x.t}</b><small>${x.reg}</small></span></a>`).join('')}</div>`;return}
 const M=caseModel(c);shared.projectActive=true;shared.returnTo='#/projet';shared.hook=null;
 const hk=r=>{if(r.stage==='profile')setProject({profile:r.score});if(r.stage==='section')setProject({section:r.score})};hk.once=false;shared.hook=hk;
 const render=()=>{const p=P(),st=[['Profil topographique',p.profile!=null],['Carte géologique',p.map!=null],['Coupe géologique',p.section!=null],['Synthèse',!!p.done]];
  root.innerHTML=`<div class="crumb"><a href="#/projet">Projet final</a></div><h1>🎓 ${c.em} ${c.t}</h1><div class="stepper">${st.map((s,i)=>`<div class="st ${s[1]?'done':''}"><b>${s[1]?'✓':i+1}</b>${s[0]}</div>`).join('')}</div>
  <div class="card"><h3>1. Profil topographique</h3><p>Réalise un profil sur le terrain du cas (mode Intermédiaire conseillé). ${p.profile!=null?`<b>Score : ${p.profile}/100</b>`:''}</p><button class="btn" id="b1">${p.profile!=null?'Refaire':'Ouvrir le simulateur'}</button></div>
  <div class="card"><h3>2. Lecture de la carte géologique</h3><div class="grid g2"><div class="cvw"><canvas role="img" aria-label="Carte géologique du cas"></canvas></div><div>${legendHtml(M.g)}</div></div><div id="q"></div></div>
  <div class="card"><h3>3. Coupe géologique</h3><p>Dessine la coupe avec le trait de ton choix. ${p.section!=null?`<b>Score : ${p.section}/100</b>`:''}</p><button class="btn blue" id="b3">${p.section!=null?'Refaire':'Dessiner la coupe'}</button></div>
  <div class="card"><h3>4. Synthèse écrite</h3><p class="mute">Rédige quelques phrases (≥ 25 mots par rubrique). Le système vérifie la complétude et l'emploi du vocabulaire du cours — pas la qualité scientifique, que l'enseignant évalue.</p><div id="rep"></div></div><div id="fin"></div>`;
  const cv=root.querySelector('canvas'),draw=()=>{const w=cv.parentNode.clientWidth||400,hh=w*(M.d.H-1)/(M.d.W-1);drawGeoMap(fitCanvas(cv,w,hh),M.g,w,hh,{eq:M.eq,showDip:false})};new ResizeObserver(draw).observe(cv.parentNode);
  root.querySelector('#b1').onclick=()=>{const l=suggestLine(M.d,M.eq);shared.handoff={opts:{...c.topo},A:l.A,B:l.B};location.hash='#/profil'};
  root.querySelector('#b3').onclick=()=>{shared.handoff={geo:{kind:c.geo.kind,seed:c.geo.seed,demOpts:c.topo,geoOpts:c.geo.dip?{dip:c.geo.dip}:{},caseId:c.id,tab:'cut'}};location.hash='#/geo'};
  mapQuiz(root.querySelector('#q'));report(root.querySelector('#rep'));finish(root.querySelector('#fin'))};
 const mapQuiz=el=>{const p=P();if(p.map!=null){el.innerHTML=`<p><b>Score de lecture : ${p.map}/100</b></p>`;return}
  const ks=Object.keys(KINDS),o1=shuffle([c.geo.kind,...shuffle(ks.filter(k=>k!==c.geo.kind)).slice(0,3)]),ids=[...M.g.units.keys()].filter(u=>!M.g.units[u].ign),old=Math.min(...ids.filter(u=>{for(let k=0;k<400;k++){if(M.g.at(Math.floor(Math.random()*150)+3,Math.floor(Math.random()*100)+3)===u)return true}return false}).concat([ids[0]]));
  const ans={};const mc=(q,opts,right,key)=>{const d=h('div',{class:'q'},h('p',{},q),...opts.map((t,i)=>h('button',{class:'opt',onclick:ev=>{d.querySelectorAll('.opt').forEach(b=>b.disabled=true);ans[key]=i===right?1:0;ev.currentTarget.classList.add(i===right?'ok':'ko');d.querySelectorAll('.opt')[right].classList.add('ok');if(Object.keys(ans).length===3)fin2()}},t)));return d};
  const fin2=()=>{const s=Math.round(100*(ans.a+ans.b+ans.c)/3);setProject({map:s});toast('Lecture enregistrée : '+s+'/100');render()};
  const ds=M.g.info.dip?[`${M.g.info.dip}° (±3°)`]:null;const u=ids,ob=shuffle(ids.slice(0,4)).map(i=>i);const oo=ob.includes(old)?ob:[...ob.slice(0,3),old];
  el.append(mc('Quelle structure domine la carte ?',o1.map(k=>KINDS[k]),o1.indexOf(c.geo.kind),'a'),mc('Quelle formation SÉDIMENTAIRE est la plus ancienne parmi celles de la carte ?',oo.map(i=>`${M.g.units[i].id} — ${M.g.units[i].n} (${M.g.units[i].a})`),oo.indexOf(old),'b'),mc('Les formations les plus récentes sont-elles situées… ?',['Au cœur de la structure (ou plus haut dans la série)','Toujours dans les vallées','Sans rapport avec la structure','Impossible à dire'],0,'c'))};
 const report=el=>{const p=P(),r=p.report||{};const F=[['ctx','Contexte et objectif (localisation, échelle, relief)'],['obs','Observations (formes du relief, pentes, formations, structures)'],['interp','Interprétation (structure géologique, évolution)'],['lim','Limites et incertitudes de ton travail']];
  const wc=t=>(t||'').trim().split(/\s+/).filter(Boolean).length;el.innerHTML='';const ta={};F.forEach(([k,l])=>{ta[k]=h('textarea',{'aria-label':l,rows:3,style:'width:100%;border:2px solid var(--line);border-radius:12px;padding:8px;background:var(--bg)',placeholder:l},r[k]||'');el.append(h('p',{class:'mute'},l),ta[k])});
  el.append(h('button',{class:'btn',onclick:()=>{const v=Object.fromEntries(F.map(([k])=>[k,ta[k].value]));const full=F.every(([k])=>wc(v[k])>=25),txt=Object.values(v).join(' ').toLowerCase(),terms=[...TERMS.all,...(TERMS[c.geo.kind]||[])],hit=terms.filter(t=>txt.includes(t)).length;const sc=Math.round(Math.min(100,(F.filter(([k])=>wc(v[k])>=25).length/4)*60+Math.min(hit,8)/8*40));setProject({report:v,reportScore:sc,done:full?Date.now():0});toast(full?'Synthèse enregistrée':'Complète chaque rubrique (≥ 25 mots)');render()}},'Enregistrer la synthèse'))};
 const finish=el=>{const p=P();if(!(p.profile!=null&&p.map!=null&&p.section!=null&&p.done))return;const total=Math.round(.25*p.profile+.2*p.map+.35*p.section+.2*(p.reportScore||0));if(p.score!==total){setProject({score:total});}
  el.innerHTML=`<div class="card"><div class="row">${ring(total,100,'Note du projet')}<div class="sp"><h2 style="margin:0">Dossier complet</h2><p class="mute">Profil 25 % · Carte 20 % · Coupe 35 % · Synthèse 20 % (note indicative automatique ; l'enseignant a le dernier mot).</p></div></div><div class="row"><button class="btn" id="pr">🖨️ Imprimer / PDF</button><button class="btn sec" id="pf">➕ Ajouter au portfolio</button></div></div>`;
  el.querySelector('#pr').onclick=()=>window.print();el.querySelector('#pf').onclick=()=>{addPortfolio({type:'projet',title:`Projet final – ${c.t}`,score:total,mode:'projet',code:c.id});toast('Ajouté au portfolio');if(total>=60)confetti(50)}};
 render();const off=on(t=>{if(t==='progress')render()});return()=>{off();shared.projectActive=false}}
