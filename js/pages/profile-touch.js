/* Simulateur de profil — gestes TACTILES de l'étape « Relevé » (v3.1 rc.4). Ne réagit qu'aux pointeurs de type « touch » :
   souris et stylet gardent exactement le comportement du bureau.
     · un doigt, appui bref ............ toucher un point (sélection, comme un clic)
     · un doigt, appui maintenu ........ LOUPE ×3 à côté du doigt, avec réticule ; lâcher = sélectionner le point visé
     · un doigt qui glisse (carte zoomée) déplacer la carte
     · deux doigts ..................... pincer pour zoomer (×1 à ×4) et déplacer
   La loupe et le zoom ne montrent que la CARTE (courbes, cotes imprimées) : aucune altitude n'est révélée. */
const HOLD = 380, MOVE = 10, LENS = 132;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function attachTouch(M, { on, select }) {
  const pts = new Map(); let g = null, timer = 0, lc = null, raf = 0;
  const local = e => { const r = M.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, cx: e.clientX, cy: e.clientY }; };
  /* loupe : canevas rond posé à côté du doigt (pas dessous), toujours dans la carte */
  const lensAt = q => {
    if (!lc) { lc = document.createElement('canvas'); lc.className = 'loupe'; lc.setAttribute('aria-hidden', 'true'); M.box.append(lc); }
    const { w, hh } = M.size(), cx = q.x > w / 2 ? q.x - 96 : q.x + 96, x = Math.min(Math.max(cx, LENS / 2 + 2), w - LENS / 2 - 2), y = Math.min(Math.max(q.y - 40, LENS / 2 + 2), Math.max(LENS / 2 + 2, hh - LENS / 2 - 2));
    lc.style.left = (x - LENS / 2) + 'px'; lc.style.top = (y - LENS / 2) + 'px';
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const c = M.lens(lc, M.pos({ clientX: q.cx, clientY: q.cy }), Math.min(M.zoom() * 3, 12), LENS), m = LENS / 2;
      c.strokeStyle = '#111'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(m - 14, m); c.lineTo(m - 4, m); c.moveTo(m + 4, m); c.lineTo(m + 14, m); c.moveTo(m, m - 14); c.lineTo(m, m - 4); c.moveTo(m, m + 4); c.lineTo(m, m + 14); c.stroke();
    });
  };
  const lensOff = () => { cancelAnimationFrame(raf); if (lc) { lc.remove(); lc = null; } };
  on(M.cv, 'pointerdown', e => {
    if (e.pointerType !== 'touch') return; e.preventDefault(); M.cv.setPointerCapture(e.pointerId); const q = local(e); pts.set(e.pointerId, q);
    if (pts.size === 1) { g = { mode: 'tap', start: q, at: q }; clearTimeout(timer); timer = setTimeout(() => { if (g && g.mode === 'tap') { g.mode = 'lens'; lensAt(g.at); } }, HOLD); }
    else if (pts.size === 2) { clearTimeout(timer); lensOff(); const [a, b] = [...pts.values()]; g = { mode: 'pinch', d0: Math.max(dist(a, b), 1), z0: M.zoom(), m: mid(a, b) }; }
  });
  on(M.cv, 'pointermove', e => {
    if (e.pointerType !== 'touch' || !pts.has(e.pointerId) || !g) return; const prev = pts.get(e.pointerId), q = local(e); pts.set(e.pointerId, q);
    if (g.mode === 'tap' && dist(q, g.start) > MOVE) { clearTimeout(timer); g.mode = M.zoom() > 1 ? 'pan' : 'none'; }
    if (g.mode === 'pan') M.panBy(q.x - prev.x, q.y - prev.y);
    else if (g.mode === 'lens') { g.at = q; lensAt(q); }
    else if (g.mode === 'pinch' && pts.size === 2) { const [a, b] = [...pts.values()], m = mid(a, b); M.panBy(m.x - g.m.x, m.y - g.m.y, true); M.zoomAt(g.z0 * dist(a, b) / g.d0, m.x, m.y); g.m = m; }
  });
  const end = e => {
    if (e.pointerType !== 'touch' || !pts.has(e.pointerId)) return; pts.delete(e.pointerId); clearTimeout(timer);
    if (g && e.type === 'pointerup' && (g.mode === 'tap' || g.mode === 'lens')) { const q = g.mode === 'lens' ? g.at : g.start; select(M.pos({ clientX: q.cx, clientY: q.cy }), q, { precise: g.mode === 'lens' }); }
    if (pts.size === 0) { lensOff(); g = null; }
    else if (g && g.mode === 'pinch') g = { mode: M.zoom() > 1 ? 'pan' : 'none' };
  };
  on(M.cv, 'pointerup', end); on(M.cv, 'pointercancel', end);
  return () => { clearTimeout(timer); lensOff(); };
}
