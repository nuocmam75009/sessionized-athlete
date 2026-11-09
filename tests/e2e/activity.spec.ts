import { expect, signInAs, test } from './fixtures'
import { ATHLETE_ACTIVITY_ID, USERS } from './mock-api/server'

// T33 — graphe d'allure et sélection de laps. Vérifié ici, dans un vrai
// navigateur : Recharts ne dessine rien dans jsdom. L'activité de référence de
// l'API simulée est un fractionné de 13 laps : échauffement (lap 1), six
// répétitions (laps 2, 4… 12) séparées par des récupérations, retour au calme.
test.describe('T33 — graphe d’allure et sélection de laps', () => {
  test.beforeEach(async ({ page, context }) => {
    // Style minimal à la place des tuiles externes, bloquées pendant les tests.
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    )
    await signInAs(context, USERS.athlete)
    await page.goto(`/activities/${ATHLETE_ACTIVITY_ID}`)
  })

  test('les répétitions ressortent d’office, bornées, et suivent le tableau', async ({ page }) => {
    const chart = page.locator('figure', { has: page.locator('.recharts-surface') })
    await expect(chart.locator('.recharts-line').first()).toBeVisible()
    const boundaries = chart.locator('.recharts-reference-line')

    // Six répétitions séparées par des récupérations : douze bornes distinctes.
    await expect(page.getByText('6 laps selected')).toBeVisible()
    await expect(boundaries).toHaveCount(12)

    // L'échauffement finit où commence la première répétition : seule sa borne
    // de départ s'ajoute.
    await page.getByRole('checkbox', { name: 'Select lap 1', exact: true }).check()
    await expect(page.getByText('7 laps selected')).toBeVisible()
    await expect(boundaries).toHaveCount(13)

    await page.getByRole('button', { name: 'Clear selection' }).click()
    await expect(boundaries).toHaveCount(0)
    await expect(page.getByText('Select laps to see their combined totals.')).toBeVisible()
  })

  test('survoler le graphe nomme le lap, cliquer le sélectionne', async ({ page }) => {
    const surface = page.locator('figure .recharts-surface').first()
    await expect(surface).toBeVisible()
    // Les sections chargées après coup (analyse aérobie) décalent le graphe :
    // on ne mesure sa position qu'une fois la page stable et à l'écran.
    await page.waitForLoadState('networkidle')
    await surface.scrollIntoViewIfNeeded()
    const box = (await surface.boundingBox())!
    // Vers 15 % de la zone tracée (après l'axe des allures, 48 px) : en pleine
    // portion d'échauffement, qui couvre le premier tiers de la séance.
    const point = { x: box.x + 48 + (box.width - 56) * 0.15, y: box.y + 60 }

    await page.mouse.move(point.x, point.y)
    await expect(page.locator('.recharts-tooltip-wrapper')).toContainText('Lap 1')

    await page.mouse.click(point.x, point.y)
    await expect(page.getByRole('checkbox', { name: 'Select lap 1', exact: true })).toBeChecked()
    await expect(page.getByText('7 laps selected')).toBeVisible()

    // Un clic dans l'aperçu du bas navigue, il ne sélectionne rien.
    const strip = (await page.locator('figure .recharts-brush').boundingBox())!
    await page.mouse.click(strip.x + strip.width * 0.15, strip.y + strip.height / 2)
    await expect(page.getByText('7 laps selected')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Select lap 1', exact: true })).toBeChecked()
  })
})
