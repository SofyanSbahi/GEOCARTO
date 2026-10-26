/* Moteur de terrain : génération procédurale, formes analytiques, courbes de niveau, hydrographie */
import {clamp,sstep,rng,lerp} from './util.js';
export const MAP_W=160, MAP_H=110;            // 1 maille = 1 mm sur la carte (16 cm × 11 cm)
export const ASPECT=MAP_W/MAP_H;
export const TYPES={montagne:'Montagne',plateau:'Plateau',vallee:'Vallée',volcan:'Volcan',cuvette:'Cuvette',bassin:'Bassin versant',complexe:'Relief complexe'};

/* ---------- bruit ---------- */
const h2=(x,y,s)=>{let k=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,1442695041))|0;k=Math.imul(k^(k>>>13),1274126177);k^=k>>>16;return(k>>>0)/4294967296};
const sm=t=>t*t*(3-2*t);
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),u=sm(x-xi),v=sm(y-yi);const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s,o=5,g=.5){let a=1,f=1,t=0,n=0;for(let i=0;i<o;i++){t+=a*vn(x*f,y*f,s+i*101);n+=a;a*=g;f*=2.03}return t/n}
function ridged(x,y,s,f,o){let a=1,t=0,n=0;for(let i=0;i<o;i++){t+=a*(1-Math.abs(2*vn(x*f,y*f,s+31*i)-1));n+=a;a*=.5;f*=2.1}return t/n}

/* ---------- formes analytiques (pour l'atlas et le labo) : coordonnées x∈[0,ASPECT], y∈[0,1] ---------- */
export const FORMS={
 colline:{nom:'Colline / sommet',f:(x,y)=>Math.exp(-(((x-ASPECT/2)/.3)**2+((y-.5)/.3)**2))},
 cuvette:{nom:'Cuvette (dépression fermée)',f:(x,y)=>1-Math.exp(-(((x-ASPECT/2)/.33)**2+((y-.5)/.33)**2))},
 col:{nom:'Col (selle)',f:(x,y)=>{const c=ASPECT/2,a=Math.exp(-(((x-c-.42)/.24)**2+((y-.5)/.3)**2)),b=Math.exp(-(((x-c+.42)/.24)**2+((y-.5)/.3)**2));return Math.min(1,(a+b)*1.05)}},
 vallee:{nom:'Vallée et talweg',f:(x,y)=>{const d=Math.abs(x-ASPECT/2),fl=.1+.28*(1-y);return fl+(1-fl)*Math.pow(Math.min(1,d/.62),1.05)}},
 crete:{nom:'Ligne de crête',f:(x,y)=>{const d=Math.abs(x-ASPECT/2),top=.78+.2*Math.sin(y*5.2+.8)*.7;return Math.max(0,top-Math.pow(d/.62,.95)*(top-.1))}},
 plateau:{nom:'Plateau',f:(x,y)=>{const dx=(x-ASPECT/2)/.62,dy=(y-.5)/.36,d=Math.pow(Math.abs(dx)**3+Math.abs(dy)**3,1/3);return .12+.8*(1-sstep(.72,1.0,d))}},
 constante:{nom:'Versant à pente constante',f:(x,y)=>1-y},
 convexe:{nom:'Versant convexe',f:(x,y)=>1-y*y},
 concave:{nom:'Versant concave',f:(x,y)=>(1-y)**2},
 rupture:{nom:'Rupture de pente',f:(x,y)=>{const s=y;return s<.35?1-s*.35:s<.62?1-.1225-(s-.35)*2.2:1-.1225-.594-(s-.62)*.3}},
 falaise:{nom:'Falaise',f:(x,y)=>{const e=.04*Math.sin(x*9);return .08+.84*(1-sstep(.46+e,.5+e,y))+(1-y)*.1}}
};

/* ---------- construction d'un MNT ---------- */
function shape(type,seed,o){
 const R=rng(seed*7+13),A=ASPECT,s=seed|0,vd=o.valleys;
 const pk=[...Array(Math.max(1,Math.round(o.peaks)))].map(()=>({x:A*(.22+.56*R()),y:.2+.6*R(),h:.65+.35*R(),r:.12+.1*R()}));
 const vph=R()*6,vam=.08+.06*R(),vcx=A/2+(R()-.5)*.1;
 const warp=(x,y)=>[x+.07*(fbm(x*3,y*3,s+7,3)-.5)*2,y+.07*(fbm(x*3+5,y*3+5,s+9,3)-.5)*2];
 const carve=(h,x,y,f,k=.6)=>h*(1-vd*k*(1-ridged(x,y,s+5,f,4)));
 const mk={
 montagne:(x,y)=>{const[wx,wy]=warp(x,y);let g=0,m=0;for(const p of pk){const d=Math.hypot(wx-p.x,wy-p.y);g=Math.max(g,p.h*Math.pow(Math.max(0,1-d/(p.r*2.4)),1.35));m+=p.h*Math.exp(-(d*d)/(2*(p.r*1.35)**2))}
   return carve(.55*g+.45*Math.min(1,m),x,y,3.4)},
 plateau:(x,y)=>{const[wx,wy]=warp(x,y);const dx=(wx-A/2)/(A*.37),dy=(wy-.5)/.38,d=Math.pow(Math.abs(dx)**3+Math.abs(dy)**3,1/3),top=1-sstep(.74,1.0,d);
   let h=.1+.74*top+.05*fbm(x*4,y*4,s+3,3)*top;const rg=ridged(x,y,s+5,5,4);h-=vd*.4*(1-rg)*sstep(.45,.9,d)*top*top;
   const rim=(1-top)*(.16*fbm(x*5,y*5,s+4,4));return h+rim},
 vallee:(x,y)=>{const ax=A/2+vam*A*Math.sin(2.6*y+vph);const d=Math.abs(x-ax)/(A*.5),fl=.1+.22*(1-y);
   let h=fl+(1-fl)*Math.pow(Math.min(1,d*1.18),1.12)*(.78+.22*fbm(x*2.2,y*2.2,s,3));const rg=ridged(x,y,s+5,4,4);h*=1-vd*.5*(1-rg)*sstep(.12,.5,d);
   for(const p of pk)h+=.22*p.h*Math.exp(-((x-p.x)**2+(y-p.y)**2)/(2*(p.r*.8)**2))*sstep(.45,.85,d);return h},
 volcan:(x,y)=>{const[wx,wy]=warp(x,y),cx=vcx,cy=.5,dx=wx-cx,dy=wy-cy,r=Math.hypot(dx,dy),th=Math.atan2(dy,dx),Rr=.5,rc=.075;
   const cone=r_=>Math.pow(Math.max(0,1-r_/Rr),1.55);let c=cone(r);const rim=cone(rc)+.04;
   if(r<rc)c=rim-.2*(1-(r/rc)**2);else c+=.04*Math.exp(-(((r-rc)/.03)**2));
   const g=Math.abs(Math.sin(th*Math.round(5+vd*9)+3*fbm(r*5,th,s,2)));c*=1-vd*.33*(1-g)*sstep(.07,.28,r);return c+.03*fbm(x*6,y*6,s,3)},
 cuvette:(x,y)=>{const[wx,wy]=warp(x,y),r=Math.hypot((wx-A/2)/1.1,wy-.5),Rr=.3;let h=.1+.62*Math.pow(sstep(0,Rr,r),1.15);h+=.3*ridged(x,y,s+8,3.2,4)*sstep(Rr*.9,.58,r)*(1-vd*.3);return h},
 bassin:(x,y)=>{const[wx,wy]=warp(x,y),q=Math.hypot((wx-A/2)/(A*.46),(wy-.46)/.5),rim=sstep(.45,1.0,q);let h=.08+.8*Math.pow(rim,1.05)+.25*(1-y)*(1-rim);
   const gap=Math.exp(-(((x-A/2)/.07)**2))*sstep(.7,1,y);h*=1-.85*gap;const rg=ridged(x,y,s+5,5,5);return h*(1-vd*.6*(1-rg)*(1-rim*.4))},
 };
 mk.complexe=(x,y)=>{const hm=mk.montagne(x,y),hp=mk.plateau(x,y),hv=mk.vallee(x,y),w1=sstep(.4,.62,fbm(x*1.3,y*1.3,s+3,3)),w2=sstep(.5,.7,fbm(x*1.7+9,y*1.7,s+11,3));return lerp(lerp(hm,hp,w1),hv,w2*.7)};
 return mk[type]||mk.montagne;
}
export function defaultParams(type,seed){const R=rng(seed*31+5);
 const rel={montagne:[450,900],plateau:[250,450],vallee:[300,600],volcan:[350,700],cuvette:[180,380],bassin:[250,500],complexe:[400,800]}[type]||[300,600];
 return{relief:Math.round(lerp(rel[0],rel[1],R())/10)*10,base:Math.round((50+R()*900)/10)*10,slope:.9+R()*.5,rough:.15+R()*.3,valleys:.35+R()*.45,peaks:2+Math.floor(R()*4),rivers:true}}
export function niceEq(relief){const t=relief/18;return[5,10,20,25,40,50,100].find(e=>e>=t)||100}
export function autoEq(d){const g=[];for(let j=2;j<d.H-2;j+=3)for(let i=2;i<d.W-2;i+=3){const a=d.z[j*d.W+i+1]-d.z[j*d.W+i-1],b=d.z[(j+1)*d.W+i]-d.z[(j-1)*d.W+i];g.push(Math.hypot(a,b)/2)}
 g.sort((a,b)=>a-b);const p95=g[Math.floor(g.length*.95)]||1,t=Math.max((d.zmax-d.zmin)/26,p95*1.15);return[5,10,20,25,40,50,100,200].find(e=>e>=t)||200}

export function makeDem(opts){
 const o={type:'montagne',seed:1,scaleN:25000,...opts};o.type=TYPES[o.type]?o.type:'montagne';
 const P={...defaultParams(o.type,o.seed),...o};const W=MAP_W,H=MAP_H,z=new Float32Array(W*H);
 const f=shape(o.type,o.seed,P);let mn=1e9,mx=-1e9;
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=i/(H-1),y=j/(H-1);let v=f(x*1,y*1);v+=.1*(1-y)+P.rough*.05*(fbm(x*16,y*16,o.seed+77,3)-.5)*2*Math.pow(clamp(v,0,1),1.4);z[j*W+i]=v;if(v<mn)mn=v;if(v>mx)mx=v}
 const s=P.slope;for(let k=0;k<z.length;k++){let v=(z[k]-mn)/(mx-mn||1);v=clamp(.5+(v-.5)*s,-.15,1.15);z[k]=v}
 mn=1e9;mx=-1e9;for(const v of z){if(v<mn)mn=v;if(v>mx)mx=v}
 for(let k=0;k<z.length;k++)z[k]=P.base+P.relief*(z[k]-mn)/(mx-mn||1);
 return finish({W,H,z,type:o.type,seed:o.seed,scaleN:o.scaleN,params:P,x0:280+Math.floor(rng(o.seed)()*60),y0:250+Math.floor(rng(o.seed+3)()*70)});
}
export function demFromForm(name,{base=200,relief=400,slope=1,scaleN=25000,rot=0,flipH=false}={}){
 const f=FORMS[name].f,W=MAP_W,H=MAP_H,z=new Float32Array(W*H),c=Math.cos(rot),s=Math.sin(rot);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){let x=i/(H-1)-ASPECT/2,y=j/(H-1)-.5;if(flipH)x=-x;const xr=x*c-y*s+ASPECT/2,yr=x*s+y*c+.5;z[j*W+i]=f(xr,yr)}
 let mn=1e9,mx=-1e9;for(const v of z){mn=Math.min(mn,v);mx=Math.max(mx,v)}
 for(let k=0;k<z.length;k++){let v=(z[k]-mn)/(mx-mn||1);v=clamp(.5+(v-.5)*slope,0,1.2);z[k]=base+relief*v}
 return finish({W,H,z,type:name,seed:0,scaleN,params:{base,relief,slope},x0:300,y0:290});
}
export function transformDem(d,mode){ // symétries pour les distracteurs
 const{W,H}=d,z=new Float32Array(W*H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ii=(mode==='fx'||mode==='r180')?W-1-i:i,jj=(mode==='fy'||mode==='r180')?H-1-j:j;z[j*W+i]=d.z[jj*W+ii]}
 return finish({...d,z,_an:null,_ct:null});
}
function finish(d){let mn=1e9,mx=-1e9;for(const v of d.z){if(v<mn)mn=v;if(v>mx)mx=v}d.zmin=mn;d.zmax=mx;d.cellM=d.scaleN/1000;d._ct={};d._an=null;return d}
export const sample=(d,x,y)=>{x=clamp(x,0,d.W-1.001);y=clamp(y,0,d.H-1.001);const i=x|0,j=y|0,u=x-i,v=y-j,W=d.W,z=d.z,a=z[j*W+i],b=z[j*W+i+1],c=z[(j+1)*W+i],e=z[(j+1)*W+i+1];return a+(b-a)*u+(c-a)*v+(a-b-c+e)*u*v};
export function gradient(d,x,y){const e=1.2;return[(sample(d,x+e,y)-sample(d,x-e,y))/(2*e),(sample(d,x,y+e)-sample(d,x,y-e))/(2*e)]} // m par maille (y vers le bas)
export function slopePct(d,x,y){const[gx,gy]=gradient(d,x,y);return Math.hypot(gx,gy)/d.cellM*100}

/* ---------- courbes de niveau (marching squares + chaînage) ---------- */
function levelChains(d,L){
 const{W,H,z}=d,pt=new Map(),adj=new Map();
 const link=(a,b)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(b);(adj.get(b)||adj.set(b,[]).get(b)).push(a)};
 const T=(i,j)=>(j*W+i)*2,Lf=(i,j)=>(j*W+i)*2+1,Rt=(i,j)=>(j*W+i+1)*2+1,B=(i,j)=>((j+1)*W+i)*2;
 for(let j=0;j<H-1;j++)for(let i=0;i<W-1;i++){
  const a=z[j*W+i],b=z[j*W+i+1],c=z[(j+1)*W+i+1],e=z[(j+1)*W+i];
  const m=(a>=L?1:0)|(b>=L?2:0)|(c>=L?4:0)|(e>=L?8:0);if(m===0||m===15)continue;
  const P=(id)=>{if(pt.has(id))return id;let x,y;
   if(id===T(i,j)){x=i+(L-a)/(b-a);y=j}else if(id===Lf(i,j)){x=i;y=j+(L-a)/(e-a)}else if(id===Rt(i,j)){x=i+1;y=j+(L-b)/(c-b)}else{x=i+(L-e)/(c-e);y=j+1}
   pt.set(id,[x,y]);return id};
  const t=()=>P(T(i,j)),l=()=>P(Lf(i,j)),r=()=>P(Rt(i,j)),bt=()=>P(B(i,j));
  switch(m){case 1:case 14:link(l(),t());break;case 2:case 13:link(t(),r());break;case 3:case 12:link(l(),r());break;case 4:case 11:link(r(),bt());break;
   case 6:case 9:link(t(),bt());break;case 7:case 8:link(l(),bt());break;
   case 5:{const hi=(a+b+c+e)/4>=L;if(hi){link(t(),r());link(l(),bt())}else{link(l(),t());link(r(),bt())}break}
   case 10:{const hi=(a+b+c+e)/4>=L;if(hi){link(l(),t());link(r(),bt())}else{link(t(),r());link(l(),bt())}break}}
 }
 const seen=new Set(),out=[];
 const walk=(start,closed)=>{const ids=[start];seen.add(start);let prev=-1,cur=start;
  for(;;){const nb=adj.get(cur).filter(n=>n!==prev&&!(n===start&&ids.length<3));let nx=nb.find(n=>!seen.has(n));if(nx===undefined){break}ids.push(nx);seen.add(nx);prev=cur;cur=nx}
  return{pts:ids.map(id=>pt.get(id)),closed:closed}};
 for(const[id,n]of adj)if(n.length===1&&!seen.has(id))out.push(walk(id,false));
 for(const[id]of adj)if(!seen.has(id)){const c=walk(id,true);out.push(c)}
 return out.filter(c=>c.pts.length>=3);
}
const chaikin=(pts,closed)=>{const o=[],n=pts.length;for(let k=0;k<(closed?n:n-1);k++){const a=pts[k],b=pts[(k+1)%n];o.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]])}
 if(!closed){o.unshift(pts[0]);o.push(pts[n-1])}return o};
export function contours(d,eq){const key=eq;if(d._ct[key])return d._ct[key];const out=[];
 for(let L=Math.ceil((d.zmin+1e-3)/eq)*eq;L<d.zmax;L+=eq){const ch=levelChains(d,L+1e-4).map(c=>({...c,pts:chaikin(c.pts,c.closed)}));if(ch.length)out.push({level:L,chains:ch})}
 d._ct[key]=out;return out}
export const indexStep=eq=>({5:25,10:50,20:100,25:100,40:200,50:250,100:500}[eq]||eq*5);

/* ---------- analyse : écoulements, talwegs, crêtes, sommets, cols, cuvettes ---------- */
const NB=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function priorityFlood(z,W,H,keep){ // remplissage des petites dépressions
 const out=Float32Array.from(z),vis=new Uint8Array(W*H),heap=[];
 const push=i=>{heap.push(i);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(out[heap[p]]<=out[heap[k]])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
 const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let k=0;for(;;){let a=2*k+1,b=a+1,m=k;if(a<heap.length&&out[heap[a]]<out[heap[m]])m=a;if(b<heap.length&&out[heap[b]]<out[heap[m]])m=b;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return t};
 for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(i===0||j===0||i===W-1||j===H-1){vis[j*W+i]=1;push(j*W+i)}
 while(heap.length){const c=pop(),ci=c%W,cj=(c/W)|0;for(const[dx,dy]of NB){const x=ci+dx,y=cj+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x;if(vis[n])continue;vis[n]=1;if(out[n]<=out[c])out[n]=out[c]+1e-3;push(n)}}
 return out}
function accumulate(z,W,H,fillMax){
 let zf=priorityFlood(z,W,H);if(fillMax!=null){for(let k=0;k<z.length;k++)if(zf[k]-z[k]>fillMax)zf[k]=z[k]}
 const order=[...Array(W*H).keys()].sort((a,b)=>zf[b]-zf[a]),dir=new Int32Array(W*H).fill(-1),acc=new Float32Array(W*H).fill(1);
 for(const k of order){const i=k%W,j=(k/W)|0;let best=-1,bd=0;for(const[dx,dy]of NB){const x=i+dx,y=j+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x,dr=(zf[k]-zf[n])/Math.hypot(dx,dy);if(dr>bd){bd=dr;best=n}}dir[k]=best;if(best>=0)acc[best]+=acc[k]}
 const fill=new Float32Array(W*H);for(let k=0;k<W*H;k++)fill[k]=zf[k]-z[k];return{acc,dir,fill}}
export function analyze(d){if(d._an)return d._an;const{W,H,z}=d;const rel=d.zmax-d.zmin;
 const fl=accumulate(z,W,H,rel*.05);const neg=new Float32Array(z.length);for(let k=0;k<z.length;k++)neg[k]=-z[k];const rd=accumulate(neg,W,H,rel*.05);
 const thr=(d.params&&d.params.valleys!=null)?Math.round(260-150*d.params.valleys):200;
 const summits=[],pits=[],saddles=[];const R=7;
 for(let j=R;j<H-R;j++)for(let i=R;i<W-R;i++){const v=z[j*W+i];let mx=true,mn=true;
  for(let dj=-R;dj<=R&&(mx||mn);dj+=1)for(let di=-R;di<=R;di+=1){if(!di&&!dj)continue;const u=z[(j+dj)*W+i+di];const tie=u===v&&(dj<0||(dj===0&&di<0));if(u>v||tie)mx=false;if(u<v||tie)mn=false;if(!mx&&!mn)break}
  if(!mx&&!mn)continue;let rs=0;for(let a=0;a<12;a++)rs+=sample(d,i+Math.cos(a*Math.PI/6)*11,j+Math.sin(a*Math.PI/6)*11);rs/=12;
  if(mx&&v-rs>.05*rel&&v>d.zmin+.15*rel)summits.push({x:i,y:j,z:v});if(mn&&rs-v>.04*rel)pits.push({x:i,y:j,z:v})}
 const thin=(a,min,sortf)=>{a.sort(sortf);const o=[];for(const p of a)if(o.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>min))o.push(p);return o};
 const S=thin(summits,16,(a,b)=>b.z-a.z).slice(0,8),Pt=thin(pits,16,(a,b)=>a.z-b.z).slice(0,5);
 // cols : selles (4 changements de signe sur un anneau) situées près d'une crête
 const ring=[];for(let a=0;a<16;a++)ring.push([Math.cos(a*Math.PI/8)*4,Math.sin(a*Math.PI/8)*4]);
 const sd=[];for(let j=6;j<H-6;j+=2)for(let i=6;i<W-6;i+=2){const v=sample(d,i,j);let ch=0,prev=sample(d,i+ring[15][0],j+ring[15][1])>v,amp=0;
  for(const[rx,ry]of ring){const u=sample(d,i+rx,j+ry);amp=Math.max(amp,Math.abs(u-v));const s=u>v;if(s!==prev)ch++;prev=s}
  if(ch===4&&amp>.03*rel&&rd.acc[j*W+i]>12)sd.push({x:i,y:j,z:v})}
 const C=thin(sd,14,(a,b)=>b.z-a.z).slice(0,6);
 const river=new Uint8Array(W*H),eps=.0012*rel;for(let j=3;j<H-3;j++)for(let i=3;i<W-3;i++){const q=j*W+i;if(fl.acc[q]<thr)continue;if(fl.fill[q]>.02&&d.type!=='cuvette')continue;let av=0;for(const[dx,dy]of NB)av+=z[(j+dy*3)*W+i+dx*3];if(av/8-z[q]>eps)river[q]=1}
 {const lab=new Int32Array(W*H);for(let q0=0;q0<W*H;q0++){if(!river[q0]||lab[q0])continue;const st=[q0],comp=[q0];lab[q0]=1;while(st.length){const c=st.pop(),ci=c%W,cj=(c/W)|0;for(const[dx,dy]of NB){const x=ci+dx,y=cj+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x;if(river[n]&&!lab[n]){lab[n]=1;st.push(n);comp.push(n)}}}if(comp.length<28)for(const c of comp)river[c]=0}}
 d._an={river,fill:fl.fill,acc:fl.acc,dir:fl.dir,racc:rd.acc,thr,summits:S,pits:Pt,saddles:C};return d._an}

/* ---------- profil exact le long de AB (coordonnées en mailles) ---------- */
export function profileAlong(d,A,B,n=500){const L=Math.hypot(B.x-A.x,B.y-A.y)*d.cellM,out=[];for(let k=0;k<=n;k++){const t=k/n;out.push({t,s:t*L,x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t,z:sample(d,A.x+(B.x-A.x)*t,A.y+(B.y-A.y)*t)})}return out}
export function crossings(d,A,B,eq){const P=profileAlong(d,A,B,1200),c=[];
 for(let k=1;k<P.length;k++){const a=P[k-1].z,b=P[k].z;if(a===b)continue;const lo=Math.min(a,b),hi=Math.max(a,b);
  for(let L=Math.ceil(lo/eq)*eq;L<=hi;L+=eq){if(L<lo)continue;if(L===lo&&a<b&&false)continue;const u=(L-a)/(b-a),t=P[k-1].t+(P[k].t-P[k-1].t)*u;if(u<0||u>1)continue;c.push({t,s:t*P[P.length-1].s,z:L,x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t})}}
 return c.sort((p,q)=>p.t-q.t)}
export function extremes(P,minProm){ // extrema locaux du profil (lissage léger)
 const z=P.map(p=>p.z),n=z.length,sm=z.map((_,i)=>{let s=0,c=0;for(let k=-4;k<=4;k++){const j=i+k;if(j>=0&&j<n){s+=z[j];c++}}return s/c}),e=[];
 for(let i=6;i<n-6;i++){const isMax=sm[i]>=sm[i-1]&&sm[i]>sm[i+1],isMin=sm[i]<=sm[i-1]&&sm[i]<sm[i+1];if(isMax||isMin)e.push({i,s:P[i].s,t:P[i].t,z:z[i],max:isMax})}
 // prominence : on garde ceux dont l'écart avec les extrema voisins dépasse minProm
 const keep=[];for(let k=0;k<e.length;k++){const p=e[k],prevZ=k?e[k-1].z:z[0],nextZ=k<e.length-1?e[k+1].z:z[n-1];const prom=Math.min(Math.abs(p.z-prevZ),Math.abs(p.z-nextZ));if(prom>=minProm)keep.push(p)}
 return keep}
export function suggestLine(d,eq,R=Math.random,tries=120){let best=null,bs=-1e9;const L0=60,L1=135;
 for(let k=0;k<tries;k++){const a=R()*Math.PI*2,len=L0+R()*(L1-L0),cx=20+R()*(d.W-40),cy=15+R()*(d.H-30),A={x:cx-Math.cos(a)*len/2,y:cy-Math.sin(a)*len/2},B={x:cx+Math.cos(a)*len/2,y:cy+Math.sin(a)*len/2};
  if(A.x<4||B.x<4||A.y<4||B.y<4||A.x>d.W-5||B.x>d.W-5||A.y>d.H-5||B.y>d.H-5)continue;
  const c=crossings(d,A,B,eq).length,P=profileAlong(d,A,B,200),ex=extremes(P,eq*.4).length;const sc=Math.min(c,24)+ex*3-Math.abs(c-16)*.2;if(c>=6&&sc>bs){bs=sc;best={A,B}}}
 return best}
