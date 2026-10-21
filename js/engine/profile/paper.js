/* Moteur de profil — papier millimétré : échelles, origine, géométrie de la feuille, conversions mm ↔ (s,z).
   Tout est calculé à partir d'un « setup » explicite ; plus aucune fermeture sur un état d'interface. */
import {profileAlong} from './line.js';

export const PAD={l:15,r:15,t:10,b:14}; // marges du papier (mm)
export const MAX_SHEET_CM=24;           // hauteur maximale de la feuille (cm)
export const MIN_FILL=.35;              // taux de remplissage minimal en hauteur

/* setup : {dem, A, B, eq, vm, z0}
   vm = mètres représentés par 1 cm de papier en hauteur ; z0 = altitude de l'origine de l'axe.
   hs = mètres par cm en longueur (échelle de la carte) ; 1 maille = 1 mm sur la carte. */
export function makeSetup({dem,A,B,eq,vm,z0}){
 const hs=dem.scaleN/100,lcm=Math.hypot(B.x-A.x,B.y-A.y)/10,lm=lcm*hs;
 const S={dem,A,B,eq,vm,z0,hs,lcm,lm,ev:hs/vm};
 S.geometry=()=>paperGeometry(S);
 S.toMm=(s,z,g)=>({x:PAD.l+s/hs*10,y:PAD.t+(g.zTop-z)/vm*10});
 S.fromMm=(x,y,g)=>({s:(x-PAD.l)/10*hs,z:g.zTop-(y-PAD.t)/10*vm});
 return S}

export function paperGeometry(S){
 const P=profileAlong(S.dem,S.A,S.B,300),zs=P.map(p=>p.z),lo=Math.min(...zs),hi=Math.max(...zs),
  zTop=Math.ceil(hi/S.eq)*S.eq+S.eq,hmm=(zTop-S.z0)/S.vm*10,Wmm=PAD.l+S.lcm*10+PAD.r,Hmm=PAD.t+hmm+PAD.b;
 return{P,lo,hi,zTop,Wmm,Hmm,hmm}}

/* Choix proposés à l'étudiant : échelles de hauteur, échelle recommandée, origines possibles. */
export function paperChoices({dem,A,B,eq,mode}){
 const hs=dem.scaleN/100,P=profileAlong(dem,A,B,300),zs=P.map(p=>p.z),lo=Math.min(...zs),hi=Math.max(...zs),rel=hi-lo,
  opts=[hs,hs/2,hs/2.5,hs/4,hs/5,hs/10].map(v=>Math.round(v*10)/10),
  rec=opts.reduce((b,v)=>Math.abs(rel/v-9)<Math.abs(rel/b-9)?v:b),
  zBase=Math.floor(lo/eq)*eq,zOpts=[];
 for(let z=zBase-3*eq;z<=zBase+eq;z+=eq)zOpts.push(z);
 return{lo,hi,rel,opts,rec,zOpts,vm:mode==='expert'?opts[0]:rec,z0:zBase}}

/* Le choix d'échelle/origine est-il raisonnable ? reason ∈ ok | tooTall | tooFlat | originAbove | originLow */
export function checkPaper(S){
 const g=paperGeometry(S),rel=g.hi-g.lo,fill=rel/S.vm*10/g.hmm,hcm=g.Hmm/10,
  ok=hcm<=MAX_SHEET_CM&&fill>=MIN_FILL&&S.z0<=g.lo&&S.z0>=g.lo-2*S.eq;
 const reason=ok?'ok':hcm>MAX_SHEET_CM?'tooTall':fill<MIN_FILL?'tooFlat':S.z0>g.lo?'originAbove':'originLow';
 return{ok,reason,fill,hcm,wcm:g.Wmm/10,ev:S.hs/S.vm,geom:g}}

/* Conseil sur le papier — critère ABSOLU.
   checkPaper() reprend le critère historique « remplissage ≥ 35 % », qui ne dépend PAS de l'échelle des hauteurs (vm s'annule dans le rapport) :
   il ne peut donc jamais dire « trop aplati » à cause de vm. paperAdvice() mesure la hauteur réelle du profil sur la feuille (cm).
   reason ∈ ok | originAbove | originLow | tooTall | tooSmall   (priorité dans cet ordre) */
export const MIN_PROFILE_CM=5;
export function paperAdvice(S){
 const g=paperGeometry(S),profileCm=(g.hi-g.lo)/S.vm,sheetCm=g.Hmm/10;
 const reason=S.z0>g.lo?'originAbove':S.z0<g.lo-2*S.eq?'originLow':sheetCm>MAX_SHEET_CM?'tooTall':profileCm<MIN_PROFILE_CM?'tooSmall':'ok';
 return{ok:reason==='ok',reason,profileCm,sheetCm,ev:S.hs/S.vm,geom:g}}
