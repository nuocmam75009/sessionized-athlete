'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * Faux pendant le rendu serveur et l'hydratation, vrai ensuite.
 *
 * Avant l'hydratation, un formulaire est affiché mais ses gestionnaires React
 * ne sont pas encore branchés : un clic sur « Log in » déclenchait une
 * soumission native (rechargement, saisie perdue), un fichier choisi n'était
 * jamais lu. Les commandes concernées restent désactivées jusque-là — sur une
 * connexion lente, l'utilisateur voit un bouton inactif plutôt qu'une page
 * qui se recharge sans rien dire. L'instantané serveur garantit que le HTML
 * hydraté est identique à celui du serveur.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
