'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AccountDataActions } from '@/components/account/AccountDataActions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { RadioOption } from '@/components/ui/RadioOption'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { clientFetch } from '@/lib/client-fetch'
import { setUnit, useSessionState } from '@/lib/session-store'
import { APP_LOCALE, formatLegalDate } from '@/lib/utils'
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
  return new Intl.DateTimeFormat(APP_LOCALE, { month: 'short', year: 'numeric' }).format(new Date(createdAt))
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
  // reconnect : posé par le bouton de synchronisation du calendrier quand l'API
  // ne peut plus utiliser la connexion Strava enregistrée (409).
  stravaBanner: 'connected' | 'error' | 'reconnect' | null
}) {
  const session = useSessionState()
  const [notify, setNotify] = useState<NotifyPref>('new-plan')
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [stravaConnected, setStravaConnected] = useState(initialStravaConnected)
  const [stravaBusy, setStravaBusy] = useState(false)
  const [stravaError, setStravaError] = useState<string | null>(null)
  const [stravaSync, setStravaSync] = useState<StravaSyncState>('idle')
  const router = useRouter()
  // Une fois Strava déconnecté, il n'y a plus rien à renouveler.
  const needsReconnect = stravaBanner === 'reconnect' && stravaConnected

  // Première connexion Strava : l'import initial peut porter sur des mois
  // d'historique et prendre un certain temps, contrairement aux resynchros
  // incrémentales que l'athlète déclenche ensuite depuis le calendrier.
  useEffect(() => {
    if (stravaBanner !== 'connected') return
    let cancelled = false
    setStravaSync('syncing')
    clientFetch('/api/strava/sync', { method: 'POST' })
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
    setStravaError(null)
    // Sert aussi à reconnecter : les nouveaux tokens remplacent ceux devenus
    // inutilisables.
    try {
      const res = await clientFetch('/api/strava/authorize')
      if (!res.ok) throw new Error('authorize failed')
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setStravaError("Couldn't start the Strava connection. Try again.")
      setStravaBusy(false)
    }
  }

  async function disconnectStrava() {
    setStravaBusy(true)
    setStravaError(null)
    try {
      const res = await clientFetch('/api/strava/disconnect', { method: 'DELETE' })
      if (!res.ok) throw new Error('disconnect failed')
      setStravaConnected(false)
    } catch {
      setStravaError("Couldn't disconnect Strava. Try again.")
    } finally {
      setStravaBusy(false)
    }
  }

  async function save() {
    setSaveState('saving')
    try {
      const res = await clientFetch('/api/users/me', {
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
      {!user && (
        <p role="alert" className="text-danger mb-4">
          Couldn&apos;t load your profile. Refresh the page to try again.
        </p>
      )}
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
            <div className="panel-flat rounded-lg px-4 py-3.5">
              <p className="m-0 text-sm">
                <strong className="font-semibold">{coachName(coach)}</strong>
                <span className="text-text/45"> · assigned since {assignedSince(coach.createdAt)}</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="m-0 text-text/50 mb-2">No coach assigned.</p>
              <Link href="/coaches" className="text-sm text-accent hover:text-accent-700">
                Find a coach →
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
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={stravaConnected && !needsReconnect ? 'accent' : 'neutral'}>
              Strava · {needsReconnect ? 'Expired' : stravaConnected ? 'Connected' : 'Not connected'}
            </Badge>
            {/* autoFocus : l'athlète arrive ici depuis le tableau de bord pour
                cette seule action ; le focus amène aussi le bouton à l'écran. */}
            {needsReconnect && (
              <Button onClick={connectStrava} disabled={stravaBusy} autoFocus>
                {stravaBusy ? 'Redirecting…' : 'Reconnect Strava'}
              </Button>
            )}
            {stravaConnected ? (
              <Button variant="ghost" onClick={disconnectStrava} disabled={stravaBusy}>
                {stravaBusy ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={connectStrava} disabled={stravaBusy}>
                {stravaBusy ? 'Redirecting…' : 'Connect'}
              </Button>
            )}
          </div>
          {needsReconnect && (
            <p role="alert" className="text-sm text-danger mt-2 max-w-[60ch]">
              Your Strava connection has expired — new Strava activities aren&apos;t being imported. Reconnect Strava
              to resume, or disconnect it.
            </p>
          )}
          {stravaError && (
            <p role="alert" className="text-sm text-danger mt-2">
              {stravaError}
            </p>
          )}
          {stravaBanner === 'connected' && stravaSync === 'syncing' && (
            <div role="status" className="flex items-center gap-2 mt-2 text-sm text-text/70">
              <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              Importing your Strava activities… this may take a moment.
            </div>
          )}
          {stravaBanner === 'connected' && stravaSync === 'done' && (
            <p role="status" className="text-sm text-success mt-2">
              Strava activities imported.{' '}
              <Link href="/dashboard" className="text-accent hover:text-accent-700">
                View my calendar →
              </Link>
            </p>
          )}
          {stravaBanner === 'connected' && stravaSync === 'error' && (
            <p role="alert" className="text-sm text-danger mt-2">
              Account connected, but importing your activities failed. Try again from the calendar.
            </p>
          )}
          {stravaBanner === 'error' && (
            <p role="alert" className="text-sm text-danger mt-2">
              Couldn&apos;t connect Strava. Try again.
            </p>
          )}
        </section>

        <div className="flex items-center gap-3">
          <Button className="w-fit" onClick={save} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save changes'}
          </Button>
          {saveState === 'saved' && (
            <span role="status" className="text-sm text-success">
              Saved.
            </span>
          )}
          {saveState === 'error' && (
            <span role="alert" className="text-sm text-danger">
              Couldn&apos;t save changes. Try again.
            </span>
          )}
        </div>

        {/* Après le bouton d'enregistrement : ces actions ne font pas partie
            du formulaire, et la suppression doit rester à l'écart. */}
        <section className="border-t border-divider pt-6">
          <h4 className="mb-3">Your data</h4>
          <p className="text-sm text-text/80 mb-3 max-w-[60ch]">
            {user?.healthDataConsentAt && (
              <>You agreed to the processing of your health data on {formatLegalDate(user.healthDataConsentAt)}. </>
            )}
            How we use your data and for how long: see the{' '}
            {/* Souligné : au milieu d'une phrase, la couleur seule ne
                distingue pas un lien (WCAG 1.4.1). */}
            <Link href="/privacy" className="text-accent underline hover:text-accent-700">
              privacy policy
            </Link>
            .
          </p>
          <AccountDataActions />
        </section>
      </div>
    </div>
  )
}
