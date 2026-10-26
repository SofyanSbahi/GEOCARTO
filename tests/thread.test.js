/* WP2 (v3.1) — fil du raisonnement du géologue : Observer · Situer · Mesurer · Dater · Supposer · Vérifier.
   BROUILLON AUTOMATIQUE tant qu'un géologue ne l'a pas relu : la correspondance scène → étape ci-dessous est la version 0 ; la modifier est normal,
   mais volontaire (le test la fige pour qu'un changement soit visible en revue). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { t, has } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import { STEPS, THREAD_DRAFT, stepOf, threadHtml, threadNote } from '../js/stage/thread.js';
import { LESSONS, lessonById } from '../js/stage/lessons/index.js';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const css = read('css/stage.css').replace(/\/\*[\s\S]*?\*\//g, '');
const geo = lessonById('geocarte'), cut = lessonById('coupe');

const MAPPING_V0 = {
  geocarte: { hook: 'observe', v1: 'observe', legende: 'observe', contact: 'locate', horiz: 'locate', v2: 'locate', dip: 'measure', v3: 'measure', age: 'date', v4: 'date', recoup: 'date', struct: 'suppose', v5: 'suppose', pr: 'measure', recap: 'all' },
  coupe: { hook: 'observe', v1: 'verify', horiz: 'verify', mono: 'verify', v2: 'measure', erreurs: 'measure', apparent: 'measure', ev: 'measure', v3: 'suppose', struct: 'suppose', pr: 'verify', recap: 'all' }
};

test('six étapes, noms courts (≤ 10 caractères), chacune avec sa question et son indice', () => {
  assert.deepEqual(STEPS, ['observe', 'locate', 'measure', 'date', 'suppose', 'verify']);
  for (const id of STEPS) {
    for (const k of ['th.' + id, 'th.' + id + '.q', 'th.' + id + '.h']) assert.ok(has(k), 'texte manquant : ' + k);
    assert.ok(t('th.' + id).length <= 10, `« ${t('th.' + id)} » trop long pour le bandeau`);
    assert.ok(t('th.' + id + '.q').trim().endsWith('?'), id + ' : la question doit être une question');
  }
});

test('seules les leçons de géologie ont un fil ; toutes leurs scènes ont une étape valide', () => {
  assert.deepEqual(LESSONS.filter(L => L.thread).map(L => L.id).sort(), ['coupe', 'geocarte']);
  for (const L of [geo, cut]) for (const sc of L.scenes) assert.ok(STEPS.includes(stepOf(sc)) || stepOf(sc) === 'all', `${L.id}.${sc.id} : étape « ${stepOf(sc)} » invalide`);
  for (const L of LESSONS.filter(l => !l.thread)) for (const sc of L.scenes) assert.equal(stepOf(sc), null, `${L.id}.${sc.id} : étape sans leçon à fil`);
});

test('correspondance scène → étape (version 0, à relire) ; le bilan montre les six étapes ; chaque étape est exercée', () => {
  for (const L of [geo, cut]) {
    assert.deepEqual(Object.fromEntries(L.scenes.map(sc => [sc.id, stepOf(sc)])), MAPPING_V0[L.id], `${L.id} : la correspondance a changé`);
    assert.equal(stepOf(L.scenes.at(-1)), 'all', `${L.id} : le bilan doit montrer les six étapes`);
  }
  const used = new Set([...geo.scenes, ...cut.scenes].map(stepOf)); for (const id of STEPS) assert.ok(used.has(id), `l'étape « ${id} » n'est exercée par aucune scène`);
  assert.equal(stepOf(cut.scenes.find(s => s.id === 'pr')), 'verify', 'la pratique des coupes aboutit à « Vérifier »');
});

test('bandeau : six pastilles numérotées, une seule courante (aria-current) ; bilan : les six pleines ; aucun point focal, aucun SVG', () => {
  for (const L of [geo, cut]) for (const sc of L.scenes) {
    const h = threadHtml(L, sc), items = [...h.matchAll(/<li class="st-th( on)?" data-step="(\w+)"( aria-current="step")?>/g)];
    assert.equal(items.length, 6, `${L.id}.${sc.id}`);
    assert.deepEqual(items.map(m => m[2]), STEPS);
    if (stepOf(sc) === 'all') assert.ok(items.every(m => m[1]), `${L.id}.${sc.id} : le bilan doit pleiner les six étapes`);
    else { assert.equal(items.filter(m => m[1]).length, 1); assert.equal(items.filter(m => m[3]).length, 1); assert.equal(items.find(m => m[3])[2], stepOf(sc)); }
    assert.ok(!/\bfp\b/.test(h) && !/<svg/.test(h), 'le bandeau ne doit rien ajouter à la figure');
    for (let i = 1; i <= 6; i++) assert.ok(h.includes(`<b>${i}</b>`), 'numéro ' + i);
  }
  assert.equal(threadHtml(lessonById('relief'), lessonById('relief').scenes[0]), '', 'pas de fil hors géologie');
});

test('BROUILLON : la mention « brouillon automatique — à relire par un géologue » accompagne le fil (présentateur et fiche)', () => {
  assert.equal(THREAD_DRAFT, true, 'THREAD_DRAFT ne passe à false qu\'après relecture (nom et date dans docs/V3_1_PLAN.md)');
  assert.equal(t('th.draft'), 'brouillon automatique — à relire par un géologue');
  for (const L of [geo, cut]) for (const sc of L.scenes) { const n = threadNote(L, sc); assert.ok(n.includes(t('th.draft')), `${L.id}.${sc.id}`); assert.ok(n.startsWith('Fil :')); }
  assert.match(threadNote(geo, geo.scenes.find(s => s.id === 'dip')), /étape 3 — Mesurer : Quelle direction, quel pendage \?/);
  assert.match(read('js/stage/pages.js'), /THREAD_DRAFT \? `<p class="st-fil-draft">/);
  assert.match(read('js/stage/lesson.js'), /threadNote\(L, sc\)/);
});

test('CSS : noms ≥ 3,8 u, étape courante pleine ; le rail ne prend plus de place avec un fil (réapparaît au pointeur)', () => {
  const m = css.match(/\.st-th\{[^}]*font-size:var\(--thf,calc\(var\(--uc\)\*([\d.]+)\)\)/); assert.ok(m, 'taille des pastilles introuvable'); assert.ok(+m[1] >= 3.8, `pastilles ${m[1]} u < 3,8 u`);
  assert.match(css, /\.st-th\.on\{[^}]*background:var\(--st-pri\)/);
  assert.match(css, /\.has-thread \.st-l-rail\{[^}]*position:absolute[^}]*opacity:0/);
  assert.match(css, /\.has-thread\.act \.st-l-rail/);
  assert.match(css, /\.st-l-thread\.compact \.st-th:not\(\[aria-current\]\) span\{display:none\}/);
});

test('intégration : fitThread, route #/stage/fil, lien depuis l\'index, présentateur', () => {
  const lesson = read('js/stage/lesson.js'), stage = read('js/stage/stage.js');
  assert.match(lesson, /fitThread\(th\)/); assert.match(lesson, /has-thread/); assert.match(lesson, /id="lThread"/);
  assert.match(stage, /a === 'fil'/); assert.match(lesson, /href="#\/stage\/fil"/); assert.match(lesson, /class="pv-th"/);
});
