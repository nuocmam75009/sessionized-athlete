'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { AuthUser } from '@/lib/types'

type Mode = 'login' | 'register'

// N'accepte que des chemins internes ("/plan") pour éviter une redirection
// ouverte vers un domaine externe via le paramètre `redirect`.
function safeRedirectTarget(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value
  return '/dashboard'
}

export default function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectTarget(searchParams.get('redirect'))
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setError(null)
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
                }),
              })
            })()
      if (!res.ok) throw new Error('auth failed')

      const { user }: { user: AuthUser } = await res.json()

      // Cette page est réservée aux athlètes ; un compte coach est redirigé
      // vers l'app coach (URL distincte) plutôt que d'atterrir ici.
      if (user.role === 'COACH') {
        const coachAppUrl = process.env.NEXT_PUBLIC_COACH_APP_URL
        if (!coachAppUrl) {
          setError("L'app coach n'est pas configurée dans cet environnement.")
          return
        }
        window.location.href = `${coachAppUrl}${redirectTo}`
        return
      }

      router.push(redirectTo)
    } catch {
      setError('Impossible de se connecter. Vérifie tes identifiants.')
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
      <div className="mb-6">
        <SegmentedControl
          name="authmode"
          ariaLabel="Login or register"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'login', label: 'Log in' },
            { value: 'register', label: 'Register' },
          ]}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="grid gap-3"
      >
        {mode === 'register' && (
          <Field label="Full name" htmlFor="sn-name">
            <Input id="sn-name" placeholder="Jakob Ingebrigsten" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Email" htmlFor="sn-email">
          <Input
            id="sn-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="sn-pw">
          <Input
            id="sn-pw"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {mode === 'register' && (
          <Field label="Coach invite code" htmlFor="sn-invite">
            <Input
              id="sn-invite"
              placeholder="e.g. RUN-2C4F"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </Field>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" block disabled={submitting}>
          {submitting ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
      <p className="text-[13px] mt-5 text-text/45">
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setMode(mode === 'login' ? 'register' : 'login')
          }}
          className="text-accent hover:text-accent-700"
        >
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </a>
      </p>
    </AuthLayout>
  )
}
