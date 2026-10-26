/* Utilitaires partagés */
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function h(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v)}for(const c of kids.flat())if(c!=null)e.append(c.nodeType?c:document.createTextNode(c));return e}
export const fr=(n,d=1)=>(+n).toFixed(d).replace('.',',').replace(/,0+$/,'');
export const parseNum=s=>{if(typeof s==='number')return s;const v=parseFloat(String(s).trim().replace(/\s/g,'').replace(',','.'));return isNaN(v)?NaN:v};
export const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9% ]+/g,' ').replace(/\s+/g,' ').trim();
export const shuffle=(a,R=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export const pick=(a,R=Math.random)=>a[Math.floor(R()*a.length)];
export const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const DIRS16=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
export const dirName=az=>DIRS16[Math.round(((az%360)+360)%360/22.5)%16];
export const azimuth=(dx,dyUp)=>(Math.atan2(dx,dyUp)*180/Math.PI+360)%360; // dx vers l'Est, dyUp vers le Nord
export const debounce=(f,ms=60)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
export const raf=f=>{let q=0;return(...a)=>{if(q)return;q=requestAnimationFrame(()=>{q=0;f(...a)})}};
/* canvas HiDPI : adapte la résolution interne à la taille CSS */
export function fitCanvas(cv,wCss,hCss){const d=Math.min(window.devicePixelRatio||1,2.5);cv.style.width=wCss+'px';cv.style.height=hCss+'px';cv.width=Math.round(wCss*d);cv.height=Math.round(hCss*d);const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return c}
export function pointerPos(e,el){const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
