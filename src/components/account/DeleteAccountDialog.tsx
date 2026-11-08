'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, fieldErrorProps, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { clientFetch } from '@/lib/client-fetch'
import { hardNavigate } from '@/lib/hard-navigate'

const PASSWORD_ID = 'sn-delete-pw'

function focusPassword() {
  document.getElementById(PASSWORD_ID)?.focus()
}

// Confirmation de la suppression du compte (droit à l'effacement). Le mot de
// passe est redemandé : une session laissée ouverte sur un poste partagé ne
// suffit pas à tout effacer.
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password) {
      setPasswordError('Enter your password.')
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
        setPasswordError('Incorrect password.')
        focusPassword()
      } else if (res.status === 429) {
        setError('Too many attempts. Wait a minute, then try again.')
      } else {
        setError("Couldn't delete your account. Try again.")
      }
    } catch {
      setError("Couldn't delete your account. Try again.")
    }
    setDeleting(false)
  }

  return (
    <Modal label="Delete your account" eyebrow="Delete account" onClose={onClose}>
      <h2 className="mb-3">Delete your account?</h2>
      <p className="text-sm text-text/80 mb-2">
        This permanently erases your account and everything in it: activities, GPS tracks, original files, training
        plans and notes. Your coach loses access to them too. This can&apos;t be undone.
      </p>
      <p className="text-sm text-text/80 mb-5">Want a copy? Download your data before deleting your account.</p>
      {/* noValidate : même raison que sur l'écran de connexion, la validation
          et ses messages sont les nôtres. */}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Password" htmlFor={PASSWORD_ID} error={passwordError}>
          <Input
            id={PASSWORD_ID}
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...fieldErrorProps(PASSWORD_ID, passwordError)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete my account'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
