/* Registre des chapitres : un chapitre = Théorie → Exemple → Activité → Exercices → Quiz → Validation */
export const CH={
 def:{mod:'m1',skill:'cartes'},echelle:{mod:'m1',skill:'echelle'},orient:{mod:'m1',skill:'orientation'},coord:{mod:'m1',skill:'coordonnees'},courbes:{mod:'m1',skill:'courbes'},pente:{mod:'m1',skill:'pente'},formes:{mod:'m1',skill:'formes'},
 theorie:{mod:'m2',skill:'profils'},methode:{mod:'m2',skill:'profils'},echelles:{mod:'m2',skill:'profils'},auto:{mod:'m2',skill:'profils'},
 geo1:{mod:'m3',skill:'geol'},geo2:{mod:'m3',skill:'geol'},geo3:{mod:'m3',skill:'geol'},
 coupe1:{mod:'m4',skill:'coupes'},coupe2:{mod:'m4',skill:'coupes'}};
export const MODNAMES={m1:'Cartographie topographique',m2:'Profils topographiques',m3:'Cartes géologiques',m4:'Coupes géologiques'};
export const MODICON={m1:'📍',m2:'📈',m3:'🪨',m4:'🧱'};
export const EXO_GOAL=4,QUIZ_GOAL=.8,ACT_GOAL=3; // critères de validation
