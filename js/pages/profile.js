/* Simulateur de profil topographique sur papier millimétré numérique */
import {h,fr,fitCanvas,clamp,rng,pick,DIRS16,dirName,azimuth,shuffle,parseNum} from '../core/util.js';
import {attachTouch} from './profile-touch.js';
import {makeDem,TYPES,autoEq,crossings,suggestLine,sample,slopePct} from '../core/terrain.js';
import {makeSetup,paperGeometry,paperChoices,checkPaper,PAD,curveFn,evaluateProfile,diagnoseProfile,trendRuns,levelList,targetsFrom,firstMissing} from '../engine/profile/index.js';
import {diagnosisLines} from '../core/profile-text.js';
import {drawMap} from '../core/draw.js';
import {state,profileResult,addXp,setting,addError,addPortfolio} from '../core/store.js';
import {byId} from '../data/errors.js';
import {shared} from '../core/shared.js';
import {toast,confetti,ring} from '../core/ui.js';

const MODES={debutant:['Débutant','Guidage complet : repères, cibles et indices'],intermediaire:['Intermédiaire','Aides partielles : guides verticaux'],expert:['Expert','Aucune aide, comme sur papier']};
export {curveFn}; // compatibilité : la courbe de l'étudiant vit désormais dans engine/profile/curve.js

export default async function(root){
 const S={mode:state().settings.mode||'intermediaire',type:'aleatoire',scaleN:25000,step:1,dem:null,eq:20,A:null,B:null,cross:[],marks:[],pts:[],redo:[],smooth:true,vm:50,z0:0,hints:0,tool:'pen',zoom:1,pan:{x:0,y:0},res:null,seed:0};
window.__profile={S,render:()=>render()}; // point d'accès pour les tests de bout en bout (tools/e2e)
let cleanup=[];const on=(t,e,f,o)=>{t.addEventListener(e,f,o);cleanup.push(()=>t.removeEventListener(e,f,o))};
 const view=h('div');root.append(h('h1',{},'✏️ Simulateur de profil topographique'),view);
 const STEPS=['Terrain','Trait A–B','Relevé','Papier','Tracé','Correction'];
 const stepper=()=>h('div',{class:'stepper',role:'list'},...STEPS.map((t,i)=>h('div',{class:'st'+(S.step===i+1?' on':'')+(S.step>i+1?' done':''),role:'listitem'},h('b',{},S.step>i+1?'✓':i+1),t)));
 const coach=(txt)=>h('div',{class:'coach'+(S.mode==='expert'?' exp':'')},h('span',{class:'av'},S.mode==='expert'?'📝':'🧑‍🏫'),h('div',{html:S.mode==='expert'?'<small>Mode Expert : aucune aide. Travaille comme sur papier.</small>':txt}));
 const SU=()=>makeSetup({dem:S.dem,A:S.A,B:S.B,eq:S.eq,vm:S.vm,z0:S.z0}); // état « papier » pour le moteur de profil
 const LCM=()=>SU().lcm; // longueur AB en cm sur la carte (1 maille = 1 mm)
 const hs=()=>S.scaleN/100; // m par cm (longueurs)
 const LM=()=>SU().lm;
 const code=()=>`${S.type}-${S.seed.toString(36)}-${S.scaleN/1000}`;
 function newTerrain(type,seed,scaleN,extra){S.extra=extra||{};S.type=type;S.seed=seed;S.scaleN=scaleN;S.dem=makeDem({type,seed,scaleN,...S.extra});S.eq=autoEq(S.dem);S.A=S.B=null;S.cross=[];S.marks=[];S.pts=[];S.redo=[];S.res=null;S.hints=0;S.zoom=1;S.pan={x:0,y:0}}
 shared.profileHint=()=>{if(!S.dem||!S.A||!S.B)return null;return trendRuns(crossings(S.dem,S.A,S.B,S.eq))};

 /* ---------- étape 1 ---------- */
 function stepSetup(){view.innerHTML='';const sel=h('select',{},h('option',{value:'aleatoire'},'🎲 Aléatoire'),...Object.entries(TYPES).map(([k,v])=>h('option',{value:k},v))),sc=h('select',{},...[10000,20000,25000,50000].map(n=>h('option',{value:n,selected:n===25000},'1/'+n.toLocaleString('fr')))),codeIn=h('input',{type:'text',placeholder:'ex : volcan-1k2z-25',style:'width:190px'});
  const seg=h('div',{class:'seg'},...Object.entries(MODES).map(([k,v])=>h('button',{class:k===S.mode?'on':'',onclick:e=>{S.mode=k;setting('mode',k);seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===e.currentTarget));desc.textContent=v[1]}},v[0])));const desc=h('p',{class:'mute'},MODES[S.mode][1]);
  view.append(stepper(),h('div',{class:'card'},h('h3',{},'1. Choisis ton exercice'),h('p',{class:'mute'},'Chaque terrain est généré à partir d\'un code : donne-le à un camarade pour qu\'il refasse exactement le même exercice.'),h('div',{class:'ctrl'},h('label',{},'Niveau d\'aide',seg)),desc,h('div',{class:'ctrl'},h('label',{},'Relief ',sel),h('label',{},'Échelle ',sc)),h('div',{class:'row'},h('button',{class:'btn acc',onclick:()=>{let t=sel.value;if(t==='aleatoire')t=pick(Object.keys(TYPES));newTerrain(t,Math.floor(Math.random()*1e6)+1,+sc.value);S.step=2;render()}},'🎲 Générer un terrain'),h('span',{class:'sp'}),codeIn,h('button',{class:'btn sec sm',onclick:()=>{const m=codeIn.value.trim().split('-');if(m.length===3&&TYPES[m[0]]){newTerrain(m[0],parseInt(m[1],36)||1,(+m[2]||25)*1000);S.step=2;render()}else toast('Code invalide')}},'Charger un code'))))}

 /* ---------- étape 2 : trait A–B ---------- */
 function mapCanvas(opts={}){const box=h('div',{class:'cvw'}),cv=h('canvas');box.append(cv);let k=1,w=0,hh=0,Z=1,ox=0,oy=0;
  /* Z, ox, oy : zoom tactile (rc.4, étape Relevé). À Z = 1 le rendu est strictement celui d'avant (même appel à drawMap) : le bureau n'est pas touché.
     À Z > 1 la carte est REDESSINÉE à la taille Z × w (traits et cotes nets), puis décalée de (ox, oy) ; échelle graphique et flèche du nord masquées. */
  const paint=(c,kz,o)=>{if(S.A){c.strokeStyle='#c0392b';c.lineWidth=2.5;c.setLineDash([8,5]);if(S.B){c.beginPath();c.moveTo(S.A.x*kz,S.A.y*kz);c.lineTo(S.B.x*kz,S.B.y*kz);c.stroke()}c.setLineDash([]);
    [['A',S.A],['B',S.B]].forEach(([n,p])=>{if(!p)return;c.fillStyle='#c0392b';c.beginPath();c.arc(p.x*kz,p.y*kz,7,0,7);c.fill();c.fillStyle='#fff';c.font='700 11px system-ui';c.textAlign='center';c.fillText(n,p.x*kz,p.y*kz+4);})}
   opts.after&&opts.after(c,kz,w,hh,o)};
  const draw=()=>{w=box.clientWidth||600;hh=w*(S.dem.H-1)/(S.dem.W-1);const c=fitCanvas(cv,w,hh);clampView();
   if(Z===1){k=drawMap(c,S.dem,w,hh,{eq:S.eq,shade:true,rivers:S.mode!=='expert',spots:true});paint(c,k,{z:1})}
   else{c.save();c.translate(-ox,-oy);k=drawMap(c,S.dem,w*Z,hh*Z,{eq:S.eq,shade:true,rivers:S.mode!=='expert',spots:true,scaleBar:false,north:false});paint(c,k,{z:Z});c.restore()}
   opts.onDraw&&opts.onDraw(Z)};
  const clampView=()=>{ox=clamp(ox,0,w*Z-w);oy=clamp(oy,0,hh*Z-hh)};
  /* zoom autour d'un point (cx, cy) de la boîte : le point de la carte sous le doigt reste sous le doigt */
  const zoomAt=(z,cx=w/2,cy=hh/2)=>{const nz=clamp(z,1,4),mx=(cx+ox)/Z,my=(cy+oy)/Z;Z=nz;ox=mx*Z-cx;oy=my*Z-cy;draw()};
  const ro=new ResizeObserver(draw);ro.observe(box);cleanup.push(()=>ro.disconnect());
  /* rendu d'une loupe : la carte au facteur lz, centrée sur le point p (coordonnées du MNT), dans un canevas de taille s */
  const lens=(lc,p,lz,s)=>{const c=fitCanvas(lc,s,s),kz=w*lz/(S.dem.W-1);c.save();c.translate(s/2-p.x*kz,s/2-p.y*kz);drawMap(c,S.dem,w*lz,hh*lz,{eq:S.eq,shade:true,rivers:S.mode!=='expert',spots:true,scaleBar:false,north:false});paint(c,kz,{z:lz,lens:true});c.restore();return c};
  return{box,cv,draw,k:()=>k,zoom:()=>Z,zoomAt,panBy:(dx,dy,nd)=>{ox-=dx;oy-=dy;if(!nd)draw()},lens,size:()=>({w,hh}),
   pos:e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left+ox)/(r.width*Z)*(S.dem.W-1),y:(e.clientY-r.top+oy)/(r.height*Z)*(S.dem.H-1)}},
   toBox:p=>({x:p.x*k-ox,y:p.y*k-oy})}}
 function stepLine(){view.innerHTML='';const info=h('div',{class:'fb'}),btn=h('button',{class:'btn',disabled:true},'Valider le trait →');
  const upd=()=>{if(S.A&&S.B){const c=crossings(S.dem,S.A,S.B,S.eq),az=azimuth(S.B.x-S.A.x,-(S.B.y-S.A.y));info.className='fb';info.innerHTML=`Longueur ${fr(LCM(),1)} cm (${fr(LM()/1000,2)} km) · direction ${dirName(az)} (${Math.round(az)}°) · ${c.length} courbes traversées`;const okLen=LCM()>=6,okC=c.length>=6;btn.disabled=!(okLen&&okC);if(!okLen||!okC){info.className='fb ko';info.innerHTML+=' — trait '+(!okLen?'trop court (≥ 6 cm)':'trop plat (≥ 6 courbes)')}}else info.textContent=S.A?'Place maintenant le point B.':'Touche la carte pour placer A.'};
  const M=mapCanvas({});let drag=null;
  on(M.cv,'pointermove',e=>{const p=M.pos(e);shared.probe={z:sample(S.dem,p.x,p.y),slope:slopePct(S.dem,p.x,p.y),eq:S.eq,scaleN:S.scaleN};if(drag){drag.x=clamp(p.x,2,S.dem.W-3);drag.y=clamp(p.y,2,S.dem.H-3);M.draw();upd()}});
  on(M.cv,'pointerdown',e=>{const p=M.pos(e),k=M.k(),near=q=>q&&Math.hypot((q.x-p.x)*k,(q.y-p.y)*k)<26;M.cv.setPointerCapture(e.pointerId);
   if(near(S.A))drag=S.A;else if(near(S.B))drag=S.B;else if(!S.A)S.A=drag={x:p.x,y:p.y};else if(!S.B)S.B=drag={x:p.x,y:p.y};else{const qa=Math.hypot(S.A.x-p.x,S.A.y-p.y),qb=Math.hypot(S.B.x-p.x,S.B.y-p.y);drag=qa<qb?S.A:S.B;drag.x=p.x;drag.y=p.y}M.draw();upd()});
  on(M.cv,'pointerup',()=>drag=null);
  btn.onclick=()=>{S.cross=crossings(S.dem,S.A,S.B,S.eq);S.marks=[];S.step=3;render()};
  view.append(stepper(),coach(S.mode==='debutant'?'Choisis un trait qui traverse <b>une crête et un talweg</b> (reconnais les V), avec au moins 6 courbes. Touche A puis B, ou utilise « Trait suggéré ».':'Place le segment A–B (touche ou glisse).'),M.box,h('div',{class:'tools'},h('button',{class:'btn sec sm',onclick:()=>{const l=suggestLine(S.dem,S.eq);if(l){S.A=l.A;S.B=l.B;M.draw();upd()}}},'✨ Trait suggéré'),h('button',{class:'btn sec sm',onclick:()=>{S.A=S.B=null;M.draw();upd()}},'Effacer'),h('span',{class:'sp'}),h('small',{class:'mute'},'Code : '+code()),btn),info);upd()}

 /* ---------- étape 3 : relevé des intersections ---------- */
 function stepSurvey(){view.innerHTML='';const total=S.cross.length,info=h('div',{class:'fb'}),prog=h('b',{}),levels=levelList(S.dem,S.eq);
  const strip=h('canvas'),sw=h('div',{class:'cvw'},strip);let M,pop=null,tip=null;
  const zl=h('span',{class:'zl'},'×1');   /* niveau de zoom tactile (rc.4) */
  const upd=()=>{prog.textContent=`${S.marks.length} / ${total} intersections relevées`;btn.disabled=S.mode==='debutant'?S.marks.length<total:S.marks.length<3;drawStrip()};
  const drawStrip=()=>{const w=sw.clientWidth||600,c=fitCanvas(strip,w,64);c.fillStyle='#f5efdc';c.fillRect(0,0,w,64);c.fillStyle='#bbb';c.fillRect(0,0,w,2);c.strokeStyle='#333';c.fillStyle='#222';c.font='700 11px system-ui';c.textAlign='center';
   c.beginPath();c.moveTo(10,10);c.lineTo(w-10,10);c.stroke();S.marks.forEach(m=>{const x=10+m.t*(w-20);c.strokeStyle=m.zs===m.z||S.mode==='expert'?'#222':'#c0392b';c.beginPath();c.moveTo(x,10);c.lineTo(x,26);c.stroke();c.save();c.translate(x,32);c.rotate(Math.PI/2.6);c.textAlign='left';c.fillText(m.zs,0,0);c.restore()});c.textAlign='left';c.fillStyle='#c0392b';c.fillText('A',2,60);c.textAlign='right';c.fillText('B',w-2,60)};
  M=mapCanvas({onDraw:z=>{zl.textContent='×'+fr(z,1)},after:(c,k)=>{c.strokeStyle='#c0392b';c.lineWidth=2.5;c.beginPath();c.moveTo(S.A.x*k,S.A.y*k);c.lineTo(S.B.x*k,S.B.y*k);c.stroke();
    S.cross.forEach((q,i)=>{const got=S.marks.find(m=>m.i===i);if(got){c.fillStyle=got.zs===got.z?'#2e9e4f':'#d9622b';c.beginPath();c.arc(q.x*k,q.y*k,5,0,7);c.fill()}else if(S.mode==='debutant'||S.revealed){c.strokeStyle='#2d86c8';c.lineWidth=2.5;c.beginPath();c.arc(q.x*k,q.y*k,9,0,7);c.stroke()}});
    [['A',S.A],['B',S.B]].forEach(([n,p])=>{c.fillStyle='#c0392b';c.beginPath();c.arc(p.x*k,p.y*k,7,0,7);c.fill();c.fillStyle='#fff';c.font='700 11px system-ui';c.textAlign='center';c.fillText(n,p.x*k,p.y*k+4)})}});
  const mark=(i,zs)=>{const q=S.cross[i];S.marks.push({i,t:q.t,s:q.s,z:q.z,zs});if(zs===q.z)info.className='fb ok',info.textContent=`✅ ${q.z} m`;else if(S.mode==='intermediaire'){S.marks.pop();info.className='fb ko';info.textContent=`❌ ${zs} m n'est pas l'altitude de cette courbe. Regarde la maîtresse la plus proche et compte les courbes.`;return}else info.textContent='';M.draw();upd()};
  on(M.cv,'pointerdown',e=>{if(e.pointerType==='touch')return;if(pop){pop.remove();pop=null}const p=M.pos(e),k=M.k(),A=S.A,B=S.B,dx=B.x-A.x,dy=B.y-A.y,L2=dx*dx+dy*dy,t=clamp(((p.x-A.x)*dx+(p.y-A.y)*dy)/L2,0,1),qx=A.x+dx*t,qy=A.y+dy*t;
   if(Math.hypot((qx-p.x)*k,(qy-p.y)*k)>26){info.className='fb';info.textContent='Touche le trait A–B, à l\'endroit où il coupe une courbe.';return}
   const tol=(S.mode==='debutant'?18:S.mode==='intermediaire'?13:9)/k/Math.sqrt(L2)*1; // tolérance en t
   let bi=-1,bd=1e9;S.cross.forEach((q,i)=>{const d=Math.abs(q.t-t);if(d<bd&&!S.marks.find(m=>m.i===i)){bd=d;bi=i}});
   if(bi<0||bd>tol*(Math.sqrt(L2)>0?1:1)*(1)){info.className='fb ko';info.textContent=S.mode==='expert'?'':'Pas d\'intersection ici.';return}
   if(S.mode==='debutant'){mark(bi,S.cross[bi].z);return}
   const r=M.box.getBoundingClientRect();pop=h('div',{class:'pop',style:`left:${clamp(e.clientX-r.left-60,4,r.width-270)}px;top:${clamp(e.clientY-r.top+14,4,r.height-120)}px;max-height:150px;overflow:auto`},h('b',{style:'width:100%;font-size:.8rem'},'Altitude de cette courbe ?'),...levels.map(z=>h('button',{onclick:()=>{pop.remove();pop=null;mark(bi,z)}},z)));M.box.append(pop)});
  /* ---- tactile (rc.4) : mêmes règles pédagogiques, cibles plus grandes, ambiguïté signalée au lieu d'être tranchée au hasard ;
     l'altitude n'est JAMAIS affichée avant la réponse de l'élève (la bulle reprend le message déjà donné sous la carte). ---- */
  const bubble=(txt,cls,q)=>{if(tip){tip.remove();tip=null}if(!txt)return;const {w}=M.size();tip=h('div',{class:'tapfb '+(cls||''),role:'status',style:`left:${clamp(q.x-110,4,Math.max(4,w-224))}px;top:${Math.max(4,q.y-58)}px`},txt);M.box.append(tip);const t=tip;setTimeout(()=>{t.remove();if(tip===t)tip=null},2600)};
  const pickTouch=(p,q,{precise})=>{if(pop){pop.remove();pop=null}
   const f=precise?Math.min(M.zoom()*3,12)/M.zoom():1,k=M.k()*f,A=S.A,B=S.B,dx=B.x-A.x,dy=B.y-A.y,L2=dx*dx+dy*dy,L=Math.sqrt(L2),t=clamp(((p.x-A.x)*dx+(p.y-A.y)*dy)/L2,0,1),qx=A.x+dx*t,qy=A.y+dy*t;
   if(Math.hypot((qx-p.x)*k,(qy-p.y)*k)>(precise?26:30)){bubble('Touche le trait A–B, à l\'endroit où il coupe une courbe.','',q);return}
   const tolPx=Math.max(S.mode==='debutant'?18:S.mode==='intermediaire'?13:9,precise?10:22),tol=tolPx/k/L,gap=precise?8:16;   // cible ≥ 44 px au doigt ; sous la loupe, le réticule vise à ~2 px près
   const cand=S.cross.map((c,i)=>({i,d:Math.abs(c.t-t),t:c.t})).filter(c=>!S.marks.find(m=>m.i===c.i)).sort((a,b)=>a.d-b.d);
   if(!cand.length||cand[0].d>tol){bubble(S.mode==='expert'?'':'Pas d\'intersection ici.','ko',q);return}
   if(cand[1]&&cand[1].d<=tol&&Math.abs(cand[1].t-cand[0].t)*L*k<gap){bubble(precise?'Courbes encore trop serrées : zoome d\'abord avec deux doigts (ou +), puis reprends la loupe.':'Deux courbes très proches : garde le doigt appuyé pour la loupe, ou zoome avec deux doigts.','',q);return}
   const bi=cand[0].i;
   if(S.mode==='debutant'){mark(bi,S.cross[bi].z);bubble(info.textContent,/\bok\b/.test(info.className)?'ok':/\bko\b/.test(info.className)?'ko':'',q);return}
   const {w,hh}=M.size();pop=h('div',{class:'pop',style:`left:${clamp(q.x-60,4,Math.max(4,w-264))}px;top:4px;max-height:${Math.min(150,hh-8)}px;overflow:auto`},h('b',{style:'width:100%;font-size:.8rem'},'Altitude de cette courbe ?'),...levels.map(z=>h('button',{onclick:()=>{pop.remove();pop=null;mark(bi,z);bubble(info.textContent,/\bok\b/.test(info.className)?'ok':/\bko\b/.test(info.className)?'ko':'',q)}},z)));M.box.append(pop);
   pop.style.top=clamp(q.y+14,4,Math.max(4,hh-pop.offsetHeight-4))+'px'};
  cleanup.push(attachTouch(M,{on,select:pickTouch}));
  const zb=(t,lab,f)=>h('button',{type:'button','aria-label':lab,onclick:f},t);
  M.box.classList.add('touchz');M.box.append(h('div',{class:'zctl'},zb('+','Zoomer',()=>M.zoomAt(M.zoom()*1.5)),zb('−','Dézoomer',()=>M.zoomAt(M.zoom()/1.5)),zb('1:1','Carte entière',()=>M.zoomAt(1)),zl));
  document.body.classList.add('gc-survey');cleanup.push(()=>document.body.classList.remove('gc-survey'));
  /* écran tactile étroit : après l'arrivée sur l'étape, faire remonter la carte juste assez pour qu'elle ne soit pas sous la barre d'onglets */
  if(matchMedia('(pointer: coarse)').matches)setTimeout(()=>{const r=M.box.getBoundingClientRect(),tabs=document.querySelector('.tabs'),tb=tabs&&getComputedStyle(tabs).display!=='none'?tabs.getBoundingClientRect().height:0,bot=innerHeight-tb-8;const y=scrollY,tg=Math.max(0,Math.min(r.bottom+y-bot,r.top+y-70));if(r.bottom>bot||y>tg)window.scrollTo({top:tg,behavior:'instant'})},60);   // position absolue : interrompt le défilement doux vers le haut lancé par render()
  const btn=h('button',{class:'btn',onclick:()=>{S.step=4;render()}},'Passer au papier →');
  view.append(stepper(),coach('Place la bande de papier le long de A–B : <b>touche chaque point où le trait coupe une courbe</b> (cercles bleus). Les altitudes se déduisent des courbes maîtresses cotées et de l\'équidistance de <b>'+S.eq+' m</b>.'),M.box,h('p',{class:'mute touchhint'},'📱 Deux doigts : zoomer et déplacer la carte · doigt maintenu : loupe de précision.'),h('p',{},prog),sw,info,h('div',{class:'tools'},h('button',{class:'btn sec sm',onclick:()=>{S.hints+=3;S.revealed=true;toast('Intersections révélées (−3 pts)');M.draw()}},'💡 Indice : montrer les intersections'),h('button',{class:'btn ghost sm',onclick:()=>{S.step=2;render()}},'← Changer le trait'),h('span',{class:'sp'}),btn));upd()}

 /* ---------- étape 4 : papier ---------- */
 const ev=()=>hs()/S.vm;
 const paperGeom=()=>paperGeometry(SU());
 function stepPaper(){view.innerHTML='';const ch=paperChoices({dem:S.dem,A:S.A,B:S.B,eq:S.eq,mode:S.mode}),{lo,hi,rel,opts,rec}=ch;
  if(!S.paperSet){S.vm=ch.vm;S.z0=ch.z0}
  const selV=h('select',{},...opts.map(v=>h('option',{value:v,selected:v===S.vm},`1 cm = ${fr(v,1)} m  (×${fr(hs()/v,1)})`))),zOpts=ch.zOpts;
  const selZ=h('select',{},...zOpts.map(z=>h('option',{value:z,selected:z===S.z0},z+' m'))),msg=h('div',{class:'fb'}),prev=h('canvas',{style:'width:100%;border:2px solid var(--line);border-radius:12px'});
  const upd=()=>{S.vm=+selV.value;S.z0=+selZ.value;S.paperSet=true;const g=paperGeom(),{fill,hcm,ok}=checkPaper(SU());msg.className='fb '+(ok?'ok':'ko');msg.innerHTML=`Papier : ${fr(g.Wmm/10,1)} × ${fr(hcm,1)} cm · exagération ×${fr(hs()/S.vm,1)} · le profil occupera ${Math.round(fill*100)} % de la hauteur. `+(ok?'👍 Bon choix.':(hcm>24?'Trop haut pour la feuille : augmente les m par cm.':fill<.35?'Profil trop aplati : diminue les m par cm.':S.z0>lo?'L\'origine est AU-DESSUS du point le plus bas !':'Origine trop basse : papier gaspillé.'));
   const w=prev.parentNode?prev.parentNode.clientWidth:500,c=fitCanvas(prev,Math.max(w,280),Math.max(w,280)*g.Hmm/g.Wmm);const sc=Math.max(w,280)/g.Wmm;c.fillStyle='#fff7e0';c.fillRect(0,0,9999,9999);paintPaper(c,g,sc,0,0,{light:true});c.strokeStyle='#d9622b';c.lineWidth=2;c.beginPath();g.P.forEach((p,i)=>{const x=(PAD.l+p.s/hs()*10)*sc,y=(PAD.t+(g.zTop-p.z)/S.vm*10)*sc;i?c.lineTo(x,y):c.moveTo(x,y)});c.setLineDash([4,4]);if(S.mode==='debutant')c.stroke();c.setLineDash([])};
  selV.onchange=upd;selZ.onchange=upd;
  view.append(stepper(),coach(`Le profil va de <b>${Math.round(lo)} m</b> à <b>${Math.round(hi)} m</b> (dénivelée ${Math.round(rel)} m). Échelle des longueurs imposée : <b>1 cm = ${fr(hs(),0)} m</b>. Choisis l'échelle des hauteurs (le profil doit occuper ~⅔ de la hauteur) et l'<b>origine</b> : un multiple de l'équidistance juste sous le point le plus bas.`),h('div',{class:'card'},h('div',{class:'ctrl'},h('label',{},'Échelle des hauteurs ',selV),h('label',{},'Origine des altitudes ',selZ)),msg,prev,h('div',{class:'row',style:'margin-top:10px'},h('button',{class:'btn ghost sm',onclick:()=>{S.step=3;render()}},'← Relevé'),h('span',{class:'sp'}),h('button',{class:'btn sec',onclick:()=>printSheet()},'🖨️ Imprimer (carte + papier)'),h('button',{class:'btn',onclick:()=>{S.step=5;render()}},'Commencer le tracé →'))));requestAnimationFrame(upd)}
 /* peinture du papier millimétré (c, géométrie, px/mm, décalage) */
 function paintPaper(c,g,sc,ox,oy,o={}){const X=mm=>mm*sc+ox,Y=mm=>mm*sc+oy,W=g.Wmm,H=g.Hmm;c.fillStyle='#fffaf0';c.fillRect(X(0),Y(0),W*sc,H*sc);
  const vis={x0:Math.max(0,Math.floor(-ox/sc)),x1:Math.min(W,Math.ceil((c.canvas.width/(window.devicePixelRatio>1?Math.min(window.devicePixelRatio,2.5):1)-ox)/sc)),y0:Math.max(0,Math.floor(-oy/sc)),y1:H};
  for(let m=0;m<=W;m++){const big=m%10===0,mid=m%5===0;if(sc<1.6&&!mid)continue;c.strokeStyle=big?'rgba(214,110,70,.75)':mid?'rgba(214,110,70,.45)':'rgba(214,110,70,.2)';c.lineWidth=big?1:.6;c.beginPath();c.moveTo(X(m),Y(0));c.lineTo(X(m),Y(H));c.stroke()}
  for(let m=0;m<=H;m++){const big=m%10===0,mid=m%5===0;if(sc<1.6&&!mid)continue;c.strokeStyle=big?'rgba(214,110,70,.75)':mid?'rgba(214,110,70,.45)':'rgba(214,110,70,.2)';c.lineWidth=big?1:.6;c.beginPath();c.moveTo(X(0),Y(m));c.lineTo(X(W),Y(m));c.stroke()}
  const yz=z=>PAD.t+(g.zTop-z)/S.vm*10,Lmm=LCM()*10;c.strokeStyle='#222';c.lineWidth=2;c.beginPath();c.moveTo(X(PAD.l),Y(yz(g.zTop)));c.lineTo(X(PAD.l),Y(yz(S.z0)));c.lineTo(X(PAD.l+Lmm),Y(yz(S.z0)));c.lineTo(X(PAD.l+Lmm),Y(yz(g.zTop)));c.stroke();
  c.fillStyle='#222';c.font=`700 ${clamp(sc*3,9,14)}px system-ui`;c.textAlign='right';const lab=Math.max(S.eq,Math.ceil(12/(S.eq/S.vm*10*sc))*S.eq);for(let z=S.z0;z<=g.zTop;z+=S.eq){const y=Y(yz(z));c.strokeStyle='#222';c.lineWidth=1;c.beginPath();c.moveTo(X(PAD.l-2),y);c.lineTo(X(PAD.l+2),y);c.stroke();if(((z-S.z0)/S.eq)%Math.round(lab/S.eq)===0)c.fillText(z,X(PAD.l-3),y+4)}
  c.textAlign='center';const stepCm=Math.ceil(24/(10*sc));for(let cm=0;cm<=LCM()+.01;cm+=stepCm){const x=X(PAD.l+cm*10);c.beginPath();c.moveTo(x,Y(yz(S.z0)-1));c.lineTo(x,Y(yz(S.z0)+2));c.stroke();c.fillText(fr(cm*hs(),0)+' m',x,Y(yz(S.z0)+8))}
  c.font=`700 ${clamp(sc*3.4,10,15)}px system-ui`;c.fillStyle='#c0392b';c.textAlign='center';c.fillText('A',X(PAD.l),Y(PAD.t-3));c.fillText('B',X(PAD.l+Lmm),Y(PAD.t-3))}

 const toMm=(s,z,g)=>SU().toMm(s,z,g),fromMm=(x,y,g)=>SU().fromMm(x,y,g);

 function printSheet(){const g=paperGeom(),old=document.getElementById('printsheet');if(old)old.remove();const sheet=h('div',{id:'printsheet'});
  const mc=document.createElement('canvas');mc.width=1600;mc.height=1100;const c=mc.getContext('2d'),k=drawMap(c,S.dem,1600,1100,{eq:S.eq,shade:false,rivers:true,spots:true,labels:true});c.strokeStyle='#c0392b';c.lineWidth=5;c.beginPath();c.moveTo(S.A.x*k,S.A.y*k);c.lineTo(S.B.x*k,S.B.y*k);c.stroke();c.fillStyle='#c0392b';c.font='700 36px system-ui';c.fillText('A',S.A.x*k-30,S.A.y*k);c.fillText('B',S.B.x*k+10,S.B.y*k);
  const pc=document.createElement('canvas'),sc=6;pc.width=Math.round(g.Wmm*sc);pc.height=Math.round(g.Hmm*sc);const pg=pc.getContext('2d');paintPaper(pg,g,sc,0,0);
  sheet.append(h('h2',{},'TP – Profil topographique'),h('p',{},`Échelle 1/${S.scaleN.toLocaleString('fr')} · équidistance ${S.eq} m · échelle des hauteurs : 1 cm = ${fr(S.vm,1)} m · origine ${S.z0} m · code ${code()}`),h('img',{src:mc.toDataURL('image/png'),style:'width:160mm;height:110mm;border:1px solid #000'}),h('p',{},'Papier millimétré (échelles imprimées à 100 % — vérifier « taille réelle » dans la boîte d\'impression) :'),h('img',{src:pc.toDataURL('image/png'),style:`width:${g.Wmm}mm;height:${g.Hmm}mm`}));document.body.append(sheet);setTimeout(()=>{window.print();setTimeout(()=>sheet.remove(),500)},200)}
 /* ---------- étape 5 : tracé ---------- */
 function stepDraw(){view.innerHTML='';const g=paperGeom(),box=h('div',{class:'cvw',style:'background:#fffaf0'}),cv=h('canvas'),ro={x:0,y:0};box.append(cv);
  const hud=h('div',{class:'hud'},h('span',{class:'chip',id:'rd',style:S.mode==='expert'?'display:none':''},'—'));box.append(hud);let w=0,hh=0,sc=1,cursor=null,drag=-1,animT=0,erase=false;
  const targets=()=>targetsFrom(S.marks);
  const pts=()=>[...S.pts].sort((a,b)=>a.s-b.s);
  const lay=()=>{w=box.clientWidth||600;sc=Math.min(w/g.Wmm,(window.innerHeight*.62)/g.Hmm)*S.zoom;hh=Math.max(260,Math.min(window.innerHeight*.7,g.Hmm*Math.min(w/g.Wmm,(window.innerHeight*.62)/g.Hmm)*S.zoom));};
  const draw=(ts)=>{lay();const c=fitCanvas(cv,w,hh),base=Math.min(w/g.Wmm,(window.innerHeight*.62)/g.Hmm);c.fillStyle='#e9e2cf';c.fillRect(0,0,w,hh);const ox=S.zoom<=1?(w-g.Wmm*sc)/2:S.pan.x,oy=S.zoom<=1?0:S.pan.y;ro.x=ox;ro.y=oy;
   paintPaper(c,g,sc,ox,oy);const X=mm=>mm*sc+ox,Y=mm=>mm*sc+oy;
   const T=targets(),yBase=PAD.t+(g.zTop-S.z0)/S.vm*10;
   // bande de papier posée sur l'axe A–B
   c.fillStyle='rgba(255,255,255,.7)';c.fillRect(X(PAD.l),Y(yBase+1),LCM()*10*sc,6*sc);c.fillStyle='#222';c.font=`700 ${clamp(sc*2.6,8,12)}px system-ui`;c.textAlign='center';
   T.forEach(t=>{const x=X(PAD.l+t.s/hs()*10);c.strokeStyle='#c0392b';c.lineWidth=1.6;c.beginPath();c.moveTo(x,Y(yBase));c.lineTo(x,Y(yBase+3));c.stroke();if(sc>2.2)c.fillText(t.zs,x,Y(yBase+5.6))});
   if(S.mode!=='expert'){c.setLineDash([4,4]);c.strokeStyle='rgba(45,134,200,.55)';c.lineWidth=1;T.forEach(t=>{const x=X(PAD.l+t.s/hs()*10);c.beginPath();c.moveTo(x,Y(yBase));c.lineTo(x,Y(PAD.t));c.stroke()});c.setLineDash([])}
   if(S.mode==='debutant'){const placed=pts();T.forEach(t=>{if(placed.some(p=>Math.abs(p.s-t.s)<hs()*.12&&Math.abs(p.z-t.z)<S.eq*.2))return;const m=toMm(t.s,t.zs,g);c.strokeStyle='#2d86c8';c.lineWidth=2;c.beginPath();c.arc(X(m.x),Y(m.y),Math.max(6,sc*1.8),0,7);c.stroke()})}
   // trait au crayon
   const P=pts();if(P.length){const f=P.length>1?curveFn(P,S.smooth):null;c.strokeStyle='#3a3a3a';c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';c.beginPath();
    if(f){const n=Math.max(60,Math.round(P.at(-1).s/ (g.Wmm/200*hs()/10)));const prog=animT?Math.min(1,(ts-animT)/260):1;const last=P.at(-1).s,first=P[0].s,span=last-first,sStart=P.length>2?P[P.length-2].s:first;
     for(let i=0;i<=n;i++){const s=first+span*i/n,z=f(s),m=toMm(s,z,g);let x=X(m.x),y=Y(m.y);i?c.lineTo(x,y):c.moveTo(x,y);if(s>sStart+(last-sStart)*prog)break}}c.stroke();
    P.forEach(p=>{const m=toMm(p.s,p.z,g);c.strokeStyle='#000';c.lineWidth=1.4;c.beginPath();c.moveTo(X(m.x)-5,Y(m.y)-5);c.lineTo(X(m.x)+5,Y(m.y)+5);c.moveTo(X(m.x)+5,Y(m.y)-5);c.lineTo(X(m.x)-5,Y(m.y)+5);c.stroke()})}
   if(cursor){c.strokeStyle='rgba(192,57,43,.9)';c.lineWidth=1;c.beginPath();c.moveTo(cursor.px-14,cursor.py);c.lineTo(cursor.px+14,cursor.py);c.moveTo(cursor.px,cursor.py-14);c.lineTo(cursor.px,cursor.py+14);c.stroke();c.beginPath();c.arc(cursor.px,cursor.py,6,0,7);c.stroke()}
   if(animT&&ts-animT<300)requestAnimationFrame(draw)};
  const toData=(px,py)=>fromMm((px-ro.x)/sc,(py-ro.y)/sc,g);
  const upd=()=>{draw(performance.now());nb.textContent=`${S.pts.length} point${S.pts.length>1?'s':''}`};
  const addPt=(px,py)=>{let d=toData(px,py);if(d.s<-hs()*.2||d.s>LM()+hs()*.2){toast('Hors du papier');return}d.s=clamp(d.s,0,LM());
   if(S.mode==='debutant'){const T=targets();let best=null,bd=1e9;T.forEach(t=>{const dd=Math.hypot((t.s-d.s)/hs()*10,(t.zs-d.z)/S.vm*10);if(dd<bd){bd=dd;best=t}});if(best&&bd<4){d={s:best.s,z:best.zs}}}
   if(S.pts.some(p=>Math.abs(p.s-d.s)<hs()*.02))S.pts=S.pts.filter(p=>Math.abs(p.s-d.s)>=hs()*.02);S.pts.push(d);S.redo=[];animT=performance.now();upd()};
  const nearPt=(px,py)=>S.pts.findIndex(p=>{const m=toMm(p.s,p.z,g);return Math.hypot(m.x*sc+ro.x-px,m.y*sc+ro.y-py)<14});
  let panStart=null,moved=0;
  on(cv,'pointerdown',e=>{const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;cv.setPointerCapture(e.pointerId);moved=0;
   if(S.tool==='pan'){panStart={x:e.clientX-ro.x,y:e.clientY-ro.y};return}
   const i=nearPt(px,py);if(erase){if(i>=0){S.pts.splice(i,1);upd()}return}if(i>=0){drag=i;return}
   cursor={px,py:py-(e.pointerType==='touch'?38:0)};draw(performance.now())});
  on(cv,'pointermove',e=>{const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;moved++;
   if(S.tool==='pan'&&panStart){S.pan={x:e.clientX-panStart.x,y:e.clientY-panStart.y};draw(performance.now());return}
   const off=e.pointerType==='touch'?38:0;if(drag>=0){const d=toData(px,py-off);d.s=clamp(d.s,0,LM());S.pts[drag]=d;upd();return}
   if(cursor||e.pointerType!=='touch'){cursor={px,py:py-(e.buttons||e.pointerType!=='touch'?off:0)};if(e.pointerType==='touch'&&!e.buttons)cursor=null;draw(performance.now())}
   if(S.mode!=='expert'){const d=toData(px,py-off);hud.querySelector('#rd').textContent=`x = ${fr(clamp(d.s,0,LM()),0)} m · z = ${fr(d.z,0)} m`}});
  on(cv,'pointerup',e=>{if(S.tool==='pan'){panStart=null;return}if(drag>=0){drag=-1;S.redo=[];upd();return}if(cursor&&!erase){const{px,py}=cursor;cursor=null;addPt(px,py)}});
  on(cv,'pointerleave',e=>{if(e.pointerType==='mouse'){cursor=null;draw(performance.now())}});
  on(cv,'wheel',e=>{e.preventDefault();setZoom(S.zoom*(e.deltaY<0?1.15:.87))},{passive:false});
  const setZoom=z=>{const old=S.zoom;S.zoom=clamp(z,1,5);if(S.zoom>1&&old<=1){S.pan={x:ro.x,y:ro.y}}upd()};
  cv.setAttribute('tabindex','0');cv.setAttribute('role','application');cv.setAttribute('aria-label','Feuille de papier millimétré. Flèches : déplacer le réticule, Entrée : poser un point, Retour arrière : annuler.');
  let kx=null;on(cv,'keydown',e=>{const st=(e.shiftKey?5:1)*sc;if(!kx)kx={px:w/2,py:hh/2};if(e.key==='ArrowLeft')kx.px-=st;else if(e.key==='ArrowRight')kx.px+=st;else if(e.key==='ArrowUp')kx.py-=st;else if(e.key==='ArrowDown')kx.py+=st;else if(e.key==='Enter'){addPt(kx.px,kx.py);e.preventDefault();return}else if(e.key==='Backspace'){if(S.pts.length){S.redo.push(S.pts.pop());upd()}e.preventDefault();return}else return;e.preventDefault();cursor={px:kx.px,py:kx.py};const d=toData(kx.px,kx.py);hud.querySelector('#rd').textContent=`x = ${fr(clamp(d.s,0,LM()),0)} m · z = ${fr(d.z,0)} m`;hud.querySelector('#rd').style.display='';draw(performance.now())});
  const sIn=h('input',{type:'text',inputmode:'decimal','aria-label':'Distance depuis A en mètres',placeholder:'x (m)',style:'width:90px'}),zIn=h('input',{type:'text',inputmode:'decimal','aria-label':'Altitude en mètres',placeholder:'z (m)',style:'width:90px'});
  const addNum=()=>{const sv=parseNum(sIn.value),zv=parseNum(zIn.value);if(isNaN(sv)||isNaN(zv)){toast('Saisis x et z en mètres');return}const m=toMm(clamp(sv,0,LM()),zv,g);addPt(m.x*sc+ro.x,m.y*sc+ro.y);sIn.value=zIn.value=''};
  const nb=h('span',{class:'pill'},'0 point'),tb=(t,f,cls='btn sec sm')=>h('button',{class:cls,onclick:f},t);
  const penBtn=tb('✏️ Crayon',()=>{S.tool='pen';erase=false;sync()}),panBtn=tb('✋ Déplacer',()=>{S.tool='pan';erase=false;sync()}),erBtn=tb('🧽 Gomme',()=>{S.tool='pen';erase=!erase;sync()}),smBtn=tb('〰️ Lisser',()=>{S.smooth=!S.smooth;sync();upd()});
  const sync=()=>{penBtn.classList.toggle('on',S.tool==='pen'&&!erase);panBtn.classList.toggle('on',S.tool==='pan');erBtn.classList.toggle('on',erase);smBtn.textContent=S.smooth?'〰️ Main levée':'📏 Segments';cv.style.cursor=S.tool==='pan'?'grab':'crosshair'};
  const fin=h('button',{class:'btn acc',onclick:()=>{const P=pts();if(P.length<3){toast('Place au moins 3 points');return}if(P[0].s>LM()*.1||P.at(-1).s<LM()*.9){toast('Ton profil doit couvrir tout le trait, de A à B');return}S.res=evaluate();S.step=6;render()}},'Terminer et corriger ✓');
  const hint=tb('💡 Indice',()=>{const T=targets(),P=pts();const miss=firstMissing(T,P,hs(),S.eq);S.hints+=2;if(miss){const m=toMm(miss.s,miss.zs,g);toast(`Il manque un point vers x = ${fr(miss.s,0)} m, altitude ${miss.zs} m`)}else toast('Tous les repères sont placés : estime maintenant les sommets et les fonds de talweg entre deux points de même altitude.')},'btn sec sm');
  view.append(stepper(),coach('Reporte chaque repère de la bande sur le papier : <b>un clic = un point</b> (en mode tactile, le réticule est décalé au-dessus du doigt ; lâche pour poser). Cercles bleus = positions attendues. Pense aussi aux <b>sommets et fonds de talweg</b> entre deux points de même altitude !'),box,h('div',{class:'tools'},penBtn,erBtn,panBtn,smBtn,tb('↶',()=>{if(S.pts.length){S.redo.push(S.pts.pop());upd()}}),tb('↷',()=>{if(S.redo.length){S.pts.push(S.redo.pop());upd()}}),tb('＋',()=>setZoom(S.zoom*1.4)),tb('－',()=>setZoom(S.zoom/1.4)),nb),h('details',{},h('summary',{},'Saisie numérique (clavier, lecteur d\'écran, précision)'),h('div',{class:'tools'},sIn,zIn,tb('Ajouter le point',addNum))),h('div',{class:'tools'},h('button',{class:'btn ghost sm',onclick:()=>{S.step=4;render()}},'← Papier'),S.mode!=='expert'?hint:'',h('span',{class:'sp'}),fin));
  sync();const rz=new ResizeObserver(upd);rz.observe(box);cleanup.push(()=>rz.disconnect());upd()}

 /* ---------- évaluation ---------- */
 function evaluate(){return evaluateProfile(SU(),{pts:S.pts,smooth:S.smooth,marks:S.marks,cross:S.cross,hints:S.hints})}
 /* ---------- étape 6 : correction ---------- */
 function stepResult(){view.innerHTML='';const R=S.res,g=R.g,box=h('div',{class:'cvw'}),cv=h('canvas');box.append(cv);let t0=performance.now();
  const f=curveFn([...S.pts].sort((a,b)=>a.s-b.s),S.smooth),L=R.P.at(-1).s;
  const draw=ts=>{const w=box.clientWidth||600,sc=w/g.Wmm,hh=g.Hmm*sc,c=fitCanvas(cv,w,hh);paintPaper(c,g,sc,0,0);const X=mm=>mm*sc,prog=clamp((ts-t0)/1600,0,1),upto=L*prog;
   c.fillStyle='rgba(214,69,69,.28)';c.beginPath();let first=true;R.P.forEach(p=>{if(p.s>upto)return;const m=toMm(p.s,f(p.s),g);first?c.moveTo(X(m.x),X(m.y)):c.lineTo(X(m.x),X(m.y));first=false});[...R.P].reverse().forEach(p=>{if(p.s>upto)return;const m=toMm(p.s,p.z,g);c.lineTo(X(m.x),X(m.y))});c.fill();
   c.lineWidth=3;c.strokeStyle='#2e9e4f';c.beginPath();R.P.forEach((p,i)=>{if(p.s>upto)return;const m=toMm(p.s,p.z,g);i?c.lineTo(X(m.x),X(m.y)):c.moveTo(X(m.x),X(m.y))});c.stroke();
   c.strokeStyle='#d9622b';c.beginPath();R.P.forEach((p,i)=>{if(p.s>upto)return;const m=toMm(p.s,f(p.s),g);i?c.lineTo(X(m.x),X(m.y)):c.moveTo(X(m.x),X(m.y))});c.stroke();
   if(prog>=1){const m=toMm(R.maxS,f(R.maxS),g);c.strokeStyle='#d64545';c.lineWidth=2;c.beginPath();c.arc(X(m.x),X(m.y),12,0,7);c.stroke()}
   if(prog<1)requestAnimationFrame(draw)};requestAnimationFrame(draw);const ro2=new ResizeObserver(()=>draw(t0+9999));ro2.observe(box);cleanup.push(()=>ro2.disconnect());
  const mmErr=R.mae/S.vm*10,DG=diagnoseProfile(SU(),R,{pts:S.pts,smooth:S.smooth,marks:S.marks});
  DG.errorIds.forEach(addError);
  const diag=diagnosisLines(DG.findings,DG.errorIds,{byId});
  profileResult({score:R.score,mode:S.mode,mae:R.mae,type:S.type,eq:S.eq,code:code()});if(R.score>=85)confetti(50);
  const m=(v,l,u='')=>h('div',{class:'metric'},h('b',{},v+u),h('small',{},l));
  const hab=h('div',{class:'card'},h('h3',{},'🖋️ Habillage (bonus)'),h('p',{class:'mute'},'Complète les informations du cartouche du profil.'));
  const az=azimuth(S.B.x-S.A.x,-(S.B.y-S.A.y)),inpA=h('input',{type:'text',inputmode:'decimal'}),inpB=h('input',{type:'text',inputmode:'decimal'}),inpV=h('input',{type:'text',inputmode:'decimal'}),selD=h('select',{},...DIRS16.map(d=>h('option',{},d))),zA=sample(S.dem,S.A.x,S.A.y),zB=sample(S.dem,S.B.x,S.B.y),fbH=h('div',{class:'fb'});
  hab.append(h('div',{class:'ctrl'},h('label',{},'Direction A → B ',selD),h('label',{},'Altitude de A ',inpA,' m'),h('label',{},'Altitude de B ',inpB,' m'),h('label',{},'Échelle des hauteurs : 1 cm = ',inpV,' m')),h('button',{class:'btn sm',onclick:()=>{let ok=0;const di=Math.abs(DIRS16.indexOf(selD.value)-DIRS16.indexOf(dirName(az)));if(Math.min(di,16-di)<=1)ok++;if(Math.abs(parseNum(inpA.value)-zA)<=S.eq*.6)ok++;if(Math.abs(parseNum(inpB.value)-zB)<=S.eq*.6)ok++;if(Math.abs(parseNum(inpV.value)-S.vm)<.2)ok++;fbH.className='fb '+(ok===4?'ok':'ko');fbH.innerHTML=`${ok}/4 corrects — A ≈ ${fr(zA,0)} m, B ≈ ${fr(zB,0)} m, direction ${dirName(az)}, 1 cm = ${fr(S.vm,1)} m.`;if(ok===4){addXp(10,'habillage');}}},'Vérifier'),fbH);
  view.append(stepper(),h('div',{class:'card'},h('div',{class:'row'},h('div',{html:ring(R.score,110,'Score global')}),h('div',{class:'sp'},h('h2',{style:'margin:0'},R.score>=85?'Très bien !':R.score>=65?'Bon travail':'À retravailler'),h('p',{class:'mute'},`Mode ${MODES[S.mode][0]} · ${TYPES[S.type]} · code ${code()}${S.hints?` · indices : −${S.hints} pts`:''}`))),
   h('div',{class:'legendp'},h('span',{html:'<i style="background:#2e9e4f"></i>Profil exact'}),h('span',{html:'<i style="background:#d9622b"></i>Ton profil'}),h('span',{html:'<i style="background:rgba(214,69,69,.4)"></i>Erreur'})),box,
   h('div',{class:'metrics'},m(fr(R.mae,1),'Erreur moyenne',' m'),m(fr(mmErr,1),'soit sur le papier',' mm'),m(fr(R.max,0),'Erreur maximale',' m'),m(Math.round(R.precision),`Précision (±${fr(R.tol,0)} m)`,' %'),m(`${R.got}/${R.tot}`,'Intersections relevées'),m(Math.round(R.exs),'Extrema (sommets, talwegs)',' %')),
   h('div',{class:'box tip'},h('b',{class:'t'},'Diagnostic'),h('ul',{html:diag.map(d=>`<li>${d}</li>`).join('')}))),hab,
   h('div',{class:'row'},h('button',{class:'btn acc',onclick:()=>{newTerrain(pick(Object.keys(TYPES)),Math.floor(Math.random()*1e6)+1,S.scaleN);S.step=2;S.paperSet=false;render()}},'🎲 Nouvel exercice'),h('button',{class:'btn sec',onclick:()=>{S.pts=[];S.redo=[];S.hints=0;S.step=5;render()}},'↻ Refaire ce profil'),h('button',{class:'btn blue',onclick:()=>{shared.handoff={opts:{type:S.type,seed:S.seed,scaleN:S.scaleN},A:S.A,B:S.B};location.hash='#/labo/relief'}},'🏔️ Voir en 3D avec mon trait'),h('a',{class:'btn ghost',href:'#/portfolio'},'Mon portfolio')))}
 function render(){cleanup.forEach(f=>f());cleanup=[];({1:stepSetup,2:stepLine,3:stepSurvey,4:stepPaper,5:stepDraw,6:stepResult})[S.step]();window.scrollTo({top:0})}
 if(shared.handoff&&shared.handoff.A){const hd=shared.handoff;shared.handoff=null;{const{type,seed,scaleN,...ex}=hd.opts;newTerrain(type,seed,scaleN,ex)}S.A=hd.A;S.B=hd.B;S.cross=crossings(S.dem,S.A,S.B,S.eq);S.step=3;toast('Terrain importé : relève les intersections de ton trait')}
 render();return()=>cleanup.forEach(f=>f())}
