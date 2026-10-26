/* Rendu cartographique 2D (carte topographique) et rendu isométrique 2D (bloc-diagramme léger) */
import {clamp,cssv,sstep} from './util.js';
import {contours,indexStep,analyze,gradient,sample} from './terrain.js';

export const PAPER='#fbf6e9',BISTRE='#b0622a',BISTRE_D='#8a4a1c',WATER='#2d86c8';
const RAMP=[[0,[96,150,92]],[.25,[170,190,110]],[.5,[226,212,140]],[.72,[200,160,110]],[.9,[170,130,110]],[1,[245,240,235]]];
export function hypso(t){t=clamp(t,0,1);for(let i=1;i<RAMP.length;i++)if(t<=RAMP[i][0]){const[a,ca]=RAMP[i-1],[b,cb]=RAMP[i],u=(t-a)/(b-a);return ca.map((c,k)=>Math.round(c+(cb[k]-c)*u))}return RAMP.at(-1)[1]}

export function shadeCanvas(d){ // estompage : lumière NW, 45°
 if(d._shade)return d._shade;const{W,H}=d,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),im=c.createImageData(W,H),az=315*Math.PI/180,alt=45*Math.PI/180,ex=2.2;
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const[gx,gy]=gradient(d,i,j),sx=gx/d.cellM*ex,sy=gy/d.cellM*ex,sl=Math.atan(Math.hypot(sx,sy)),as=Math.atan2(sy,-sx);
  let v=Math.cos(alt)*Math.cos(sl)+Math.sin(alt)*Math.sin(sl)*Math.cos(az-as);v=clamp(v,0,1);const k=(j*W+i)*4,g=Math.round(255*(.35+.65*v)),tint=hypso((d.z[j*W+i]-d.zmin)/(d.zmax-d.zmin||1));
  im.data[k]=g;im.data[k+1]=g;im.data[k+2]=g;im.data[k+3]=255;d._tint=d._tint||[];}
 c.putImageData(im,0,0);d._shade=cv;return cv}
export function tintCanvas(d){if(d._tintCv)return d._tintCv;const{W,H}=d,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),im=c.createImageData(W,H);
 for(let k=0;k<W*H;k++){const t=hypso((d.z[k]-d.zmin)/(d.zmax-d.zmin||1));im.data[k*4]=t[0];im.data[k*4+1]=t[1];im.data[k*4+2]=t[2];im.data[k*4+3]=255}c.putImageData(im,0,0);d._tintCv=cv;return cv}

/* Dessine la carte dans (0,0,w,h) du contexte ctx. Retourne le facteur k (px par maille). */
export function drawMap(ctx,d,w,h,o={}){
 const{eq=20,shade=false,tint=false,rivers=true,labels=true,spots=true,inter=false,grid=false,scaleBar=true,north=true,crest=false,talweg=false,flood=null,lineW=1}=o;
 const k=w/(d.W-1),X=x=>x*k,Y=y=>y*k;
 ctx.save();if(!o.transparent){ctx.fillStyle=PAPER;ctx.fillRect(0,0,w,h)}ctx.imageSmoothingEnabled=true;
 const src=(cv)=>ctx.drawImage(cv,.5,.5,d.W-1,d.H-1,0,0,w,h);
 if(tint){src(tintCanvas(d));}
 if(shade){ctx.globalCompositeOperation=tint?'multiply':'multiply';ctx.globalAlpha=tint?.55:.42;src(shadeCanvas(d));ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
 if(flood!=null){ctx.fillStyle='rgba(60,150,220,.5)';const c=contours(d,1);}
 if(flood!=null){ctx.save();const cv=document.createElement('canvas');cv.width=d.W;cv.height=d.H;const c2=cv.getContext('2d'),im=c2.createImageData(d.W,d.H);for(let q=0;q<d.W*d.H;q++){if(d.z[q]<flood){im.data[q*4]=50;im.data[q*4+1]=140;im.data[q*4+2]=215;im.data[q*4+3]=140}}c2.putImageData(im,0,0);ctx.drawImage(cv,.5,.5,d.W-1,d.H-1,0,0,w,h);ctx.restore()}
 if(grid)drawGrid(ctx,d,w,h,k);
 const an=(rivers||crest||talweg)?analyze(d):null;
 if(rivers&&an&&d.params&&d.params.rivers!==false){ctx.strokeStyle=WATER;ctx.lineCap='round';for(let q=0;q<d.W*d.H;q++){if(!an.river[q])continue;const n=an.dir[q];if(n<0)continue;const i=q%d.W,j=(q/d.W)|0;ctx.lineWidth=clamp(.5+Math.log2(an.acc[q]/an.thr)*.55,.6,3.2)*lineW;ctx.beginPath();ctx.moveTo(X(i),Y(j));ctx.lineTo(X(n%d.W),Y((n/d.W)|0));ctx.stroke()}}
 if(crest&&an){ctx.strokeStyle='#c0392b';ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();const T=Math.max(30,an.thr*.7);for(let q=0;q<d.W*d.H;q++){if(an.racc[q]<T)continue;const i=q%d.W,j=(q/d.W)|0;ctx.moveTo(X(i),Y(j));ctx.lineTo(X(i)+.1,Y(j)+.1)}ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([])}
 const C=contours(d,eq),step=indexStep(eq),lab=[];
 for(const lv of C){const idx=Math.round(lv.level/eq)%Math.round(step/eq)===0;ctx.strokeStyle=idx?BISTRE_D:BISTRE;ctx.lineWidth=(idx?1.9:.85)*lineW;ctx.beginPath();
  for(const ch of lv.chains){const p=ch.pts;ctx.moveTo(X(p[0][0]),Y(p[0][1]));for(let q=1;q<p.length;q++)ctx.lineTo(X(p[q][0]),Y(p[q][1]));if(ch.closed)ctx.closePath()}ctx.stroke();
  // courbes en cuvette : hachures vers le bas de la pente
  for(const ch of lv.chains){if(!ch.closed||ch.pts.length<24)continue;const cx=ch.pts.reduce((a,p)=>a+p[0],0)/ch.pts.length,cy=ch.pts.reduce((a,p)=>a+p[1],0)/ch.pts.length;
   if(sample(d,cx,cy)<lv.level-1){ctx.strokeStyle=BISTRE_D;ctx.lineWidth=1;ctx.beginPath();for(let q=0;q<ch.pts.length;q+=Math.max(2,Math.round(14/k/ (1))) ){const[px,py]=ch.pts[q],[gx,gy]=gradient(d,px,py),g=Math.hypot(gx,gy)||1;ctx.moveTo(X(px),Y(py));ctx.lineTo(X(px)-gx/g*5,Y(py)-gy/g*5)}ctx.stroke()}}
  if(inter&&false){}
  if(idx&&labels)lv.chains.slice().sort((a,b)=>b.pts.length-a.pts.length).slice(0,3).forEach(ch=>{if(ch.pts.length<40)return;const m=ch.pts[Math.floor(ch.pts.length*.42)];lab.push({x:X(m[0]),y:Y(m[1]),mx:m[0],my:m[1],t:lv.level})})}
 if(inter){ctx.setLineDash([4,3]);ctx.strokeStyle=BISTRE;ctx.lineWidth=.7*lineW;const half=eq/2;for(let L=Math.ceil(d.zmin/eq)*eq-half;L<d.zmax;L+=eq){if(L<=d.zmin)continue;ctx.beginPath();for(const ch of contoursHalf(d,L)){const p=ch.pts;ctx.moveTo(X(p[0][0]),Y(p[0][1]));for(let q=1;q<p.length;q++)ctx.lineTo(X(p[q][0]),Y(p[q][1]))}ctx.stroke()}ctx.setLineDash([])}
 if(labels){const placed=[];ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${Math.round(clamp(k*3.2,10,15))}px system-ui,sans-serif`;
  for(const L of lab){if(L.x<22||L.y<14||L.x>w-22||L.y>h-14)continue;if(placed.some(p=>Math.hypot(p.x-L.x,p.y-L.y)<k*26))continue;placed.push(L);const[gx,gy]=gradient(d,L.mx,L.my);ctx.save();ctx.translate(L.x,L.y);ctx.rotate(Math.atan2(gx,-gy));ctx.lineWidth=4;ctx.strokeStyle=PAPER;ctx.lineJoin='round';ctx.strokeText(L.t,0,0);ctx.fillStyle=BISTRE_D;ctx.fillText(L.t,0,0);ctx.restore()}}
 if(spots&&d.params){const a=analyze(d);ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font=`600 ${Math.round(clamp(k*3,10,13))}px system-ui,sans-serif`;
  for(const p of a.summits.slice(0,4)){ctx.fillStyle='#222';ctx.beginPath();ctx.arc(X(p.x),Y(p.y),2.6,0,7);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=PAPER;const t=Math.round(p.z);ctx.strokeText(t,X(p.x)+5,Y(p.y)-3);ctx.fillStyle='#222';ctx.fillText(t,X(p.x)+5,Y(p.y)-3)}
  for(const p of a.pits.slice(0,2)){ctx.fillStyle='#222';ctx.beginPath();ctx.arc(X(p.x),Y(p.y),2.2,0,7);ctx.fill();const t=Math.round(p.z);ctx.lineWidth=3;ctx.strokeStyle=PAPER;ctx.strokeText(t,X(p.x)+5,Y(p.y)-3);ctx.fillStyle='#222';ctx.fillText(t,X(p.x)+5,Y(p.y)-3)}}
 if(scaleBar){const kmPerCm=d.scaleN/1e5,px1cm=w/16,cand=[.1,.2,.25,.5,1,2,5],km=cand.reduce((b,c)=>Math.abs(c/kmPerCm*px1cm-w*.2)<Math.abs(b/kmPerCm*px1cm-w*.2)?c:b),len=km/kmPerCm*px1cm;
  ctx.fillStyle='rgba(251,246,233,.85)';ctx.fillRect(8,h-30,len+30,24);ctx.fillStyle='#222';ctx.fillRect(14,h-14,len,3);ctx.fillRect(14,h-18,1.5,7);ctx.fillRect(14+len,h-18,1.5,7);ctx.font='600 11px system-ui';ctx.textAlign='left';ctx.fillText(km<1?km*1000+' m':km+' km',14,h-21)}
 if(north){ctx.fillStyle='rgba(251,246,233,.85)';ctx.fillRect(w-34,6,28,38);ctx.fillStyle='#222';ctx.beginPath();ctx.moveTo(w-20,10);ctx.lineTo(w-14,34);ctx.lineTo(w-20,29);ctx.lineTo(w-26,34);ctx.closePath();ctx.fill();ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText('N',w-20,43)}
 ctx.restore();return k}
const _half=new WeakMap();
function contoursHalf(d,L){let m=_half.get(d);if(!m){m=new Map();_half.set(d,m)}if(!m.has(L)){const z=d.z,tmp={...d,z:z,_ct:{}};const lv=contours({...d,zmin:L-1,zmax:L+1,_ct:{}},1e9);m.set(L,[])}return m.get(L)}
function drawGrid(ctx,d,w,h,k){ // quadrillage kilométrique (type Lambert), 1 km
 const kmPerMaille=d.cellM/1000,step=1/kmPerMaille;ctx.save();ctx.strokeStyle='rgba(20,60,160,.45)';ctx.fillStyle='rgba(20,60,160,.9)';ctx.lineWidth=.8;ctx.font='600 10px system-ui';
 for(let gx=0;gx*step<=d.W-1;gx++){const x=gx*step*k;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.textAlign='left';ctx.fillText((d.x0+gx).toFixed(0),x+2,10)}
 for(let gy=0;gy*step<=d.H-1;gy++){const y=h-gy*step*k;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.textAlign='left';ctx.fillText((d.y0+gy).toFixed(0),2,y-2)}ctx.restore()}

/* ---------- rendu isométrique 2D ---------- */
export function drawIso(ctx,d,w,h,o={}){
 const{rot=35,tilt=48,vex=2.2,eq=0,level=null,tint=true,step=2,cut=null,cutLevel=null}=o,th=rot*Math.PI/180,tl=tilt*Math.PI/180,cr=Math.cos(th),sr=Math.sin(th);
 const W=d.W,H=d.H,sc=Math.min(w/(Math.abs(W*cr)+Math.abs(H*sr))*.92,h/((W*Math.abs(sr)+H*Math.abs(cr))*Math.sin(tl)+((d.zmax-d.zmin)/d.cellM*vex)*Math.cos(tl))*.9);
 const cx=W/2,cy=H/2,zr=d.zmin;
 const P=(i,j,z)=>{const X=i-cx,Y=j-cy,xr=X*cr-Y*sr,yr=X*sr+Y*cr;return[w/2+xr*sc,h*.62+(yr*Math.sin(tl))*sc-((z-zr)/d.cellM*vex)*Math.cos(tl)*sc-((d.zmax-d.zmin)/d.cellM*vex*Math.cos(tl)*sc)*.28,yr]};
 const cells=[];for(let j=0;j<H-1-step+1;j+=step)for(let i=0;i<W-1-step+1;i+=step){const X=i+step/2-cx,Y=j+step/2-cy;cells.push([i,j,X*sr+Y*cr])}cells.sort((a,b)=>a[2]-b[2]);
 ctx.save();ctx.lineJoin='round';const rel=d.zmax-d.zmin||1,lx=-.5,ly=-.6;
 for(const[i,j]of cells){const i2=Math.min(i+step,W-1),j2=Math.min(j+step,H-1),za=d.z[j*W+i],zb=d.z[j*W+i2],zc=d.z[j2*W+i2],zd=d.z[j2*W+i];
  const a=P(i,j,za),b=P(i2,j,zb),c=P(i2,j2,zc),e=P(i,j2,zd),zm=(za+zb+zc+zd)/4;
  const gx=((zb+zc)-(za+zd))/2/d.cellM/step*vex,gy=((zd+zc)-(za+zb))/2/d.cellM/step*vex,sh=clamp(.78+(-gx*lx-gy*ly)*.5/Math.hypot(1,Math.hypot(gx,gy))*1.0,.35,1.15);
  let col=tint?hypso((zm-zr)/rel):[220,210,190];const sub=level!=null&&zm<level;
  ctx.fillStyle=`rgb(${clamp(col[0]*sh,0,255)|0},${clamp(col[1]*sh,0,255)|0},${clamp(col[2]*sh,0,255)|0})`;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.6;
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(e[0],e[1]);ctx.closePath();ctx.fill();ctx.stroke();
  if(sub){ctx.fillStyle='rgba(45,134,200,.62)';ctx.fill()}
  if(eq){const mn=Math.min(za,zb,zc,zd),mx=Math.max(za,zb,zc,zd);ctx.strokeStyle='rgba(95,45,12,.9)';ctx.lineWidth=.9;
   for(let L=Math.ceil(mn/eq)*eq;L<=mx;L+=eq){const seg=[];const E=[[a,b,za,zb],[b,c,zb,zc],[e,c,zd,zc],[a,e,za,zd]];for(const[p,q,u,v]of E){if((u<L)!==(v<L)){const t=(L-u)/(v-u);seg.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}
    if(seg.length>=2){ctx.beginPath();ctx.moveTo(seg[0][0],seg[0][1]);ctx.lineTo(seg[1][0],seg[1][1]);if(seg.length===4){ctx.moveTo(seg[2][0],seg[2][1]);ctx.lineTo(seg[3][0],seg[3][1])}ctx.stroke()}}}}
 if(cutLevel!=null){ // plan horizontal translucide
  const q=[[0,0],[W-1,0],[W-1,H-1],[0,H-1]].map(([i,j])=>P(i,j,cutLevel));ctx.fillStyle='rgba(45,134,200,.28)';ctx.strokeStyle='rgba(45,134,200,.9)';ctx.lineWidth=1.5;ctx.beginPath();q.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();ctx.stroke()}
 if(cut){ // rideau vertical le long de AB + profil
  const n=80,top=[],bot=[];for(let q=0;q<=n;q++){const t=q/n,x=cut.A.x+(cut.B.x-cut.A.x)*t,y=cut.A.y+(cut.B.y-cut.A.y)*t,z=sample(d,x,y);top.push(P(x,y,z));bot.push(P(x,y,d.zmin-rel*.08))}
  ctx.fillStyle='rgba(192,57,43,.22)';ctx.strokeStyle='#c0392b';ctx.lineWidth=2.4;ctx.beginPath();top.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));for(let q=n;q>=0;q--)ctx.lineTo(bot[q][0],bot[q][1]);ctx.closePath();ctx.fill();ctx.beginPath();top.forEach((p,n)=>n?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.fillStyle='#c0392b';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText('A',top[0][0]-8,top[0][1]-8);ctx.fillText('B',top[n][0]+8,top[n][1]-8)}
 ctx.restore();return{P,sc}}
