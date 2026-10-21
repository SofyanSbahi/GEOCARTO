import {h,fr,DIRS16,dirName,rng,pick,shuffle,fitCanvas,parseNum,clamp} from '../core/util.js';
import {makeDem,autoEq,sample} from '../core/terrain.js';
import {drawMap} from '../core/draw.js';
import {svgSlope} from './svgs.js';
import {skill,addXp} from '../core/store.js';
import {shared} from '../core/shared.js';

export const W={};
/* ----- échelle ----- */
W.scale=el=>{el.innerHTML=`<h3>📏 Du papier au terrain</h3><div class="ctrl"><label>Distance sur la carte <input type="range" id="d" min="0.5" max="16" step="0.5" value="4"> <b id="dv"></b></label><label>Échelle 1/ <select id="n"><option>5000</option><option>10000</option><option>20000</option><option selected>25000</option><option>50000</option><option>100000</option><option>200000</option></select></label></div><div class="svgw"><svg viewBox="0 0 640 150" id="sv"></svg></div><div class="fb ok" id="r"></div><small>Formule : D = d × N. Exemple : 4 cm × 25 000 = 100 000 cm = 1 000 m.</small>`;
 const q=s=>el.querySelector(s),run=()=>{const d=+q('#d').value,N=+q('#n').value,D=d*N/100,kmv=D/1000;q('#dv').textContent=fr(d,1)+' cm';
  const cm=(640-60)/16,tk=Array.from({length:17},(_,i)=>`<line x1="${30+i*cm}" x2="${30+i*cm}" y1="30" y2="${i%5?42:50}" stroke="currentColor"/>${i%2?'':`<text x="${30+i*cm}" y="64" font-size="11" text-anchor="middle">${i}</text>`}`).join('');
  const gl=(N/100)/1000,units=Math.min(16,16),gt=Array.from({length:17},(_,i)=>`<text x="${30+i*cm}" y="136" font-size="11" text-anchor="middle" fill="var(--mute)">${fr(i*gl*1000>=1000?i*gl:i*gl*1000,i*gl*1000>=1000?1:0)}${i*gl*1000>=1000?' km':' m'}</text>`).filter((_,i)=>i%2===0).join('');
  q('#sv').innerHTML=`<text x="30" y="20" font-weight="800">Carte (cm)</text><g color="var(--ink)">${tk}</g><rect x="30" y="86" width="${d*cm}" height="14" rx="4" fill="#0f7b66"/><text x="${30+d*cm+8}" y="98" font-weight="800" fill="#0f7b66">${fr(d,1)} cm</text><text x="30" y="122" font-weight="800">Terrain</text>${gt}`;
  q('#r').textContent=`${fr(d,1)} cm sur la carte → ${D>=1000?fr(kmv,2)+' km':fr(D,0)+' m'} sur le terrain (1 cm = ${N/100>=1000?fr(N/1e5,1)+' km':fr(N/100,0)+' m'}).`};
 el.addEventListener('input',run);run()};
W.photocopy=el=>{el.innerHTML=`<h3>🖨️ Photocopie : l'échelle numérique ment</h3><div class="ctrl"><label>Réduction / agrandissement <input type="range" id="f" min="40" max="160" value="100"> <b id="fv">100 %</b></label></div><div class="svgw"><svg viewBox="0 0 640 190" id="sv"></svg></div><div class="fb" id="r"></div>`;
 const q=s=>el.querySelector(s),run=()=>{const f=+q('#f').value/100,w=300*f,hh=120*f;q('#fv').textContent=Math.round(f*100)+' %';
  q('#sv').innerHTML=`<rect x="20" y="20" width="${w}" height="${hh}" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><text x="${20+w/2}" y="${20+hh/2-8}" text-anchor="middle" font-weight="800" font-size="${Math.max(11,15*f)}">Échelle numérique</text><text x="${20+w/2}" y="${20+hh/2+14}" text-anchor="middle" font-size="${Math.max(11,16*f)}" font-weight="800" fill="var(--acc)">1 / 25 000 (inchangé !)</text>
   <rect x="${30}" y="${20+hh-22*f}" width="${100*f}" height="${6*f}" fill="#0f7b66"/><text x="${30}" y="${20+hh-28*f}" font-size="${Math.max(10,12*f)}" fill="#0f7b66" font-weight="800">1 km</text>
   <text x="360" y="60" font-weight="800">Échelle réelle de la copie :</text><text x="360" y="92" font-size="26" font-weight="900" fill="${Math.abs(f-1)<.01?'var(--ok)':'var(--ko)'}">1 / ${fr(25000/f,0).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}</text><text x="360" y="124" font-size="13">Le segment gradué « 1 km » suit la carte : il reste juste.</text>`;
  q('#r').className='fb '+(Math.abs(f-1)<.01?'ok':'ko');q('#r').textContent=Math.abs(f-1)<.01?'Copie à 100 % : tout est cohérent.':'Après copie, seule l\'échelle graphique reste exacte. Mesure toujours avec elle !'};
 el.addEventListener('input',run);run()};
/* ----- rose des vents interactive ----- */
W.rose=el=>{let target=0,okn=0,n=0;
 el.innerHTML=`<h3>🧭 Lire une direction</h3><p class="mute">De A vers B, quelle est la direction (rose à 16 secteurs) ? Convention française : <b>O</b> = Ouest.</p><div class="row"><div class="svgw" style="width:min(300px,100%)"><svg viewBox="0 0 300 300" id="sv"></svg></div><div class="sp"><div class="seg" id="ans" style="max-width:100%"></div><div class="fb" id="r"></div><button class="btn sm sec" id="nx">Autre segment</button><p class="score" id="sc"></p></div></div>`;
 const q=s=>el.querySelector(s);
 const draw=()=>{const R=130;let s='';DIRS16.forEach((d,i)=>{const a=i*22.5*Math.PI/180,L=i%4===0?R:i%2===0?R*.8:R*.62;s+=`<line x1="150" y1="150" x2="${150+L*Math.sin(a)}" y2="${150-L*Math.cos(a)}" stroke="var(--line)" stroke-width="${i%4===0?3:1.5}"/><text x="${150+(R+12)*Math.sin(a)}" y="${153-(R+12)*Math.cos(a)}" font-size="${i%4===0?15:10}" text-anchor="middle" font-weight="${i%4===0?800:600}">${d}</text>`});
  const a=target*Math.PI/180,x2=150+95*Math.sin(a),y2=150-95*Math.cos(a);s+=`<circle cx="150" cy="150" r="5" fill="#c0392b"/><line x1="150" y1="150" x2="${x2}" y2="${y2}" stroke="#c0392b" stroke-width="4" marker-end="url(#h)"/><text x="138" y="170" fill="#c0392b" font-weight="800">A</text><text x="${x2+8*Math.sin(a)}" y="${y2-8*Math.cos(a)}" fill="#c0392b" font-weight="800" text-anchor="middle">B</text><defs><marker id="h" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#c0392b"/></marker></defs>`;q('#sv').innerHTML=s};
 const nw=()=>{target=Math.floor(Math.random()*360);draw();q('#r').textContent='';q('#ans').querySelectorAll('button').forEach(b=>b.disabled=false)};
 q('#ans').innerHTML=DIRS16.map(d=>`<button>${d}</button>`).join('');
 q('#ans').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const ok=b.textContent===dirName(target);n++;if(ok)okn++;skill('orientation',ok);b.classList.toggle('on',ok);
  q('#r').className='fb '+(ok?'ok':'ko');q('#r').innerHTML=ok?`✅ Oui : azimut ≈ ${Math.round(target)}° → ${dirName(target)}.`:`❌ C'est <b>${dirName(target)}</b> (azimut ≈ ${Math.round(target)}°, mesuré depuis le Nord dans le sens horaire).`;q('#sc').textContent=`${okn}/${n}`;q('#ans').querySelectorAll('button').forEach(x=>x.disabled=true);if(ok)addXp(3)};
 q('#nx').onclick=nw;nw()};
W.norths=el=>{el.innerHTML=`<h3>🧲 Les trois « Nord »</h3><div class="ctrl"><label>Déclinaison magnétique d <input type="range" id="d" min="-12" max="12" step="0.5" value="-2.5"> <b id="dv"></b></label><label>Convergence (N Lambert) γ <input type="range" id="g" min="-3" max="3" step="0.1" value="1.2"> <b id="gv"></b></label></div><div class="svgw"><svg viewBox="0 0 400 260" id="sv"></svg></div><div class="fb ok" id="r"></div><small>1 grade = 0,9° (400 grades = 360°). Les cartes anciennes donnent la déclinaison en grades et sa variation annuelle.</small>`;
 const q=s=>el.querySelector(s),run=()=>{const d=+q('#d').value,g=+q('#g').value;q('#dv').textContent=fr(d,1)+'°';q('#gv').textContent=fr(g,1)+'°';
  const arrow=(a,c,t,l)=>{const r=a*Math.PI/180;return `<line x1="200" y1="220" x2="${200+l*Math.sin(r)}" y2="${220-l*Math.cos(r)}" stroke="${c}" stroke-width="4" stroke-linecap="round"/><text x="${200+(l+16)*Math.sin(r)}" y="${220-(l+16)*Math.cos(r)}" fill="${c}" font-weight="800" text-anchor="middle" font-size="13">${t}</text>`};
  q('#sv').innerHTML=arrow(0,'#222','NG',170)+arrow(d,'#c0392b','NM',150)+arrow(g,'#2d86c8','N Lambert',130)+`<circle cx="200" cy="220" r="6" fill="var(--ink)"/>`;
  q('#r').textContent=`Un azimut géographique de 90° (plein Est) se lit ${fr((90-d+360)%360,1)}° à la boussole (NM). Déclinaison ${d<0?'Ouest':'Est'}.`};
 el.addEventListener('input',run);run()};
/* ----- globe ----- */
W.globe=el=>{el.innerHTML=`<h3>🌍 Latitude et longitude</h3><div class="ctrl"><label>Latitude φ <input type="range" id="la" min="-90" max="90" value="30"> <b id="lav"></b></label><label>Longitude λ <input type="range" id="lo" min="-180" max="180" value="-20"> <b id="lov"></b></label><label>Vue centrée sur <input type="range" id="c" min="-180" max="180" value="-20"></label><label><input type="checkbox" id="an"> Afficher l'antipode</label></div><div class="svgw"><svg viewBox="0 0 320 320" id="sv" style="max-width:360px"></svg></div><div class="fb ok" id="r"></div>`;
 const q=s=>el.querySelector(s),R=140,cx=160,cy=160,p0=20*Math.PI/180;
 const proj=(lat,lon,l0)=>{const f=lat*Math.PI/180,l=(lon-l0)*Math.PI/180,vis=Math.sin(p0)*Math.sin(f)+Math.cos(p0)*Math.cos(f)*Math.cos(l)>0;return{x:cx+R*Math.cos(f)*Math.sin(l),y:cy-R*(Math.cos(p0)*Math.sin(f)-Math.sin(p0)*Math.cos(f)*Math.cos(l)),vis}};
 const line=(pts)=>{let d='',pen=false;for(const p of pts){if(p.vis){d+=(pen?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1);pen=true}else pen=false}return d};
 const run=()=>{const la=+q('#la').value,lo=+q('#lo').value,l0=+q('#c').value;q('#lav').textContent=Math.abs(la)+'° '+(la>=0?'N':'S');q('#lov').textContent=Math.abs(lo)+'° '+(lo>=0?'E':'O');
  let s=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="color-mix(in srgb,var(--blue) 18%,var(--card))" stroke="var(--ink)" stroke-width="2"/>`;
  for(let l=-180;l<180;l+=30){const pts=[];for(let f=-90;f<=90;f+=3)pts.push(proj(f,l,l0));s+=`<path d="${line(pts)}" fill="none" stroke="${l===0?'#c0392b':'var(--line)'}" stroke-width="${l===0?2.4:1.2}"/>`}
  for(let f=-60;f<=60;f+=30){const pts=[];for(let l=-180;l<=180;l+=3)pts.push(proj(f,l,l0));s+=`<path d="${line(pts)}" fill="none" stroke="${f===0?'#0f7b66':'var(--line)'}" stroke-width="${f===0?2.4:1.2}"/>`}
  const P=proj(la,lo,l0);if(P.vis)s+=`<circle cx="${P.x}" cy="${P.y}" r="6" fill="#d9622b" stroke="#fff" stroke-width="2"/><text x="${P.x+9}" y="${P.y-8}" font-weight="800" fill="#d9622b">P</text>`;
  if(q('#an').checked){let al=lo+180;if(al>180)al-=360;const A=proj(-la,al,l0);if(A.vis)s+=`<circle cx="${A.x}" cy="${A.y}" r="6" fill="#2d86c8" stroke="#fff" stroke-width="2"/><text x="${A.x+9}" y="${A.y-8}" font-weight="800" fill="#2d86c8">P′</text>`}
  s+=`<text x="${cx}" y="14" text-anchor="middle" font-size="12" fill="var(--mute)">Rouge : méridien de Greenwich · Vert : Équateur</text>`;q('#sv').innerHTML=s;
  let al=lo+180;if(al>180)al-=360;q('#r').innerHTML=`P (${fr(lo,0)}° ; ${fr(la,0)}°) · antipode P′ = (${fr(al,0)}° ; ${fr(-la,0)}°) : latitude opposée, longitude ± 180°. · 1° de latitude ≈ 111 km ; 1° de longitude ≈ ${fr(111*Math.cos(la*Math.PI/180),0)} km à cette latitude.`};
 el.addEventListener('input',run);run()};
/* ----- coordonnées Lambert ----- */
W.lambert=el=>{const d=makeDem({type:'montagne',seed:Math.floor(Math.random()*9e4)+1,scaleN:25000});d.x0=Math.floor(280+Math.random()*50);d.y0=Math.floor(250+Math.random()*50);const eq=autoEq(d);
 el.innerHTML=`<h3>📍 Lire X et Y sur le quadrillage kilométrique</h3><p class="mute">Touche la carte : on projette le point sur les marges. 1 km = 4 cm à l'échelle 1/25 000 (le quadrillage est dessiné tous les km).</p><div class="cvw"><canvas></canvas></div><div class="fb ok" id="r">Touche un point.</div><div class="row"><button class="btn sm sec" id="nw">🎲 Défi : trouve X et Y</button><span id="ch"></span></div>`;
 const cv=el.querySelector('canvas'),box=cv.parentNode;let mark=null,tgt=null;
 const draw=()=>{const w=box.clientWidth||600,hh=w*(d.H-1)/(d.W-1),c=fitCanvas(cv,w,hh);drawMap(c,d,w,hh,{eq,grid:true,shade:true,labels:true,rivers:false,spots:false});
  if(mark){c.strokeStyle='#c0392b';c.lineWidth=2;c.beginPath();c.arc(mark.px,mark.py,9,0,7);c.moveTo(mark.px-14,mark.py);c.lineTo(mark.px+14,mark.py);c.moveTo(mark.px,mark.py-14);c.lineTo(mark.px,mark.py+14);c.stroke()}
  if(tgt){c.fillStyle='#d9622b';c.beginPath();c.arc(tgt.px*w/600,tgt.py*hh/412,8,0,7);c.fill()}};
 const rd=(i,j)=>({X:d.x0+i*d.cellM/1000,Y:d.y0+(d.H-1-j)*d.cellM/1000,Z:sample(d,i,j)});
 cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),i=(e.clientX-r.left)/r.width*(d.W-1),j=(e.clientY-r.top)/r.height*(d.H-1),p=rd(i,j);mark={px:e.clientX-r.left,py:e.clientY-r.top};draw();
  el.querySelector('#r').innerHTML=`X = <b>${fr(p.X,1)} km</b> · Y = <b>${fr(p.Y,1)} km</b> · Z ≈ <b>${fr(Math.round(p.Z/ (eq/4))*(eq/4),0)} m</b> (interpolée entre courbes)`;shared.probe={z:p.Z};
  if(tgt){const t=rd(tgt.i,tgt.j),ok=Math.hypot(p.X-t.X,p.Y-t.Y)<.25;skill('coordonnees',ok);el.querySelector('#ch').textContent=ok?'✅ Bien vu !':'❌ Pas ici. Cherche le point orange.';if(ok){addXp(5);tgt=null;draw()}}});
 el.querySelector('#nw').onclick=()=>{tgt={i:20+Math.random()*120,j:15+Math.random()*80};tgt.px=tgt.i/(d.W-1)*600;tgt.py=tgt.j/(d.H-1)*412;mark=null;el.querySelector('#ch').textContent='Touche le point orange pour lire ses coordonnées (tolérance 250 m).';draw()};
 const ro=new ResizeObserver(draw);ro.observe(box);return()=>ro.disconnect()};
/* ----- simulateur de pente ----- */
export const slopeClass=p=>p<3?['Quasi plat','#2e9e4f','Marche sans effort, écoulement très lent.']:p<8?['Pente faible','#7cb342','Route ou voie ferrée courante (≈ 4–6 %).']:p<15?['Pente modérée','#f0b429','Route de montagne (jusqu’à 12 %), cyclable avec effort.']:p<30?['Pente forte','#f08a2b','Sentier raide ; les courbes sont déjà bien serrées.']:p<60?['Pente très forte','#d9622b','Versant escarpé, risque d\'érosion et de glissements.']:['Pente abrupte / paroi','#c0392b','Proche de la falaise : les courbes se confondent sur la carte.'];
W.slope=(el)=>{el.innerHTML=`<div class="seg" id="tab"><button class="on" data-t="a">Avec H et D</button><button data-t="b">Avec les courbes de niveau</button></div>
 <div id="pa"><div class="ctrl"><label>Dénivelée H <input type="range" id="H" min="1" max="500" value="80"> <input type="number" id="Hn" value="80"> m</label><label>Distance horizontale D <input type="range" id="D" min="10" max="3000" value="500" step="10"> <input type="number" id="Dn" value="500"> m</label></div></div>
 <div id="pb" hidden><div class="ctrl"><label>Équidistance Éq <select id="eq"><option>10</option><option selected>20</option><option>25</option><option>50</option></select> m</label><label>Écartement Éc <input type="range" id="ec" min="0.1" max="3" step="0.05" value="0.8"> <b id="ecv"></b> cm</label><label>Échelle 1/ <select id="n"><option>10000</option><option selected>25000</option><option>50000</option><option>100000</option></select></label></div></div>
 <div class="svgw" id="viz"></div><ol class="steps" id="st"></ol><div class="row"><span class="pill" id="cl"></span><span id="ds" class="mute"></span></div>
 <details><summary>Pourquoi 100 % ≠ 90° ?</summary><p>La pente en % est la <b>tangente</b> de l'angle ×100 : 100 % ⇒ H = D ⇒ α = 45°. Une paroi verticale (90°) a une pente infinie. Passage : α = arctan(P/100) et P = 100 × tan α.</p></details>`;
 const q=s=>el.querySelector(s);let mode='a';
 const run=()=>{let H,D;if(mode==='a'){H=+q('#H').value;D=+q('#D').value}else{const eq=+q('#eq').value,ec=+q('#ec').value,N=+q('#n').value;q('#ecv').textContent=fr(ec,2);D=ec*N/100;H=eq}
  const P=H/D*100,a=Math.atan(H/D)*180/Math.PI,c=slopeClass(P),hyp=Math.hypot(H,D);
  q('#viz').innerHTML=svgSlope(H,D);q('#cl').textContent=c[0];q('#cl').style.cssText=`background:${c[1]}33;border-color:${c[1]}`;q('#ds').textContent=c[2];
  q('#st').innerHTML=mode==='a'?`<li>Dénivelée <b>H = ${fr(H,0)} m</b> (différence d'altitude)</li><li>Distance horizontale <b>D = ${fr(D,0)} m</b></li><li>H ÷ D = ${fr(H/D,3)}</li><li>× 100 ⇒ <b>P = ${fr(P,1)} %</b> · α = arctan(${fr(H/D,3)}) = <b>${fr(a,1)}°</b> · distance suivant la pente ≈ ${fr(hyp,0)} m</li>`:
   `<li>Équidistance (marge de la carte) : <b>Éq = ${fr(H,0)} m</b></li><li>Écartement mesuré : ${fr(+q('#ec').value,2)} cm × ${q('#n').value}/100 = <b>Éc = ${fr(D,0)} m</b> sur le terrain</li><li>P = Éq ÷ Éc × 100 = <b>${fr(P,1)} %</b></li><li>α = <b>${fr(a,1)}°</b> · plus les courbes sont serrées (Éc petit), plus la pente est forte</li>`;
  shared.probe={slope:P,eq:mode==='b'?H:null,ecart:mode==='b'?D:null,scaleN:+q('#n').value}};
 q('#tab').onclick=e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.t;q('#tab').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));q('#pa').hidden=mode!=='a';q('#pb').hidden=mode!=='b';run()};
 el.addEventListener('input',e=>{if(e.target.id==='Hn')q('#H').value=e.target.value;if(e.target.id==='Dn')q('#D').value=e.target.value;if(e.target.id==='H')q('#Hn').value=e.target.value;if(e.target.id==='D')q('#Dn').value=e.target.value;run()});run()};
