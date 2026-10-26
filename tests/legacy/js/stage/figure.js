/* Figure partagée : peint la scène courante (utilisée par la projection ET par l'aperçu de la vue présentateur). */
import { makeDem, demFromForm, sample } from '../core/terrain.js';
import { resolve } from './scenes.js';
import { paintBackdrop, paintVectors, paintIso } from './mapsvg.js';

const cache = new Map();
export function demFor(cfg) {
  const key = cfg.form === 'mixte' ? `m|${cfg.type || 'complexe'}|${cfg.seed}` : `f|${cfg.form}|${cfg.relief}|${cfg.base}`;
  if (!cache.has(key)) {
    if (cache.size > 24) cache.delete(cache.keys().next().value);
    /* « mixte » : mêmes paramètres par défaut que le simulateur de profil → le code du terrain est partageable */
    cache.set(key, cfg.form === 'mixte'
      ? makeDem({ type: cfg.type || 'complexe', seed: cfg.seed || 1, scaleN: 25000 })
      : demFromForm(cfg.form, { base: cfg.base, relief: cfg.relief, slope: 1, scaleN: 25000 }));
  }
  return cache.get(key);
}
export const terrainCode = (cfg) => cfg.form === 'mixte' ? `${cfg.type || 'complexe'}-${(cfg.seed || 1).toString(36)}-25` : null;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* fenêtre visible (en mailles) pour un zoom et un centre donnés */
export function viewOf(S, d) {
  const w = (d.W - 1) / S.zoom, h = (d.H - 1) / S.zoom;
  return { x0: clamp(S.cx - w / 2, 0, d.W - 1 - w), y0: clamp(S.cy - h / 2, 0, d.H - 1 - h), w, h };
}
/* dimensions des boîtes carte / bloc 3D dans une zone w×h */
export function boxes(w, h, split, aspect = 159 / 109) {
  if (!split) { const mw = Math.min(w, h * aspect); return { mw, mh: mw / aspect, iw: 0, ih: 0 }; }
  const gap = 12, gw = (w - gap) / 2, mw = Math.min(gw, h * aspect);
  return { mw, mh: mw / aspect, iw: mw, ih: mw / aspect };
}
export function paintFigure(els, S, deck, { w, h, u }) {
  const scene = deck.scenes[S.scene], cfg = resolve(scene, S.pi, S.seed), d = demFor(cfg);
  const probe = S.probe || cfg.probe, split = scene.view === 'split', b = boxes(w, h, split);
  const view = viewOf(S, d);
  paintBackdrop(els.bd, d, b.mw, b.mh, view, cfg.layers);
  const meta = paintVectors(els.svg, d, b.mw, b.mh, view, { u, eq: cfg.eq, layers: cfg.layers, level: cfg.level, upto: !!scene.upto, probe, hideProbe: scene.hide === 'probe' && !S.reveal });
  if (split && els.iso) paintIso(els.iso, d, b.iw, b.ih, { level: cfg.level, u });
  return { scene, cfg, d, view, probe, split, box: b, meta, k: meta.k, zAt: p => (p ? sample(d, p.x, p.y) : null) };
}
