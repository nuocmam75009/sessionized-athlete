'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AccountDataActions } from '@/components/account/AccountDataActions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { RadioOption } from '@/components/ui/RadioOption'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import { setUnit, useSessionState } from '@/lib/session-store'
import { formatLegalDate, formatMonthYear } from '@/lib/utils'
import type { CoachAssignment, UserProfile } from '@/lib/types'

type NotifyPref = 'new-plan' | 'weekly' | 'none'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type StravaSyncState = 'idle' | 'syncing' | 'done' | 'error'
// Échec d'une action Strava ; le message est rédigé à l'affichage.
type StravaError = 'connect' | 'disconnect'

function coachName(coach: CoachAssignment) {
  const { firstName, lastName, email } = coach.user
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || email
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
  const { locale, t } = useI18n()
  const session = useSessionState()
  const [notify, setNotify] = useState<NotifyPref>('new-plan')
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [stravaConnected, setStravaConnected] = useState(initialStravaConnected)
  const [stravaBusy, setStravaBusy] = useState(false)
  const [stravaError, setStravaError] = useState<StravaError | null>(null)
  // « En cours » dès le premier rendu au retour de Strava : l'effet ci-dessous
  // lance la synchronisation sans avoir à modifier l'état de façon synchrone.
  const [stravaSync, setStravaSync] = useState<StravaSyncState>(stravaBanner === 'connected' ? 'syncing' : 'idle')
  const router = useRouter()
  // Une fois Strava déconnecté, il n'y a plus rien à renouveler.
  const needsReconnect = stravaBanner === 'reconnect' && stravaConnected

  // Première connexion Strava : l'import initial peut porter sur des mois
  // d'historique et prendre un certain temps, contrairement aux resynchros
  // incrémentales que l'athlète déclenche ensuite depuis le calendrier.
  useEffect(() => {
    if (stravaBanner !== 'connected') return
    let cancelled = false
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
      setStravaError('connect')
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
      setStravaError('disconnect')
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

  const stravaStatus = needsReconnect
    ? t.profile.stravaExpired
    : stravaConnected
      ? t.profile.stravaConnected
      : t.profile.stravaNotConnected

  return (
    <div>
      <h1>{t.profile.title}</h1>
      {!user && (
        <p role="alert" className="text-danger mb-4">
          {t.profile.loadFailed}
        </p>
      )}
      <div className="grid gap-8 max-w-[560px] mt-5">
        <section>
          <h2 className="section-title mb-3">{t.profile.account}</h2>
          <div className="grid gap-3">
            <Field label={t.profile.firstName} htmlFor="sn-p-firstname">
              <Input id="sn-p-firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label={t.profile.lastName} htmlFor="sn-p-lastname">
              <Input id="sn-p-lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
            <Field label={t.common.email} htmlFor="sn-p-email">
              <Input id="sn-p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">{t.profile.coach}</h2>
          {coach ? (
            <div className="panel-flat rounded-lg px-4 py-3.5">
              <p className="m-0 text-sm">
                <strong className="font-semibold">{coachName(coach)}</strong>
                <span className="text-text/60">{t.profile.assignedSince(formatMonthYear(coach.createdAt, locale))}</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="m-0 text-text/60 mb-2">{t.profile.noCoach}</p>
              <Link href="/coaches" className="text-sm text-accent underline underline-offset-2 hover:text-accent-700">
                {t.profile.findCoach}
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title mb-3">{t.profile.preferences}</h2>
          {/* Même bascule que dans la barre latérale : c'est aussi dans les
              préférences qu'on cherche la langue. Le groupe porte son propre
              nom accessible, l'intitulé visible ne fait que le doubler. */}
          <div className="grid gap-1.5 mb-3">
            <span aria-hidden className="block text-[11px] uppercase tracking-[0.08em] text-text/60">
              {t.profile.language}
            </span>
            <div>
              <LanguageToggle />
            </div>
          </div>
          <Field label={t.profile.units} htmlFor="sn-unit">
            <SegmentedControl
              name="unit"
              ariaLabel={t.profile.units}
              value={session.unit}
              onChange={(v) => setUnit(v as 'km' | 'mi')}
              options={[
                { value: 'km', label: t.profile.kilometers },
                { value: 'mi', label: t.profile.miles },
              ]}
            />
          </Field>
          <div className="grid gap-1.5 mt-3">
            <RadioOption name="notify" checked={notify === 'new-plan'} onChange={() => setNotify('new-plan')}>
              {t.profile.notifyNewPlan}
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'weekly'} onChange={() => setNotify('weekly')}>
              {t.profile.notifyWeekly}
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'none'} onChange={() => setNotify('none')}>
              {t.profile.notifyNone}
            </RadioOption>
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">{t.profile.integrations}</h2>
          <div className="flex gap-2 items-center mb-2">
            <Badge variant="accent">{t.profile.garminConnected}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={stravaConnected && !needsReconnect ? 'accent' : 'neutral'}>
              {t.profile.stravaStatus(stravaStatus)}
            </Badge>
            {/* autoFocus : l'athlète arrive ici depuis le tableau de bord pour
                cette seule action ; le focus amène aussi le bouton à l'écran. */}
            {needsReconnect && (
              <Button onClick={connectStrava} disabled={stravaBusy} autoFocus>
                {stravaBusy ? t.profile.redirecting : t.profile.reconnectStrava}
              </Button>
            )}
            {stravaConnected ? (
              <Button variant="ghost" onClick={disconnectStrava} disabled={stravaBusy}>
                {stravaBusy ? t.profile.disconnecting : t.profile.disconnect}
              </Button>
            ) : (
              <Button variant="ghost" onClick={connectStrava} disabled={stravaBusy}>
                {stravaBusy ? t.profile.redirecting : t.profile.connect}
              </Button>
            )}
          </div>
          {needsReconnect && (
            <p role="alert" className="text-sm text-danger mt-2 max-w-[60ch]">
              {t.profile.stravaExpiredWarning}
            </p>
          )}
          {stravaError && (
            <p role="alert" className="text-sm text-danger mt-2">
              {stravaError === 'connect' ? t.profile.stravaConnectFailed : t.profile.stravaDisconnectFailed}
            </p>
          )}
          {stravaBanner === 'connected' && stravaSync === 'syncing' && (
            <div role="status" className="flex items-center gap-2 mt-2 text-sm text-text/70">
              <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              {t.profile.stravaImporting}
            </div>
          )}
          {stravaBanner === 'connected' && stravaSync === 'done' && (
            <p role="status" className="text-sm text-success mt-2">
              {t.profile.stravaImported}{' '}
              <Link href="/dashboard" className="text-accent underline underline-offset-2 hover:text-accent-700">
                {t.profile.viewCalendar}
              </Link>
            </p>
          )}
          {stravaBanner === 'connected' && stravaSync === 'error' && (
            <p role="alert" className="text-sm text-danger mt-2">
              {t.profile.stravaImportFailed}
            </p>
          )}
          {stravaBanner === 'error' && (
            <p role="alert" className="text-sm text-danger mt-2">
              {t.profile.stravaConnectionFailed}
            </p>
          )}
        </section>

        <div className="flex items-center gap-3">
          <Button className="w-fit" onClick={save} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? t.common.saving : t.common.saveChanges}
          </Button>
          {saveState === 'saved' && (
            <span role="status" className="text-sm text-success">
              {t.common.saved}
            </span>
          )}
          {saveState === 'error' && (
            <span role="alert" className="text-sm text-danger">
              {t.common.saveChangesFailed}
            </span>
          )}
        </div>

        {/* Après le bouton d'enregistrement : ces actions ne font pas partie
            du formulaire, et la suppression doit rester à l'écart. */}
        <section className="border-t border-divider pt-6">
          <h2 className="section-title mb-3">{t.profile.yourData}</h2>
          <p className="text-sm text-text/80 mb-3 max-w-[60ch]">
            {user?.healthDataConsentAt && t.profile.consentedOn(formatLegalDate(user.healthDataConsentAt, locale))}
            {t.profile.dataUsageBefore}{' '}
            {/* Souligné : au milieu d'une phrase, la couleur seule ne
                distingue pas un lien (WCAG 1.4.1). */}
            <Link href="/privacy" className="text-accent underline hover:text-accent-700">
              {t.profile.dataUsageLink}
            </Link>
            {t.profile.dataUsageAfter}
          </p>
          <AccountDataActions />
        </section>
      </div>
    </div>
  )
}
