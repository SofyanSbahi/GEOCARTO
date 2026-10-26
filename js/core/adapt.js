/* Expérience Learning : met en mots les recommandations calculées par le moteur pédagogique (engine/pedagogy/recommend.js).
   La logique (quoi recommander, quand) est dans le moteur ; ici : l'état courant, l'horloge et les phrases. */
import {state} from './store.js';
import {SKILLS} from '../data/skills.js';
import {byId} from '../data/errors.js';
import {ORDER,weekKey as engineWeekKey,recommendations} from '../engine/pedagogy/recommend.js';
export {ORDER};
export const weekKey=(d=new Date())=>engineWeekKey(d);
const TEXT={
 next:r=>({i:'➡️',t:`Continuer : chapitre « ${r.chapter} »`,why:'Prochain chapitre non validé du parcours.',href:`#/${r.mod}/${r.chapter}`}),
 weak:r=>({i:'🎯',t:`Renforcer : ${SKILLS[r.skill]}`,why:`Maîtrise estimée ${Math.round(r.mastery*100)} % sur ${r.tries} essais.`,href:`#/exos/${r.chapter}`}),
 error:r=>({i:'🔎',t:`Erreur récurrente : ${byId[r.errorId].t}`,why:`Rencontrée ${r.count} fois. Lis la fiche puis entraîne-toi.`,href:`#/erreurs/${r.errorId}`}),
 review:r=>({i:'🧠',t:`Révision espacée : ${SKILLS[r.skill]}`,why:'Plus de 7 jours sans pratique : quelques exercices suffisent.',href:`#/exos/${r.chapter}`}),
 profileFirst:()=>({i:'✏️',t:'Fais un profil en mode Intermédiaire',why:'Le profil est la compétence centrale du cours.',href:'#/profil'}),
 profileGuided:r=>({i:'📈',t:'Reprends un profil guidé (mode Débutant)',why:`Moyenne récente ${Math.round(r.avg)}/100.`,href:'#/profil'}),
 weekly:()=>({i:'🏁',t:'Défi de la semaine',why:'Un profil et 5 exercices, XP bonus.',href:'#/defi'})};
export function recommend(){
 return recommendations(state(),{now:Date.now(),week:weekKey()}).map(r=>({...TEXT[r.kind](r),p:r.p}))}
