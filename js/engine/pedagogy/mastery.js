/* Moteur pédagogique — maîtrise des compétences et validation des chapitres (fonctions pures sur l'état de l'élève).
   Le temps est TOUJOURS passé en paramètre (now) : pas de Date.now() ici. */
export const EXO_GOAL_DEFAULT=4,QUIZ_GOAL_DEFAULT=.8,ACT_GOAL_DEFAULT=3;

/* Mise à jour d'une compétence après un essai : moyenne mobile exponentielle (poids .22 pour le dernier essai). Renvoie une NOUVELLE entrée. */
export function updateSkill(e,ok,now){const o={n:0,ok:0,m:0,...(e||{})};o.n++;if(ok)o.ok++;o.m=o.n===1?(ok?1:0):o.m*.78+(ok?.22:0);o.last=now;return o}

/* Critères de validation d'un chapitre (codes + mesures ; les libellés sont affaire d'expérience) */
export function chapterCriteria(c,{act=ACT_GOAL_DEFAULT,exo=EXO_GOAL_DEFAULT,quiz=QUIZ_GOAL_DEFAULT}={}){
 return[{k:'theory',ok:!!c.theory},{k:'example',ok:!!c.example},
  {k:'act',ok:c.act>=act,have:Math.min(c.act,act),goal:act},
  {k:'exo',ok:c.exoOk>=exo,have:Math.min(c.exoOk,exo),goal:exo},
  {k:'quiz',ok:c.quiz>=quiz,best:c.quiz,goal:quiz}]}
export const chapterReady=(c,goals)=>chapterCriteria(c,goals).every(x=>x.ok);
