export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'sessionized-theme'

// Le changement de thème est diffusé par un événement window plutôt que par un
// contexte React : la carte Leaflet doit recharger ses tuiles au basculement,
// et elle n'est pas forcément sous le même arbre que le bouton. Un événement
// évite d'envelopper toute l'app dans un provider pour deux abonnés.
export const THEME_CHANGE_EVENT = 'sessionized:themechange'

// Exécuté en tête de <body>, avant que le navigateur ne peigne quoi que ce
// soit : sans lui, la page s'affiche une fraction de seconde dans le thème par
// défaut avant que React n'ait hydraté et corrigé — le fameux flash blanc quand
// on a choisi le sombre. Volontairement en chaîne brute et sans dépendance,
// c'est la seule façon de le faire tourner assez tôt.
//
// Ordre de décision : choix explicite mémorisé > préférence système > sombre.
// Le sombre est le défaut parce que c'est le thème pour lequel l'interface est
// dessinée ; le clair en est la traduction.
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`

// Lue depuis le DOM et non depuis un état React : le script d'amorçage a déjà
// posé l'attribut avant l'hydratation, il fait donc autorité.
export function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function writeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Navigation privée ou stockage refusé : le thème tient pour la session,
    // ce qui vaut mieux que de faire échouer le clic.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}
