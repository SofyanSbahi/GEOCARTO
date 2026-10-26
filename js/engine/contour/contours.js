/* Moteur de courbes de niveau — marching squares, chaînage, lissage de Chaikin. Renvoie des données (polylignes en mailles), jamais du dessin. */
function levelChains(d,L){
 const{W,H,z}=d,pt=new Map(),adj=new Map();
 const link=(a,b)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(b);(adj.get(b)||adj.set(b,[]).get(b)).push(a)};
 const T=(i,j)=>(j*W+i)*2,Lf=(i,j)=>(j*W+i)*2+1,Rt=(i,j)=>(j*W+i+1)*2+1,B=(i,j)=>((j+1)*W+i)*2;
 for(let j=0;j<H-1;j++)for(let i=0;i<W-1;i++){
  const a=z[j*W+i],b=z[j*W+i+1],c=z[(j+1)*W+i+1],e=z[(j+1)*W+i];
  const m=(a>=L?1:0)|(b>=L?2:0)|(c>=L?4:0)|(e>=L?8:0);if(m===0||m===15)continue;
  const P=(id)=>{if(pt.has(id))return id;let x,y;
   if(id===T(i,j)){x=i+(L-a)/(b-a);y=j}else if(id===Lf(i,j)){x=i;y=j+(L-a)/(e-a)}else if(id===Rt(i,j)){x=i+1;y=j+(L-b)/(c-b)}else{x=i+(L-e)/(c-e);y=j+1}
   pt.set(id,[x,y]);return id};
  const t=()=>P(T(i,j)),l=()=>P(Lf(i,j)),r=()=>P(Rt(i,j)),bt=()=>P(B(i,j));
  switch(m){case 1:case 14:link(l(),t());break;case 2:case 13:link(t(),r());break;case 3:case 12:link(l(),r());break;case 4:case 11:link(r(),bt());break;
   case 6:case 9:link(t(),bt());break;case 7:case 8:link(l(),bt());break;
   case 5:{const hi=(a+b+c+e)/4>=L;if(hi){link(t(),r());link(l(),bt())}else{link(l(),t());link(r(),bt())}break}
   case 10:{const hi=(a+b+c+e)/4>=L;if(hi){link(l(),t());link(r(),bt())}else{link(t(),r());link(l(),bt())}break}}
 }
 const seen=new Set(),out=[];
 const walk=(start,closed)=>{const ids=[start];seen.add(start);let prev=-1,cur=start;
  for(;;){const nb=adj.get(cur).filter(n=>n!==prev&&!(n===start&&ids.length<3));let nx=nb.find(n=>!seen.has(n));if(nx===undefined){break}ids.push(nx);seen.add(nx);prev=cur;cur=nx}
  return{pts:ids.map(id=>pt.get(id)),closed:closed}};
 for(const[id,n]of adj)if(n.length===1&&!seen.has(id))out.push(walk(id,false));
 for(const[id]of adj)if(!seen.has(id)){const c=walk(id,true);out.push(c)}
 return out.filter(c=>c.pts.length>=3);
}
const chaikin=(pts,closed)=>{const o=[],n=pts.length;for(let k=0;k<(closed?n:n-1);k++){const a=pts[k],b=pts[(k+1)%n];o.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]])}
 if(!closed){o.unshift(pts[0]);o.push(pts[n-1])}return o};
export function contours(d,eq){const key=eq;if(d._ct[key])return d._ct[key];const out=[];
 for(let L=Math.ceil((d.zmin+1e-3)/eq)*eq;L<d.zmax;L+=eq){const ch=levelChains(d,L+1e-4).map(c=>({...c,pts:chaikin(c.pts,c.closed)}));if(ch.length)out.push({level:L,chains:ch})}
 d._ct[key]=out;return out}
export const indexStep=eq=>({5:25,10:50,20:100,25:100,40:200,50:250,100:500}[eq]||eq*5);
