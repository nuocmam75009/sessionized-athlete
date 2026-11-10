import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/components/layout/I18nProvider'
import { LegalLinks } from '@/components/layout/LegalLinks'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { LOCALE_COOKIE_NAME, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { HOSTS, PUBLISHER } from '@/lib/legal'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import LegalNoticePage from './legal/page'
import PrivacyPolicyPage from './privacy/page'

// T23 — mentions légales et politique de confidentialité, dans les deux
// langues de l'interface (T34).

// Langue de la requête simulée : hors d'une vraie requête Next, getI18n() ne
// peut pas lire les cookies.
const request = vi.hoisted(() => ({ locale: 'en' as Locale }))
vi.mock('@/lib/i18n/server', () => ({
  getLocale: async () => request.locale,
  getI18n: async () => ({ locale: request.locale, t: getDictionary(request.locale) }),
}))

// Les pages sont des Server Components asynchrones : on rend l'élément
// qu'elles produisent.
async function renderPage(page: () => Promise<React.JSX.Element>, locale: Locale = 'en') {
  request.locale = locale
  render(await page())
}

beforeEach(() => {
  request.locale = 'en'
})

describe('LegalLinks', () => {
  it('mène aux deux pages, dans une navigation nommée', () => {
    render(<LegalLinks />)
    const nav = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(nav).getByRole('link', { name: 'Legal notice' })).toHaveAttribute('href', '/legal')
    expect(within(nav).getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
  })

  it('T34 — suit la langue de l’interface', () => {
    render(
      <I18nProvider locale="fr">
        <LegalLinks />
      </I18nProvider>,
    )
    const nav = screen.getByRole('navigation', { name: 'Informations légales' })
    expect(within(nav).getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/legal')
    expect(within(nav).getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/privacy')
  })
})

describe('Mentions légales', () => {
  it('identifient l’éditeur, le directeur de la publication et l’hébergeur (LCEN, art. 6)', async () => {
    await renderPage(LegalNoticePage)
    for (const heading of ['Publisher', 'Publication director', 'Hosting']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText(PUBLISHER.publicationDirector)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(HOSTS.frontend.name))).toBeInTheDocument()
  })

  it('T34 — existent en français, avec les mêmes rubriques', async () => {
    await renderPage(LegalNoticePage, 'fr')
    for (const heading of ['Mentions légales', 'Éditeur', 'Directeur de la publication', 'Hébergement']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText(PUBLISHER.publicationDirector)).toBeInTheDocument()
    expect(screen.getByText(/Dernière mise à jour/)).toBeInTheDocument()
  })
})

describe('Politique de confidentialité', () => {
  it('couvre les rubriques d’information exigées par l’article 13 du RGPD', async () => {
    await renderPage(PrivacyPolicyPage)
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

  it('T34 — couvre les mêmes rubriques en français', async () => {
    await renderPage(PrivacyPolicyPage, 'fr')
    for (const heading of [
      'Qui est responsable de vos données',
      'Ce que nous collectons',
      'Pourquoi, et sur quelle base légale',
      'Qui peut les voir',
      'Combien de temps nous les conservons',
      'Vos droits',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText('données de santé')).toBeInTheDocument()
    expect(screen.getByText(/adresser une réclamation à la CNIL/)).toBeInTheDocument()
  })

  it('annonce le traitement de données de santé et sa base légale', async () => {
    await renderPage(PrivacyPolicyPage)
    expect(screen.getByText('health data')).toBeInTheDocument()
    expect(screen.getByText(/your explicit consent, given when you create your account/)).toBeInTheDocument()
  })

  it.each(['en', 'fr'] as const)(
    'nomme le cookie de session, le cookie de langue et la clé de thème réellement utilisés (%s)',
    async (locale) => {
      await renderPage(PrivacyPolicyPage, locale)
      expect(screen.getByText(SESSION_COOKIE_NAME, { selector: 'code' })).toBeInTheDocument()
      expect(screen.getByText(LOCALE_COOKIE_NAME, { selector: 'code' })).toBeInTheDocument()
      expect(screen.getByText(THEME_STORAGE_KEY, { selector: 'code' })).toBeInTheDocument()
    },
  )
})
