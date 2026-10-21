import {drawMap,shadeCanvas} from './draw.js';
import {geoRaster} from './geol.js';
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
export function legendHtml(geo,{thick=true}={}){const rows=[...geo.units.keys()].reverse();const th=geo.info.thick;return `<div class="strat" role="list" aria-label="Colonne stratigraphique (du plus récent au plus ancien)">${rows.map(i=>{const u=geo.units[i];return `<div class="srow" role="listitem"><span class="sw" style="background:${u.c}" aria-hidden="true">${u.id}</span><span><b>${u.n}</b><br><small>${u.a}${thick&&th&&th[i]&&!u.ign?` · ép. ≈ ${Math.round(th[i]/10)*10} m`:''}</small></span></div>`}).join('')}</div>`}
