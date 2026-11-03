import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Sans `globals: true`, Testing Library ne démonte pas seul les composants
// entre deux tests : un rendu précédent resterait dans le DOM.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
