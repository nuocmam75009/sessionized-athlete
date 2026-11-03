import { expect, signInAs, test } from './fixtures'
import { ATHLETE_ACTIVITY_ID, OTHER_ATHLETE_ACTIVITY_ID, USERS } from './mock-api/server'

test.describe('Sécurité — accès aux activités', () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, USERS.athlete)
  })

  test('contrôle positif : l’athlète ouvre sa propre activité', async ({ page }) => {
    const response = await page.goto(`/activities/${ATHLETE_ACTIVITY_ID}`)
    expect(response?.status()).toBe(200)
  })

  test('T14 — activité d’un autre athlète : 404, rien n’est divulgué', async ({ page }) => {
    const response = await page.goto(`/activities/${OTHER_ATHLETE_ACTIVITY_ID}`)
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Note privée de Otto')).toHaveCount(0)

    const api = await page.request.get(`/api/activities/${OTHER_ATHLETE_ACTIVITY_ID}`)
    expect(api.status()).toBe(404)
  })

  test('T15 — GET /api/activities/..%2Fusers%2Fme : 400 (identifiant invalide)', async ({ page }) => {
    const api = await page.request.get('/api/activities/..%2Fusers%2Fme')
    expect(api.status()).toBe(400)
    expect(await api.text()).not.toContain(USERS.athlete.email)
  })

  test('T15 — page /activities/..%2Fusers%2Fme : 404, pas de rendu du profil', async ({ page }) => {
    const response = await page.goto('/activities/..%2Fusers%2Fme')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(USERS.athlete.email)).toHaveCount(0)
  })
})
