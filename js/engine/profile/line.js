/* Moteur de profil — géométrie du trait A–B : profil exact, intersections avec les courbes, extrema, trait suggéré.
   Coordonnées en mailles (1 maille = 1 mm sur la carte). L'aléa (suggestLine) est injecté : R est obligatoire. */
import {sample} from '../terrain/dem.js';
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
export function suggestLine(d,eq,R,tries=120){let best=null,bs=-1e9;const L0=60,L1=135;
 for(let k=0;k<tries;k++){const a=R()*Math.PI*2,len=L0+R()*(L1-L0),cx=20+R()*(d.W-40),cy=15+R()*(d.H-30),A={x:cx-Math.cos(a)*len/2,y:cy-Math.sin(a)*len/2},B={x:cx+Math.cos(a)*len/2,y:cy+Math.sin(a)*len/2};
  if(A.x<4||B.x<4||A.y<4||B.y<4||A.x>d.W-5||B.x>d.W-5||A.y>d.H-5||B.y>d.H-5)continue;
  const c=crossings(d,A,B,eq).length,P=profileAlong(d,A,B,200),ex=extremes(P,eq*.4).length;const sc=Math.min(c,24)+ex*3-Math.abs(c-16)*.2;if(c>=6&&sc>bs){bs=sc;best={A,B}}}
 return best}

/* Trait de coupe « pédagogique » : court (lisible en projection), avec un nombre de croisements borné et au moins exMin extrema marqués.
   Même contrat que suggestLine : l'aléa R est injecté, aucune horloge. Renvoie {A,B,cross,P} ou null. */
export function pickLine(d,eq,R,{lenMin=40,lenMax=75,cMin=8,cMax=14,exMin=2,tries=300,minGap=3}={}){
 let best=null,bs=-1e9;
 for(let k=0;k<tries;k++){const a=R()*Math.PI*2,len=lenMin+R()*(lenMax-lenMin),cx=20+R()*(d.W-40),cy=15+R()*(d.H-30),A={x:cx-Math.cos(a)*len/2,y:cy-Math.sin(a)*len/2},B={x:cx+Math.cos(a)*len/2,y:cy+Math.sin(a)*len/2};
  if(A.x<4||B.x<4||A.y<4||B.y<4||A.x>d.W-5||B.x>d.W-5||A.y>d.H-5||B.y>d.H-5)continue;
  const cross=crossings(d,A,B,eq);if(cross.length<cMin||cross.length>cMax)continue;
  /* lisible en projection : pas de points tassés (minGap mailles = mm de carte) ni de triplet à la même altitude */
  if(cross.some((c,i)=>i&&Math.hypot(c.x-cross[i-1].x,c.y-cross[i-1].y)<minGap)||cross.some((c,i)=>i>1&&c.z===cross[i-1].z&&c.z===cross[i-2].z))continue;
  const P=profileAlong(d,A,B,300),ex=extremes(P,eq*.4).length;if(ex<exMin)continue;
  const dup=cross.some((c,i)=>i&&c.z===cross[i-1].z),sc=ex*3+(dup?4:0)-Math.abs(cross.length-11)*.5;
  if(sc>bs){bs=sc;best={A,B,cross,P}}}
 return best}
