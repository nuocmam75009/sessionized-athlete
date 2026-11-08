'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

// Préférence « réduire les animations » appliquée par motion lui-même : les
// déplacements et rotations deviennent instantanés, seuls les fondus restent.
//
// Les composants ne doivent pas changer leur rendu selon useReducedMotion() :
// ce hook vaut toujours « non » sur le serveur et « oui » dans un navigateur
// qui l'a activée. Un HTML différent des deux côtés casse l'hydratation
// (erreur React n° 418) : React reconstruit alors toute la page côté client
// et perd au passage le thème posé sur <html> par le script d'amorçage.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
