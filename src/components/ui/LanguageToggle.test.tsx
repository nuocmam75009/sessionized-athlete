import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/components/layout/I18nProvider'
import type { Locale } from '@/lib/i18n/config'
import { LanguageToggle } from './LanguageToggle'

// T34 — bascule de langue. La Server Function est simulée : sous jsdom, aucun
// serveur ne pose le cookie ni ne renvoie la page re-rendue.
const action = vi.hoisted(() => ({ setLocale: vi.fn<(locale: Locale) => Promise<void>>() }))
vi.mock('@/lib/i18n/actions', () => action)

function renderToggle(locale: Locale = 'en') {
  render(
    <I18nProvider locale={locale}>
      <LanguageToggle />
    </I18nProvider>,
  )
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    action.setLocale.mockReset()
  })

  it('T34 — groupe nommé, une bascule par langue, la langue courante enfoncée', () => {
    renderToggle('en')
    const group = screen.getByRole('group', { name: 'Language' })
    expect(within(group).getByRole('button', { name: 'EN English' })).toHaveAttribute('aria-pressed', 'true')
    const french = within(group).getByRole('button', { name: 'FR Français' })
    expect(french).toHaveAttribute('aria-pressed', 'false')
    // Prononcé avec les règles du français par un lecteur d'écran.
    expect(french).toHaveAttribute('lang', 'fr')
  })

  it('T34 — nommé dans la langue de l’interface', () => {
    renderToggle('fr')
    expect(screen.getByRole('group', { name: 'Langue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FR Français' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('T34 — le clic mémorise la langue, et le curseur part sans attendre la réponse', async () => {
    // Réponse du serveur suspendue : on observe l'état pendant la transition.
    action.setLocale.mockReturnValue(new Promise(() => {}))
    renderToggle('en')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'FR Français' }))
    })

    expect(action.setLocale).toHaveBeenCalledWith('fr')
    expect(screen.getByRole('button', { name: 'FR Français' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true')
  })

  it('ne rappelle pas le serveur pour la langue déjà affichée', () => {
    renderToggle('en')
    fireEvent.click(screen.getByRole('button', { name: 'EN English' }))
    expect(action.setLocale).not.toHaveBeenCalled()
  })
})
