'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import type { Activity, ActivityNoteUpdate } from '@/lib/types'

// Marque l'activité comme séance de qualité (fractionné, seuil, côtes), ce qui
// la fait entrer dans l'analyse de /trainings. Porté par l'activité et non par
// le workout : PATCH /workouts/:id est réservé au coach, alors que l'athlète a
// le dernier mot sur ses propres activités. Le choix du coach, hérité à la
// liaison, est rappelé sous l'interrupteur.
//
// role="switch" : un état activé / désactivé, appliqué dès le clic, sans
// bouton « Enregistrer ».
export function TrainingToggle({
  activity,
  prescribedByCoach,
  onSaved,
}: {
  activity: Activity
  prescribedByCoach: boolean
  onSaved: (activity: Activity) => void
}) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  // Drapeau plutôt que message : le texte est rédigé à l'affichage, dans la
  // langue courante.
  const [saveFailed, setSaveFailed] = useState(false)
  const on = activity.training

  async function toggle() {
    setSaving(true)
    setSaveFailed(false)
    try {
      const body: ActivityNoteUpdate = { training: !on }
      const res = await clientFetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('patch failed')
      onSaved((await res.json()) as Activity)
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-busy={saving || undefined}
          onClick={toggle}
          disabled={saving}
          className="group inline-flex items-center gap-2.5 text-sm font-medium cursor-pointer disabled:cursor-wait"
        >
          {/* Éteint, la piste garde un liseré et le curseur une teinte franche :
              un interrupteur doit se voir à 3:1 contre le fond (WCAG 1.4.11). */}
          <span
            aria-hidden
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              on ? 'bg-accent' : 'bg-surface-2 ring-1 ring-inset ring-text/40'
            } ${saving ? 'opacity-60' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full motion-safe:transition-transform motion-safe:duration-200 ${
                on ? 'translate-x-4 bg-bg' : 'bg-text/70'
              }`}
            />
          </span>
          {t.training.toggle}
        </button>
        {on && (
          <Link href="/trainings" className="text-sm text-accent underline underline-offset-2 hover:text-accent-700">
            {t.training.seeAnalysis}
          </Link>
        )}
        {saveFailed && (
          <span role="alert" className="text-sm text-danger">
            {t.training.toggleFailed}
          </span>
        )}
      </div>
      <p className="text-xs text-text/60 mt-1.5">
        {prescribedByCoach ? t.training.prescribedByCoach : t.training.toggleHint}
      </p>
    </div>
  )
}
