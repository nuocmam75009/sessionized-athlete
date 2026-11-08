'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckboxField } from '@/components/ui/Field'
import { clientFetch } from '@/lib/client-fetch'
import { AccountDataActions } from './AccountDataActions'
import { HealthConsentLabel } from './HealthConsentLabel'

const CONSENT_ID = 'sn-gate-consent'

// Affiché à la place des pages à un athlète inscrit avant la case de
// consentement : ses données de santé sont déjà en base, sans accord daté.
// Il consent, ou il récupère ses données et supprime son compte.
export function HealthConsentGate() {
  const router = useRouter()
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!consent) {
      setConsentError('Tick this box to keep using Sessionized.')
      document.getElementById(CONSENT_ID)?.focus()
      return
    }
    setConsentError(null)
    setSaving(true)
    try {
      const res = await clientFetch('/api/users/me/health-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthDataConsent: true }),
      })
      if (!res.ok) throw new Error('consent failed')
      // Le layout relit le profil : l'accord daté, il rend la page demandée.
      router.refresh()
    } catch {
      setError("Couldn't save your answer. Try again.")
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[560px]">
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        Privacy
      </div>
      <h1>Your health data</h1>
      <p className="text-text/80 mt-4">
        Sessionized uses your heart rate, weight and training activities to plan and analyse your workouts. These are
        health data, and the law requires your explicit consent to process them.
      </p>
      <p className="text-text/80 mt-3">
        Your account was created before we asked for it. Answer once to get back to your training.
      </p>
      <form onSubmit={submit} noValidate className="grid gap-4 mt-6">
        <CheckboxField id={CONSENT_ID} required checked={consent} onChange={setConsent} error={consentError}>
          <HealthConsentLabel />
        </CheckboxField>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="w-fit" disabled={saving}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </form>
      <section className="mt-10 border-t border-divider pt-6">
        <h2 className="text-base mb-2">You don&apos;t agree?</h2>
        <p className="text-sm text-text/80 mb-4">
          Sessionized can&apos;t work without these data. You can download a copy of everything we hold about you,
          then delete your account.
        </p>
        <AccountDataActions />
      </section>
    </div>
  )
}
