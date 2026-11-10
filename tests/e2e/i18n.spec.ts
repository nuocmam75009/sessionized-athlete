import { LOCALE_COOKIE_NAME } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { chooseLocale, currentMonthLabel, expect, signInAs, test } from './fixtures'
import { PASSWORD, USERS } from './mock-api/server'

const fr = getDictionary('fr')

// T34 — langue de l'interface : anglais ou français, choisi par le bouton de
// langue ou, à défaut, d'après le navigateur.
test.describe('T34 — langue de l’interface', () => {
  test('anglais pour un navigateur anglophone, sans choix enregistré', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page).toHaveTitle('Log in · Sessionized')
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
  })

  test.describe('navigateur francophone', () => {
    test.use({ locale: 'fr-FR' })

    test('français d’emblée, sans rien choisir', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')
      await expect(page).toHaveTitle('Connexion · Sessionized')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(fr.auth.tagline)
    })

    test('le choix explicite l’emporte sur la langue du navigateur', async ({ page, context }) => {
      await chooseLocale(context, 'en')
      await page.goto('/login')
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    })
  })

  test('la bascule traduit la page sans la recharger, et le choix est mémorisé', async ({ page, context }) => {
    await page.goto('/login')
    // Saisie en cours : changer de langue ne doit pas la perdre.
    await page.getByLabel('Email', { exact: true }).fill('athlete@test.dev')

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Français' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fr.auth.tagline)
    await expect(page.getByRole('group', { name: 'Langue' }).getByRole('button', { name: 'Français' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByLabel(fr.common.email, { exact: true })).toHaveValue('athlete@test.dev')
    await expect(page).toHaveTitle('Connexion · Sessionized')

    // Cookie lu par le serveur seulement, conservé un an.
    const cookie = (await context.cookies()).find((c) => c.name === LOCALE_COOKIE_NAME)
    expect(cookie).toMatchObject({ value: 'fr', httpOnly: true, sameSite: 'Lax' })
    expect(cookie!.expires * 1000).toBeGreaterThan(Date.now() + 300 * 24 * 3600 * 1000)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')

    await page.getByRole('group', { name: 'Langue' }).getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page).toHaveTitle('Log in · Sessionized')
  })

  test('connecté : calendrier et navigation basculent, y compris les pages déjà préchargées', async ({
    page,
    context,
  }) => {
    await signInAs(context, USERS.athlete)
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(currentMonthLabel('en'))

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Français' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(currentMonthLabel('fr'))
    await expect(page).toHaveTitle('Calendrier · Sessionized')
    // Lien de la barre latérale préchargé en anglais avant la bascule : la
    // page affichée doit pourtant être en français.
    await page.getByRole('link', { name: fr.nav.profile, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: fr.profile.title })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: fr.profile.preferences })).toBeVisible()
  })

  test('les messages d’erreur suivent la langue choisie', async ({ page, context }) => {
    await chooseLocale(context, 'fr')
    await page.goto('/login')
    await page.getByLabel(fr.common.email, { exact: true }).fill(USERS.athlete.email)
    await page.getByLabel(fr.common.password, { exact: true }).fill(`${PASSWORD}-faux`)
    await page.getByRole('button', { name: fr.auth.logIn, exact: true }).click()

    await expect(page.getByText(fr.auth.errors.loginFailed)).toBeVisible()
  })
})
