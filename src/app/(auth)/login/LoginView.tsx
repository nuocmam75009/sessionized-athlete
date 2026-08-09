'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { AuthUser } from '@/lib/types'

type Mode = 'login' | 'register'
type Role = 'ATHLETE' | 'COACH'

const HERO_COPY: Record<Role, { title: string; body: string }> = {
  ATHLETE: {
    title: 'Your plan, from your coach, every day.',
    body: "See the session your coach set for today, follow the week ahead, and upload your .fit file the moment you're done.",
  },
  COACH: {
    title: 'Every athlete you coach, in one place.',
    body: 'Track training load, review sessions as they come in, and plan what comes next — all from a single dashboard.',
  },
}

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
  const [role, setRole] = useState<Role>('ATHLETE')
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
          : await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, inviteCode: invite }),
            })
      if (!res.ok) throw new Error('auth failed')

      const { user }: { user: AuthUser } = await res.json()

      // La page est commune aux deux apps : on route par le rôle réel renvoyé
      // par le backend, pas par l'onglet choisi dans l'UI (un compte coach
      // reste un compte coach même si l'onglet "Athlete" était sélectionné).
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

  const hero = HERO_COPY[role]

  return (
    <div className="grid md:grid-cols-[1.1fr_0.9fr] min-h-screen">
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center max-w-xl">
        <div className="font-heading font-semibold text-xs tracking-[0.14em] uppercase text-accent mb-4">
          Sessionized
        </div>
        <h1 className="text-4xl md:text-5xl max-w-[9.5ch]">{hero.title}</h1>
        <p className="text-base opacity-75 max-w-[44ch] mt-3">{hero.body}</p>
        {role === 'ATHLETE' && (
          <Link href="/coaches" className="text-sm text-accent hover:text-accent-700 mt-5 w-fit">
            Not coached yet? Browse our coaches →
          </Link>
        )}
      </div>
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center border-t md:border-t-0 md:border-l border-divider">
        <div className="max-w-[360px] w-full">
          <div className="mb-3">
            <SegmentedControl
              name="role"
              ariaLabel="Athlete or coach"
              value={role}
              onChange={(v) => setRole(v as Role)}
              options={[
                { value: 'ATHLETE', label: 'Athlete' },
                { value: 'COACH', label: 'Coach' },
              ]}
            />
          </div>
          <div className="mb-4">
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
          <div className="grid gap-3">
            {mode === 'register' && (
              <Field label="Full name" htmlFor="sn-name">
                <Input id="sn-name" placeholder="Jordan Reyes" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            )}
            <Field label="Email" htmlFor="sn-email">
              <Input
                id="sn-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="sn-pw">
              <Input
                id="sn-pw"
                type="password"
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button block onClick={submit} disabled={submitting}>
              {submitting ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </div>
          <p className="text-[13px] mt-4 opacity-70">
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
        </div>
      </div>
    </div>
  )
}
