'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { apiFetch } from '@/lib/api'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
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
      if (mode === 'login') {
        await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      } else {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, inviteCode: invite }),
        })
      }
      router.push('/dashboard')
    } catch {
      setError('Impossible de se connecter. Vérifie tes identifiants.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid md:grid-cols-[1.1fr_0.9fr] min-h-screen">
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center max-w-xl">
        <div className="font-heading font-semibold text-xs tracking-[0.14em] uppercase text-accent mb-4">
          Sessionized
        </div>
        <h1 className="text-4xl md:text-5xl max-w-[9.5ch]">Your plan, from your coach, every day.</h1>
        <p className="text-base opacity-75 max-w-[44ch] mt-3">
          See the session your coach set for today, follow the week ahead, and upload your .fit file the moment
          you&apos;re done.
        </p>
      </div>
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center border-t md:border-t-0 md:border-l border-divider">
        <div className="max-w-[360px] w-full">
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
