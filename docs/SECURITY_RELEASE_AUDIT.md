# GéoCarto v3.1.0-rc.2 — audit de sécurité et de diffusion

> Version 1.0 · 2026-10-26 · audit **statique et local** du dépôt `SofyanSbahi/GEOCARTO` (branche `main` = rc.2). Aucune action n'a été faite sur GitHub (réglages, accès) ; ce qui n'a pas pu être vérifié est signalé « non vérifié ».
> **Objectif de Sofyan** : partager GéoCarto avec des collègues et des étudiants **par un lien**, sans leur donner le code source et sans qu'ils puissent le modifier.

## 1. Réponse courte

| Souhait | Possible ? | Comment |
|---|---|---|
| Les utilisateurs **ne peuvent pas modifier** votre application | **Oui** | Ils ne reçoivent qu'une copie dans leur navigateur ; modifier cette copie n'affecte personne d'autre. Seuls ceux qui ont le droit d'écriture sur le dépôt / l'hébergement peuvent changer la version diffusée. |
| Ils **n'ont pas accès au dépôt** (historique, tests, docs, outils) | **Oui** | Dépôt privé (c'est le cas : `private: true`) + publier **uniquement** le dossier `site/` (script fourni). |
| Ils **ne peuvent pas lire le code JavaScript** de l'interface | **Non, pas complètement** | Toute application web envoie son code au navigateur. Ici : un seul fichier `dist/app.js` (1,2 Mo, minifié, **sans carte source**). Minifié ≠ protégé : un outil de mise en forme le rend lisible en une minute. L'obfuscation ralentit sans empêcher, casse la maintenance et n'est pas de la sécurité. |
| **Seules les personnes invitées** ouvrent le lien | **Seulement avec un hébergement qui authentifie** | GitHub Pages sur dépôt privé publie un site **public** (quiconque a l'adresse y accède) sauf offre Enterprise Cloud ; voir § 5. |

À retenir : **protéger l'accès au code source (dépôt) et au droit de modifier (écriture) est réalisable ; empêcher de *voir* le code de l'interface ne l'est pas.** La protection réelle du travail est le droit d'auteur et une mention claire, pas le secret.

## 2. Constats (par gravité)

| # | Gravité | Constat | Preuve | Recommandation |
|---|---|---|---|---|
| F1 | **Élevée** | **Publier la racine du dépôt (réglage GitHub Pages par défaut) exposerait tout le code source** : `js/` (96 fichiers non minifiés), `tests/`, `docs/`, `tools/`, `README.md` (avec le code enseignant), `package*.json`. `dist/app.js` n'est pas le seul fichier servi. | `git ls-files` : 96 js, 68 tests, 24 docs, 8 tools ; le dépôt contient aussi `.nojekyll`, donc rien n'est filtré. | Publier **uniquement `site/`** (§ 6). Testé : l'application fonctionne depuis `site/` seul (porte de projection : 136 écrans, 0 défaut ; 0 requête en erreur ; `js/main.js` → 404). |
| F2 | **Élevée** | **Le code enseignant est écrit en clair dans `README.md`, dans `docs/RAPPORT_PHASE2.md` et dans l'historique Git depuis le tout premier dépôt (commit `ec1840d`)** ; son empreinte SHA-256 **non salée** est dans `config.js` (public). L'empreinte du code documenté correspond bien (vérifié). | `git log -S"Atlas-K7Q2"` ; `sha256("…") = 9f7fee11…` = `config.js`. | **Changer le code**, ne jamais l'écrire dans un document ; le choisir long (≥ 12 caractères, phrase) car l'empreinte non salée est attaquable hors ligne. Retirer le code du README et du rapport (l'historique restera lisible par quiconque a accès au dépôt privé : d'où le changement de code). |
| F3 | **Moyenne** | **L'espace enseignant est contournable en une ligne** (`sessionStorage.setItem('gc_teacher','1')`) ; il donne accès au tableau de classe local, à la création de devoirs et à l'**aperçu des exercices avec corrigés**. | Reproduit (Chromium) : espace atteint sans code. | Le code est *dissuasif*, comme le dit déjà `prof.js`. **Aucun corrigé ne peut être caché dans une application statique** : les générateurs d'exercices calculent les réponses dans le navigateur. Si l'intégrité d'une évaluation compte, la faire **hors outil** (papier, plateforme de l'université). |
| F4 | **Moyenne** | **Injection (XSS stockée) par le nom d'un élève** : le tableau de classe écrit `r.name` sans l'échapper ; un rapport d'élève importé avec un nom piégé exécute du script dans le navigateur de l'enseignant (reproduit). Portée limitée : aucun serveur, aucune donnée centrale ; le script peut lire le `localStorage` de l'application (tableau de classe) et se faire passer pour l'enseignant. | Reproduit : `<img onerror=…>` exécuté. | Échapper `r.name`, `r.cls` (et le champ « Prénom / pseudo » de `portfolio.js`) ; ajouter un test. **Correctif non appliqué** : rc.2 est figée pour l'essai en classe ; à intégrer dans une rc.3 si vous le décidez. |
| F5 | **Moyenne** | **Aucune politique de sécurité de contenu (CSP)** ; scripts en ligne dans `index.html`. GitHub Pages ne permet pas d'envoyer d'en-têtes. | `index.html` : pas de `<meta http-equiv="Content-Security-Policy">`. | Ajouter une CSP par `<meta>` (`default-src 'self'; img-src 'self' data:`) après essai ; hébergement avec en-têtes (Cloudflare) pour plus de contrôle. À tester avec la porte avant diffusion. |
| F6 | Moyenne | **Un site GitHub Pages issu d'un dépôt privé est public** (plans Pro/Team) ; seul **Enterprise Cloud** peut le limiter aux personnes ayant accès au dépôt. Actuellement `has_pages: false` : **aucun site n'est publié** (le site que vous avez ouvert auparavant venait peut-être de l'époque où le dépôt était public — non vérifié). | API GitHub : `private: true`, `has_pages: false`. | Voir § 5 (choix d'hébergement). |
| F7 | Moyenne | **Droits des images et des cartes non vérifiés** : 15 images (`img/*.webp`, dont *lambertmaroc*, *tizi*, *zat*) et des cas marocains « inspirés » ; la source et la licence de chaque image sont inconnues. Les distribuer à des étudiants = les republier. | `img/` ; la référence GéoCarto §6 exige déjà « droits et sources par figure ». | Tableau `figure → source → licence/autorisation` avant diffusion large ; remplacer ce qui n'est pas libre. |
| F8 | Faible | **Réglages GitHub non vérifiables d'ici** (accès bloqué par le proxy) : liste des collaborateurs, protection de `main`, authentification à deux facteurs, `allow_forking: true`. | API : 403. | § 4 (liste à contrôler par vous). |
| F9 | Faible | **Pas de licence** (`license: null`). Par défaut, tous droits réservés — ce qui convient à votre souhait, mais ne le dit nulle part dans l'interface. | `license: null`. | Ajouter une mention « © Sofyan Sbahi — tous droits réservés — usage pédagogique par lien » dans l'application et un fichier `LICENSE` (ou une licence ouverte si vous changez d'avis). |
| F10 | Faible | **Service worker** : met en cache toute réponse du même site (réseau d'abord, cache en secours). Sans risque de contenu tiers ; une ancienne version peut rester affichée jusqu'au rechargement forcé. | `sw.js`. | Garder ; changer le nom de cache (`V`) à chaque version (fait pour 3.1). |

### Points positifs (vérifiés)
- **Aucun appel réseau sortant** : pas de CDN, de police distante, de statistiques, de `fetch`/XHR/WebSocket ; seules requêtes : `index.html`, `config.js`, `css/`, `dist/`, `img/`. → **aucune donnée d'étudiant ne quitte l'appareil** ; pas de bannière de consentement nécessaire pour ce qui est suivi (journal de votes, progression : `localStorage`).
- **Pas de `eval`, `new Function`, `document.write`.** Pas de carte source dans `dist/app.js`.
- **Aucun secret** (clé d'API, jeton, mot de passe) dans l'arbre du dépôt ; adresses de commit = adresses « noreply » GitHub ; aucun courriel personnel dans les fichiers.
- **Dépendances** : une seule, de développement (`esbuild`, version épinglée) ; `npm audit` : **0 vulnérabilité** ; three.js (MIT) embarqué avec sa licence (conservée dans le bundle et dans `site/THIRD-PARTY-LICENSES.txt`).
- **Construction reproductible** (`check:dist`) : le fichier diffusé correspond au code ; **CI en lecture seule** (`permissions: contents: read`).
- **Dépôt privé** (`private: true`).

## 3. Ce que voit exactement un utilisateur du lien (si on publie `site/`)
- `index.html`, `config.js` (contient l'empreinte du code enseignant et le nom de la classe — **à ne pas mettre de donnée sensible**), `css/`, `img/`, `dist/app.js` (code minifié), `sw.js`, `manifest.webmanifest`.
- **Pas** : le dépôt, l'historique, `js/` lisible, tests, documents (revue, plan, protocole, vision v3.2), outils, README.
- Il **peut** : lire/mettre en forme `app.js`, enregistrer une copie, la modifier **chez lui**. Il **ne peut pas** : modifier votre version en ligne.

## 4. Liste de contrôle des réglages GitHub (à faire par vous, 10 minutes)
1. **Settings → Collaborators** : seulement vous (et au plus un relecteur en *lecture*). Les colleagues et étudiants n'ont **pas** besoin de compte GitHub pour utiliser le lien.
2. **Settings → Branches / Rules** : protéger `main` (PR obligatoire, pas de poussée forcée, pas de suppression).
3. **Authentification à deux facteurs** activée sur votre compte (et celui de tout collaborateur).
4. **Settings → General → Forks** : désactiver « Allow forking » (dépôt privé).
5. **Settings → Actions** : approuver l'exécution des workflows sur les PR (CI jamais exécutée jusqu'ici) ; garder les permissions en lecture seule.
6. **Settings → Pages** : ne **pas** choisir « Deploy from a branch → /(root) » (F1). Voir § 5.
7. Si le dépôt a un jour été public : tout ce qui y figurait a pu être copié ; **changer le code enseignant** quoi qu'il arrive.

## 5. Choisir l'hébergement du lien (décision de Sofyan)

| Option | Qui peut ouvrir le lien | Source visible ? | Coût / contraintes |
|---|---|---|---|
| **A. GitHub Pages depuis un dépôt public** | Tout le monde | **Oui, tout le dépôt** | ✘ À écarter : contraire à votre objectif. |
| **B. GitHub Pages depuis un dépôt privé, publication de `site/` par Actions** (plan Pro/Team) | **Toute personne ayant l'adresse** (non indexée mais non protégée) | Non (seulement `app.js` minifié) | Plan payant ; simple ; convient si le contenu n'est pas confidentiel. |
| **C. Hébergement statique avec contrôle d'accès** (par ex. Cloudflare Pages + Access par code envoyé par courriel ; Netlify avec mot de passe) | **Seulement les adresses autorisées** | Non | Offre gratuite de Cloudflare Access annoncée jusqu'à 50 utilisateurs, moyen de paiement possible à enregistrer *(à vérifier sur la page tarifaire actuelle)* ; ne pas oublier de protéger aussi l'adresse par défaut et les aperçus. |
| **D. Serveur de l'université** (site statique interne ou LMS) | Selon l'université | Non | Dépend du service informatique ; souvent le meilleur choix institutionnel. |
| **E. GitHub Enterprise Cloud (Pages privé)** | Seulement les personnes ayant accès au dépôt | Non | Offre entreprise ; **exige un compte GitHub pour chaque utilisateur** : peu adapté aux étudiants. |

**Recommandation** : **B** pour démarrer l'essai en classe (rapide, pas de compte pour les étudiants) ; **C ou D** si vous voulez restreindre aux personnes de votre établissement. Dans tous les cas : publier `site/`, dépôt privé, code enseignant changé, mention de droits dans l'application.

## 6. Procédure de publication sûre (testée localement)
1. `npm ci && sh build.sh` (reproduit `dist/app.js`).
2. `sh tools/make-site.sh` → dossier `site/` (25 fichiers, 2,1 Mo ; ignoré par Git).
3. Publier **le contenu de `site/`** :
   - *Option B* : activer Pages avec la source « GitHub Actions » et un workflow qui exécute les étapes 1-2 puis `upload-pages-artifact` (`path: site`) et `deploy-pages` (`permissions: pages: write, id-token: write`). **Non ajouté au dépôt** : à décider avec vous (nécessite le réglage Pages).
   - *Option C/D* : déposer le dossier tel quel.
4. Vérifier le lien publié (§ 7).

## 7. Vérifier que la version en ligne est la bonne (rc.2)
- `<adresse>/dist/app.js` : la taille et l'empreinte doivent correspondre à `sha256sum site/dist/app.js` en local.
- `<adresse>/sw.js` : nom de cache `geocarto-v4-stage4-v31`.
- `<adresse>/#/stage/prereq` et `#/stage/fil` existent ; dans *Stage → Coupes géologiques*, la barre « Observer … Vérifier » est visible.
- `<adresse>/js/main.js`, `<adresse>/README.md`, `<adresse>/docs/…` → **doivent répondre 404**.
- Rechargement forcé (Ctrl+Maj+R) ou fenêtre privée si l'ancienne version s'affiche (service worker).

## 8. Actions recommandées, dans l'ordre
| # | Action | Qui | Bloquant avant partage ? |
|---|---|---|---|
| 1 | Changer le code enseignant ; retirer l'ancien du README et de `docs/RAPPORT_PHASE2.md` | Sofyan (je peux préparer la modification des documents) | **Oui** |
| 2 | Choisir l'hébergement (§ 5) et publier **`site/`** seulement | Sofyan | **Oui** |
| 3 | Régler GitHub (§ 4) | Sofyan | Oui (2FA, collaborateurs) |
| 4 | Ajouter la mention de droits dans l'application + `LICENSE` | Sofyan décide ; moi pour l'écriture | Recommandé |
| 5 | Tableau des sources/droits des 15 images | Sofyan | Recommandé avant diffusion large |
| 6 | Correctif F4 (échapper les noms) + CSP (F5) dans une rc.3 | moi, sur votre accord | Recommandé (non bloquant pour l'essai local) |
| 7 | Ne pas compter sur l'espace enseignant pour cacher des corrigés ou protéger une évaluation | — | Information |

## 9. Limites de cet audit
Audit statique du dépôt et essais locaux ; pas de test d'intrusion sur un site déployé (il n'y en a pas : `has_pages: false`) ; réglages GitHub non lus ; modèle de menace : étudiants et collègues curieux, pas un attaquant ciblé. Les informations sur les offres (GitHub, Cloudflare) viennent de la documentation consultée aujourd'hui et sont à reconfirmer.
