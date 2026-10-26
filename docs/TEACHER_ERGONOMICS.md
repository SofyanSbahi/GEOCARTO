# Ergonomie enseignant (mode Stage) — fait en rc.5, à évaluer après l'essai

> Version 1.0 · 2026-10-26. Périmètre : **confort de l'enseignant** uniquement ; pédagogie et écran projeté inchangés.

## 1. Constat de départ (rc.4)
- Vue enseignant ouvrable seulement depuis la projection (touche P) ; aucune entrée depuis l'index ; impossible de rouvrir la projection depuis la vue enseignant.
- Statut « Connecté » jamais remis à jour si la projection est fermée ou rechargée ; aucun signal de présence.
- **Aucune touche dans la vue enseignant** : une télécommande de présentation ou le clavier ne faisaient rien quand le focus était sur l'écran de l'enseignant.
- Boutons d'environ 40 px dans la vue enseignant ; pas de geste de balayage.

## 2. Fait en rc.5 (vue enseignant et index seulement)
| # | Amélioration | Réalisation |
|---|---|---|
| 1 | Lancement plus simple | Bouton « Ouvrir la fenêtre de projection » dans la vue enseignant (visible quand la projection n'est pas détectée) |
| 2 | État de synchronisation | La projection envoie un signal toutes les 2 s (rien n'est dessiné) ; la vue enseignant affiche 🟢 *Synchronisé*, 🟠 *En attente* ou 🔴 *Projection non détectée* (après 5,5 s de silence), et grise les commandes tant que la liaison est perdue |
| 3 | Projection + vue enseignant en un clic | Sur chaque leçon de l'index : « 🎙️ Projection + vue enseignant ». La projection s'ouvre dans une fenêtre, la vue enseignant prend l'onglet courant ; un encadré « deux écrans : trois gestes » guide la mise en place |
| 5 | Grandes commandes | Barre ◀ / ▶ de 72 px de haut en tête de la vue enseignant, position « Scène a / b · étape c / d », boutons ≥ 52 px, votes 76 × 64 px |
| 6 | Raccourcis clavier | Les **mêmes touches** que la projection, relayées : → Espace Entrée Page↓ / ← Page↑, Début / Fin, ↑ ↓, A–D ou 1–4 (Maj = retirer), R, I, « . » (écran vide), N, T, + −, K. Non relayées : Échap (quitter), F (le plein écran exige un geste dans la fenêtre de projection), H (l'aide s'afficherait aux étudiants), P |

**Vérifié** : écran projeté identique au pixel à rc.4 (42 écrans de 5 leçons, capture déterministe) ; parcours complet dans Chromium (lancement en un clic, touches relayées, votes, fermeture puis réouverture de la projection) ; tests `tests/presenter.test.js`.

## 3. Restent à évaluer après l'essai
### Item 4 — Vue enseignant plein écran, optimisée pour deux écrans
- **Idée** : une mise en page qui tient sans défilement sur l'écran de l'ordinateur (scène, note, question, votes, ◀ ▶), et un bouton « Plein écran ».
- **Placement automatique de la projection sur le second écran** : possible seulement dans **Chrome / Edge** (API de gestion des fenêtres multi-écrans, avec autorisation demandée à l'utilisateur) ; ailleurs, glisser la fenêtre à la main (comme aujourd'hui).
- **Questions pour l'essai** : quel ordinateur et quel navigateur en salle ? Le défilement de la vue enseignant gêne-t-il ? Combien de temps prend l'installation à deux écrans ?
- **Effort** : moyen ; **risque** : moyen (compatibilité navigateurs).

### Item 7 — Écrans tactiles et tablettes de l'enseignant
- **Possible** : balayage gauche / droite dans la vue enseignant, cibles de 64 px, compteurs de vote au doigt (une partie est déjà faite en rc.5 avec les grands boutons).
- **Non faisable sur un site statique** : utiliser une **tablette comme télécommande** de l'ordinateur relié au projecteur. La synchronisation actuelle (`BroadcastChannel`) ne relie que des fenêtres du **même navigateur sur la même machine** ; relier deux appareils exige un serveur ou un relais (WebRTC avec signalisation), c'est-à-dire un hébergement différent.
- **Questions pour l'essai** : l'enseignant utilise-t-il un écran tactile, un tableau interactif, une tablette ? Une télécommande de présentation (qui envoie Page↓ / Page↑, déjà pris en charge) suffit-elle ?
- **Effort** : moyen pour le tactile local ; élevé (et changement d'hébergement) pour la télécommande sur tablette.

## 4. À observer pendant l'essai (ajout possible à la fiche d'observation)
- Temps de mise en place des deux fenêtres ; nombre de pertes de synchronisation ; touches ou boutons réellement utilisés ; besoin d'une télécommande ou d'une tablette.

## 5. rc.6 — enchaînement des leçons
Fait : carte de fin de leçon, passage à la leçon suivante au clavier ou à la télécommande, navigation entre leçons et suivi automatique dans la vue enseignant (voir `V3_1_RELEASE.md` § 11). À évaluer après l'essai : **plan de séance choisi** depuis l'index (par ex. Échelle → Orientation → Coordonnées seulement).
