/* Cas de caractérisation des moteurs. `compute(api)` renvoie un objet JSON-stable.
   - tools/make-golden.mjs l'exécute sur le CODE HISTORIQUE (tests/legacy) → tests/golden/engines.json  (la référence)
   - tests/golden.test.js l'exécute sur les NOUVEAUX moteurs et exige l'égalité exacte.
   Toute différence = changement de comportement : à justifier, versionner (ENGINE_VERSION) et re-générer. */
import {sha,stable} from './helpers/hash.js';

const SEEDS=[1,2,3,7,42,1234,99999];
const SUBSET=[['montagne',1],['vallee',2],['volcan',42],['complexe',7],['bassin',3],['cuvette',1234],['plateau',99999]];

export function compute(api){
 const out={dem:{},forms:{},transform:{},contours:{},analysis:{},lines:{},curve:{},paper:{},profile:{},geology:{},exo:{},mastery:{},recommend:{},criteria:{}};

 /* ---- terrain ---- */
 for(const type of Object.keys(api.TYPES))for(const seed of SEEDS){
  const d=api.makeDem({type,seed,scaleN:25000});
  out.dem[`${type}-${seed}`]={z:sha(d.z),zmin:d.zmin,zmax:d.zmax,x0:d.x0,y0:d.y0,cellM:d.cellM,params:stable(d.params)}}
 for(const sc of [10000,50000])for(const seed of [1,42]){const d=api.makeDem({type:'montagne',seed,scaleN:sc});out.dem[`sc${sc}-${seed}`]={z:sha(d.z),cellM:d.cellM,x0:d.x0,y0:d.y0}}
 {const d=api.makeDem({type:'volcan',seed:5,relief:500,base:120,slope:1.3,rough:.4,valleys:.6,peaks:3});out.dem['custom']={z:sha(d.z),zmin:d.zmin,zmax:d.zmax}}
 {const d=api.makeDem({type:'inconnu',seed:3});out.dem['badtype']={type:d.type,z:sha(d.z)}}
 for(const name of Object.keys(api.FORMS)){
  const d=api.demFromForm(name,{});out.forms[name]=sha(d.z);
  const e=api.demFromForm(name,{rot:.7,flipH:true,base:100,relief:250,slope:1.2,scaleN:50000});out.forms[name+'~rot']={z:sha(e.z),zmin:e.zmin,zmax:e.zmax,cellM:e.cellM}}
 {const d=api.makeDem({type:'montagne',seed:11});for(const m of['fx','fy','r180'])out.transform[m]=sha(api.transformDem(d,m).z)}

 /* ---- courbes, analyse, profil ---- */
 for(const[type,seed]of SUBSET){
  const d=api.makeDem({type,seed,scaleN:25000}),eq=api.autoEq(d),key=`${type}-${seed}`;
  const ct=api.contours(d,eq);
  out.contours[key]={eq,levels:ct.length,chains:ct.reduce((a,l)=>a+l.chains.length,0),pts:ct.reduce((a,l)=>a+l.chains.reduce((b,c)=>b+c.pts.length,0),0),hash:sha(JSON.stringify(stable(ct,5)))};
  const ct2=api.contours(d,eq*2);out.contours[key+'~2eq']={levels:ct2.length,hash:sha(JSON.stringify(stable(ct2,5)))};
  const an=api.analyze(d);
  out.analysis[key]={thr:an.thr,summits:stable(an.summits),pits:stable(an.pits),saddles:stable(an.saddles),river:sha(an.river),acc:sha(an.acc),fill:sha(an.fill),racc:sha(an.racc),dir:sha(an.dir)};
  const line=api.suggestLine(d,eq,api.rng(seed*7+1));
  const A=line?line.A:{x:20,y:30},B=line?line.B:{x:130,y:70};
  const P=api.profileAlong(d,A,B,300),cr=api.crossings(d,A,B,eq);
  out.lines[key]={A:stable(A),B:stable(B),profile:sha(JSON.stringify(stable(P,4))),crossings:stable(cr,4),extremes:stable(api.extremes(P,eq*.4),4),extremes2:stable(api.extremes(P,eq*.35),4)}}
 for(const eq of [5,10,20,25,40,50,100,7])out.contours['indexStep'+eq]=api.indexStep(eq);
 for(const r of [60,150,300,700,1200])out.contours['niceEq'+r]=api.niceEq(r);
 {const P=[{s:0,z:100},{s:300,z:180},{s:520,z:150},{s:900,z:260},{s:1200,z:200}];
  for(const smooth of[true,false]){const f=api.curveFn(P,smooth);out.curve[smooth?'smooth':'linear']=Array.from({length:61},(_,i)=>+f(i*20-10).toFixed(6))}
  out.curve.one=api.curveFn([{s:0,z:1}],true)===null}

 /* ---- profil : papier, évaluation, diagnostic (production d'élève simulée, déterministe) ---- */
 const modes=['debutant','intermediaire','expert'];let n=0;
 for(const[type,seed]of SUBSET)for(const mode of modes){
  const d=api.makeDem({type,seed,scaleN:25000}),eq=api.autoEq(d),line=api.suggestLine(d,eq,api.rng(seed*7+1));if(!line)continue;
  const{A,B}=line,R=api.rng(seed*131+n++),P=api.profileAlong(d,A,B,300),L=P.at(-1).s;
  const cross=api.crossings(d,A,B,eq);
  const ch=api.paperChoices({dem:d,A,B,eq,mode});
  const key=`${type}-${seed}-${mode}`;
  out.paper[key]={lo:ch.lo,hi:ch.hi,opts:ch.opts,rec:ch.rec,zOpts:ch.zOpts,vm:ch.vm,z0:ch.z0};
  /* quelques réglages de papier, bons et mauvais */
  const checks=[];for(const vmK of[0,1,5])for(const dz of[0,1,-3,2]){const vm=ch.opts[vmK],z0=ch.z0+dz*eq;checks.push({vm,z0,...api.paperCheck({dem:d,A,B,eq,vm,z0})})}
  out.paper[key+'~checks']=stable(checks,5);
  /* production simulée */
  const k=5+Math.floor(R()*9),pts=[{s:0,z:P[0].z+(R()-.5)*eq},{s:L,z:P.at(-1).z+(R()-.5)*eq}];
  for(let i=0;i<k;i++){const t=R(),p=P[Math.round(t*300)];pts.push({s:p.s,z:p.z+(R()-.5)*eq*(mode==='expert'?1.6:.8)})}
  const marks=[];cross.forEach((c,i)=>{if(R()<.85)marks.push({i,t:c.t,s:c.s,z:c.z,zs:R()<.1?c.z+eq:c.z})});
  const smooth=R()<.8,hints=R()<.3?2:0,vm=ch.vm,z0=R()<.8?ch.z0:ch.z0-eq*2;
  const res=api.profileRun({dem:d,A,B,eq,vm,z0,pts,smooth,marks,cross,hints,mode});
  out.profile[key]=res}

 /* production quasi parfaite : exerce la branche « Excellent travail » et les cas sans constat */
 for(const[type,seed]of SUBSET.slice(0,5)){
  const d=api.makeDem({type,seed,scaleN:25000}),eq=api.autoEq(d),line=api.suggestLine(d,eq,api.rng(seed*7+1));if(!line)continue;
  const{A,B}=line,P=api.profileAlong(d,A,B,300),cross=api.crossings(d,A,B,eq),ch=api.paperChoices({dem:d,A,B,eq,mode:'intermediaire'});
  const pts=[];for(let i=0;i<=300;i+=5)pts.push({s:P[i].s,z:P[i].z});
  const marks=cross.map((c,i)=>({i,t:c.t,s:c.s,z:c.z,zs:c.z}));
  out.profile[`${type}-${seed}-good`]=api.profileRun({dem:d,A,B,eq,vm:ch.vm,z0:ch.z0,pts,smooth:true,marks,cross,hints:0,mode:'intermediaire'})}

 /* ---- géologie ---- */
 for(const kind of Object.keys(api.KINDS))for(const seed of [1,5,9]){
  const dem=api.makeDem({type:'complexe',seed:seed+3}),g=api.makeGeology(dem,kind,seed);
  const at=[],att=[];for(let j=2;j<dem.H;j+=9)for(let i=2;i<dem.W;i+=9){at.push(g.at(i,j));const a=g.attitude(i,j);att.push(a?[+a.dip.toFixed(4),a.az==null?null:+a.az.toFixed(4)]:null)}
  const A={x:15,y:20},B={x:140,y:85},sec=api.sectionGrid(g,A,B),bd=api.boundaries(sec,g);
  out.geology[`${kind}-${seed}`]={units:g.units.map(u=>u.id),info:stable(g.info,4),bnd:stable(g.bnd,4),fault:stable(g.fault&&{dipAz:g.fault.dipAz,dip:g.fault.dip,slip:g.fault.slip},4),disc:stable(g.disc,4),pluton:stable(g.pluton,4),dyke:stable(g.dyke,4),at:sha(JSON.stringify(at)),att:sha(JSON.stringify(att)),
   section:{ns:sec.ns,nz:sec.nz,zb:+sec.zb.toFixed(4),zt:+sec.zt.toFixed(4),L:+sec.L.toFixed(4),az:+sec.az.toFixed(4),g:sha(sec.g),sd:sec.sd?sha(sec.sd):null},
   boundaries:[...bd.keys()].sort().map(k=>[k,bd.get(k).length,sha(JSON.stringify(stable(bd.get(k),3)))])}}
 out.geology.apparent=[api.apparentDip(30,90,45),api.apparentDip(25,0,0),api.apparentDip(40,120,30)].map(v=>+v.toFixed(6));
 out.geology.plane=stable(api.planeFrom3([[0,0,100],[100,0,110],[0,100,90]]),6);

 /* ---- exercices : même graine → même tâche (hors fonction de dessin) ---- */
 for(const ch of Object.keys(api.Gens))for(let seed=1;seed<=40;seed++){
  const ex=api.pickExoPlain(ch,seed*37+5);out.exo[`${ch}-${seed}`]=sha(JSON.stringify(stable(ex.data,6)))+(ex.hasFigure?'+fig':'')}

 /* ---- maîtrise, critères, recommandations (via l'état de l'élève) ---- */
 out.mastery.seq=api.skillSeq([1,1,0,1,0,0,1,1,1,0,1]);
 for(const[i,st]of api.STATES.entries()){out.recommend['s'+i]=api.recommendFor(st);out.criteria['s'+i]=api.criteriaFor(st)}
 return out}
