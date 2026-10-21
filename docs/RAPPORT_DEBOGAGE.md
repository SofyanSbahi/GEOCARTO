# Rapport de débogage – écran bloqué sur « Chargement… »

## Cause racine (reproduite)
`index.html` contenait un `<div id="view">Chargement…</div>` statique et ne chargeait l'application que par `<script type="module" src="js/main.js">`.
Les navigateurs **interdisent le chargement de modules ES depuis `file://`** (origine « null », politique CORS). Console observée :
`Access to script at 'file:///…/js/main.js' from origin 'null' has been blocked by CORS policy` → `main.js` ne s'exécute jamais → le texte statique n'est jamais remplacé.
Aggravant : aucun garde-fou ne signalait l'échec. C'est un défaut de ma livraison précédente : je ne l'avais testée que via un serveur http.

Je n'ai pas pu reproduire le blocage via http (localhost, ni sous-dossier `/repo/` imitant GitHub Pages). Si ton blocage survient bien en ligne, la cause probable est un dépôt incomplet (voir §5 : le garde-fou affichera désormais le fichier manquant). Je ne peux pas le confirmer sans ton URL / ta console.

## Vérifications demandées
| # | Point | Résultat |
|---|---|---|
| 1 | Erreurs console | file:// : blocage CORS de `main.js` (cause). http : aucune erreur sur les 24 routes. |
| 2 | `fetch()` | **Aucun** `fetch` applicatif : tout le contenu est en JavaScript (`js/content/lessons.js`, `js/data/*.js`). Seul `sw.js` en utilise (hors file://). Il n'y a donc ni JSON ni Markdown à charger. |
| 3 | Fichiers de contenu | Tous les imports relatifs et les 15 images `img/*.webp` référencés existent (script de vérification, 0 manquant). |
| 4 | Chemins relatifs | Tous relatifs, aucun `/` initial → compatible sous-dossier (`/repo/`). |
| 5 | GitHub Pages | Testé sous `/repo/` : OK. `.nojekyll` présent. Attention à la casse des noms (Pages est sensible) et à publier `dist/`. |
| 6 | file:// et localhost | Corrigé : 24/24 routes sans erreur en file:// ; localhost et sous-dossier OK. |
| 7 | Gestion d'erreurs | Garde-fou inline (erreur JS, `dist/app.js` introuvable, démarrage > 6 s) ; carte d'erreur par page ; assistant optionnel isolé. |
| 8 | Leçon de secours | Leçon inconnue → leçon générée automatiquement + liens vers outils. Image absente → encadré « Figure indisponible ». |
| 9 | Rapport | Ce document. |
| 10 | Version corrigée | `geocarto2-site.zip` (bundle `dist/app.js`, 0,85 Mo). |

## Correctifs
1. Bundle classique `dist/app.js` (esbuild, IIFE) chargé par `<script defer>` : fonctionne en file://, localhost et Pages. Les `import()` dynamiques sont explicites (plus de chemin construit à l'exécution).
2. Garde-fou de démarrage dans `index.html` + `onerror` sur le script.
3. Leçon de secours, repli d'images, message d'erreur par page.
4. Service worker : version de cache incrémentée (anciens caches purgés).

## Tests effectués (Chromium headless)
file://, http://localhost, http://localhost/repo/ ; 24 routes ; bundle supprimé → message explicite ; image supprimée → repli ; leçon/route inconnue → leçon de secours / accueil.
**Non testé** : Safari, Firefox, vrais mobiles, et ton déploiement réel.
