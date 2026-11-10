'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import type { Activity } from '@/lib/types'

interface FitFileUploadProps {
  activityId: string
  onAttached: (activity: Activity) => void
}

// Clé du message dans t.fitAttach, rédigé à l'affichage dans la langue courante.
type AttachError = 'alreadyAttached' | 'invalid' | 'failed' | 'reloadFailed'

// Message choisi d'après le statut plutôt que repris de l'API (rédigée en
// français) : 409 pour un fichier déjà rattaché, ici ou à une autre activité ;
// 400 pour un fichier illisible, sans tours, ou dont l'heure de départ ne
// correspond pas à l'activité.
function attachError(status: number): AttachError {
  if (status === 409) return 'alreadyAttached'
  if (status === 400) return 'invalid'
  return 'failed'
}

// Rattache le .fit de la montre à une activité importée de Strava : l'API
// remplace ses laps par ceux du fichier, avec l'intensité (travail, récup,
// échauffement) et les métriques de foulée que Strava ne donne pas.
export function FitFileUpload({ activityId, onAttached }: FitFileUploadProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<AttachError | null>(null)

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
      if (!res.ok) {
        setError(attachError(res.status))
        return
      }

      const refreshed = await clientFetch(`/api/activities/${activityId}`)
      if (!refreshed.ok) {
        setError('reloadFailed')
        return
      }
      onAttached(await refreshed.json())
    } catch {
      setError('failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <p className="text-sm text-text/60 mb-2 max-w-[62ch]">{t.fitAttach.intro}</p>
      <input ref={fileInputRef} type="file" accept=".fit" className="hidden" onChange={onFileSelected} />
      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? t.common.uploading : t.fitAttach.attach}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger mt-2">
          {t.fitAttach[error]}
        </p>
      )}
    </div>
  )
}
