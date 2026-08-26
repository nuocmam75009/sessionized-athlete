'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContactCoachButton } from '@/components/chat/ContactCoachButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { RadioOption } from '@/components/ui/RadioOption'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { setUnit, useSessionState } from '@/lib/session-store'
import type { CoachAssignment, UserProfile } from '@/lib/types'

type NotifyPref = 'new-plan' | 'weekly' | 'none'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type StravaSyncState = 'idle' | 'syncing' | 'done' | 'error'

function coachName(coach: CoachAssignment) {
  const { firstName, lastName, email } = coach.user
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || email
}

function assignedSince(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(createdAt))
}

export function ProfileView({
  user,
  coach,
  stravaConnected: initialStravaConnected,
  stravaBanner,
}: {
  user: UserProfile | null
  coach: CoachAssignment | null
  stravaConnected: boolean
  stravaBanner: 'connected' | 'error' | null
}) {
  const session = useSessionState()
  const [notify, setNotify] = useState<NotifyPref>('new-plan')
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [stravaConnected, setStravaConnected] = useState(initialStravaConnected)
  const [stravaBusy, setStravaBusy] = useState(false)
  const [stravaSync, setStravaSync] = useState<StravaSyncState>('idle')
  const router = useRouter()

  // Première connexion Strava : l'import initial peut porter sur des mois
  // d'historique et prendre un certain temps, contrairement aux resynchros
  // incrémentales déclenchées ensuite à chaque chargement du dashboard.
  useEffect(() => {
    if (stravaBanner !== 'connected') return
    let cancelled = false
    setStravaSync('syncing')
    fetch('/api/strava/sync', { method: 'POST' })
      .then((res) => {
        if (cancelled) return
        setStravaSync(res.ok ? 'done' : 'error')
        if (res.ok) router.refresh()
      })
      .catch(() => {
        if (!cancelled) setStravaSync('error')
      })
    return () => {
      cancelled = true
    }
  }, [stravaBanner, router])

  async function connectStrava() {
    setStravaBusy(true)
    try {
      const res = await fetch('/api/strava/authorize')
      if (!res.ok) throw new Error('authorize failed')
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setStravaBusy(false)
    }
  }

  async function disconnectStrava() {
    setStravaBusy(true)
    try {
      const res = await fetch('/api/strava/disconnect', { method: 'DELETE' })
      if (!res.ok) throw new Error('disconnect failed')
      setStravaConnected(false)
    } finally {
      setStravaBusy(false)
    }
  }

  async function save() {
    setSaveState('saving')
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      })
      setSaveState(res.ok ? 'saved' : 'error')
    } catch {
      setSaveState('error')
    }
  }

  return (
    <div>
      <h1>Profile</h1>
      {!user && <p className="text-red-600 mb-4">Impossible de charger le profil.</p>}
      <div className="grid gap-8 max-w-[560px] mt-5">
        <section>
          <h4 className="mb-3">Account</h4>
          <div className="grid gap-3">
            <Field label="First name" htmlFor="sn-p-firstname">
              <Input id="sn-p-firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="sn-p-lastname">
              <Input id="sn-p-lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="sn-p-email">
              <Input id="sn-p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3">Coach</h4>
          {coach ? (
            <div>
              <p className="m-0">
                <strong>{coachName(coach)}</strong> · assigned since {assignedSince(coach.createdAt)}
              </p>
              <ContactCoachButton coachId={coach.id} coachName={coachName(coach)} label="Message" />
            </div>
          ) : (
            <div>
              <p className="m-0 text-text/60 mb-2">Aucun coach assigné.</p>
              <Link href="/coaches" className="text-sm text-accent hover:text-accent-700">
                Trouver un coach →
              </Link>
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-3">Preferences</h4>
          <Field label="Units" htmlFor="sn-unit">
            <SegmentedControl
              name="unit"
              ariaLabel="Units"
              value={session.unit}
              onChange={(v) => setUnit(v as 'km' | 'mi')}
              options={[
                { value: 'km', label: 'Kilometers' },
                { value: 'mi', label: 'Miles' },
              ]}
            />
          </Field>
          <div className="grid gap-1.5 mt-3">
            <RadioOption name="notify" checked={notify === 'new-plan'} onChange={() => setNotify('new-plan')}>
              Notify me when a new plan is posted
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'weekly'} onChange={() => setNotify('weekly')}>
              Weekly summary only
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'none'} onChange={() => setNotify('none')}>
              No notifications
            </RadioOption>
          </div>
        </section>

        <section>
          <h4 className="mb-3">Integrations</h4>
          <div className="flex gap-2 items-center mb-2">
            <Badge variant="accent">Garmin Connect · Connected</Badge>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant={stravaConnected ? 'accent' : 'neutral'}>
              Strava · {stravaConnected ? 'Connected' : 'Not connected'}
            </Badge>
            {stravaConnected ? (
              <Button variant="ghost" onClick={disconnectStrava} disabled={stravaBusy}>
                {stravaBusy ? 'Déconnexion…' : 'Disconnect'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={connectStrava} disabled={stravaBusy}>
                {stravaBusy ? 'Redirection…' : 'Connect'}
              </Button>
            )}
          </div>
          {stravaBanner === 'connected' && stravaSync === 'syncing' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-text/70">
              <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              Importation de vos activités Strava en cours… cela peut prendre quelques instants.
            </div>
          )}
          {stravaBanner === 'connected' && stravaSync === 'done' && (
            <p className="text-sm text-green-600 mt-2">
              Activités Strava importées.{' '}
              <Link href="/dashboard" className="text-accent hover:text-accent-700">
                Voir mon calendrier →
              </Link>
            </p>
          )}
          {stravaBanner === 'connected' && stravaSync === 'error' && (
            <p className="text-sm text-red-600 mt-2">
              Compte connecté, mais l&apos;import des activités a échoué. Réessaie depuis le calendrier.
            </p>
          )}
          {stravaBanner === 'error' && (
            <p className="text-sm text-red-600 mt-2">Échec de la connexion Strava. Réessaie.</p>
          )}
        </section>

        <div className="flex items-center gap-3">
          <Button className="w-fit" onClick={save} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save changes'}
          </Button>
          {saveState === 'saved' && <span className="text-sm text-green-600">Saved.</span>}
          {saveState === 'error' && <span className="text-sm text-red-600">Échec de l&apos;enregistrement.</span>}
        </div>
      </div>
    </div>
  )
}
