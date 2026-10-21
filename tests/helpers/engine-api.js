/* Adaptateur « NOUVEAU » : expose js/engine/* (et les couches d'expérience minces) derrière la même API que legacy-api.js */
import './shim-dom.js';
import {NOW_MS,STATES} from './states.js';
import {stable} from './hash.js';
import {summarize} from './legacy-api.js';
import * as M from '../../js/engine/math.js';
import * as TE from '../../js/engine/terrain/index.js';
import * as CO from '../../js/engine/contour/index.js';
import * as PR from '../../js/engine/profile/index.js';
import * as GE from '../../js/engine/geology/index.js';
import * as PE from '../../js/engine/pedagogy/index.js';
import {byId} from '../../js/data/errors.js';
import {diagnosisLines} from '../../js/core/profile-text.js';
import * as ST from '../../js/core/store.js';
import * as AD from '../../js/core/adapt.js';
const withState=(st,f)=>{ST.reset();ST.importJson(JSON.stringify(st));const realNow=Date.now;Date.now=()=>NOW_MS;try{return f()}finally{Date.now=realNow}};
export const api={
 TYPES:TE.TYPES,FORMS:TE.FORMS,makeDem:TE.makeDem,demFromForm:TE.demFromForm,transformDem:TE.transformDem,contours:CO.contours,autoEq:TE.autoEq,analyze:TE.analyze,indexStep:CO.indexStep,niceEq:TE.niceEq,
 profileAlong:PR.profileAlong,crossings:PR.crossings,extremes:PR.extremes,suggestLine:(d,eq,R)=>PR.suggestLine(d,eq,R),rng:M.rng,curveFn:PR.curveFn,
 paperChoices:PR.paperChoices,
 paperCheck:({dem,A,B,eq,vm,z0})=>{const c=PR.checkPaper(PR.makeSetup({dem,A,B,eq,vm,z0}));return{ok:c.ok,reason:c.reason,fill:c.fill,hcm:c.hcm}},
 profileRun:({dem,A,B,eq,vm,z0,pts,smooth,marks,cross,hints})=>{const S=PR.makeSetup({dem,A,B,eq,vm,z0}),R=PR.evaluateProfile(S,{pts,smooth,marks,cross,hints}),DG=PR.diagnoseProfile(S,R,{pts,smooth,marks});
  return summarize(R,diagnosisLines(DG.findings,DG.errorIds,{byId}),DG.errorIds)},
 KINDS:GE.KINDS,makeGeology:GE.makeGeology,sectionGrid:GE.sectionGrid,boundaries:GE.boundaries,apparentDip:GE.apparentDip,planeFrom3:GE.planeFrom3,
 Gens:Object.fromEntries(AD.ORDER.filter(PE.chapterHasExo).map(c=>[c,1])),
 pickExoPlain:(ch,seed)=>{const ex=PE.pickExo(ch,seed),{visual,figure,...data}=ex;return{data,hasFigure:figure!==undefined}},
 skillSeq:oks=>withState(STATES[0],()=>{oks.forEach(ok=>ST.skill('courbes',ok));return stable(ST.state().skills.courbes)}),
 STATES,recommendFor:st=>withState(st,()=>stable(AD.recommend())),
 criteriaFor:st=>withState(st,()=>stable(['def','echelle','courbes'].map(c=>ST.criteria(c))))
};
