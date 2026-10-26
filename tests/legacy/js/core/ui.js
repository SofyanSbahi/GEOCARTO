import {h,$} from './util.js';
import {on,LEVELS} from './store.js';
export function toast(html,cls=''){let box=$('#toasts');if(!box){box=h('div',{id:'toasts','aria-live':'polite'});document.body.append(box)}
 const t=h('div',{class:'toast '+cls,html});box.append(t);setTimeout(()=>t.classList.add('out'),3200);setTimeout(()=>t.remove(),3700)}
export function confetti(n=40){const c=h('div',{class:'confetti','aria-hidden':'true'});for(let i=0;i<n;i++){const p=h('i');p.style.cssText=`left:${Math.random()*100}%;background:hsl(${Math.random()*360} 80% 55%);animation-delay:${Math.random()*.4}s;transform:rotate(${Math.random()*360}deg)`;c.append(p)}document.body.append(c);setTimeout(()=>c.remove(),2200)}
on((t,p)=>{if(t==='xp'&&p.n>0)toast(`<b>+${Math.round(p.n)} XP</b> ${p.why?'· '+p.why:''}`,'xp');
 if(t==='badge'){toast(`${p.i} Nouveau badge : <b>${p.n}</b>`,'badge');confetti()}
 if(t==='level'){toast(`${p.i} Niveau <b>${p.n}</b> atteint !`,'badge');confetti(70)}});
export function modal(content,{title='',wide=false}={}){const m=h('div',{class:'modal',role:'dialog','aria-modal':'true'},h('div',{class:'sheet'+(wide?' wide':'')},h('div',{class:'sheet-h'},h('b',{},title),h('button',{class:'icon',onclick:()=>m.remove(),'aria-label':'Fermer'},'✕')),h('div',{class:'sheet-b'},content)));
 m.addEventListener('click',e=>{if(e.target===m)m.remove()});addEventListener('keydown',function k(e){if(e.key==='Escape'){m.remove();removeEventListener('keydown',k)}});document.body.append(m);return m}
export const pill=(txt,cls='')=>`<span class="pill ${cls}">${txt}</span>`;
export function lightbox(src,alt){modal(h('img',{src,alt,class:'lbimg'}),{title:alt,wide:true})}
export function ring(pct,size=84,label=''){const r=size/2-7,c=2*Math.PI*r;return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label||pct+'%'}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="8"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--pri)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct/100)}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .8s"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-weight="800" font-size="${size/4}" fill="var(--ink)">${Math.round(pct)}</text></svg>`}
