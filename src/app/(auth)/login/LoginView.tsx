'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HealthConsentLabel } from '@/components/account/HealthConsentLabel'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { CheckboxField, Field, fieldErrorProps, Input } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { AuthFailure } from '@/lib/auth-errors'
import { safeRedirectTarget } from '@/lib/redirect'
import type { AuthUser } from '@/lib/types'

type Mode = 'login' | 'register'

// Même minimum que l'API (RegisterDto) : refusé ici sans aller-retour. Les
// autres règles de la politique de mots de passe sont vérifiées par l'API,
// dont les raisons de refus s'affichent sur le champ.
const MIN_PASSWORD_LENGTH = 8

interface FieldErrors {
  email?: string
  password?: string
  consent?: string
}

// Ordre du formulaire : le focus va au premier champ en erreur dans cet ordre.
const FIELD_IDS: Record<keyof FieldErrors, string> = {
  email: 'sn-email',
  password: 'sn-pw',
  consent: 'sn-consent',
}

function validate(mode: Mode, email: string, password: string, healthConsent: boolean): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Enter your email.'
  if (!password) errors.password = 'Enter your password.'
  else if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  // Fréquence cardiaque, poids, séances : des données de santé (art. 9 du
  // RGPD), traitées sur la base d'un consentement explicite.
  if (mode === 'register' && !healthConsent) {
    errors.consent = 'Tick this box to create your account: Sessionized needs your health data to work.'
  }
  return errors
}

export default function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectTarget(searchParams.get('redirect'))
  // Posé par le proxy ou par une page dont l'appel à l'API a reçu un 401.
  const sessionExpired = searchParams.get('reason') === 'expired'
  // Posé après la suppression du compte, depuis le profil.
  const accountDeleted = searchParams.get('reason') === 'deleted'
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [healthConsent, setHealthConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Les règles changent d'un mode à l'autre (longueur du mot de passe) : les
  // erreurs affichées pour l'autre mode ne valent plus.
  function switchMode(next: Mode) {
    setMode(next)
    setFieldErrors({})
    setError(null)
  }

  async function submit() {
    setError(null)
    const errors = validate(mode, email, password, healthConsent)
    setFieldErrors(errors)
    const firstInvalid = (Object.keys(FIELD_IDS) as Array<keyof FieldErrors>).find((field) => errors[field])
    if (firstInvalid) {
      // Le focus va au premier champ à corriger, que le lecteur d'écran
      // annonce avec son message d'erreur.
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    setSubmitting(true)
    try {
      // Passe par nos propres routes /api/auth/* (et non le backend
      // directement) : elles seules peuvent poser le cookie httpOnly.
      const res =
        mode === 'login'
          ? await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })
          : await (() => {
              const [firstName, ...rest] = name.trim().split(/\s+/)
              const lastName = rest.join(' ') || undefined
              return fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: firstName || undefined,
                  lastName,
                  email,
                  password,
                  inviteCode: invite,
                  role: 'ATHLETE',
                  // validate() a déjà refusé l'envoi sans la case cochée.
                  healthDataConsent: true,
                }),
              })
            })()
      if (!res.ok) {
        const failure = (await res.json().catch(() => null)) as AuthFailure | null
        // Compte ou IP temporairement bloqués : le délai est dit, sans rien
        // révéler sur l'existence du compte (même réponse pour tous).
        if (res.status === 429 && failure?.message) {
          setError(failure.message)
          return
        }
        // Mot de passe refusé à l'inscription : chaque raison, sur le champ.
        if (mode === 'register' && failure?.reasons?.length) {
          setFieldErrors({ password: failure.reasons.join(' ') })
          document.getElementById(FIELD_IDS.password)?.focus()
          return
        }
        throw new Error('auth failed')
      }

      const { user }: { user: AuthUser } = await res.json()

      // Cette page est réservée aux athlètes ; un compte coach est redirigé
      // vers l'app coach (URL distincte) plutôt que d'atterrir ici.
      if (user.role === 'COACH') {
        const coachAppUrl = process.env.NEXT_PUBLIC_COACH_APP_URL
        if (!coachAppUrl) {
          setError("The coach app isn't configured in this environment.")
          return
        }
        // Autre application, sur une autre origine : navigation complète, que
        // le routeur de Next ne sait pas faire.
        window.location.assign(new URL(redirectTo, coachAppUrl).toString())
        return
      }

      router.push(redirectTo)
    } catch {
      // Générique dans les deux cas : préciser « e-mail inconnu » ou « déjà
      // utilisé » dirait à un tiers quels comptes existent.
      setError(
        mode === 'login'
          ? "Couldn't log in. Check your email and password."
          : "Couldn't create your account. Check your details and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Sessionized"
      title="Your workouts plan and data, in one place."
      description=" "
    >
      {sessionExpired && (
        <p role="status" className="panel-flat rounded-md px-3.5 py-2.5 mb-5 text-sm text-text/80">
          Your session has expired. Log in again to pick up where you left off.
        </p>
      )}
      {accountDeleted && (
        <p role="status" className="panel-flat rounded-md px-3.5 py-2.5 mb-5 text-sm text-text/80">
          Your account and all its data have been deleted.
        </p>
      )}
      <div className="mb-6">
        <SegmentedControl
          name="authmode"
          ariaLabel="Login or register"
          value={mode}
          onChange={(v) => switchMode(v as Mode)}
          options={[
            { value: 'login', label: 'Log in' },
            { value: 'register', label: 'Register' },
          ]}
        />
      </div>
      {/* noValidate : les champs restent marqués required pour les lecteurs
          d'écran, mais la validation est la nôtre — les bulles du navigateur
          suivent la langue de son interface, pas celle de la page. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="grid gap-3"
      >
        {mode === 'register' && (
          <Field label="Full name (optional)" htmlFor="sn-name">
            <Input
              id="sn-name"
              autoComplete="name"
              placeholder="Jakob Ingebrigsten"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email" htmlFor="sn-email" error={fieldErrors.email}>
          <Input
            id="sn-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...fieldErrorProps('sn-email', fieldErrors.email)}
          />
        </Field>
        <Field label="Password" htmlFor="sn-pw" error={fieldErrors.password}>
          <Input
            id="sn-pw"
            type="password"
            required
            minLength={mode === 'register' ? MIN_PASSWORD_LENGTH : undefined}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...fieldErrorProps('sn-pw', fieldErrors.password)}
          />
        </Field>
        {mode === 'register' && (
          <Field label="Coach invite code (optional)" htmlFor="sn-invite">
            <Input
              id="sn-invite"
              placeholder="e.g. RUN-2C4F"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </Field>
        )}
        {mode === 'register' && (
          // Transmis à l'API, qui refuse un compte athlète sans lui et en
          // conserve la date (healthDataConsentAt) comme preuve.
          <CheckboxField
            id="sn-consent"
            required
            checked={healthConsent}
            onChange={setHealthConsent}
            error={fieldErrors.consent}
          >
            <HealthConsentLabel />
          </CheckboxField>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" block disabled={submitting}>
          {submitting ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
      <p className="text-[13px] mt-5 text-text/60">
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        {/* Un bouton et non un lien : il change de mode sans quitter la page. */}
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="text-accent hover:text-accent-700 cursor-pointer"
        >
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </button>
      </p>
    </AuthLayout>
  )
}
