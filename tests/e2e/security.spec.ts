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
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
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

test.describe('T30 — en-têtes de sécurité et Content-Security-Policy', () => {
  test('en-têtes présents sur une page publique et une page protégée', async ({ page, context }) => {
    for (const path of ['/login', '/dashboard']) {
      if (path === '/dashboard') await signInAs(context, USERS.athlete)
      const response = await page.goto(path)
      const headers = response!.headers()
      expect(headers['content-security-policy']).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/)
      expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-frame-options']).toBe('DENY')
      expect(headers['strict-transport-security']).toContain('max-age=')
      expect(headers['x-powered-by']).toBeUndefined()
    }
  })

  test('aucune violation de la CSP : l’application fonctionne avec la politique stricte', async ({ page, context }) => {
    const violations: string[] = []
    page.on('console', (message) => {
      if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text())
    })
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()

    await signInAs(context, USERS.athlete)
    for (const path of ['/dashboard', `/activities/${ATHLETE_ACTIVITY_ID}`, '/profile']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
    }
    // Le thème clair/sombre (script inline au nonce) et l'hydratation
    // (boutons interactifs) ont bien fonctionné.
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)
    expect(violations).toEqual([])
  })

  // Charge utile XSS classique, comme si un texte non échappé arrivait dans
  // le HTML : un gestionnaire d'événement inline. Sans 'unsafe-inline', la
  // CSP refuse de l'exécuter, même si l'image se charge en erreur.
  test('un gestionnaire inline injecté (<img onerror>) n’est pas exécuté', async ({ page }) => {
    const violations: string[] = []
    page.on('console', (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text())
    })
    await page.goto('/login')
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', '<img src="/introuvable.png" onerror="window.__injected = true">')
    })
    await expect.poll(() => violations.length).toBeGreaterThan(0)
    expect(await page.evaluate(() => (window as unknown as { __injected?: boolean }).__injected)).toBeUndefined()
  })
})
