/* Rendu « projection » de la carte : fond (canvas : estompage / hypsométrie) + vecteurs (SVG).
   Toutes les tailles sont exprimées en « u » = 1 % de la hauteur d'écran × facteur de salle.
   Les étiquettes et les traits sont donc recalculés à chaque redimensionnement / zoom :
   ils restent nets et gardent la MÊME taille à l'écran, quel que soit le zoom de la carte. */
import { contours, indexStep, analyze, gradient, sample } from '../core/terrain.js';
import { tintCanvas, shadeCanvas, drawIso } from '../core/draw.js';
import { fitCanvas } from '../core/util.js';
import { t, nf } from './i18n.js';

export const PAL = { paper: '#ffffff', line: '#8a4313', index: '#4a2208', label: '#1b1209', water: '#0a58b0', crest: '#c62828', hi: '#d62828', halo: '#ffffff', frame: '#1b1b1b' };
const f1 = n => n.toFixed(1);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---------- fond ---------- */
export function paintBackdrop(cv, d, w, h, view, layers) {
  const c = fitCanvas(cv, w, h);
  c.fillStyle = PAL.paper; c.fillRect(0, 0, w, h);
  const sx = view.x0 + .5, sy = view.y0 + .5, sw = view.w, sh = view.w * h / w;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  if (layers.tint) { c.globalAlpha = .9; c.drawImage(tintCanvas(d), sx, sy, sw, sh, 0, 0, w, h); c.globalAlpha = 1; }
  if (layers.shade) {
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = layers.tint ? .5 : .32;
    c.drawImage(shadeCanvas(d), sx, sy, sw, sh, 0, 0, w, h);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
}

/* ---------- vecteurs ---------- */
export function paintVectors(svg, d, w, h, view, o) {
  const { u, eq, layers = {}, level = null, upto = false, probe = null, hideProbe = false } = o;
  const k = w / view.w;                       // px par maille (1 maille = 1 mm carte)
  const X = x => (x - view.x0) * k, Y = y => (y - view.y0) * k;
  const font = 2.5 * u;                       // taille minimale des étiquettes : 2,5 % de la hauteur d'écran
  const inView = (x, y, m = 0) => x > -m && y > -m && x < w + m && y < h + m;
  const out = [];
  svg.setAttribute('viewBox', `0 0 ${f1(w)} ${f1(h)}`); svg.setAttribute('width', w); svg.setAttribute('height', h);

  const C = contours(d, eq);
  const levels = upto && level != null ? C.filter(l => l.level <= level + 1e-6) : C;
  const step = Math.round(indexStep(eq) / eq), labelAll = levels.length <= 10;

  /* hydrographie et crêtes (sous les courbes) */
  if (layers.rivers || layers.crest) {
    const an = analyze(d);
    if (layers.rivers) {
      const buckets = [[], [], [], []];
      for (let q = 0; q < d.W * d.H; q++) {
        if (!an.river[q]) continue; const n = an.dir[q]; if (n < 0) continue;
        const i = q % d.W, j = (q / d.W) | 0, x = X(i), y = Y(j);
        if (!inView(x, y, 20)) continue;
        const b = Math.max(0, Math.min(3, Math.floor(Math.log2(an.acc[q] / an.thr) * .9)));
        buckets[b].push(`M${f1(x)} ${f1(y)}L${f1(X(n % d.W))} ${f1(Y((n / d.W) | 0))}`);
      }
      buckets.forEach((b, i) => { if (b.length) out.push(`<path d="${b.join('')}" fill="none" stroke="${PAL.water}" stroke-width="${f1((.22 + i * .12) * u)}" stroke-linecap="round"/>`); });
    }
    if (layers.crest) {
      const T = Math.max(60, an.thr * 2.4), seg = [];
      for (let q = 0; q < d.W * d.H; q++) {
        if (an.racc[q] < T) continue; const x = X(q % d.W), y = Y((q / d.W) | 0);
        if (inView(x, y, 10)) seg.push(`M${f1(x)} ${f1(y)}h.1`);
      }
      if (seg.length) out.push(`<path d="${seg.join('')}" fill="none" stroke="${PAL.crest}" stroke-width="${f1(.5 * u)}" stroke-linecap="round" opacity=".9"/>`);
    }
  }

  /* courbes de niveau */
  const norm = [], idx = [], hi = [], ticks = [], cand = [];
  for (const lv of levels) {
    const isIdx = Math.round(lv.level / eq) % step === 0, isHi = upto && level != null && Math.abs(lv.level - level) < 1e-6;
    const dst = isHi ? hi : isIdx ? idx : norm;
    for (const ch of lv.chains) {
      const p = ch.pts; let s = '', any = false;
      for (let q = 0; q < p.length; q++) {
        const x = X(p[q][0]), y = Y(p[q][1]); if (inView(x, y, 40)) any = true;
        s += (q ? 'L' : 'M') + f1(x) + ' ' + f1(y);
      }
      if (!any) continue;
      dst.push(s + (ch.closed ? 'Z' : ''));
      /* hachures des dépressions fermées */
      if (ch.closed && p.length >= 24) {
        const cx = p.reduce((a, b) => a + b[0], 0) / p.length, cy = p.reduce((a, b) => a + b[1], 0) / p.length;
        if (sample(d, cx, cy) < lv.level - 1) {
          let acc = 0;
          for (let q = 1; q < p.length; q++) {
            acc += Math.hypot(p[q][0] - p[q - 1][0], p[q][1] - p[q - 1][1]) * k;
            if (acc < 3.2 * u) continue; acc = 0;
            const [gx, gy] = gradient(d, p[q][0], p[q][1]), g = Math.hypot(gx, gy) || 1, x = X(p[q][0]), y = Y(p[q][1]);
            if (inView(x, y)) ticks.push(`M${f1(x)} ${f1(y)}l${f1(-gx / g * 1.3 * u)} ${f1(-gy / g * 1.3 * u)}`);
          }
        }
      }
      if ((isIdx || labelAll) && layers.labels !== false && p.length >= 20)
        for (const f of [.42, .2, .64, .82, .08, .95]) {
          const pt = p[Math.floor(p.length * f)], x = X(pt[0]), y = Y(pt[1]);
          if (inView(x, y)) cand.push({ x, y, t: lv.level, prio: p.length - Math.abs(f - .42) * 40 });
        }
    }
  }
  if (norm.length) out.push(`<path d="${norm.join('')}" fill="none" stroke="${PAL.line}" stroke-width="${f1(.27 * u)}" stroke-linejoin="round"/>`);
  if (idx.length) out.push(`<path d="${idx.join('')}" fill="none" stroke="${PAL.index}" stroke-width="${f1(.55 * u)}" stroke-linejoin="round"/>`);
  if (hi.length) out.push(`<path d="${hi.join('')}" fill="none" stroke="${PAL.hi}" stroke-width="${f1(.9 * u)}" stroke-linejoin="round"/>`);
  if (ticks.length) out.push(`<path d="${ticks.join('')}" fill="none" stroke="${PAL.index}" stroke-width="${f1(.3 * u)}"/>`);

  /* étiquettes : placement glouton, espacement proportionnel à la taille de police (donc au zoom) */
  const labels = [], minD = font * 6.5, mx = font * 2.2;
  const keepOut = (x, y) => (x < 24 * u && y > h - 8 * u) || (x > w - 9 * u && y < 10 * u);
  cand.sort((a, b) => b.prio - a.prio);
  for (const c of cand) {
    if (labels.length >= 30) break;
    if (c.x < mx || c.x > w - mx || c.y < font * 1.2 || c.y > h - font * 1.2 || keepOut(c.x, c.y)) continue;
    if (labels.some(l => Math.hypot(l.x - c.x, l.y - c.y) < (l.t === c.t ? minD * 3 : minD))) continue;
    if (labels.filter(l => l.t === c.t).length >= 2) continue;
    labels.push(c);
  }
  const text = (x, y, s, cls = 'lb', fs = font) => `<text x="${f1(x)}" y="${f1(y)}" class="${cls}" style="font-size:${f1(fs)}px">${esc(s)}</text>`;
  for (const l of labels) out.push(text(l.x, l.y, nf(l.t)));

  /* sommets / dépressions cotés */
  if (layers.spots && d.params) {
    const an = analyze(d), sm = u * .9;
    for (const p of an.summits.slice(0, 4)) {
      const x = X(p.x), y = Y(p.y); if (!inView(x, y, -font)) continue;
      out.push(`<path d="M${f1(x)} ${f1(y - sm)}L${f1(x + sm * .9)} ${f1(y + sm * .6)}L${f1(x - sm * .9)} ${f1(y + sm * .6)}Z" fill="#111" stroke="#fff" stroke-width="${f1(.18 * u)}"/>`);
      out.push(text(x + (x + sm * 1.3 + font * 3.4 > w ? -sm * 1.3 : sm * 1.3), y - sm * .2, nf(Math.round(p.z)), x + sm * 1.3 + font * 3.4 > w ? 'lb sm right' : 'lb sm left'));
    }
    for (const p of an.pits.slice(0, 2)) {
      const x = X(p.x), y = Y(p.y); if (!inView(x, y, -font)) continue;
      out.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.6 * u)}" fill="#111" stroke="#fff" stroke-width="${f1(.18 * u)}"/>`);
      out.push(text(x + (x + sm * 1.1 + font * 3.4 > w ? -sm * 1.1 : sm * 1.1), y - sm * .2, nf(Math.round(p.z)), x + sm * 1.1 + font * 3.4 > w ? 'lb sm right' : 'lb sm left'));
    }
  }

  /* sonde */
  let probeInfo = null;
  if (probe) {
    const px = X(probe.x), py = Y(probe.y), z = sample(d, probe.x, probe.y);
    probeInfo = { x: px, y: py, z };
    if (inView(px, py, 0)) {
      const r = 1.4 * u;
      out.push(`<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(r)}" fill="none" stroke="#fff" stroke-width="${f1(.9 * u)}"/><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(r)}" fill="none" stroke="${PAL.hi}" stroke-width="${f1(.45 * u)}"/><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(.28 * u)}" fill="${PAL.hi}"/>`);
      const lab = hideProbe ? '?' : '≈ ' + nf(Math.round(z)) + ' m', bw = lab.length * font * .62 + font, bx = Math.min(w - bw - 4, Math.max(4, px + r * 1.4)), by = Math.max(font * 1.6, py - r * 2.2);
      out.push(`<rect x="${f1(bx)}" y="${f1(by - font * 1.1)}" width="${f1(bw)}" height="${f1(font * 1.6)}" rx="${f1(font * .3)}" fill="#fff" stroke="${PAL.hi}" stroke-width="${f1(.3 * u)}"/>`);
      out.push(`<text x="${f1(bx + bw / 2)}" y="${f1(by - font * .3)}" class="lb probe" style="font-size:${f1(font * 1.05)}px;text-anchor:middle">${esc(lab)}</text>`);
    }
  }

  /* échelle graphique */
  const mPerPx = d.cellM / k, target = w * .2 * mPerPx, nice = [50, 100, 200, 250, 500, 1000, 2000, 5000].reduce((b, c) => Math.abs(c - target) < Math.abs(b - target) ? c : b);
  const len = nice / mPerPx, bx0 = 2.2 * u, by0 = h - 3.2 * u, bh = .9 * u;
  out.push(`<rect x="${f1(bx0 - u * .5)}" y="${f1(by0 - font * 1.35)}" width="${f1(len + u)}" height="${f1(font * 1.35 + bh + u * .7)}" fill="#fff" opacity=".9" rx="${f1(u * .4)}"/>`);
  out.push(`<rect x="${f1(bx0)}" y="${f1(by0)}" width="${f1(len / 2)}" height="${f1(bh)}" fill="#111"/><rect x="${f1(bx0 + len / 2)}" y="${f1(by0)}" width="${f1(len / 2)}" height="${f1(bh)}" fill="#fff" stroke="#111" stroke-width="${f1(.18 * u)}"/><rect x="${f1(bx0)}" y="${f1(by0)}" width="${f1(len)}" height="${f1(bh)}" fill="none" stroke="#111" stroke-width="${f1(.18 * u)}"/>`);
  out.push(text(bx0, by0 - u * .45, nice >= 1000 ? nf(nice / 1000) + ' km' : nf(nice) + ' m', 'lb plain left base', 2.3 * u));

  /* nord */
  const nx = w - 4 * u, ny = 2.2 * u;
  out.push(`<rect x="${f1(nx - 2.6 * u)}" y="${f1(ny - u * .8)}" width="${f1(5.2 * u)}" height="${f1(8.2 * u)}" rx="${f1(u * .5)}" fill="#fff" opacity=".9"/><path d="M${f1(nx)} ${f1(ny)}L${f1(nx + 1.5 * u)} ${f1(ny + 5 * u)}L${f1(nx)} ${f1(ny + 3.9 * u)}L${f1(nx - 1.5 * u)} ${f1(ny + 5 * u)}Z" fill="#111"/>`);
  out.push(text(nx, ny + 7.2 * u, t('map.north'), 'lb plain', 2.3 * u));
  out.push(`<rect x="${f1(.15 * u)}" y="${f1(.15 * u)}" width="${f1(w - .3 * u)}" height="${f1(h - .3 * u)}" fill="none" stroke="${PAL.frame}" stroke-width="${f1(.3 * u)}"/>`);

  svg.innerHTML = out.join('');
  return { k, font, labels: labels.length, probe: probeInfo, levels: levels.length, strokeIndex: .55 * u, strokeNorm: .27 * u };
}

/* ---------- bloc 3D (scène « plan horizontal ») ---------- */
export function paintIso(cv, d, w, h, o) {
  const c = fitCanvas(cv, w, h);
  c.fillStyle = '#eef3f7'; c.fillRect(0, 0, w, h);
  drawIso(c, d, w, h, { rot: 35, tilt: 52, vex: 2.2, eq: 0, level: o.level, cutLevel: o.level, tint: true, step: 2 });
  c.strokeStyle = PAL.frame; c.lineWidth = Math.max(2, .3 * o.u); c.strokeRect(0, 0, w, h);
}
