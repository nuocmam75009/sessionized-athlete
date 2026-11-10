'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckboxField } from '@/components/ui/Field'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import { AccountDataActions } from './AccountDataActions'
import { HealthConsentLabel } from './HealthConsentLabel'

const CONSENT_ID = 'sn-gate-consent'

// Affiché à la place des pages à un athlète inscrit avant la case de
// consentement : ses données de santé sont déjà en base, sans accord daté.
// Il consent, ou il récupère ses données et supprime son compte.
export function HealthConsentGate() {
  const router = useRouter()
  const { t } = useI18n()
  const [consent, setConsent] = useState(false)
  // Drapeaux plutôt que messages : le texte est rédigé à l'affichage, dans la
  // langue courante.
  const [consentMissing, setConsentMissing] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaveFailed(false)
    if (!consent) {
      setConsentMissing(true)
      document.getElementById(CONSENT_ID)?.focus()
      return
    }
    setConsentMissing(false)
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
      setSaveFailed(true)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[560px]">
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        {t.consent.gate.eyebrow}
      </div>
      <h1>{t.consent.gate.title}</h1>
      <p className="text-text/80 mt-4">{t.consent.gate.intro}</p>
      <p className="text-text/80 mt-3">{t.consent.gate.whyNow}</p>
      <form onSubmit={submit} noValidate className="grid gap-4 mt-6">
        <CheckboxField
          id={CONSENT_ID}
          required
          checked={consent}
          onChange={setConsent}
          error={consentMissing ? t.consent.gate.required : null}
        >
          <HealthConsentLabel />
        </CheckboxField>
        {saveFailed && (
          <p role="alert" className="text-sm text-danger">
            {t.consent.gate.saveFailed}
          </p>
        )}
        <Button type="submit" className="w-fit" disabled={saving}>
          {saving ? t.common.saving : t.consent.gate.continue}
        </Button>
      </form>
      <section className="mt-10 border-t border-divider pt-6">
        <h2 className="text-base mb-2">{t.consent.gate.disagreeTitle}</h2>
        <p className="text-sm text-text/80 mb-4">{t.consent.gate.disagreeBody}</p>
        <AccountDataActions />
      </section>
    </div>
  )
}
