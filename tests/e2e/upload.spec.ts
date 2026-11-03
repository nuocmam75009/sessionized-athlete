import { expect, signInAs, test, todayLabel } from './fixtures'
import { fitFileBuffer, USERS } from './mock-api/server'
import type { Page } from '@playwright/test'

async function uploadFit(page: Page, name: string, buffer: Buffer) {
  await page.goto('/activities/upload')
  await page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer })
  await page.getByRole('button', { name: 'Confirm & save' }).click()
}

// Chaque test a son propre compte : en parallèle, l'import de T10 apparaîtrait
// sinon dans le calendrier vérifié par T09.
test.describe('Import .fit', () => {
  test('T09 — .fit valide : 201, activité visible dans le calendrier', async ({ page, context }) => {
    await signInAs(context, USERS.uploader)
    const response = page.waitForResponse('**/api/activities/upload')
    await uploadFit(page, 'sortie.fit', fitFileBuffer())

    const res = await response
    expect(res.status()).toBe(201)
    const { id } = (await res.json()) as { id: string }
    await expect(page).toHaveURL('/dashboard')
    // Le compte peut déjà porter des imports du jour (serveur réutilisé, test
    // rejoué) : on cherche celui-ci, par son identifiant.
    await page.getByRole('button').filter({ hasText: 'Unplanned' }).filter({ hasText: 'Run' }).click()
    await expect(page.getByRole('dialog', { name: todayLabel() }).locator(`a[href="/activities/${id}"]`)).toBeVisible()
  })

  test('T10 — même .fit deux fois : 409 « Cette activité a déjà été importée » affiché', async ({ page, context }) => {
    await signInAs(context, USERS.duplicate)
    const buffer = fitFileBuffer()
    await uploadFit(page, 'doublon.fit', buffer)
    await expect(page).toHaveURL('/dashboard')

    const response = page.waitForResponse('**/api/activities/upload')
    await uploadFit(page, 'doublon.fit', buffer)

    expect((await response).status()).toBe(409)
    await expect(page.getByText('Cette activité a déjà été importée')).toBeVisible()
    await expect(page).toHaveURL('/activities/upload')
  })

  test('T13 — .exe renommé en .fit : 400 côté API, erreur affichée, aucun plantage', async ({ page, context }) => {
    await signInAs(context, USERS.uploader)
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))
    // En-tête d'exécutable Windows (« MZ ») au lieu de la signature .FIT.
    const exe = Buffer.concat([Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1'), Buffer.alloc(64)])

    const response = page.waitForResponse('**/api/activities/upload')
    await uploadFit(page, 'setup.fit', exe)

    expect((await response).status()).toBe(400)
    await expect(page.getByText('Fichier .fit invalide ou corrompu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm & save' })).toBeEnabled()
    expect(pageErrors).toEqual([])
  })
})
