/* Recommandations adaptatives : points faibles, erreurs récurrentes, révision espacée */
import {state,chapter,SKILLS} from './store.js';
import {CH} from '../data/chapters.js';
import {byId} from '../data/errors.js';
export const ORDER=['def','echelle','orient','coord','courbes','pente','formes','theorie','methode','echelles','auto','geo1','geo2','geo3','coupe1','coupe2'];
const route=ch=>`#/${CH[ch].mod}/${ch}`;
export const weekKey=(d=new Date())=>{const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return `${y}-W${String(w).padStart(2,'0')}`};
export function recommend(){const s=state(),out=[],now=Date.now();
 const next=ORDER.find(c=>!chapter(c).ok);if(next)out.push({i:'➡️',t:`Continuer : chapitre « ${next} »`,why:'Prochain chapitre non validé du parcours.',href:route(next),p:3});
 const sk=Object.entries(s.skills).filter(([k,e])=>e.n>=3&&e.m<.6).sort((a,b)=>a[1].m-b[1].m)[0];
 if(sk){const ch=ORDER.find(c=>CH[c].skill===sk[0]);out.push({i:'🎯',t:`Renforcer : ${SKILLS[sk[0]]}`,why:`Maîtrise estimée ${Math.round(sk[1].m*100)} % sur ${sk[1].n} essais.`,href:`#/exos/${ch}`,p:5})}
 const er=Object.entries(s.errors).sort((a,b)=>b[1]-a[1])[0];if(er&&er[1]>=2&&byId[er[0]])out.push({i:'🔎',t:`Erreur récurrente : ${byId[er[0]].t}`,why:`Rencontrée ${er[1]} fois. Lis la fiche puis entraîne-toi.`,href:`#/erreurs/${er[0]}`,p:4});
 const old=Object.entries(s.skills).filter(([k,e])=>e.last&&now-e.last>7*864e5&&e.m<.9)[0];if(old)out.push({i:'🧠',t:`Révision espacée : ${SKILLS[old[0]]}`,why:'Plus de 7 jours sans pratique : quelques exercices suffisent.',href:`#/exos/${ORDER.find(c=>CH[c].skill===old[0])}`,p:2});
 if(s.profiles.length<3)out.push({i:'✏️',t:'Fais un profil en mode Intermédiaire',why:'Le profil est la compétence centrale du cours.',href:'#/profil',p:3});
 else{const avg=s.profiles.slice(-5).reduce((a,p)=>a+p.score,0)/Math.min(5,s.profiles.length);if(avg<65)out.push({i:'📈',t:'Reprends un profil guidé (mode Débutant)',why:`Moyenne récente ${Math.round(avg)}/100.`,href:'#/profil',p:4})}
 if(!s.weekly[weekKey()]||!s.weekly[weekKey()].done)out.push({i:'🏁',t:'Défi de la semaine',why:'Un profil et 5 exercices, XP bonus.',href:'#/defi',p:1});
 return out.sort((a,b)=>b.p-a.p).slice(0,4)}
