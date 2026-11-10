'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, fieldErrorProps, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import { hardNavigate } from '@/lib/hard-navigate'

const PASSWORD_ID = 'sn-delete-pw'

function focusPassword() {
  document.getElementById(PASSWORD_ID)?.focus()
}

// Codes plutôt que messages : le texte est rédigé à l'affichage, dans la
// langue courante.
type PasswordError = 'missing' | 'incorrect'
type DeleteError = 'tooManyAttempts' | 'failed'

// Confirmation de la suppression du compte (droit à l'effacement). Le mot de
// passe est redemandé : une session laissée ouverte sur un poste partagé ne
// suffit pas à tout effacer.
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<PasswordError | null>(null)
  const [error, setError] = useState<DeleteError | null>(null)
  const [deleting, setDeleting] = useState(false)

  const passwordMessage =
    passwordError === 'missing'
      ? t.common.enterPassword
      : passwordError === 'incorrect'
        ? t.accountData.deleteDialog.incorrectPassword
        : null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password) {
      setPasswordError('missing')
      focusPassword()
      return
    }
    setPasswordError(null)
    setDeleting(true)
    try {
      const res = await clientFetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.status === 204) {
        // Rechargement complet plutôt que router.replace : le cache du routeur
        // garderait les pages du compte supprimé, que le bouton Précédent
        // réafficherait sur un poste partagé.
        hardNavigate('/login?reason=deleted')
        return
      }
      if (res.status === 403) {
        setPasswordError('incorrect')
        focusPassword()
      } else if (res.status === 429) {
        setError('tooManyAttempts')
      } else {
        setError('failed')
      }
    } catch {
      setError('failed')
    }
    setDeleting(false)
  }

  return (
    <Modal label={t.accountData.deleteDialog.label} eyebrow={t.accountData.deleteDialog.eyebrow} onClose={onClose}>
      <h2 className="mb-3">{t.accountData.deleteDialog.title}</h2>
      <p className="text-sm text-text/80 mb-2">{t.accountData.deleteDialog.warning}</p>
      <p className="text-sm text-text/80 mb-5">{t.accountData.deleteDialog.copyHint}</p>
      {/* noValidate : même raison que sur l'écran de connexion, la validation
          et ses messages sont les nôtres. */}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label={t.common.password} htmlFor={PASSWORD_ID} error={passwordMessage}>
          <Input
            id={PASSWORD_ID}
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...fieldErrorProps(PASSWORD_ID, passwordMessage)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {t.accountData.deleteDialog[error]}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="danger" disabled={deleting}>
            {deleting ? t.accountData.deleteDialog.deleting : t.accountData.deleteAccount}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
