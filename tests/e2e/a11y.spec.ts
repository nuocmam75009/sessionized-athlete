import AxeBuilder from '@axe-core/playwright'
import { expect, signInAs, test } from './fixtures'
import { ATHLETE_ACTIVITY_ID, USERS } from './mock-api/server'

const PAGES: Array<{ path: string; authenticated: boolean }> = [
  { path: '/login', authenticated: false },
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

    for (const { path, authenticated } of PAGES) {
      test(`${path} : aucune violation axe « serious » ou « critical »`, async ({ page, context }) => {
        if (authenticated) await signInAs(context, USERS.athlete)
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
