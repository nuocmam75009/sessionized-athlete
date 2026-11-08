'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { clientFetch } from '@/lib/client-fetch'
import { DeleteAccountDialog } from './DeleteAccountDialog'

type ExportState = 'idle' | 'exporting' | 'error'

// Nom proposé par notre Route Handler ; repli si l'en-tête manque.
function exportFileName(contentDisposition: string | null): string {
  return contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? 'sessionized-export.json'
}

// Droits d'accès, de portabilité et d'effacement, exercés en un clic : sur le
// profil, et sur l'écran de consentement pour qui refuse.
export function AccountDataActions() {
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // fetch puis lien temporaire, plutôt qu'un simple <a download> : une
  // session expirée renvoie vers /login (clientFetch) au lieu de télécharger
  // un fichier d'erreur, et un échec s'affiche ici.
  async function downloadData() {
    setExportState('exporting')
    try {
      const res = await clientFetch('/api/users/me/export')
      if (!res.ok) throw new Error('export failed')
      const url = URL.createObjectURL(await res.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName(res.headers.get('content-disposition'))
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setExportState('idle')
    } catch {
      setExportState('error')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={downloadData} disabled={exportState === 'exporting'}>
          {exportState === 'exporting' ? 'Preparing your data…' : 'Download my data'}
        </Button>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete my account
        </Button>
      </div>
      <p className="text-[13px] text-text/70 mt-2 max-w-[60ch]">
        The download is a JSON file with your account, profile, plans, activities, GPS tracks and original .fit and
        .gpx files.
      </p>
      {exportState === 'error' && (
        <p role="alert" className="text-sm text-danger mt-2">
          Couldn&apos;t prepare your data. Try again.
        </p>
      )}
      {deleteOpen && <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />}
    </div>
  )
}
