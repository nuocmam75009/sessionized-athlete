import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalLinks } from '@/components/layout/LegalLinks'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { HOSTS, PUBLISHER } from '@/lib/legal'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import LegalNoticePage from './legal/page'
import PrivacyPolicyPage from './privacy/page'

// T23 — mentions légales et politique de confidentialité.

describe('LegalLinks', () => {
  it('mène aux deux pages, dans une navigation nommée', () => {
    render(<LegalLinks />)
    const nav = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(nav).getByRole('link', { name: 'Legal notice' })).toHaveAttribute('href', '/legal')
    expect(within(nav).getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
  })
})

describe('Mentions légales', () => {
  it('identifient l’éditeur, le directeur de la publication et l’hébergeur (LCEN, art. 6)', () => {
    render(<LegalNoticePage />)
    for (const heading of ['Publisher', 'Publication director', 'Hosting']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText(PUBLISHER.publicationDirector)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(HOSTS.frontend.name))).toBeInTheDocument()
  })
})

describe('Politique de confidentialité', () => {
  it('couvre les rubriques d’information exigées par l’article 13 du RGPD', () => {
    render(<PrivacyPolicyPage />)
    for (const heading of [
      'Who is responsible for your data',
      'What we collect',
      'Why, and on what legal basis',
      'Who can see it',
      'How long we keep it',
      'Your rights',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText(/lodge a complaint with the CNIL/)).toBeInTheDocument()
  })

  it('annonce le traitement de données de santé et sa base légale', () => {
    render(<PrivacyPolicyPage />)
    expect(screen.getByText('health data')).toBeInTheDocument()
    expect(screen.getByText(/your explicit consent, given when you create your account/)).toBeInTheDocument()
  })

  it('nomme le cookie de session et la clé de thème réellement utilisés', () => {
    render(<PrivacyPolicyPage />)
    expect(screen.getByText(SESSION_COOKIE_NAME, { selector: 'code' })).toBeInTheDocument()
    expect(screen.getByText(THEME_STORAGE_KEY, { selector: 'code' })).toBeInTheDocument()
  })
})
