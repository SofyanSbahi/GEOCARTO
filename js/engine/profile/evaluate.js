/* Moteur de profil — évaluation d'un profil d'étudiant contre le profil exact, puis diagnostic STRUCTURÉ.
   Entrée  : setup (makeSetup) + production {pts:[{s,z}], smooth, marks:[{i,t,s,z,zs}], cross:[{t,s,z,x,y}], hints}
   Sortie  : des mesures (evaluateProfile) et des constats codés (diagnoseProfile) — jamais de phrases : la mise en mots
   est le travail de l'expérience (Learning / Stage), ce qui rend possible l'arabe et l'anglais. */
import {clamp} from '../math.js';
import {extremes} from './line.js';
import {curveFn} from './curve.js';
import {paperGeometry} from './paper.js';

export function evaluateProfile(S,{pts:raw,smooth,marks,cross,hints=0}){
 const g=paperGeometry(S),P=g.P,pts=[...raw].sort((a,b)=>a.s-b.s),f=curveFn(pts,smooth);if(!f)return null;
 const eq=S.eq,L=P.at(-1).s;let sum=0,sq=0,mx=0,mxs=0,bias=0,inTol=0;const tol=Math.max(eq/2,S.vm/10);
 const errs=P.map(p=>{const e=f(p.s)-p.z;return{s:p.s,e,z:p.z}});
 errs.forEach(r=>{const a=Math.abs(r.e);sum+=a;sq+=a*a;bias+=r.e;if(a>mx){mx=a;mxs=r.s}if(a<=tol)inTol++});
 const n=errs.length,mae=sum/n;bias/=n;
 const shape=100*(1-Math.pow(clamp(mae/eq,0,1),.85));
 const got=marks.length,tot=cross.length;let hit=0;
 cross.forEach(c=>{const m=marks.find(m=>Math.abs(m.s-c.s)<1e-6);if(m&&Math.abs(f(c.s)-c.z)<=eq*.35)hit++});
 const pointsScore=tot?100*hit/tot:100;
 const ex=extremes(P,eq*.35);let exs=100,exd=[];
 if(ex.length){let a=0;ex.forEach(e=>{const lo=e.s-L*.04,hi=e.s+L*.04;let best=e.max?-1e9:1e9;
  for(let s=lo;s<=hi;s+=L/400){const v=f(clamp(s,0,L));best=e.max?Math.max(best,v):Math.min(best,v)}
  const err=Math.abs(best-e.z);a+=clamp(1-err/eq,0,1);exd.push({...e,err,est:best})});exs=100*a/ex.length}
 const hrel=(g.hi-g.lo)/S.vm*10,fill=hrel/g.hmm;let setup=100;
 if(g.Hmm>240)setup-=40;if(fill<.35)setup-=30;if(S.z0>g.lo)setup-=40;if(S.z0<g.lo-2*S.eq)setup-=20;setup=Math.max(0,setup);
 const score=Math.round(clamp(.55*shape+.2*pointsScore+.15*exs+.1*setup-hints,0,100));
 return{score,shape,pointsScore,exs,setup,mae,rmse:Math.sqrt(sq/n),max:mx,maxS:mxs,bias,precision:100*inTol/n,tol,errs,ex:exd,got,tot,P,g}}

/* Erreurs-types détectées (identifiants de la bibliothèque data/errors.js), dans l'ordre historique */
export function detectErrors(S,R,{pts,smooth,marks}){
 const badEx=R.ex.filter(e=>e.err>S.eq*.6),detected=new Set();
 if(!smooth)detected.add('p-regle');if(badEx.length)detected.add('p-extrema');if(Math.abs(R.bias)>S.eq*.25)detected.add('p-origine');
 if(marks.some(m=>m.zs!==m.z))detected.add('p-altitude');if(R.tot-R.got>=2)detected.add('p-inter');if(pts.length<5)detected.add('p-points');if(R.setup<70)detected.add('p-echelleH');
 {const sorted=[...pts].sort((a,b)=>a.s-b.s),f2=curveFn(sorted,smooth),Lm=R.P.at(-1).s;let em=0,eq2=0;
  if(f2){R.P.forEach(p=>{em+=Math.abs(f2(Lm-p.s)-p.z);eq2+=Math.abs(f2(p.s)-p.z)});
   if(R.mae>S.eq*.5&&em<eq2*.6)detected.add('p-sens')}}
 return[...detected]}

/* Constats structurés, dans l'ordre d'affichage historique.
   code ∈ bias | extrema | missing | maxerr | worstSection */
export function diagnoseProfile(S,R,input){
 const eq=S.eq,findings=[];
 if(Math.abs(R.bias)>eq*.25)findings.push({code:'bias',dir:R.bias>0?'high':'low',meters:Math.abs(R.bias)});
 const badEx=R.ex.filter(e=>e.err>eq*.6);
 if(badEx.length)findings.push({code:'extrema',items:badEx.map(e=>({max:e.max,s:e.s,err:e.err}))});
 if(R.got<R.tot)findings.push({code:'missing',n:R.tot-R.got});
 if(R.max>eq)findings.push({code:'maxerr',meters:R.max,s:R.maxS});
 /* correction assistée par tronçon : analyse algorithmique, pas un modèle de langage */
 const nSec=5,secs=[];
 for(let k=0;k<nSec;k++){const a=R.P.length*k/nSec|0,b=R.P.length*(k+1)/nSec|0,seg=R.errs.slice(a,b),
   mae=seg.reduce((x,y)=>x+Math.abs(y.e),0)/seg.length,bi=seg.reduce((x,y)=>x+y.e,0)/seg.length,zs=R.P.slice(a,b).map(p=>p.z),
   rg=Math.max(...zs)-Math.min(...zs),hasEx=R.ex.some(e=>e.i>=a&&e.i<b);
  secs.push({k,mae,bi,rg,hasEx,s0:R.P[a].s,s1:R.P[Math.min(b,R.P.length-1)].s})}
 const worst=[...secs].sort((a,b)=>b.mae-a.mae)[0];
 if(worst.mae>eq*.3)findings.push({code:'worstSection',s0:worst.s0,s1:worst.s1,mae:worst.mae,dir:worst.bi>0?'high':'low',
   kind:worst.hasEx?'extremum':worst.rg>eq*3?'steep':'flat'});
 return{findings,errorIds:detectErrors(S,R,input),sections:secs}}
