import {h,fr,fitCanvas} from '../core/util.js';
import {makeDem,autoEq,suggestLine} from '../core/terrain.js';
import {makeGeology,KINDS} from '../core/geol.js';
import {drawMap} from '../core/draw.js';
import {drawGeoMap,legendHtml} from '../core/geodraw.js';
import {CASES,caseById} from '../data/cases.js';
import {shared} from '../core/shared.js';
export function caseModel(c){const d=makeDem(c.topo),g=makeGeology(d,c.geo.kind,c.geo.seed,{dip:c.geo.dip});return{d,g,eq:autoEq(d)}}
export default async function(root,{a}){const c=a&&caseById[a];
 if(!c){root.innerHTML=`<h1>🇲🇦 Études de cas marocaines</h1><div class="box rem"><b class="t">Modèles pédagogiques</b>Ces terrains sont des <b>modèles générés</b> inspirés de paysages marocains, pas des relevés réels : altitudes et géométries sont simplifiées. Confronte-les à la feuille officielle correspondante (ANCFCC / carte géologique du Maroc) quand tu en disposes.</div><div class="grid g2">${CASES.map(x=>`<a class="node" href="#/cas/${x.id}"><span class="dot">${x.em}</span><span><b>${x.t}</b><small>${x.reg} · ${x.scale}</small></span></a>`).join('')}</div>`;return}
 const M=caseModel(c);root.innerHTML=`<div class="crumb"><a href="#/cas">Études de cas</a></div><h1>${c.em} ${c.t}</h1><div class="box rem"><b class="t">Modèle pédagogique</b>Terrain modélisé à partir du cas « ${c.reg} » : ce n'est pas un relevé réel.</div><div class="seg" id="sg"><button class="on" data-m="topo">Carte topographique</button><button data-m="geo">Carte géologique</button></div><div class="grid g2"><div><div class="cvw"><canvas role="img" aria-label="Carte du cas d'étude"></canvas></div></div><div id="lg"></div></div>
 <div class="card"><h3>Contexte</h3><p>${c.ctx}</p><h3>Géologie</h3><p>${c.geoTxt}</p><h3>Objectifs d'apprentissage</h3><ul>${c.goals.map(g=>`<li>${g}</li>`).join('')}</ul></div>
 <div class="row"><button class="btn acc" id="p">✏️ Profil topographique</button><button class="btn blue" id="g">✂️ Coupe géologique</button><a class="btn sec" href="#/projet/${c.id}">🎓 Projet final</a></div>`;
 const cv=root.querySelector('canvas');let m='topo';const draw=()=>{const w=cv.parentNode.clientWidth||500,hh=w*(M.d.H-1)/(M.d.W-1),ctx=fitCanvas(cv,w,hh);if(m==='topo'){drawMap(ctx,M.d,w,hh,{eq:M.eq,shade:true});root.querySelector('#lg').innerHTML=`<p class="mute">Échelle ${c.scale} · équidistance ${M.eq} m · relief de ${fr(M.d.zmax-M.d.zmin,0)} m.</p>`}else{drawGeoMap(ctx,M.g,w,hh,{eq:M.eq});root.querySelector('#lg').innerHTML=`<p><b>${KINDS[c.geo.kind]}</b></p>`+legendHtml(M.g)}};
 root.querySelector('#sg').onclick=e=>{const b=e.target.closest('button');if(!b)return;m=b.dataset.m;root.querySelectorAll('#sg button').forEach(x=>x.classList.toggle('on',x===b));draw()};
 root.querySelector('#p').onclick=()=>{const l=suggestLine(M.d,M.eq);shared.handoff={opts:{...c.topo},A:l.A,B:l.B};location.hash='#/profil'};
 root.querySelector('#g').onclick=()=>{shared.handoff={geo:{kind:c.geo.kind,seed:c.geo.seed,demOpts:c.topo,geoOpts:c.geo.dip?{dip:c.geo.dip}:{},caseId:c.id,tab:'cut'}};location.hash='#/geo'};
 const ro=new ResizeObserver(draw);ro.observe(cv.parentNode);draw();return()=>ro.disconnect()}
