'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { Activity } from '@/lib/types'

interface FitFileUploadProps {
  activityId: string
  onAttached: (activity: Activity) => void
}

// Rattache le .fit de la montre à une activité importée de Strava : l'API
// remplace ses laps par ceux du fichier, avec l'intensité (travail, récup,
// échauffement) et les métriques de foulée que Strava ne donne pas.
export function FitFileUpload({ activityId, onAttached }: FitFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/activities/${activityId}/fit`, { method: 'POST', body: formData })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        // L'API refuse avec des messages précis (fichier déjà rattaché, déjà
        // importé sur une autre activité, horodatage qui ne correspond pas) :
        // ils valent mieux qu'un message générique.
        const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
        throw new Error(message ?? 'Échec du rattachement du fichier .fit.')
      }

      const refreshed = await fetch(`/api/activities/${activityId}`)
      if (!refreshed.ok) throw new Error("Fichier rattaché, mais l'activité n'a pas pu être rechargée.")
      onAttached(await refreshed.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Échec du rattachement du fichier .fit.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <p className="text-sm text-text/60 mb-2 max-w-[62ch]">
        Les laps venus de Strava ne disent pas ce qui est effort et ce qui est récupération. Attache le .fit de ta
        montre pour les obtenir.
      </p>
      <input ref={fileInputRef} type="file" accept=".fit" className="hidden" onChange={onFileSelected} />
      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Import…' : 'Attacher le fichier .fit'}
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
