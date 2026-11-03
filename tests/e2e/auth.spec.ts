import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { COACH_APP_URL } from './env'
import { expect, signInAs, test } from './fixtures'
import { PASSWORD, USERS } from './mock-api/server'
import type { Page } from '@playwright/test'

async function logIn(page: Page, email: string, password: string) {
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
}

const GENERIC_ERROR = "Couldn't log in. Check your email and password."

test.describe('Connexion', () => {
  test('T01 — identifiants valides : cookie HttpOnly posé, redirection /dashboard', async ({ page, context }) => {
    await page.goto('/login')
    await logIn(page, USERS.athlete.email, PASSWORD)

    await expect(page).toHaveURL('/dashboard')
    const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE_NAME)
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
    // Invisible pour le JavaScript de la page, donc pour un script injecté.
    expect(await page.evaluate(() => document.cookie)).not.toContain(SESSION_COOKIE_NAME)
  })

  test('T02 — mot de passe erroné : message générique, pas de cookie, compte non révélé', async ({ page, context }) => {
    await page.goto('/login')

    // Même statut et même corps de réponse pour un compte existant et inconnu.
    const responses: Array<{ status: number; body: string }> = []
    for (const email of [USERS.athlete.email, 'inconnu@test.dev']) {
      const response = page.waitForResponse('**/api/auth/login')
      await logIn(page, email, 'mauvais-mot-de-passe')
      const res = await response
      responses.push({ status: res.status(), body: await res.text() })
      await expect(page.getByText(GENERIC_ERROR)).toBeVisible()
    }

    expect(responses[0]).toEqual(responses[1])
    await expect(page).toHaveURL('/login')
    expect((await context.cookies()).find((c) => c.name === SESSION_COOKIE_NAME)).toBeUndefined()
  })

  test('T03 — compte coach : redirection vers l’app coach', async ({ page }) => {
    await page.route(`${COACH_APP_URL}/**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Sessionized Coach</title>' }),
    )
    await page.goto('/login')
    await logIn(page, USERS.coach.email, PASSWORD)

    await expect(page).toHaveURL(`${COACH_APP_URL}/dashboard`)
  })

  for (const redirect of ['//evil.example', '/\\evil.example']) {
    test(`T04 — ?redirect=${redirect} : redirection vers /dashboard`, async ({ page }) => {
      // Si la redirection fuit, la page atterrit ici plutôt que sur une erreur réseau.
      await page.route('http://evil.example/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<title>Evil</title>' }),
      )
      await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
      await logIn(page, USERS.athlete.email, PASSWORD)

      await expect(page).toHaveURL('/dashboard')
    })
  }
})

test.describe('Contrôle d’accès', () => {
  test('T05 — /dashboard sans cookie : redirection /login?redirect=/dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login?redirect=%2Fdashboard')
  })

  test('T06 — cookie présent mais JWT expiré : redirection /login', async ({ page, context }) => {
    await signInAs(context, USERS.athlete, -60)
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login?redirect=%2Fdashboard')
    expect((await context.cookies()).find((c) => c.name === SESSION_COOKIE_NAME)).toBeUndefined()
  })
})
