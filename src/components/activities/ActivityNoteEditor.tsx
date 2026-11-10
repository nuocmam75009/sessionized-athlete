'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, fieldErrorProps, inputClassName, Textarea } from '@/components/ui/Field'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import type { Activity } from '@/lib/types'

export function ActivityNoteEditor({ activity, onSaved }: { activity: Activity; onSaved: (activity: Activity) => void }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [athleteNote, setAthleteNote] = useState(activity.athleteNote ?? '')
  const [difficultyNote, setDifficultyNote] = useState(
    activity.difficultyNote != null ? String(activity.difficultyNote) : ''
  )
  const [saving, setSaving] = useState(false)
  // Drapeaux plutôt que messages : le texte est rédigé à l'affichage, dans la
  // langue courante.
  const [saveFailed, setSaveFailed] = useState(false)
  const [difficultyInvalid, setDifficultyInvalid] = useState(false)
  const difficultyError = difficultyInvalid ? t.note.difficultyInvalid : null

  async function save() {
    const trimmedNote = athleteNote.trim()
    const difficultyValue = difficultyNote.trim() ? Number(difficultyNote) : null
    if (difficultyValue !== null && (!Number.isInteger(difficultyValue) || difficultyValue < 1 || difficultyValue > 10)) {
      setDifficultyInvalid(true)
      document.getElementById('sn-edit-difficulty-note')?.focus()
      return
    }

    setSaving(true)
    setSaveFailed(false)
    setDifficultyInvalid(false)
    try {
      const body: Record<string, string | number> = { athleteNote: trimmedNote }
      if (difficultyValue !== null) body.difficultyNote = difficultyValue

      const res = await clientFetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('patch failed')

      const updated: Activity = await res.json()
      onSaved(updated)
      setEditing(false)
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="mb-6">
        <h2 className="section-title mb-3">{t.note.title}</h2>
        <p className="text-sm mb-1">
          <span className="text-text/60">{t.note.difficulty}</span>
          {activity.difficultyNote != null ? `${activity.difficultyNote}/10` : '—'}
        </p>
        <p className="text-sm mb-3">
          <span className="text-text/60">{t.note.note}</span>
          {activity.athleteNote || '—'}
        </p>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          {t.note.edit}
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-6 max-w-[420px]">
      <h2 className="section-title mb-3">{t.note.title}</h2>
      <div className="grid gap-3">
        <Field label={t.note.athleteNote} htmlFor="sn-edit-athlete-note">
          <Textarea
            id="sn-edit-athlete-note"
            maxLength={2000}
            value={athleteNote}
            onChange={(e) => setAthleteNote(e.target.value)}
          />
        </Field>
        <Field label={t.note.difficultyField} htmlFor="sn-edit-difficulty-note" error={difficultyError}>
          <input
            id="sn-edit-difficulty-note"
            type="number"
            min={1}
            max={10}
            step={1}
            className={`w-24 ${inputClassName}`}
            value={difficultyNote}
            onChange={(e) => {
              setDifficultyNote(e.target.value)
              setDifficultyInvalid(false)
            }}
            {...fieldErrorProps('sn-edit-difficulty-note', difficultyError)}
          />
        </Field>
      </div>
      <div className="flex gap-3 items-center mt-3">
        <Button onClick={save} disabled={saving}>
          {saving ? t.common.saving : t.common.save}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          {t.common.cancel}
        </Button>
        {saveFailed && (
          <span role="alert" className="text-sm text-danger">
            {t.note.saveFailed}
          </span>
        )}
      </div>
    </div>
  )
}
