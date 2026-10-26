/* Progression locale (localStorage) : XP, niveaux, badges, compétences, temps, historique */
const KEY='geocarto2';
export const LEVELS=[{n:'Débutant',xp:0,i:'🌱'},{n:'Apprenti',xp:150,i:'📏'},{n:'Intermédiaire',xp:400,i:'🧭'},{n:'Avancé',xp:800,i:'⛰️'},{n:'Expert',xp:1400,i:'🛰️'},{n:'Maître cartographe',xp:2200,i:'👑'}];
import {SKILLS} from '../data/skills.js';export {SKILLS};
import {updateSkill,chapterCriteria} from '../engine/pedagogy/mastery.js';
import {CH,EXO_GOAL,QUIZ_GOAL,ACT_GOAL} from '../data/chapters.js';
export const BADGES=[
 {id:'courbes',n:'Expert des courbes de niveau',i:'🟤',d:'Maîtrise ≥ 75 % sur au moins 8 exercices de courbes de niveau.',ok:s=>sk(s,'courbes',8,.75)},
 {id:'pentes',n:'Expert des pentes',i:'📐',d:'Maîtrise ≥ 75 % sur au moins 8 exercices de pente.',ok:s=>sk(s,'pente',8,.75)},
 {id:'profils',n:'Expert des profils topographiques',i:'📈',d:'3 profils à plus de 80 / 100 en mode Intermédiaire ou Expert.',ok:s=>s.profiles.filter(p=>p.score>=80&&p.mode!=='debutant').length>=3},
 {id:'cartographe',n:'Cartographe avancé',i:'🗺️',d:'Quiz des modules 1 et 2 réussis à 80 % et 10 leçons terminées.',ok:s=>(s.quiz.m1?.best||0)>=.8&&(s.quiz.m2?.best||0)>=.8&&Object.keys(s.done).length>=10},
 {id:'maitre',n:'Maître du relief',i:'👑',d:'Obtenir les 4 badges experts et atteindre le niveau Expert.',ok:s=>['courbes','pentes','profils','cartographe'].every(b=>s.badges[b])&&levelOf(s.xp)>=4},
 {id:'premier',n:'Premier profil',i:'✏️',d:'Terminer un profil topographique.',ok:s=>s.profiles.length>=1},
 {id:'parfait',n:'Profil quasi parfait',i:'🎯',d:'Obtenir 92 / 100 ou plus (hors mode Débutant).',ok:s=>s.profiles.some(p=>p.score>=92&&p.mode!=='debutant')},
 {id:'explorateur',n:'Explorateur 3D',i:'🌄',d:'Réussir 3 missions du Terrain virtuel.',ok:s=>(s.misc.missions||0)>=3},
 {id:'inverse',n:'Pensée inversée',i:'🔄',d:'Réussir 4 défis de construction inverse.',ok:s=>(s.misc.inverse||0)>=4},
 {id:'geologue',n:'Géologue de terrain',i:'🪨',d:'Valider les chapitres de cartes et coupes géologiques.',ok:s=>['geo1','geo2','geo3','coupe1','coupe2'].every(c=>s.ch[c]?.ok)},
 {id:'defi',n:'Relève-défi',i:'🏁',d:'Terminer un défi hebdomadaire.',ok:s=>Object.keys(s.weekly).length>=1},
 {id:'projet',n:'Projet abouti',i:'🎓',d:'Rendre un projet final noté ≥ 60.',ok:s=>(s.project.score||0)>=60},
 {id:'serie',n:'Série de 3 jours',i:'🔥',d:'Apprendre 3 jours de suite.',ok:s=>s.streak.n>=3}];
const sk=(s,k,n,m)=>(s.skills[k]?.n||0)>=n&&(s.skills[k]?.m||0)>=m;
const blank=()=>({sections:[],ch:{},errors:{},portfolio:{items:[],notes:{}},weekly:{},project:{},who:{name:'',cls:''},xp:0,done:{},quiz:{},skills:{},exos:{n:0,ok:0},profiles:[],badges:{},minutes:{},streak:{last:'',n:0},misc:{},settings:{mode:'intermediaire',fs:1,contrast:false,big:false,motion:false}});
let S=blank();try{S={...blank(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){}
const L=new Set();
export const state=()=>S;
export const on=f=>(L.add(f),()=>L.delete(f));
const emit=(t,p)=>L.forEach(f=>f(t,p));
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
export const levelOf=xp=>LEVELS.reduce((a,l,i)=>xp>=l.xp?i:a,0);
const today=()=>new Date().toISOString().slice(0,10);
export function addXp(n,why=''){const before=levelOf(S.xp);S.xp+=Math.max(0,Math.round(n));const after=levelOf(S.xp);touchStreak();save();emit('xp',{n,why});if(after>before)emit('level',LEVELS[after]);checkBadges()}
function touchStreak(){const t=today();if(S.streak.last===t)return;const y=new Date(Date.now()-864e5).toISOString().slice(0,10);S.streak.n=S.streak.last===y?S.streak.n+1:1;S.streak.last=t}
export function checkBadges(){for(const b of BADGES)if(!S.badges[b.id]&&b.ok(S)){S.badges[b.id]=Date.now();save();emit('badge',b)}}
export function skill(k,ok){S.skills[k]=updateSkill(S.skills[k],ok,Date.now());S.exos.n++;if(ok)S.exos.ok++;save();checkBadges()}
export function lessonDone(id){if(S.done[id])return;S.done[id]=Date.now();save();addXp(15,'leçon');emit('progress')}
export function quizResult(id,score){const q=S.quiz[id]||{best:0,n:0};q.best=Math.max(q.best,score);q.last=score;q.n++;S.quiz[id]=q;save();addXp(Math.round(score*30),'quiz');emit('progress');checkBadges()}
export function profileResult(r){S.profiles.push({t:Date.now(),...r});S.profiles=S.profiles.slice(-60);save();skill('profils',r.score>=70);addXp(Math.round(r.score*({debutant:.25,intermediaire:.5,expert:.8}[r.mode]||.5)),'profil');emit('progress')}
export function coupeResult(r){S.sections.push({t:Date.now(),...r});S.sections=S.sections.slice(-40);save();addXp(Math.round(r.score*.4),'coupe géologique');emit('progress')}
export function misc(k,n=1){S.misc[k]=(S.misc[k]||0)+n;save();checkBadges()}
export function setting(k,v){S.settings[k]=v;save()}
export function reset(){S=blank();save();emit('progress')}
export const exportJson=()=>JSON.stringify(S);
export function importJson(t){try{const o=JSON.parse(t);if(typeof o.xp!=='number')return false;S={...blank(),...o};save();emit('progress');return true}catch(e){return false}}
/* temps d'apprentissage : on compte les minutes d'activité réelle */
let last=Date.now(),acc=0;['pointerdown','keydown','scroll','touchstart'].forEach(e=>addEventListener(e,()=>last=Date.now(),{passive:true}));
setInterval(()=>{if(document.visibilityState!=='visible'||Date.now()-last>60000)return;acc+=10;if(acc>=30){const t=today();S.minutes[t]=(S.minutes[t]||0)+acc/60;acc=0;save()}},10000);
export const totalMinutes=()=>Object.values(S.minutes).reduce((a,b)=>a+b,0);
export function progressPct(){const ids=Object.keys(CH);return Math.round(ids.filter(i=>S.ch[i]&&S.ch[i].ok).length/ids.length*100)}

/* ---------- chapitres : validation ---------- */
const chs=id=>S.ch[id]||(S.ch[id]={theory:0,example:0,act:0,exo:0,exoOk:0,quiz:0,ok:0});
export const chapter=id=>chs(id);
export function chapterSet(id,k,v=1){const c=chs(id);if(k==='act')c.act=Math.min(99,(c.act||0)+1);else c[k]=v;save();emit('chapter',id)}
export function chapterExo(id,ok){const c=chs(id);c.exo++;if(ok)c.exoOk++;save();emit('chapter',id)}
export function chapterQuiz(id,score){const c=chs(id);c.quiz=Math.max(c.quiz,score);save();emit('chapter',id);quizResult('q_'+id,score)}
export const criteria=id=>{const c=chs(id),cr=chapterCriteria(c,{act:ACT_GOAL,exo:EXO_GOAL,quiz:QUIZ_GOAL}),T={theory:'Théorie lue',example:'Exemple travaillé étudié',act:`Activité interactive manipulée (${cr[2].have}/${ACT_GOAL} actions)`,exo:`Exercices du chapitre : ${cr[3].have}/${EXO_GOAL} réussis`,quiz:`Quiz du chapitre ≥ ${QUIZ_GOAL*100} % (meilleur : ${Math.round(c.quiz*100)} %)`};return cr.map(x=>({k:x.k,t:T[x.k],ok:x.ok}))};
export function validateChapter(id){const c=chs(id);if(c.ok||!criteria(id).every(x=>x.ok))return false;c.ok=Date.now();S.done[CH[id].mod+'/'+id]=Date.now();save();addXp(40,'chapitre validé');emit('progress');checkBadges();return true}
export const validatedCount=()=>Object.values(S.ch).filter(c=>c.ok).length;
/* ---------- erreurs, portfolio, défis, projet, identité ---------- */
export function addError(id){S.errors[id]=(S.errors[id]||0)+1;save();emit('errors')}
export function addPortfolio(it){S.portfolio.items.unshift({id:Date.now().toString(36),t:Date.now(),...it});S.portfolio.items=S.portfolio.items.slice(0,24);save();emit('progress')}
export function setNote(id,txt){S.portfolio.notes[id]=txt;save()}
export function weeklyDone(key,r){const o=S.weekly[key]||{};S.weekly[key]={...o,...r};save();addXp(r.bonus||0,'défi');checkBadges();emit('progress')}
export function setProject(p){S.project={...S.project,...p};save();checkBadges();emit('progress')}
export function setWho(n,c){S.who={name:n,cls:c};save()}
export function report(){const s=S;return{v:1,name:s.who.name,cls:s.who.cls,t:Date.now(),xp:s.xp,level:levelOf(s.xp),min:Math.round(totalMinutes()),skills:Object.fromEntries(Object.entries(s.skills).map(([k,e])=>[k,{n:e.n,m:Math.round(e.m*100)}])),ch:Object.fromEntries(Object.entries(s.ch).map(([k,c])=>[k,{ok:c.ok?1:0,exo:c.exo,exoOk:c.exoOk,quiz:Math.round(c.quiz*100)}])),profiles:s.profiles.slice(-12).map(p=>({t:p.t,score:p.score,mode:p.mode,type:p.type})),sections:s.sections.slice(-8).map(p=>({t:p.t,score:p.score,mode:p.mode})),errors:s.errors,project:s.project,weekly:s.weekly,badges:Object.keys(s.badges)}}
