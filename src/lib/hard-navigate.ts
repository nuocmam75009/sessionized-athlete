// Navigation avec rechargement complet de la page : vide l'état client et le
// cache du routeur, à la différence de router.push. Isolée dans un module pour
// être simulée dans les tests (jsdom n'implémente pas la navigation).
export function hardNavigate(path: string) {
  window.location.assign(path)
}
