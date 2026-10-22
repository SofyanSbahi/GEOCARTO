# Protocole de validation en classe — premier essai de GéoCarto v3.1

> Version 1.0 (brouillon, à adapter par l'enseignant) · 2026-10-22.
> **But** : savoir si GéoCarto v3.1 est lisible, utilisable et pédagogiquement prometteur avec de vrais étudiants, **sans prétendre mesurer un gain d'apprentissage**. Un gain d'apprentissage exige un plan comparatif et l'accord d'un comité d'éthique : voir § 9.
> Ce protocole est une proposition de la machine ; l'enseignant décide.

## 1. Questions
- Q1 **Lisibilité** : un étudiant du dernier rang lit-il toutes les étiquettes et comprend-il les figures ?
- Q2 **Utilisabilité** : le vote (touches ou main levée), le mélange des lettres, la vue présentateur et le préalable fonctionnent-ils sans accroc ?
- Q3 **Diagnostic** : les « malentendus dominants » affichés correspondent-ils à ce que l'enseignant observe ?
- Q4 **Rythme** : les durées prévues (préalable ≈ 7 min, Cartes ≈ 38 min, Coupes à mesurer) tiennent-elles ?
- Q5 **Signal d'apprentissage (indicatif)** : le taux de bonnes réponses progresse-t-il entre le premier vote et le revote après discussion ?

## 2. Cadre
- **Public** : un groupe de première année de géologie, 20 à 60 étudiants. **Un seul groupe, pas de groupe témoin** : étude de faisabilité.
- **Séances** : S0 (5 min, avant) · S1 préalable + Cartes géologiques (≈ 50 min) · S2 Coupes géologiques (≈ 50 min), idéalement une semaine plus tard.
- **Déroulé type** : préalable (3 votes) → décision de l'enseignant selon le verdict (< 30 % : reprendre les courbes de niveau ; 30–70 % : revoir le réflexe le plus faible ; > 70 % : passer) → leçon avec votes, discussion par deux sur les bandes 30–70 %, revote (`R`).
- **Ne pas** noter l'essai ni en faire un contrôle : l'outil est en validation.

## 3. Avant l'essai (check-list enseignant)
1. [ ] Relire (ou faire relire) les notes et solutions des scènes qui seront utilisées ; noter chaque correction (le contenu est un brouillon automatique).
2. [ ] Ordinateur de projection : navigateur récent ; ouvrir l'adresse **en ligne une fois**, puis vérifier le mode hors-ligne.
3. [ ] Test du dernier rang (touche `K`) à la vraie place du dernier rang, au vrai projecteur ; photographier l'écran.
4. [ ] Deuxième écran ou tablette pour la **vue présentateur** (`#/stage/<leçon>/presenter`, même navigateur, même origine : elle ne fonctionne qu'en `http(s)`, pas en `file://`).
5. [ ] Décider comment les étudiants votent (main levée comptée par l'enseignant avec les boutons « + A… + D », ou autre) et l'expliquer en 1 minute.
6. [ ] Vider le journal local de l'appareil de projection avant la séance (navigation privée ou effacer les données du site) pour ne mesurer que l'essai.
7. [ ] Informer les étudiants : essai d'un outil, pas une évaluation, aucune donnée personnelle collectée (voir § 8).

## 4. Pendant la séance (observation structurée)
Un observateur (collègue ou assistant) remplit la **fiche d'observation** (§ 6) ; l'enseignant n'a pas à noter pendant qu'il enseigne.
Relevés par scène de vote : bande de Mazur au premier vote, bande après revote, durée réelle, incident (touche, lettre confuse, mauvaise lecture).
Questions flash : l'enseignant pose la « question flash » affichée en vue présentateur sur quelques scènes ; noter si elle déclenche une discussion utile.

## 5. Après la séance (10 minutes, étudiants)
Questionnaire anonyme, papier ou formulaire, 6 items (échelle 1–5, « pas du tout d'accord » → « tout à fait d'accord ») + 2 questions ouvertes :
1. Je pouvais lire tout ce qui était projeté depuis ma place.
2. Je comprenais ce qu'on me demandait à chaque vote.
3. Les mauvaises réponses proposées m'ont aidé à voir mon erreur.
4. La suite « Observer · Situer · Mesurer · Dater · Supposer · Vérifier » m'aide à savoir par où commencer.
5. Le rythme (trop lent / trop rapide) était adapté.
6. Je me sens plus capable de lire une carte géologique qu'avant.
7. (ouverte) Ce qui était le plus clair / le plus utile.
8. (ouverte) Ce qui était illisible, confus ou inutile.
Mentionner : place dans la salle (rangée 1–3 / milieu / fond) — **la seule variable demandée**, pour Q1.

## 6. Fiche d'observation (à imprimer)
| Scène (leçon / n°) | Heure | Vote 1 : % ok | Vote 2 (revote) : % ok | Malentendu dominant affiché | Correspond à ce qu'on a vu ? o/n | Incident (lisibilité, touche, lettre…) | Durée réelle |
|---|---|---|---|---|---|---|---|
Ajouter en bas : lumière de la salle, projecteur (modèle si connu), distance du dernier rang, nombre d'étudiants présents, navigateur/appareil.

## 7. Données et analyse
- **Source** : journal local de l'appareil de projection (`#/stage/bilan` : taux de réussite par question, gain du revote) + fiches d'observation + questionnaires.
- **Indicateurs** (descriptifs, sans test d'hypothèse) :
  - Q1 : % d'accord ≥ 4 à l'item 1, **par zone de la salle** ; incidents de lisibilité par scène (toute scène citée par ≥ 3 étudiants ou 2 observations est à corriger).
  - Q2 : nombre d'incidents techniques par séance.
  - Q3 : concordance (o/n) du malentendu affiché ; au moins 70 % de « oui » = affichage jugé utile.
  - Q4 : écart durée réelle / prévue par leçon.
  - Q5 : pour chaque vote ayant un revote, différence de % ok ; **à lire comme un signal de discussion, pas comme un apprentissage** (les étudiants se répondent entre eux).
- **Critères de décision (suggérés, à ajuster)** :
  - *Poursuivre tel quel* : lisibilité ≥ 80 % d'accord au fond de la salle, 0 incident bloquant, ≥ 70 % de concordance.
  - *Corriger puis réessayer* : toute scène illisible pour ≥ 20 % du fond de la salle, ou durée > 25 % au-dessus de la prévue.
  - *Suspendre* : incident bloquant répété ou erreur scientifique constatée (corriger le contenu avant toute reprise).
- Rapporter honnêtement les résultats faibles ; noter le nombre d'étudiants, car n est petit.

## 8. Éthique et données
- Pas de nom, pas d'identifiant, pas de photo d'étudiants ; questionnaire anonyme ; journal des votes en **compteurs seulement**, stocké sur l'appareil de projection, jamais envoyé.
- Un **essai de faisabilité d'un outil pédagogique, sans collecte de données personnelles ni publication**, relève en général d'une démarche de développement pédagogique ; **vérifier auprès de l'université** si une déclaration est requise. **Toute publication ou toute mesure de gain d'apprentissage exige l'avis du comité d'éthique avant la collecte.**
- Conserver les fiches et questionnaires jusqu'à la fin de l'analyse, puis les détruire ou les archiver anonymisés.

## 9. Si l'on veut ensuite mesurer un gain d'apprentissage (v3.2, hors de cet essai)
Plan à préparer avec un collègue en sciences de l'éducation et avec accord éthique : pré/post-test sur items communs (non liés aux scènes), deux groupes ou deux semestres (retour ciblé vs. retour générique, ou avec/sans préalable), analyse d'items, effet avec intervalle de confiance, taille d'échantillon justifiée. Un seul groupe sans témoin ne permet **pas** d'attribuer une progression à l'outil.

## 10. Après l'essai
1. Corriger les scènes citées (lisibilité) et les contenus erronés ; relancer `npm run audit:geology`.
2. Compléter G3/G4/G5 de [V3_1_RELEASE.md](V3_1_RELEASE.md).
3. Consigner l'essai (date, effectif, constats, décisions) dans le journal de [V3_1_PLAN.md](V3_1_PLAN.md) §9.
4. Décider de la v3.2 : D « Histoire d'une carte », ou essai comparatif.
