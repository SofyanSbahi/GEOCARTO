/* Moteur de profil — relevé des intersections de la bande de papier avec les courbes. */
/* Altitudes de courbes possibles pour le terrain (menu de saisie) */
export function levelList(dem,eq){const out=[];for(let z=Math.ceil(dem.zmin/eq)*eq;z<=dem.zmax;z+=eq)out.push(z);return out}
/* Tendance le long du trait : suite de tronçons montants / descendants [{dir:+1|-1, from, to}] (indice « sommet/fond entre deux doublons ») */
export function trendRuns(cross){if(cross.length<2)return null;const c=cross;let out=[],dir=0,run=[c[0].z];
 for(let i=1;i<c.length;i++){const d=Math.sign(c[i].z-c[i-1].z)||dir;if(d!==dir&&dir!==0){out.push({dir,from:run[0],to:run.at(-1)});run=[c[i-1].z]}dir=d||dir;run.push(c[i].z)}
 out.push({dir,from:run[0],to:run.at(-1)});return out}
/* Valeurs attendues (ordonnées par s) à partir des intersections relevées */
export const targetsFrom=marks=>marks.map(m=>({s:m.s,z:m.z,zs:m.zs})).sort((a,b)=>a.s-b.s);
/* Premier repère manquant dans le tracé (pour l'indice), ou null */
export function firstMissing(targets,pts,hs,eq){return targets.find(t=>!pts.some(p=>Math.abs(p.s-t.s)<hs*.15&&Math.abs(p.z-t.zs)<eq*.6))||null}
