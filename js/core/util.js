/* Utilitaires d'INTERFACE (DOM, canvas, événements). Les fonctions pures (math, formats, azimuts) vivent dans engine/math.js
   et sont réexportées ici pour que les anciens imports continuent de fonctionner. */
import {clamp,lerp,sstep,rng,fr,parseNum,norm,DIRS16,dirName,azimuth,shuffle as _shuffle,pick as _pick} from '../engine/math.js';
export {clamp,lerp,sstep,rng,fr,parseNum,norm,DIRS16,dirName,azimuth};
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function h(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v)}for(const c of kids.flat())if(c!=null)e.append(c.nodeType?c:document.createTextNode(c));return e}
export const shuffle=(a,R=Math.random)=>_shuffle(a,R);
export const pick=(a,R=Math.random)=>_pick(a,R);
export const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const debounce=(f,ms=60)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
export const raf=f=>{let q=0;return(...a)=>{if(q)return;q=requestAnimationFrame(()=>{q=0;f(...a)})}};
/* canvas HiDPI : adapte la résolution interne à la taille CSS */
export function fitCanvas(cv,wCss,hCss){const d=Math.min(window.devicePixelRatio||1,2.5);cv.style.width=wCss+'px';cv.style.height=hCss+'px';cv.width=Math.round(wCss*d);cv.height=Math.round(hCss*d);const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return c}
export function pointerPos(e,el){const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
