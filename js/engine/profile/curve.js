/* Courbe de l'étudiant : interpolation monotone (Fritsch–Carlson simplifiée), sans dépassement aux extrema.
   pts = [{s,z}] triés par s. smooth=false → segments (règle). Retourne une fonction s ↦ z, ou null si < 2 points. */
export function curveFn(pts,smooth){const n=pts.length;if(n<2)return null;const x=pts.map(p=>p.s),y=pts.map(p=>p.z),d=[];for(let i=0;i<n-1;i++)d.push((y[i+1]-y[i])/((x[i+1]-x[i])||1e-9));
 const m=y.map((_,i)=>{if(i===0)return d[0];if(i===n-1)return d[n-2];return d[i-1]*d[i]<=0?0:2*d[i-1]*d[i]/(d[i-1]+d[i])});
 return s=>{if(s<=x[0])return y[0];if(s>=x[n-1])return y[n-1];let i=0;while(x[i+1]<s)i++;const dx=x[i+1]-x[i]||1e-9,t=(s-x[i])/dx;if(!smooth)return y[i]+(y[i+1]-y[i])*t;
  const t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*y[i]+(t3-2*t2+t)*dx*m[i]+(-2*t3+3*t2)*y[i+1]+(t3-t2)*dx*m[i+1]}}
