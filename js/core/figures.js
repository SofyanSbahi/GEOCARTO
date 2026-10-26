/* Expérience : peint les « spécifications de figure » produites par les moteurs (engine/pedagogy) sur un canvas.
   Le moteur décrit (kind:'map' | 'geomap', MNT/géologie, options) ; chaque expérience décide comment peindre.
   Learning : canvas 2D classique ci-dessous. Stage : mêmes spécifications, peintes par stage/figure.js. */
import {drawMap} from './draw.js';
import {drawGeoMap} from './geodraw.js';
const ring=(c,k,{i,j})=>{c.strokeStyle='#d62d2d';c.lineWidth=3;c.beginPath();c.arc(i*k,j*k,8,0,7);c.stroke();c.fillStyle='#d62d2d';c.beginPath();c.arc(i*k,j*k,2.5,0,7);c.fill()};
export function drawFigure(spec,c,w,hh){
 if(spec.kind==='map'){const k=drawMap(c,spec.dem,w,hh,spec.opts);if(spec.ring)ring(c,k,spec.ring);return}
 if(spec.kind==='geomap'){const g=spec.geo;drawGeoMap(c,g,w,hh,{eq:spec.eq,showDip:false,letters:true});const k=w/(g.dem.W-1);
  spec.marks.forEach((m,i)=>{c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(m.i*k,m.j*k,9,0,7);c.fill();c.stroke();c.fillStyle='#000';c.font='700 12px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(m.l||i+1,m.i*k,m.j*k)});return}
 throw new Error('figure inconnue : '+spec.kind)}
export const visualOf=spec=>spec?((c,w,hh)=>drawFigure(spec,c,w,hh)):undefined;
