import { expect, signInAs, test } from './fixtures'
import { USERS } from './mock-api/server'

// T23 — mentions légales et politique de confidentialité : lisibles sans
// compte, et atteignables depuis chaque écran.
test.describe('Pages légales', () => {
  for (const [path, heading] of [
    ['/legal', 'Legal notice'],
    ['/privacy', 'Privacy policy'],
  ] as const) {
    test(`T23 — ${path} s’ouvre sans être connecté`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveURL(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    })
  }

  test('T23 — lien depuis l’écran de connexion', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Privacy policy' }).click()
    await expect(page).toHaveURL('/privacy')
  })

  test('T23 — lien depuis l’app, une fois connecté', async ({ page, context }) => {
    await signInAs(context, USERS.athlete)
    await page.goto('/dashboard')
    await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Legal notice' }).click()
    await expect(page).toHaveURL('/legal')
  })
})
