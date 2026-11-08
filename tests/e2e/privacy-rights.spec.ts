import { readFile } from 'node:fs/promises'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { expect, signInAs, test } from './fixtures'
import { PASSWORD, USERS } from './mock-api/server'

// T24 — consentement aux données de santé demandé aux comptes créés avant la
// case d'inscription. T25 — export des données et suppression du compte.
test.describe('Droits RGPD', () => {
  test('T24 — compte sans consentement : l’accord est demandé avant toute page', async ({ page, context }) => {
    await signInAs(context, USERS.legacy)
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { level: 1, name: 'Your health data' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Previous/ })).toHaveCount(0)

    // Les autres pages sont tout aussi bloquées.
    await page.goto('/profile')
    await expect(page.getByRole('heading', { level: 1, name: 'Your health data' })).toBeVisible()

    const consent = page.getByRole('checkbox', { name: /health data/ })
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(consent).toHaveAttribute('aria-invalid', 'true')

    await consent.check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
    await expect(page.getByText(/You agreed to the processing of your health data on/)).toBeVisible()
    // L'accord est enregistré côté API : il survit au rechargement.
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Previous/ })).toBeVisible()
  })

  test('T25 — export : un fichier JSON avec les données du compte', async ({ page, context }) => {
    await signInAs(context, USERS.athlete)
    await page.goto('/profile')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download my data' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^sessionized-export-\d{4}-\d{2}-\d{2}\.json$/)
    const exported = JSON.parse(await readFile(await download.path(), 'utf8')) as {
      format: string
      account: { email: string }
    }
    expect(exported.format).toBe('sessionized-export/1')
    expect(exported.account.email).toBe(USERS.athlete.email)
  })

  test('T25 — suppression : mot de passe exigé, puis compte effacé et session fermée', async ({ page, context }) => {
    await signInAs(context, USERS.deleter)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Delete my account' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete your account' })
    const password = dialog.getByLabel('Password')
    const confirm = dialog.getByRole('button', { name: 'Delete my account' })

    await password.fill('not-my-password')
    await confirm.click()
    await expect(password).toHaveAccessibleDescription('Incorrect password.')
    await expect(page).toHaveURL('/profile')

    await password.fill(PASSWORD)
    await confirm.click()

    await expect(page).toHaveURL('/login?reason=deleted')
    await expect(page.getByRole('status')).toHaveText('Your account and all its data have been deleted.')
    expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE_NAME)).toBe(false)

    // Le compte n'existe plus : la connexion est refusée.
    await page.getByLabel('Email', { exact: true }).fill(USERS.deleter.email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText("Couldn't log in. Check your email and password.")).toBeVisible()
  })
})
