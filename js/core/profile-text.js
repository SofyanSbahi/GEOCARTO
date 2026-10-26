/* Expérience (français) : met en mots les constats structurés du moteur de profil.
   Stage et Learning peuvent chacun avoir leur propre formulation ; celle-ci est la version « élève ».
   Pour l'arabe / l'anglais : fournir un autre module de même signature. */
import {fr} from './util.js';
const dirW=d=>d==='high'?'trop haut':'trop bas';
export function diagnosisLines(findings,errorIds,{byId}){
 const out=[];
 for(const f of findings){
  if(f.code==='bias')out.push(`Ton profil est en moyenne <b>${dirW(f.dir)}</b> de ${fr(f.meters,0)} m : vérifie la graduation de l'axe des altitudes et l'origine.`);
  else if(f.code==='extrema')out.push(`Sommets / fonds de talweg mal estimés (${f.items.map(e=>(e.max?'sommet':'talweg')+' vers x = '+fr(e.s,0)+' m, écart '+fr(e.err,0)+' m').join(' ; ')}). Entre deux points de même altitude, le profil dépasse la courbe d'environ Éq/2.`);
  else if(f.code==='missing')out.push(`${f.n} intersection(s) non relevée(s) : chaque oubli crée un écart local.`);
  else if(f.code==='maxerr')out.push(`Écart maximal de ${fr(f.meters,0)} m vers x = ${fr(f.s,0)} m (cercle rouge) : relis les courbes à cet endroit.`);
  else if(f.code==='worstSection')out.push(`<b>Tronçon le moins précis : de ${fr(f.s0,0)} à ${fr(f.s1,0)} m</b> (écart moyen ${fr(f.mae,0)} m, ton tracé est en moyenne ${dirW(f.dir)}). ${f.kind==='extremum'?'Il contient un sommet ou un fond : vérifie ton estimation.':f.kind==='steep'?'Forte pente : vérifie le report de chaque intersection.':'Zone peu pentue : sans courbe, interpole avec les points cotés.'}`)}
 if(errorIds.length)out.push('Fiches utiles : '+errorIds.map(i=>`<a href="#/erreurs/${i}">${byId[i].t}</a>`).join(' · '));
 if(!out.length)out.push('Excellent travail : profil précis, extrema bien estimés. 👏');
 return out}
