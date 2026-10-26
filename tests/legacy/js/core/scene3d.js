import * as THREE from '../../vendor/three.module.min.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {analyze,sample} from './terrain.js';
import {drawMap,hypso} from './draw.js';
export {THREE};
export function createViewer(box,dem0,o={}){
 const r=new THREE.WebGLRenderer({antialias:true,alpha:false});r.setPixelRatio(Math.min(devicePixelRatio,2));box.append(r.domElement);r.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';
 const sc=new THREE.Scene();sc.background=new THREE.Color(0xcfe3ee);sc.fog=new THREE.Fog(0xcfe3ee,260,620);
 const cam=new THREE.PerspectiveCamera(50,1,.1,2000),ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.maxPolarAngle=Math.PI*.495;
 sc.add(new THREE.HemisphereLight(0xffffff,0x6b7a5a,.85));const sun=new THREE.DirectionalLight(0xfff2d8,1.05);sun.position.set(-120,160,-90);sc.add(sun);
 const A={dem:null,vex:o.vex||2.2,mode:o.mode||'both',eq:o.eq||20,mesh:null,water:null,over:new THREE.Group(),cur:null,disposed:false,onFrame:null};sc.add(A.over);
 const S=dem=>({sx:1,sz:1,y:z=>(z-dem.zmin)/dem.cellM*A.vex});
 const pos=(dem,i,j,z)=>{const zz=z===undefined?sample(dem,i,j):z;return new THREE.Vector3(i-(dem.W-1)/2,(zz-dem.zmin)/dem.cellM*A.vex,j-(dem.H-1)/2)};
 function tex(){const d=A.dem,w=1400,h=Math.round(w*(d.H-1)/(d.W-1)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  drawMap(c,d,w,h,{eq:A.mode==='tint'?1e6:A.eq,tint:A.mode!=='contour',shade:false,rivers:A.rivers!==false,labels:A.mode!=='tint',spots:false,scaleBar:false,north:false,lineW:1.6});const t=new THREE.CanvasTexture(cv);t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;return t}
 A.setDem=(dem)=>{A.dem=dem;if(A.mesh){A.mesh.geometry.dispose();A.mesh.material.map&&A.mesh.material.map.dispose();sc.remove(A.mesh)}
  const g=new THREE.PlaneGeometry(dem.W-1,dem.H-1,dem.W-1,dem.H-1);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let k=0;k<p.count;k++)p.setY(k,(dem.z[k]-dem.zmin)/dem.cellM*A.vex);g.computeVertexNormals();
  A.mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tex(),roughness:.95,metalness:0}));sc.add(A.mesh);if(!A.cur){cam.position.set(0,95,125);ctl.target.set(0,8,0)}A.cur=dem;A.rebuildOver();A.setWater(A.waterLevel)};
 A.setVex=v=>{A.vex=v;const d=A.dem,p=A.mesh.geometry.attributes.position;for(let k=0;k<p.count;k++)p.setY(k,(d.z[k]-d.zmin)/d.cellM*v);p.needsUpdate=true;A.mesh.geometry.computeVertexNormals();A.rebuildOver();A.setWater(A.waterLevel)};
 A.setMode=(m,eq)=>{A.mode=m;if(eq)A.eq=eq;A.mesh.material.map.dispose();A.mesh.material.map=tex();A.mesh.material.needsUpdate=true};
 A.setWater=l=>{A.waterLevel=l;if(A.water){sc.remove(A.water);A.water=null}if(l==null)return;const d=A.dem,m=new THREE.Mesh(new THREE.PlaneGeometry(d.W-1,d.H-1),new THREE.MeshStandardMaterial({color:0x2d86c8,transparent:true,opacity:.6,roughness:.2}));m.rotation.x=-Math.PI/2;m.position.y=(l-d.zmin)/d.cellM*A.vex;sc.add(m);A.water=m};
 A.show={rivers:false,ridges:false,line:null};
 A.rebuildOver=()=>{A.over.clear();const d=A.dem;if(!d)return;const an=analyze(d);
  const seg=(mask,dir,color)=>{const pts=[];for(let q=0;q<d.W*d.H;q++){if(!mask[q])continue;const n=dir[q];if(n<0)continue;const a=pos(d,q%d.W,(q/d.W)|0,d.z[q]),b=pos(d,n%d.W,(n/d.W)|0,d.z[n]);a.y+=.35;b.y+=.35;pts.push(a,b)}const g=new THREE.BufferGeometry().setFromPoints(pts);return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color}))};
  if(A.show.rivers)A.over.add(seg(an.river,an.dir,0x1565c0));
  if(A.show.ridges){const T=Math.max(30,an.thr*.7),m=new Uint8Array(d.W*d.H);for(let q=0;q<m.length;q++)m[q]=an.racc[q]>=T?1:0;const dd=new Int32Array(d.W*d.H).fill(-1);for(let q=0;q<m.length;q++){if(!m[q])continue;let best=-1,bz=-1e9;const i=q%d.W,j=(q/d.W)|0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const x=i+di,y=j+dj;if(x<0||y<0||x>=d.W||y>=d.H)continue;const n=y*d.W+x;if(m[n]&&d.z[n]>bz&&d.z[n]>d.z[q]){bz=d.z[n];best=n}}dd[q]=best}A.over.add(seg(m,dd,0xc0392b))}
  if(A.show.line){const{A:a,B:b}=A.show.line,n=80,top=[],bot=[];for(let k=0;k<=n;k++){const t=k/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,p=pos(d,x,y);top.push(p);bot.push(new THREE.Vector3(p.x,0,p.z))}
   const g=new THREE.BufferGeometry(),v=[];for(let k=0;k<n;k++){const T0=top[k],T1=top[k+1],B0=bot[k],B1=bot[k+1];v.push(T0.x,T0.y,T0.z,B0.x,B0.y,B0.z,T1.x,T1.y,T1.z,T1.x,T1.y,T1.z,B0.x,B0.y,B0.z,B1.x,B1.y,B1.z)}g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));A.over.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xd62d2d,transparent:true,opacity:.35,side:THREE.DoubleSide})));
   const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(top.map(p=>p.clone().setY(p.y+.4))),new THREE.LineBasicMaterial({color:0xd62d2d}));A.over.add(l)}
  (A.markers||[]).forEach(m=>{const p=pos(d,m.x,m.y),s=new THREE.Mesh(new THREE.ConeGeometry(1.4,6,12),new THREE.MeshBasicMaterial({color:m.color||0xd62d2d}));s.position.set(p.x,p.y+3,p.z);s.rotation.x=Math.PI;A.over.add(s)})};
 A.set=(k,v)=>{A.show[k]=v;A.rebuildOver()};
 const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
 A.pick=(cx,cy)=>{const b=r.domElement.getBoundingClientRect();v2.set((cx-b.left)/b.width*2-1,-((cy-b.top)/b.height)*2+1);ray.setFromCamera(v2,cam);const hit=ray.intersectObject(A.mesh)[0];if(!hit)return null;const d=A.dem,i=hit.point.x+(d.W-1)/2,j=hit.point.z+(d.H-1)/2;return{i,j,z:sample(d,i,j),p:hit.point}};
 const resize=()=>{const w=box.clientWidth,h=box.clientHeight||w*.65;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};const ro=new ResizeObserver(resize);ro.observe(box);resize();
 let id;const loop=()=>{if(A.disposed)return;id=requestAnimationFrame(loop);if(document.hidden)return;A.onFrame&&A.onFrame();if(ctl.enabled)ctl.update();r.render(sc,cam)};loop();
 A.camera=cam;A.controls=ctl;A.renderer=r;A.THREE=THREE;A.scene=sc;
 A.dispose=()=>{A.disposed=true;cancelAnimationFrame(id);ro.disconnect();ctl.dispose();A.mesh&&(A.mesh.geometry.dispose(),A.mesh.material.map&&A.mesh.material.map.dispose());r.dispose();r.forceContextLoss&&r.forceContextLoss();r.domElement.remove()};
 A.setDem(dem0);return A}
