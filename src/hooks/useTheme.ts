'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { readTheme, writeTheme, THEME_CHANGE_EVENT, type Theme } from '@/lib/theme'

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange)
}

// Le serveur ne peut pas connaître le thème (il est dans le localStorage du
// navigateur) : il rend donc toujours la valeur par défaut. useSyncExternalStore
// s'appuie sur cet instantané pendant l'hydratation — le HTML correspond — puis
// relit le DOM juste après. C'est ce qui évite l'erreur d'hydratation qu'un
// simple useState/useEffect provoquerait.
function getServerSnapshot(): Theme {
  return 'dark'
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot)

  const setTheme = useCallback((next: Theme) => writeTheme(next), [])
  // Lit l'état au moment du clic plutôt que de capturer `theme` : la valeur
  // fermée sur ce rendu pourrait être périmée si un autre onglet ou un autre
  // bouton a basculé entre-temps.
  const toggle = useCallback(() => writeTheme(readTheme() === 'dark' ? 'light' : 'dark'), [])

  return { theme, setTheme, toggle }
}
