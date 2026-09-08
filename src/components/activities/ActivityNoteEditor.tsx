'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, inputClassName, Textarea } from '@/components/ui/Field'
import type { Activity } from '@/lib/types'

export function ActivityNoteEditor({ activity, onSaved }: { activity: Activity; onSaved: (activity: Activity) => void }) {
  const [editing, setEditing] = useState(false)
  const [athleteNote, setAthleteNote] = useState(activity.athleteNote ?? '')
  const [difficultyNote, setDifficultyNote] = useState(
    activity.difficultyNote != null ? String(activity.difficultyNote) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const trimmedNote = athleteNote.trim()
    const difficultyValue = difficultyNote.trim() ? Number(difficultyNote) : null
    if (difficultyValue !== null && (!Number.isInteger(difficultyValue) || difficultyValue < 1 || difficultyValue > 10)) {
      setError('La difficulté doit être un entier entre 1 et 10.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const body: Record<string, string | number> = { athleteNote: trimmedNote }
      if (difficultyValue !== null) body.difficultyNote = difficultyValue

      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('patch failed')

      const updated: Activity = await res.json()
      onSaved(updated)
      setEditing(false)
    } catch {
      setError("Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="mb-6">
        <h4 className="mb-3">Ta note</h4>
        <p className="text-sm mb-1">
          <span className="text-text/60">Difficulté : </span>
          {activity.difficultyNote != null ? `${activity.difficultyNote}/10` : '—'}
        </p>
        <p className="text-sm mb-3">
          <span className="text-text/60">Ta note : </span>
          {activity.athleteNote || '—'}
        </p>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Éditer ma note
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-6 max-w-[420px]">
      <h4 className="mb-3">Ta note</h4>
      <div className="grid gap-3">
        <Field label="Athlete note" htmlFor="sn-edit-athlete-note">
          <Textarea
            id="sn-edit-athlete-note"
            maxLength={2000}
            value={athleteNote}
            onChange={(e) => setAthleteNote(e.target.value)}
          />
        </Field>
        <Field label="Difficulty (1–10)" htmlFor="sn-edit-difficulty-note">
          <input
            id="sn-edit-difficulty-note"
            type="number"
            min={1}
            max={10}
            step={1}
            className={`w-24 ${inputClassName}`}
            value={difficultyNote}
            onChange={(e) => setDifficultyNote(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex gap-3 items-center mt-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          Annuler
        </Button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  )
}
