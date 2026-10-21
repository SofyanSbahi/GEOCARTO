#!/usr/bin/env python3
"""Audit « dernier rang » des leçons Stage v2 — rendu réel (Chromium).
Pour chaque leçon / scène / étape (et chaque valeur de paramètre), mesure dans le DOM rendu :
  · taille minimale du texte SVG en % de la hauteur d'écran (≥ 3,2 %), légende ≥ 4,2 %
  · chevauchements texte/texte et texte hors de la figure
  · nombre d'éléments texte par écran (indicatif)
Usage : python3 tools/stage/audit_lessons.py [--url http://localhost:8765/index.html] [--w 1920 --h 1080 --rs 1] [--lessons echelle,profil] [--lang fr]
Sortie : tableau + code retour ≠ 0 s'il y a un défaut."""
import sys, argparse, json
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser()
ap.add_argument('--url', default='http://localhost:8765/index.html'); ap.add_argument('--w', type=int, default=1920); ap.add_argument('--h', type=int, default=1080)
ap.add_argument('--rs', type=float, default=1.0); ap.add_argument('--lessons', default='echelle,orient,coord,relief,pente,profil,geocarte,coupe'); ap.add_argument('--min-text', type=float, default=3.2)
ap.add_argument('--rtl', action='store_true', help="force dir=rtl pour vérifier que la mise en page ne casse pas")
a = ap.parse_args()
MEASURE = """() => {
  const H = innerHeight, svg = document.querySelector('#lSvg'), fig = document.querySelector('#lFig').getBoundingClientRect(), m = svg.getScreenCTM();
  const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim());
  const boxes = texts.map(t => { const r = t.getBoundingClientRect(); return { s: t.textContent.trim(), x: r.left, y: r.top, w: r.width, h: r.height, px: parseFloat(t.getAttribute('font-size')) * m.a }; });
  const cap = document.querySelector('#lCap'), cs = parseFloat(getComputedStyle(cap).fontSize);
  const ov = document.querySelector('#lOv.on'); const ovs = ov ? parseFloat(getComputedStyle(ov.querySelector('.st-l-prq')).fontSize) : null;
  const over = [], out = [];
  for (let i = 0; i < boxes.length; i++) {
    const A = boxes[i]; if (A.x < fig.left - 1 || A.x + A.w > fig.right + 1 || A.y < fig.top - 1 || A.y + A.h > fig.bottom + 1) out.push(A.s);
    for (let j = i + 1; j < boxes.length; j++) { const B = boxes[j], ix = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), iy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ix > 0 && iy > 0 && ix * iy > .18 * Math.min(A.w * A.h, B.w * B.h)) over.push(A.s + ' × ' + B.s); }
  }
  return { n: boxes.length, minPct: boxes.length ? Math.min(...boxes.map(b => b.px)) / H * 100 : null, capPct: cs / H * 100, ovPct: ovs && ovs / H * 100, over, out, words: cap.textContent.trim().split(/\\s+/).length };
}"""
bad = 0
def goto(L, n):
    pg.evaluate("location.hash='#/stage'"); pg.wait_for_timeout(60); pg.evaluate(f"location.hash='#/stage/{L}/{n}'"); pg.wait_for_selector('.st-l', timeout=8000)
    if a.rtl: pg.evaluate("document.documentElement.dir='rtl'")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': a.w, 'height': a.h})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(a.url); pg.evaluate(f"localStorage.setItem('gc_stage', JSON.stringify({{rs:{a.rs}}}))")
    print(f"{'écran':<22}{'textes':>7}{'min %':>7}{'légende %':>10}{'mots':>6}  défauts"); print('-' * 90)
    for L in a.lessons.split(','):
        pg.goto(f"{a.url}#/stage/{L}/1"); pg.reload(); pg.wait_for_selector('.st-l', timeout=8000)
        if a.rtl: pg.evaluate("document.documentElement.dir='rtl'")
        nsc = pg.evaluate("document.querySelectorAll('.st-l-dot').length"); worst = 99
        for sc in range(nsc):
            goto(L, sc + 1); pg.wait_for_timeout(120)
            npar = pg.evaluate("document.querySelector('.st-l-par') ? 4 : 1")
            for pi in range(npar):
                if pi: pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(60)
                k = 0
                while True:
                    pg.wait_for_timeout(70); r = pg.evaluate(MEASURE); lab = f"{L}/{sc + 1}.{k}" + (f"p{pi}" if npar > 1 else '')
                    flaws = []
                    if r['minPct'] is not None and r['minPct'] < a.min_text: flaws.append(f"texte {r['minPct']:.2f}% < {a.min_text}")
                    if r['over']: flaws.append('chevauche: ' + '; '.join(r['over'][:3]))
                    if r['out']: flaws.append('hors cadre: ' + '; '.join(r['out'][:3]))
                    if r['capPct'] < 4.2: flaws.append('légende petite')
                    if r['ovPct'] and r['ovPct'] < 4.2: flaws.append('énoncé petit')
                    if r['words'] > 22: flaws.append(f"légende longue ({r['words']} mots)")
                    if flaws: bad += 1
                    if r['minPct'] is not None: worst = min(worst, r['minPct'])
                    print(f"{lab:<22}{r['n']:>7}{(r['minPct'] or 0):>7.2f}{r['capPct']:>10.2f}{r['words']:>6}  {' | '.join(flaws)}")
                    before = pg.evaluate("document.querySelector('#lN') && document.querySelector('#lN').textContent + '|' + document.querySelector('#lCap').textContent")
                    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(60)
                    after = pg.evaluate("document.querySelector('#lN') ? document.querySelector('#lN').textContent : 'gone'")
                    k += 1
                    if after != before.split('|')[0] or k > 60: break
                if pi < npar - 1 or True:
                    goto(L, sc + 1); pg.wait_for_timeout(80)
                    if npar > 1:
                        for _ in range(pi + 1): pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(30)
                        if pi + 1 < npar - 0 and pi == npar - 1: break
            # (les paramètres sont parcourus de façon cyclique)
        print(f"== {L} : texte minimal mesuré {worst:.2f} % de la hauteur d'écran")
    if errs: print('ERREURS JS:', errs[:5]); bad += 1
    b.close()
print('\nRÉSULTAT :', 'OK' if not bad else f'{bad} écran(s) à corriger'); sys.exit(1 if bad else 0)
