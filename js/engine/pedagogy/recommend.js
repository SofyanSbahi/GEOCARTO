/* Moteur pédagogique — recommandations adaptatives : prochain chapitre, points faibles, erreurs récurrentes,
   révision espacée. Fonction pure : (état de l'élève, horloge) → liste de recommandations CODÉES.
   Les intitulés sont composés par l'expérience (core/adapt.js pour Learning). */
import {CH} from '../../data/chapters.js';
import {byId} from '../../data/errors.js';
export const ORDER=['def','echelle','orient','coord','courbes','pente','formes','theorie','methode','echelles','auto','geo1','geo2','geo3','coupe1','coupe2'];
/* Clé de semaine ISO (AAAA-Www) pour une date donnée (fuseau local) */
export const weekKey=d=>{const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return `${y}-W${String(w).padStart(2,'0')}`};
export function recommendations(s,{now,week}){const out=[];
 const next=ORDER.find(c=>!(s.ch[c]&&s.ch[c].ok));if(next)out.push({kind:'next',chapter:next,mod:CH[next].mod,p:3});
 const sk=Object.entries(s.skills).filter(([k,e])=>e.n>=3&&e.m<.6).sort((a,b)=>a[1].m-b[1].m)[0];
 if(sk)out.push({kind:'weak',skill:sk[0],mastery:sk[1].m,tries:sk[1].n,chapter:ORDER.find(c=>CH[c].skill===sk[0]),p:5});
 const er=Object.entries(s.errors).sort((a,b)=>b[1]-a[1])[0];if(er&&er[1]>=2&&byId[er[0]])out.push({kind:'error',errorId:er[0],count:er[1],p:4});
 const old=Object.entries(s.skills).filter(([k,e])=>e.last&&now-e.last>7*864e5&&e.m<.9)[0];if(old)out.push({kind:'review',skill:old[0],chapter:ORDER.find(c=>CH[c].skill===old[0]),p:2});
 if(s.profiles.length<3)out.push({kind:'profileFirst',p:3});
 else{const avg=s.profiles.slice(-5).reduce((a,p)=>a+p.score,0)/Math.min(5,s.profiles.length);if(avg<65)out.push({kind:'profileGuided',avg,p:4})}
 if(!s.weekly[week]||!s.weekly[week].done)out.push({kind:'weekly',p:1});
 return out.sort((a,b)=>b.p-a.p).slice(0,4)}
