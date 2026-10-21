/* Moteur géologique : structures 3D analytiques → carte géologique, coupes, mesures.
   Convention : x vers l'Est, y vers le Nord (mètres), z altitude ; azimuts depuis le Nord, sens horaire.
   Simplifications assumées : couches d'épaisseur constante (plis « parallèles » approchés), failles à glissement rigide le long du plan. */
import {rng,clamp} from './util.js';
import {sample,profileAlong} from './terrain.js';
const RAD=Math.PI/180;
export const MESO=[
 {id:'t',n:'Argiles rouges et évaporites',a:'Trias',c:'#8e44ad'},
 {id:'l',n:'Calcaires et dolomies',a:'Lias',c:'#1fa6d6'},
 {id:'d',n:'Marnes grises',a:'Dogger',c:'#6cc3e8'},
 {id:'m',n:'Calcaires massifs',a:'Malm',c:'#b6e1f2'},
 {id:'ci',n:'Grès et argiles',a:'Crétacé inférieur',c:'#7fc64e'},
 {id:'cs',n:'Calcaires et marnes',a:'Crétacé supérieur',c:'#c6e27a'}];
export const PALEO=[
 {id:'ca',n:'Schistes verts',a:'Cambrien',c:'#8fbf8f'},
 {id:'o',n:'Grès quartzitiques',a:'Ordovicien',c:'#2fb39a'},
 {id:'s',n:'Schistes noirs à graptolites',a:'Silurien',c:'#8fd6c0'},
 {id:'dv',n:'Calcaires et dolomies',a:'Dévonien',c:'#d99a5b'}];
export const GRANITE={id:'γ',n:'Granite (intrusion hercynienne)',a:'Carbonifère–Permien',c:'#e8788f',ign:1};
export const DOLERITE={id:'δ',n:'Dolérite (filon)',a:'≈ 200 Ma (Trias–Jurassique)',c:'#b03a2e',ign:1};
export const KINDS={tabulaire:'Couches horizontales (structure tabulaire)',monoclinal:'Monoclinal (couches inclinées)',anticlinal:'Anticlinal',synclinal:'Synclinal',faille_normale:'Faille normale',faille_inverse:'Faille inverse',discordance:'Discordance angulaire',granite:'Intrusion granitique',filon:'Filon (dyke)'};

export function makeGeology(dem,kind,seed,opts={}){
 const R=rng((seed|0)*17+3),W=dem.W,Hh=dem.H,cm=dem.cellM,rel=dem.zmax-dem.zmin,zmid=(dem.zmin+dem.zmax)/2;
 const X=i=>(i-(W-1)/2)*cm,Y=j=>-(j-(Hh-1)/2)*cm;
 const pickAz=()=>opts.dipAz!=null?opts.dipAz:Math.round(R()*23)*15;
 const info={kind,dipAz:null,dip:null};let Z,cosd,units,hf,fault=null,dyke=null,pluton=null,disc=null;
 const mono=(az,dip)=>{const t=Math.tan(dip*RAD),s=Math.sin(az*RAD),c=Math.cos(az*RAD);return{Z:(x,y)=>-t*(x*s+y*c),cosd:()=>Math.cos(dip*RAD)}};
 const fold=(ax,A,lam,plunge,sg)=>{const ca=Math.cos(ax*RAD),sa=Math.sin(ax*RAD),tp=Math.tan(plunge*RAD),k=2*Math.PI/lam;
  return{Z:(x,y)=>sg*A*Math.cos(k*(x*ca-y*sa))+tp*(x*sa+y*ca),cosd:(x,y)=>{const u=x*ca-y*sa,g=sg*A*k*Math.sin(k*u);return 1/Math.sqrt(1+g*g+tp*tp)}}};
 const grid=(f)=>{let mn=1e9,mx=-1e9;for(let j=0;j<Hh;j+=3)for(let i=0;i<W;i+=3){const v=f(X(i),Y(j),dem.z[j*Hh*0+j*W+i]);if(v<mn)mn=v;if(v>mx)mx=v}return[mn,mx]};
 const bounds=(lo,hi,n)=>{const w=Array.from({length:n},()=>.75+.5*R()),s=w.reduce((a,b)=>a+b),span=hi-lo,b=[lo];let c=lo;for(const x of w){c+=span*x/s;b.push(c)}return b};
 const idx=(v,b)=>{let k=0;while(k<b.length-2&&v>=b[k+1])k++;return k};
 let main; // fonction H(x,y,z) de la série principale
 const base=(st)=>{Z=st.Z;cosd=st.cosd;main=(x,y,z)=>(z-Z(x,y))*cosd(x,y)};
 let uni,bnd,lit;
 if(kind==='tabulaire'){units=MESO;base({Z:()=>0,cosd:()=>1});info.dip=0}
 else if(kind==='monoclinal'||kind==='granite'||kind==='filon'){const az=pickAz(),dip=opts.dip!=null?opts.dip:Math.round(14+R()*26);base(mono(az,dip));info.dipAz=az;info.dip=dip;units=kind==='monoclinal'?MESO:PALEO}
 else if(kind==='anticlinal'||kind==='synclinal'){const ax=pickAz()%180,A=rel*(.35+.2*R()),lam=W*cm*(.7+.3*R()),pl=Math.round(R()*6);base(fold(ax,A,lam,pl,kind==='anticlinal'?1:-1));info.axis=ax;info.plunge=pl;units=MESO}
 else if(kind==='faille_normale'||kind==='faille_inverse'){const az=pickAz(),dip=Math.round(8+R()*14);base(mono(az,dip));info.dipAz=az;info.dip=dip;units=MESO;
  const fAz=Math.round(R()*23)*15,fdip=Math.round(55+R()*15),slip=rel*(.22+.18*R())/Math.sin(fdip*RAD),sg=kind==='faille_normale'?1:-1,
   s=Math.sin(fAz*RAD),c=Math.cos(fAz*RAD),t=Math.tan(fdip*RAD),zp=zmid;
  fault={dipAz:fAz,dip:fdip,slip:sg*slip,normal:sg>0,plane:(x,y)=>zp-t*(x*s+y*c),dx:sg*slip*Math.cos(fdip*RAD)*s,dy:sg*slip*Math.cos(fdip*RAD)*c,dz:-sg*slip*Math.sin(fdip*RAD)};
  info.fault={dipAz:fAz,dip:fdip,throw:Math.round(Math.abs(fault.dz))};
  const m0=main;main=(x,y,z)=>(z>fault.plane(x,y))?m0(x-fault.dx,y-fault.dy,z-fault.dz):m0(x,y,z)}
 else if(kind==='discordance'){const az=pickAz(),dip=Math.round(22+R()*20);base(mono(az,dip));info.dipAz=az;info.dip=dip;units=PALEO;
  const zs=Array.from(dem.z).sort((a,b)=>a-b);disc={z:zs[Math.floor(zs.length*(.5+.15*R()))]};info.discordance=true}
 // bornes des unités
 if(kind==='discordance'){const [mn,mx]=grid((x,y,z)=>z<=disc.z?main(x,y,z):NaN>0?0:1e9);
  let lo=1e9,hi=-1e9;for(let j=0;j<Hh;j+=3)for(let i=0;i<W;i+=3){const z=Math.min(dem.z[j*W+i],disc.z),v=main(X(i),Y(j),z);lo=Math.min(lo,v);hi=Math.max(hi,v)}
  const lb=bounds(lo-.15*(hi-lo),hi,PALEO.length);let up=0;for(let k=0;k<dem.z.length;k+=7)up=Math.max(up,dem.z[k]-disc.z);
  const ub=bounds(0,up+1,3);units=[...PALEO,...MESO.slice(0,3)];bnd={lb,ub};
  lit=(x,y,z)=>z>disc.z?PALEO.length+idx(z-disc.z,ub):idx(main(x,y,z),lb);
  info.thick=[...lb.slice(1).map((v,i)=>v-lb[i]),...ub.slice(1).map((v,i)=>v-ub[i])]}
 else{let lo=1e9,hi=-1e9;for(let j=0;j<Hh;j+=2)for(let i=0;i<W;i+=2){const v=main(X(i),Y(j),dem.z[j*W+i]);lo=Math.min(lo,v);hi=Math.max(hi,v)}
  const n=units.length,b=bounds(lo-.12*(hi-lo),hi+.001,n);bnd=b;lit=(x,y,z)=>idx(main(x,y,z),b);info.thick=b.slice(1).map((v,i)=>v-b[i])}
 let all=[...units];
 if(kind==='granite'){const cx=(R()-.5)*W*cm*.4,cy=(R()-.5)*Hh*cm*.4,r=Math.min(W,Hh)*cm*(.18+.08*R()),zc=dem.zmin+rel*.15,rz=rel*1.1;pluton={cx,cy,r,zc,rz};all.push(GRANITE);const g=all.length-1,l0=lit;
  lit=(x,y,z)=>((x-cx)**2+(y-cy)**2)/(r*r)+((z-zc)/rz)**2<1?g:l0(x,y,z)}
 if(kind==='filon'){const psi=Math.round(R()*17)*10,cp=Math.cos(psi*RAD),sp=Math.sin(psi*RAD),d0=(R()-.5)*W*cm*.3,w=cm*(1.3+R()*1.2);dyke={az:psi,d0,w};all.push(DOLERITE);const g=all.length-1,l0=lit;
  lit=(x,y,z)=>Math.abs(x*cp-y*sp-d0)<w?g:l0(x,y,z);info.dykeAz=psi;info.dykeWidth=Math.round(2*w)}
 const geo={kind,units:all,litho:lit,info,Z,fault,disc,dem,X,Y,bnd,pluton,dyke,
  side:fault?(x,y,z)=>z>fault.plane(x,y):null,
  sym:all.map((u,i)=>u.id)};
 geo.at=(i,j)=>lit(X(i),Y(j),sample(dem,i,j));
 /* attitude de la stratification (direction de plongement, pendage) en un point de la carte */
 geo.attitude=(i,j)=>{if(!Z)return null;const u=geo.at(i,j);if(all[u].ign)return null;const x=X(i),y=Y(j),e=cm*.5,zx=(Z(x+e,y)-Z(x-e,y))/(2*e),zy=(Z(x,y+e)-Z(x,y-e))/(2*e),g=Math.hypot(zx,zy);if(g<1e-4)return{dip:0,az:null};return{dip:Math.atan(g)/RAD,az:(Math.atan2(-zx,-zy)/RAD+360)%360}};
 return geo}
export const apparentDip=(dip,dipAz,secAz)=>Math.atan(Math.tan(dip*RAD)*Math.abs(Math.cos((secAz-dipAz)*RAD)))/RAD;
/* trois points → plan : pendage et direction de plongement (problème des trois points) */
export function planeFrom3(p){const[a,b,c]=p,u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(n[2]<0)n.forEach((_,i)=>n[i]=-n[i]);
 const dip=Math.atan(Math.hypot(n[0],n[1])/n[2])/RAD,az=(Math.atan2(-(-n[0]/n[2]),-(-n[1]/n[2]))/RAD+360)%360;return{dip,az}}

/* ---------- carte géologique : raster haute résolution ---------- */
export function geoRaster(geo,pw=720,ph=Math.round(720*(geo.dem.H-1)/(geo.dem.W-1))){
 if(geo._r&&geo._r.width===pw)return geo._r;const d=geo.dem,cv=document.createElement('canvas');cv.width=pw;cv.height=ph;const c=cv.getContext('2d'),im=c.createImageData(pw,ph),L=new Int16Array(pw*ph),S=geo.side?new Uint8Array(pw*ph):null;
 const rgb=geo.units.map(u=>[parseInt(u.c.slice(1,3),16),parseInt(u.c.slice(3,5),16),parseInt(u.c.slice(5),16)]);
 for(let py=0;py<ph;py++)for(let px=0;px<pw;px++){const i=px/(pw-1)*(d.W-1),j=py/(ph-1)*(d.H-1),z=sample(d,i,j),u=geo.litho(geo.X(i),geo.Y(j),z),k=py*pw+px;L[k]=u;if(S)S[k]=geo.side(geo.X(i),geo.Y(j),z)?1:0;const col=rgb[u];im.data[k*4]=col[0];im.data[k*4+1]=col[1];im.data[k*4+2]=col[2];im.data[k*4+3]=255}
 for(let py=0;py<ph-1;py++)for(let px=0;px<pw-1;px++){const k=py*pw+px;if(L[k]!==L[k+1]||L[k]!==L[k+pw]){im.data[k*4]=40;im.data[k*4+1]=40;im.data[k*4+2]=40}
  if(S&&(S[k]!==S[k+1]||S[k]!==S[k+pw])){for(const o of[0,1,pw,pw+1]){const q=(k+o)*4;im.data[q]=20;im.data[q+1]=20;im.data[q+2]=20}}}
 c.putImageData(im,0,0);cv._L=L;cv._S=S;geo._r=cv;return cv}
/* ---------- coupe géologique exacte le long de AB ---------- */
export function sectionGrid(geo,A,B,ns=320,nz=170){const d=geo.dem,rel=d.zmax-d.zmin,P=profileAlong(d,A,B,ns-1),zb=d.zmin-.2*rel,zt=Math.max(...P.map(p=>p.z))+.06*rel,g=new Int16Array(ns*nz).fill(-1),sd=geo.side?new Uint8Array(ns*nz):null;
 for(let a=0;a<ns;a++){const p=P[a],x=geo.X(p.x),y=geo.Y(p.y);for(let r=0;r<nz;r++){const z=zt-(zt-zb)*r/(nz-1);if(z<=p.z){g[r*ns+a]=geo.litho(x,y,z);if(sd)sd[r*ns+a]=geo.side(x,y,z)?1:0}}}
 return{ns,nz,zb,zt,L:P.at(-1).s,P,g,sd,az:(Math.atan2(B.x-A.x,-(B.y-A.y))/RAD+360)%360}}
export function boundaries(sec,geo){const m=new Map(),{ns,nz,g,sd}=sec,add=(k,s,z)=>{(m.get(k)||m.set(k,[]).get(k)).push([s,z])};
 const S=a=>a/(ns-1)*sec.L,Zr=r=>sec.zt-(sec.zt-sec.zb)*r/(nz-1);
 for(let r=0;r<nz-1;r++)for(let a=0;a<ns-1;a++){const k=r*ns+a,u=g[k];if(u<0)continue;
  for(const o of[1,ns]){const v=g[k+o];if(v<0||v===u)continue;add(Math.min(u,v)+'-'+Math.max(u,v),S(a+(o===1?.5:0)),Zr(r+(o===ns?.5:0)))}
  if(sd)for(const o of[1,ns]){if(g[k+o]>=0&&sd[k+o]!==sd[k])add('F',S(a+(o===1?.5:0)),Zr(r+(o===ns?.5:0)))}}
 return m}
export function drawSection(c,geo,sec,x0,y0,w,h,o={}){const{ns,nz}=sec,cv=document.createElement('canvas');cv.width=ns;cv.height=nz;const cc=cv.getContext('2d'),im=cc.createImageData(ns,nz);
 const rgb=geo.units.map(u=>[parseInt(u.c.slice(1,3),16),parseInt(u.c.slice(3,5),16),parseInt(u.c.slice(5),16)]);
 for(let k=0;k<ns*nz;k++){const u=sec.g[k];if(u<0){im.data[k*4+3]=0;continue}const col=rgb[u];im.data[k*4]=col[0];im.data[k*4+1]=col[1];im.data[k*4+2]=col[2];im.data[k*4+3]=255}
 cc.putImageData(im,0,0);c.imageSmoothingEnabled=false;c.drawImage(cv,x0,y0,w,h);c.imageSmoothingEnabled=true;
 c.strokeStyle='#222';c.lineWidth=2.2;c.beginPath();sec.P.forEach((p,i)=>{const x=x0+p.s/sec.L*w,y=y0+(sec.zt-p.z)/(sec.zt-sec.zb)*h;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
