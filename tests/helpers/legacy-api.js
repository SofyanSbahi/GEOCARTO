/* Adaptateur « ORACLE » : expose le CODE HISTORIQUE (tests/legacy/js) derrière l'API commune de golden-cases.
   Le profil (papier, évaluation, diagnostic) vivait dans des fermetures de pages/profile.js : on en extrait le TEXTE
   à l'exécution et on l'évalue tel quel — aucune réécriture, donc aucun biais. */
import './shim-dom.js';
import fs from 'node:fs';
import {NOW_MS,STATES} from './states.js';
import {sha,stable} from './hash.js';
const L='../legacy/js/';
const T=await import(L+'core/terrain.js'),U=await import(L+'core/util.js'),G=await import(L+'core/geol.js'),
 ST=await import(L+'core/store.js'),AD=await import(L+'core/adapt.js'),EX=await import(L+'pages/exos.js'),ER=await import(L+'data/errors.js');
const SRC=fs.readFileSync(new URL('../legacy/js/pages/profile.js',import.meta.url),'utf8');
const lines=SRC.split('\n');
const grab=(startPrefix,endTest)=>{const a=lines.findIndex(l=>l.startsWith(startPrefix));if(a<0)throw new Error('oracle: début introuvable '+startPrefix);let b=a;while(!endTest(lines[b])){b++;if(b>=lines.length)throw new Error('oracle: fin introuvable '+startPrefix)}return lines.slice(a,b+1).join('\n')};
const paperGeomSrc=grab(' function paperGeom(){',l=>true);
const evaluateSrc=grab(' function evaluate(){',l=>l.trimEnd().endsWith('P,g}}'));
const diagSrc=grab('  const mmErr=R.mae/S.vm*10,diag=[];',l=>l.startsWith("  if(!diag.length)diag.push("));
const curveSrc=SRC.slice(SRC.indexOf('export function curveFn'),SRC.indexOf('export default async function')).replace('export function','function');
const re=(r,label)=>{const m=SRC.match(r);if(!m)throw new Error('oracle: motif introuvable '+label);return m};
const optsExpr=re(/opts=(\[hs\(\),[^\]]*\]\.map\(v=>Math\.round\(v\*10\)\/10\))/,'opts')[1];
const recExpr=re(/const rec=(opts\.reduce\([^;]*\));/,'rec')[1];
const defM=re(/S\.vm=(S\.mode==='expert'\?opts\[0\]:rec);S\.z0=([^}]*)\}/,'defaults');
const zOptsSrc=re(/zOpts=\[\];(for\(let z=[^;]*;[^;]*;[^)]*\)zOpts\.push\(z\);)/,'zOpts')[1];
const okExpr=re(/const ok=(hcm<=24[^;]*);/,'ok')[1];
const reasonExpr=re(/\(ok\?'👍 Bon choix\.':\((hcm>24\?[^]*?Origine trop basse : papier gaspillé\.')\)\)/,'reason')[1];

const mkSetupFns=new Function('profileAlong','PAD','extremes','clamp','fr','byId','S','dirs',`
 const hs=()=>S.scaleN/100;const LCM=()=>Math.hypot(S.B.x-S.A.x,S.B.y-S.A.y)/10;
 ${curveSrc}
 ${paperGeomSrc}
 ${evaluateSrc}
 const R=evaluate();const added=[];const addError=id=>added.push(id);
 ${diagSrc}
 return{R,diag,detected:[...detected],added};`);
const choicesFn=new Function('profileAlong','S','hs',`
 const P=profileAlong(S.dem,S.A,S.B,300),zs=P.map(p=>p.z),lo=Math.min(...zs),hi=Math.max(...zs),rel=hi-lo;
 const opts=${optsExpr};const rec=${recExpr};
 S.vm=${defM[1]};S.z0=${defM[2]};
 const zOpts=[];${zOptsSrc}
 return{lo,hi,opts,rec,zOpts,vm:S.vm,z0:S.z0};`);
const checkFn=new Function('profileAlong','PAD','S','mode',`
 const hs=()=>S.scaleN/100;const LCM=()=>Math.hypot(S.B.x-S.A.x,S.B.y-S.A.y)/10;
 ${paperGeomSrc}
 const P=profileAlong(S.dem,S.A,S.B,300),zs=P.map(p=>p.z),lo=Math.min(...zs),hi=Math.max(...zs),rel=hi-lo;
 const g=paperGeom(),fill=rel/S.vm*10/g.hmm,hcm=g.Hmm/10;const ok=${okExpr};
 const msg=${reasonExpr};
 return{ok,msg,fill,hcm};`);
const REASON={'Trop haut pour la feuille : augmente les m par cm.':'tooTall','Profil trop aplati : diminue les m par cm.':'tooFlat',"L'origine est AU-DESSUS du point le plus bas !":'originAbove','Origine trop basse : papier gaspillé.':'originLow'};
const PADv={l:15,r:15,t:10,b:14};

export const summarize=(R,diag,errorIds)=>({score:R.score,shape:R.shape,pointsScore:R.pointsScore,exs:R.exs,setup:R.setup,mae:R.mae,rmse:R.rmse,max:R.max,maxS:R.maxS,bias:R.bias,precision:R.precision,tol:R.tol,got:R.got,tot:R.tot,
 errs:sha(JSON.stringify(stable(R.errs,5))),ex:stable(R.ex,5),P:sha(JSON.stringify(stable(R.P,4))),g:stable({lo:R.g.lo,hi:R.g.hi,zTop:R.g.zTop,Wmm:R.g.Wmm,Hmm:R.g.Hmm,hmm:R.g.hmm},5),diag,errorIds});

const sk=ST.skill;
const withState=(st,f)=>{ST.reset();ST.importJson(JSON.stringify(st));const realNow=Date.now;Date.now=()=>NOW_MS;try{return f()}finally{Date.now=realNow}};
export const api={
 TYPES:T.TYPES,FORMS:T.FORMS,makeDem:T.makeDem,demFromForm:T.demFromForm,transformDem:T.transformDem,contours:T.contours,autoEq:T.autoEq,analyze:T.analyze,indexStep:T.indexStep,niceEq:T.niceEq,
 profileAlong:T.profileAlong,crossings:T.crossings,extremes:T.extremes,suggestLine:(d,eq,R)=>T.suggestLine(d,eq,R),rng:U.rng,curveFn:(p,s)=>eval('('+curveSrc.replace(/^function curveFn/,'function curveFn')+')')(p,s),
 paperChoices:({dem,A,B,eq,mode})=>{const S={dem,A,B,eq,mode,scaleN:dem.scaleN};const r=choicesFn(T.profileAlong,S,()=>S.scaleN/100);return r},
 paperCheck:({dem,A,B,eq,vm,z0})=>{const S={dem,A,B,eq,vm,z0,scaleN:dem.scaleN};const r=checkFn(T.profileAlong,PADv,S);return{ok:r.ok,reason:r.ok?'ok':REASON[r.msg],fill:r.fill,hcm:r.hcm}},
 profileRun:({dem,A,B,eq,vm,z0,pts,smooth,marks,cross,hints,mode})=>{const S={dem,A,B,eq,vm,z0,pts,smooth,marks,cross,hints,mode,scaleN:dem.scaleN};
  const r=mkSetupFns(T.profileAlong,PADv,T.extremes,U.clamp,U.fr,ER.byId,S);return summarize(r.R,r.diag,r.added)},
 KINDS:G.KINDS,makeGeology:G.makeGeology,sectionGrid:G.sectionGrid,boundaries:G.boundaries,apparentDip:G.apparentDip,planeFrom3:G.planeFrom3,
 Gens:Object.fromEntries(AD.ORDER.filter(EX.chapterHasExo).map(c=>[c,1])),
 pickExoPlain:(ch,seed)=>{ /* l'ancien code mélangeait avec Math.random : on le branche sur le flux dérivé de la graine, comme le fait le nouveau moteur */
  const r=U.rng((seed^0x9E3779B9)>>>0),real=Math.random;Math.random=r;try{const ex=EX.pickExo(ch,seed),{visual,figure,...data}=ex;return{data,hasFigure:typeof visual==='function'}}finally{Math.random=real}},
 skillSeq:oks=>withState(STATES[0],()=>{oks.forEach(ok=>sk('courbes',ok));return stable(ST.state().skills.courbes)}),
 STATES,recommendFor:st=>withState(st,()=>stable(AD.recommend())),
 criteriaFor:st=>withState(st,()=>stable(['def','echelle','courbes'].map(c=>ST.criteria(c))))
};
