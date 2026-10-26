/* Carte à courbes de niveau en SVG (repère logique du kit) — produite à partir du moteur Contour, pas d'un canvas : nette à toute taille.
   Mise en cache par (MNT, équidistance, boîte). */
import { contours, indexStep } from '../../engine/contour/index.js';
import * as K from '../kit.js';
const { C, txt, line, rect, circ, path, badge } = K;
const cache = new WeakMap();
export function mapSvg(d, eq, box, o = {}) {
  const k = `${eq}|${box.x},${box.y},${box.w},${box.h}|${o.labels !== false}`, m = cache.get(d) || new Map(); cache.set(d, m);
  if (m.has(k)) return m.get(k);
  const sx = box.w / (d.W - 1), sy = box.h / (d.H - 1), P = p => `${(box.x + p[0] * sx).toFixed(1)} ${(box.y + p[1] * sy).toFixed(1)}`;
  const step = indexStep(eq); let thin = '', thick = '', labs = ''; const placed = [];
  for (const lv of contours(d, eq)) {
    const idx = lv.level % step === 0; let best = null;
    for (const c of lv.chains) {
      const dd = 'M' + c.pts.map(P).join('L') + (c.closed ? 'Z' : '');
      if (idx) thick += dd; else thin += dd;
      if (idx && (!best || c.pts.length > best.pts.length)) best = c;
    }
    if (idx && best && o.labels !== false) { const q = best.pts[best.pts.length >> 1], x = box.x + q[0] * sx, y = box.y + q[1] * sy; if (x > box.x + 6 && x < box.x + box.w - 6 && y > box.y + 4 && y < box.y + box.h - 4 && !placed.some(q2 => Math.abs(q2[0] - x) < 11 && Math.abs(q2[1] - y) < 6) && placed.push([x, y])) labs += txt(x, y, String(lv.level), { size: 3.8, w: 800, fill: '#4a2208' }); }
  }
  const s = rect(box.x, box.y, box.w, box.h, { fill: '#fbf7ec', stroke: C.ink, w: .6 }) + path(thin, { stroke: '#a9692f', w: .32 }) + path(thick, { stroke: '#5a2a08', w: .7 }) + labs;
  m.set(k, s); return s;
}
export const toMap = (box, d) => p => [box.x + p.x * box.w / (d.W - 1), box.y + p.y * box.h / (d.H - 1)];

/* tracés par niveau (pour révéler les courbes une à une) : [{level, d, chains}] dans le repère de la boîte */
const lp = new WeakMap();
export function levelPaths(d, eq, box) {
  const k = `${eq}|${box.x},${box.y},${box.w},${box.h}`, m = lp.get(d) || new Map(); lp.set(d, m);
  if (m.has(k)) return m.get(k);
  const sx = box.w / (d.W - 1), sy = box.h / (d.H - 1), P = p => `${(box.x + p[0] * sx).toFixed(1)} ${(box.y + p[1] * sy).toFixed(1)}`;
  const out = contours(d, eq).map(lv => ({ level: lv.level, d: lv.chains.map(c => 'M' + c.pts.map(P).join('L') + (c.closed ? 'Z' : '')).join(''), chains: lv.chains.map(c => c.pts.map(p => [box.x + p[0] * sx, box.y + p[1] * sy])) }));
  m.set(k, out); return out;
}
export const fillBox = (box, color = '#fbf7ec') => rect(box.x, box.y, box.w, box.h, { fill: color, stroke: C.ink, w: .6 });
