import AxeBuilder from '@axe-core/playwright'
import { expect, signInAs, test } from './fixtures'
import { ATHLETE_ACTIVITY_ID, USERS } from './mock-api/server'

// as : compte qui ouvre la page, quand l'écran audité en dépend (par défaut,
// USERS.athlete). Il figure dans le titre du test, qui doit rester unique.
const PAGES: Array<{ path: string; authenticated: boolean; as?: 'legacyAudit' }> = [
  { path: '/login', authenticated: false },
  // Écran de consentement aux données de santé, à la place du tableau de bord.
  { path: '/dashboard', authenticated: true, as: 'legacyAudit' },
  { path: '/dashboard', authenticated: true },
  { path: '/activities/upload', authenticated: true },
  { path: `/activities/${ATHLETE_ACTIVITY_ID}`, authenticated: true },
  { path: '/profile', authenticated: true },
  { path: '/athlete-data', authenticated: true },
  { path: '/coaches', authenticated: true },
  { path: '/legal', authenticated: false },
  { path: '/privacy', authenticated: false },
]

// Les animations d'entrée (Reveal, modales) démarrent à opacity 0 : axe
// mesurerait le contraste d'un texte à moitié transparent.
test.use({ contextOptions: { reducedMotion: 'reduce' } })

// L'interface est dessinée en sombre, le clair en est la traduction : les deux
// thèmes sont audités.
for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`T18 — accessibilité, thème ${colorScheme}`, () => {
    test.use({ colorScheme })

    for (const { path, authenticated, as } of PAGES) {
      test(`${path}${as ? ` (${as})` : ''} : aucune violation axe « serious » ou « critical »`, async ({ page, context }) => {
        if (authenticated) await signInAs(context, USERS[as ?? 'athlete'])
        await page.goto(path)
        await page.waitForLoadState('networkidle')

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        const blocking = results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => ({ rule: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) }))

        expect(blocking).toEqual([])
      })
    }
  })
}

test.describe('T29 — navigation au clavier et titres de page (RGAA 8.6, 12.7)', () => {
  test('chaque page a son propre titre', async ({ page, context }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle('Log in · Sessionized')

    await signInAs(context, USERS.athlete)
    const titles: Record<string, string> = {
      '/dashboard': 'Calendar · Sessionized',
      '/activities/upload': 'Upload activity · Sessionized',
      '/profile': 'Profile · Sessionized',
      '/athlete-data': 'Athlete data · Sessionized',
      '/legal': 'Legal notice · Sessionized',
    }
    for (const [path, title] of Object.entries(titles)) {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
    }
  })

  test('le lien d’évitement est le premier arrêt du clavier et mène au contenu', async ({ page, context }) => {
    await signInAs(context, USERS.athlete)
    await page.goto('/profile')

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('barre latérale repliée : chaque lien garde son nom', async ({ page, context }) => {
    await signInAs(context, USERS.athlete)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Collapse sidebar' }).click()

    const nav = page.locator('aside')
    for (const name of ['Calendar', 'Athlete Data', 'Profile', 'Upload activity', 'Log out']) {
      await expect(nav.getByRole(name === 'Log out' ? 'button' : 'link', { name, exact: true })).toBeVisible()
    }
  })
})

// Régressions relevées le 08/11/2026 en capturant les écrans du dossier.
test.describe('T32 — préférences du système et affichage mobile', () => {
  // « Réduire les animations » faisait rendre à Reveal et Tilt un HTML
  // différent de celui du serveur : erreur d'hydratation (React n° 418), page
  // reconstruite côté client et thème clair perdu.
  test('« réduire les animations » : aucune erreur d’hydratation, le thème clair est conservé', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' })
    await signInAs(context, USERS.athlete)
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    for (const path of ['/dashboard', '/profile']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    }
    expect(errors).toEqual([])
    await context.close()
  })

  // Les calques de Leaflet (z-index 400 et plus) passaient au-dessus du menu.
  test('mobile : le menu ouvert passe au-dessus de la carte', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await signInAs(context, USERS.athlete)
    const page = await context.newPage()
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    )
    await page.goto(`/activities/${ATHLETE_ACTIVITY_ID}`)
    const map = page.locator('.leaflet-container')
    await expect(map).toBeVisible()

    await page.getByRole('button', { name: 'Open menu' }).click()
    const box = (await map.boundingBox())!
    // Un point de la carte recouvert par le tiroir du menu (256 px de large).
    const topmost = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('.leaflet-container') === null,
      { x: Math.min(box.x + 40, 200), y: box.y + box.height / 2 },
    )
    expect(topmost).toBe(true)
    await context.close()
  })
})
