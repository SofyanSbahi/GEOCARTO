/* Mathématiques et conventions partagées par tous les moteurs. Aucune dépendance, aucun accès navigateur.
   Convention d'azimut : depuis le Nord, sens horaire. L'aléa est TOUJOURS injecté (rng(seed)) : pas de Math.random ici. */
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export const parseNum=s=>{if(typeof s==='number')return s;const v=parseFloat(String(s).trim().replace(/\s/g,'').replace(',','.'));return isNaN(v)?NaN:v};
export const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9% ]+/g,' ').replace(/\s+/g,' ').trim();
/* R (générateur 0‥1) obligatoire : c'est l'appelant qui décide de la reproductibilité */
export const shuffle=(a,R)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export const pick=(a,R)=>a[Math.floor(R()*a.length)];
export const DIRS16=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
export const dirName=az=>DIRS16[Math.round(((az%360)+360)%360/22.5)%16];
export const azimuth=(dx,dyUp)=>(Math.atan2(dx,dyUp)*180/Math.PI+360)%360; // dx vers l'Est, dyUp vers le Nord
export const fr=(n,d=1)=>(+n).toFixed(d).replace('.',',').replace(/,0+$/,'');
