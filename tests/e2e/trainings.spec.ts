import { expect, signInAs, test } from './fixtures'
import { ATHLETE_ACTIVITY_ID, USERS } from './mock-api/server'

// Séances de qualité. L'activité de référence de l'API simulée est un
// fractionné de six répétitions de 2 min à 5 m/s, marqué `training`.
// Lecture seule : l'API simulée est partagée par les tests parallèles, et
// basculer le flag ici changerait la page auditée par a11y.spec.ts. La bascule
// elle-même est couverte par TrainingToggle.test.tsx.
test.describe('Séances de qualité', () => {
  test('une activité marquée qualité est analysée avec les autres', async ({ page, context }) => {
    // Style minimal à la place des tuiles externes, bloquées pendant les tests.
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    )
    await signInAs(context, USERS.athlete)
    await page.goto(`/activities/${ATHLETE_ACTIVITY_ID}`)

    await expect(page.getByRole('switch', { name: 'Quality session' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('link', { name: 'See the analysis' }).click()
    await expect(page).toHaveURL('/trainings')

    // 600 m en 2 min par répétition : 3'20"/km.
    const row = page.getByRole('row', { name: /6 × 2'00"/ })
    await expect(row).toContainText(`3'20"/km`)
    await expect(row.getByRole('link')).toHaveAttribute('href', `/activities/${ATHLETE_ACTIVITY_ID}`)
    await expect(page.getByRole('heading', { name: 'Rep pace · Medium reps' })).toBeVisible()
  })
})
