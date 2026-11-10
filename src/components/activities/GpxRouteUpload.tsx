'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import type { RoutePoint } from '@/components/ui/RouteMap'

interface GpxRouteUploadProps {
  activityId: string
  hasRoute: boolean
  onUploaded: (points: RoutePoint[]) => void
}

// Bouton complémentaire à l'upload .fit : attache/remplace le tracé carte
// d'une activité déjà créée via POST /activities/:id/gpx (les laps/physio
// restent sur le .fit, ce endpoint ne gère que la trace GPS).
export function GpxRouteUpload({ activityId, hasRoute, onUploaded }: GpxRouteUploadProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setFailed(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await clientFetch(`/api/activities/${activityId}/gpx`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('gpx upload failed')

      const routeRes = await clientFetch(`/api/activities/${activityId}/route`)
      if (!routeRes.ok) throw new Error('route fetch failed')
      onUploaded(await routeRes.json())
    } catch {
      setFailed(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={onFileSelected} />
      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? t.common.uploading : hasRoute ? t.gpxAttach.replace : t.gpxAttach.attach}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-danger mt-2">
          {t.gpxAttach.failed}
        </p>
      )}
    </div>
  )
}
