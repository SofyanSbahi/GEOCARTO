import {drawMap,shadeCanvas} from './draw.js';
import {sample} from '../engine/terrain/dem.js';
export {legendHtml} from '../engine/pedagogy/legend.js';
import {gradient} from './terrain.js';
/* Carte géologique : fond lithologique + estompage + courbes de niveau + mesures de pendage + lettres (lisible sans couleur) */
export function drawGeoMap(c,geo,w,h,o={}){const d=geo.dem,{eq=20,shade=true,contours=true,symbols=true,letters=true,showDip=true}=o;
 c.save();c.imageSmoothingEnabled=true;c.drawImage(geoRaster(geo),0,0,w,h);
 if(shade){c.globalCompositeOperation='multiply';c.globalAlpha=.4;c.drawImage(shadeCanvas(d),.5,.5,d.W-1,d.H-1,0,0,w,h);c.globalCompositeOperation='source-over';c.globalAlpha=1}
 if(contours)drawMap(c,d,w,h,{transparent:true,eq,labels:true,spots:false,rivers:false,scaleBar:true,north:true,lineW:.8});
 else{c.fillStyle='rgba(251,246,233,.85)';c.fillRect(w-34,6,28,38);c.fillStyle='#222';c.beginPath();c.moveTo(w-20,10);c.lineTo(w-14,34);c.lineTo(w-20,29);c.lineTo(w-26,34);c.closePath();c.fill();c.font='700 11px system-ui';c.textAlign='center';c.fillText('N',w-20,43)}
 const k=w/(d.W-1),L=geoRaster(geo)._L,pw=geoRaster(geo).width,ph=geoRaster(geo).height;
 if(letters){c.font='700 13px system-ui';c.textAlign='center';c.textBaseline='middle';for(let j=24;j<d.H-12;j+=30)for(let i=20;i<d.W-12;i+=30){const px=Math.round(i/(d.W-1)*(pw-1)),py=Math.round(j/(d.H-1)*(ph-1)),u=L[py*pw+px];let same=true;for(let a=-14;a<=14&&same;a+=7)for(let b=-14;b<=14;b+=7){const q=L[Math.min(ph-1,Math.max(0,py+b))*pw+Math.min(pw-1,Math.max(0,px+a))];if(q!==u){same=false;break}}
   if(same){c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.strokeText(geo.units[u].id,i*k,j*k);c.fillStyle='#111';c.fillText(geo.units[u].id,i*k,j*k)}}}
 if(symbols&&showDip){c.textBaseline='alphabetic';c.font='700 11px system-ui';for(let j=18;j<d.H-10;j+=38)for(let i=18;i<d.W-10;i+=38){const at=geo.attitude(i+6,j+6);if(!at)continue;const x=(i+6)*k,y=(j+6)*k;c.save();c.translate(x,y);c.strokeStyle='#111';c.fillStyle='#111';c.lineWidth=2;
   if(at.az==null||at.dip<2){c.beginPath();c.arc(0,0,6,0,7);c.moveTo(-6,0);c.lineTo(6,0);c.moveTo(0,-6);c.lineTo(0,6);c.stroke()}
   else{const a=(at.az-90)*Math.PI/180;c.rotate(a);c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.moveTo(0,0);c.lineTo(0,8);c.stroke();c.rotate(-a);c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';const tx=12*Math.cos((at.az-90)*Math.PI/180)+8,ty=12*Math.sin((at.az-90)*Math.PI/180)+4;c.strokeText(Math.round(at.dip),tx,ty);c.fillText(Math.round(at.dip),tx,ty)}c.restore()}}
 if(geo.fault&&o.faultLabel!==false){}
 c.restore()}

/* Rendu (canvas) de la géologie : le moteur ne dessine pas — ADR 0001 */
/* ---------- carte géologique : raster haute résolution ---------- */
export function geoRaster(geo,pw=720,ph=Math.round(720*(geo.dem.H-1)/(geo.dem.W-1))){
 if(geo._r&&geo._r.width===pw)return geo._r;const d=geo.dem,cv=document.createElement('canvas');cv.width=pw;cv.height=ph;const c=cv.getContext('2d'),im=c.createImageData(pw,ph),L=new Int16Array(pw*ph),S=geo.side?new Uint8Array(pw*ph):null;
 const rgb=geo.units.map(u=>[parseInt(u.c.slice(1,3),16),parseInt(u.c.slice(3,5),16),parseInt(u.c.slice(5),16)]);
 for(let py=0;py<ph;py++)for(let px=0;px<pw;px++){const i=px/(pw-1)*(d.W-1),j=py/(ph-1)*(d.H-1),z=sample(d,i,j),u=geo.litho(geo.X(i),geo.Y(j),z),k=py*pw+px;L[k]=u;if(S)S[k]=geo.side(geo.X(i),geo.Y(j),z)?1:0;const col=rgb[u];im.data[k*4]=col[0];im.data[k*4+1]=col[1];im.data[k*4+2]=col[2];im.data[k*4+3]=255}
 for(let py=0;py<ph-1;py++)for(let px=0;px<pw-1;px++){const k=py*pw+px;if(L[k]!==L[k+1]||L[k]!==L[k+pw]){im.data[k*4]=40;im.data[k*4+1]=40;im.data[k*4+2]=40}
  if(S&&(S[k]!==S[k+1]||S[k]!==S[k+pw])){for(const o of[0,1,pw,pw+1]){const q=(k+o)*4;im.data[q]=20;im.data[q+1]=20;im.data[q+2]=20}}}
 c.putImageData(im,0,0);cv._L=L;cv._S=S;geo._r=cv;return cv}
export function drawSection(c,geo,sec,x0,y0,w,h,o={}){const{ns,nz}=sec,cv=document.createElement('canvas');cv.width=ns;cv.height=nz;const cc=cv.getContext('2d'),im=cc.createImageData(ns,nz);
 const rgb=geo.units.map(u=>[parseInt(u.c.slice(1,3),16),parseInt(u.c.slice(3,5),16),parseInt(u.c.slice(5),16)]);
 for(let k=0;k<ns*nz;k++){const u=sec.g[k];if(u<0){im.data[k*4+3]=0;continue}const col=rgb[u];im.data[k*4]=col[0];im.data[k*4+1]=col[1];im.data[k*4+2]=col[2];im.data[k*4+3]=255}
 cc.putImageData(im,0,0);c.imageSmoothingEnabled=false;c.drawImage(cv,x0,y0,w,h);c.imageSmoothingEnabled=true;
 c.strokeStyle='#222';c.lineWidth=2.2;c.beginPath();sec.P.forEach((p,i)=>{const x=x0+p.s/sec.L*w,y=y0+(sec.zt-p.z)/(sec.zt-sec.zb)*h;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
