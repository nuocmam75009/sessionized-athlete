import { currentMonthLabel, expect, signInAs, test, todayLabel } from './fixtures'
import { USERS, XSS_TITLE } from './mock-api/server'

test.describe('Calendrier', () => {
  for (const month of ['2026-13', 'abc']) {
    test(`T07 — ?month=${month} : mois courant affiché, pas d’erreur`, async ({ page, context }) => {
      await signInAs(context, USERS.athlete)
      const response = await page.goto(`/dashboard?month=${month}`)

      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(currentMonthLabel())
    })
  }

  test('T16 — titre piégé par le coach affiché comme texte, aucun script exécuté', async ({ page, context }) => {
    const dialogs: string[] = []
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message())
      void dialog.dismiss()
    })
    await signInAs(context, USERS.athlete)
    await page.goto('/dashboard')

    await page.getByRole('button').filter({ hasText: XSS_TITLE }).click()
    const modal = page.getByRole('dialog', { name: todayLabel() })
    await expect(modal.getByRole('heading', { name: XSS_TITLE })).toBeVisible()
    await expect(modal.getByText('<script>window.__xss = 1</script>', { exact: false })).toBeVisible()

    await expect(modal.locator('img, script')).toHaveCount(0)
    expect(await page.evaluate(() => (window as Window & { __xss?: number }).__xss)).toBeUndefined()
    expect(dialogs).toEqual([])
  })

  test('T17 — compte Strava connecté : la sortie Strava du jour apparaît sur sa case', async ({ page, context }) => {
    await signInAs(context, USERS.strava)
    await page.goto('/dashboard')

    // La synchronisation a lieu côté serveur avant le chargement des activités :
    // la sortie est là dès le premier rendu, sans action de l'athlète.
    await page.getByRole('button').filter({ hasText: 'Unplanned' }).filter({ hasText: 'Run' }).click()
    const modal = page.getByRole('dialog', { name: todayLabel() })
    await expect(modal.getByText('Run', { exact: true })).toBeVisible()
    await expect(modal.getByRole('link', { name: 'View full breakdown' })).toBeVisible()
  })

  test('T21 — connexion Strava inutilisable (409) : redirection sur le bouton de reconnexion', async ({
    page,
    context,
  }) => {
    await signInAs(context, USERS.stravaRevoked)
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/profile?strava=reconnect')
    await expect(page.getByRole('alert').filter({ hasText: 'Your Strava connection has expired' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reconnect Strava' })).toBeFocused()

    // L'API simulée n'a pas de route d'autorisation : l'échec doit être dit.
    const authorize = page.waitForResponse('**/api/strava/authorize')
    await page.getByRole('button', { name: 'Reconnect Strava' }).click()
    await authorize
    await expect(page.getByText("Couldn't start the Strava connection. Try again.")).toBeVisible()
  })

  test('T21 — compte Strava sain : ni redirection ni alerte', async ({ page, context }) => {
    await signInAs(context, USERS.strava)
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(currentMonthLabel())
    await expect(page).toHaveURL('/dashboard')
    // Limité à <main> : Next ajoute hors du contenu un annonceur de navigation
    // vide, lui aussi en role="alert".
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  })
})
