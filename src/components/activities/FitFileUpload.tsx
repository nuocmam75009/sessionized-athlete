'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { clientFetch } from '@/lib/client-fetch'
import type { Activity } from '@/lib/types'

interface FitFileUploadProps {
  activityId: string
  onAttached: (activity: Activity) => void
}

// Message choisi d'après le statut plutôt que repris de l'API (rédigée en
// français) : 409 pour un fichier déjà rattaché, ici ou à une autre activité ;
// 400 pour un fichier illisible, sans tours, ou dont l'heure de départ ne
// correspond pas à l'activité.
function attachErrorMessage(status: number): string {
  if (status === 409) return 'This .fit file is already attached, to this activity or another one.'
  if (status === 400) {
    return "This .fit file can't be attached: it is unreadable, has no laps, or doesn't match this activity's start time."
  }
  return "Couldn't attach the .fit file. Try again."
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
      const res = await clientFetch(`/api/activities/${activityId}/fit`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(attachErrorMessage(res.status))

      const refreshed = await clientFetch(`/api/activities/${activityId}`)
      if (!refreshed.ok) throw new Error("File attached, but the activity couldn't be reloaded. Refresh the page.")
      onAttached(await refreshed.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't attach the .fit file. Try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <p className="text-sm text-text/60 mb-2 max-w-[62ch]">
        Laps imported from Strava don&apos;t tell work from recovery. Attach the .fit file from your watch to get
        them.
      </p>
      <input ref={fileInputRef} type="file" accept=".fit" className="hidden" onChange={onFileSelected} />
      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Uploading…' : 'Attach .fit file'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
