/* Moteur de terrain — analyse : écoulements, talwegs, crêtes, sommets, cols, cuvettes. */
import {sample} from './dem.js';
const NB=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function priorityFlood(z,W,H,keep){ // remplissage des petites dépressions
 const out=Float32Array.from(z),vis=new Uint8Array(W*H),heap=[];
 const push=i=>{heap.push(i);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(out[heap[p]]<=out[heap[k]])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
 const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let k=0;for(;;){let a=2*k+1,b=a+1,m=k;if(a<heap.length&&out[heap[a]]<out[heap[m]])m=a;if(b<heap.length&&out[heap[b]]<out[heap[m]])m=b;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return t};
 for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(i===0||j===0||i===W-1||j===H-1){vis[j*W+i]=1;push(j*W+i)}
 while(heap.length){const c=pop(),ci=c%W,cj=(c/W)|0;for(const[dx,dy]of NB){const x=ci+dx,y=cj+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x;if(vis[n])continue;vis[n]=1;if(out[n]<=out[c])out[n]=out[c]+1e-3;push(n)}}
 return out}
function accumulate(z,W,H,fillMax){
 let zf=priorityFlood(z,W,H);if(fillMax!=null){for(let k=0;k<z.length;k++)if(zf[k]-z[k]>fillMax)zf[k]=z[k]}
 const order=[...Array(W*H).keys()].sort((a,b)=>zf[b]-zf[a]),dir=new Int32Array(W*H).fill(-1),acc=new Float32Array(W*H).fill(1);
 for(const k of order){const i=k%W,j=(k/W)|0;let best=-1,bd=0;for(const[dx,dy]of NB){const x=i+dx,y=j+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x,dr=(zf[k]-zf[n])/Math.hypot(dx,dy);if(dr>bd){bd=dr;best=n}}dir[k]=best;if(best>=0)acc[best]+=acc[k]}
 const fill=new Float32Array(W*H);for(let k=0;k<W*H;k++)fill[k]=zf[k]-z[k];return{acc,dir,fill}}
export function analyze(d){if(d._an)return d._an;const{W,H,z}=d;const rel=d.zmax-d.zmin;
 const fl=accumulate(z,W,H,rel*.05);const neg=new Float32Array(z.length);for(let k=0;k<z.length;k++)neg[k]=-z[k];const rd=accumulate(neg,W,H,rel*.05);
 const thr=(d.params&&d.params.valleys!=null)?Math.round(260-150*d.params.valleys):200;
 const summits=[],pits=[],saddles=[];const R=7;
 for(let j=R;j<H-R;j++)for(let i=R;i<W-R;i++){const v=z[j*W+i];let mx=true,mn=true;
  for(let dj=-R;dj<=R&&(mx||mn);dj+=1)for(let di=-R;di<=R;di+=1){if(!di&&!dj)continue;const u=z[(j+dj)*W+i+di];const tie=u===v&&(dj<0||(dj===0&&di<0));if(u>v||tie)mx=false;if(u<v||tie)mn=false;if(!mx&&!mn)break}
  if(!mx&&!mn)continue;let rs=0;for(let a=0;a<12;a++)rs+=sample(d,i+Math.cos(a*Math.PI/6)*11,j+Math.sin(a*Math.PI/6)*11);rs/=12;
  if(mx&&v-rs>.05*rel&&v>d.zmin+.15*rel)summits.push({x:i,y:j,z:v});if(mn&&rs-v>.04*rel)pits.push({x:i,y:j,z:v})}
 const thin=(a,min,sortf)=>{a.sort(sortf);const o=[];for(const p of a)if(o.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>min))o.push(p);return o};
 const S=thin(summits,16,(a,b)=>b.z-a.z).slice(0,8),Pt=thin(pits,16,(a,b)=>a.z-b.z).slice(0,5);
 // cols : selles (4 changements de signe sur un anneau) situées près d'une crête
 const ring=[];for(let a=0;a<16;a++)ring.push([Math.cos(a*Math.PI/8)*4,Math.sin(a*Math.PI/8)*4]);
 const sd=[];for(let j=6;j<H-6;j+=2)for(let i=6;i<W-6;i+=2){const v=sample(d,i,j);let ch=0,prev=sample(d,i+ring[15][0],j+ring[15][1])>v,amp=0;
  for(const[rx,ry]of ring){const u=sample(d,i+rx,j+ry);amp=Math.max(amp,Math.abs(u-v));const s=u>v;if(s!==prev)ch++;prev=s}
  if(ch===4&&amp>.03*rel&&rd.acc[j*W+i]>12)sd.push({x:i,y:j,z:v})}
 const C=thin(sd,14,(a,b)=>b.z-a.z).slice(0,6);
 const river=new Uint8Array(W*H),eps=.0012*rel;for(let j=3;j<H-3;j++)for(let i=3;i<W-3;i++){const q=j*W+i;if(fl.acc[q]<thr)continue;if(fl.fill[q]>.02&&d.type!=='cuvette')continue;let av=0;for(const[dx,dy]of NB)av+=z[(j+dy*3)*W+i+dx*3];if(av/8-z[q]>eps)river[q]=1}
 {const lab=new Int32Array(W*H);for(let q0=0;q0<W*H;q0++){if(!river[q0]||lab[q0])continue;const st=[q0],comp=[q0];lab[q0]=1;while(st.length){const c=st.pop(),ci=c%W,cj=(c/W)|0;for(const[dx,dy]of NB){const x=ci+dx,y=cj+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=y*W+x;if(river[n]&&!lab[n]){lab[n]=1;st.push(n);comp.push(n)}}}if(comp.length<28)for(const c of comp)river[c]=0}}
 d._an={river,fill:fl.fill,acc:fl.acc,dir:fl.dir,racc:rd.acc,thr,summits:S,pits:Pt,saddles:C};return d._an}
