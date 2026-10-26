#!/usr/bin/env node
/* Audit de projection des leçons de géologie (v3.1, WP7) : lance la porte de qualité (stage_gate.mjs) sur Cartes géologiques, Coupes géologiques et le
   préalable « Lire le relief », sur toute la matrice formats × échelles de salle (4 formats × 4 échelles par défaut ; --quick : 2 × 3).
   Sert un serveur statique local lui-même : aucune configuration. Utilisable en local et en intégration continue (Chromium + Playwright requis).
   Usage : node tools/stage/audit_geology.mjs [--quick] [--lessons geocarte,coupe,prereq]
   Code de retour ≠ 0 s'il y a un défaut. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
srv.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const args = [path.join(root, 'tools/stage/stage_gate.mjs'), '--url', url, '--lessons', arg('lessons', 'geocarte,coupe,prereq')];
  for (const f of ['--quick', '--all']) if (process.argv.includes(f)) args.push(f);
  /* spawn asynchrone : le serveur doit rester réactif pendant que la porte tourne */
  spawn(process.execPath, args, { stdio: 'inherit', cwd: root }).on('exit', code => { srv.close(); process.exit(code ?? 1); });
});
