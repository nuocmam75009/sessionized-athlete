import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PendingHint } from './PendingHint'

// Sous jsdom, aucune navigation n'a lieu : on fixe l'état que Next renverrait.
const linkStatus = vi.hoisted(() => ({ pending: false }))
vi.mock('next/link', () => ({ useLinkStatus: () => linkStatus }))

function hint() {
  const { container } = render(<PendingHint />)
  const element = container.firstElementChild
  if (!element) throw new Error('Indice non rendu')
  return element
}

describe('PendingHint', () => {
  beforeEach(() => {
    linkStatus.pending = false
  })

  it('reste rendu mais invisible hors navigation : pas de décalage de mise en page', () => {
    const element = hint()
    expect(element).toHaveClass('opacity-0')
    expect(element).not.toHaveAttribute('data-pending')
  })

  it('apparaît pendant la navigation, animé seulement si le mouvement est accepté', () => {
    linkStatus.pending = true
    const element = hint()
    expect(element).toHaveClass('opacity-100', 'motion-safe:animate-pulse')
    expect(element).not.toHaveClass('animate-pulse')
    expect(element).toHaveAttribute('data-pending', 'true')
  })

  it('est décoratif : masqué des lecteurs d’écran, le nom du lien ne change pas', () => {
    expect(hint()).toHaveAttribute('aria-hidden', 'true')
  })
})
