'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { RouteMap } from '@/components/ui/RouteMap'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { COROS_ACTIVITIES, type CorosActivity } from '@/lib/mock-data'
import { confirmUpload, confirmRealUpload } from '@/lib/session-store'
import type { UploadedActivity } from '@/lib/types'

type Stage = 'idle' | 'syncing' | 'synced' | 'parsed'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [parsed, setParsed] = useState<CorosActivity>(COROS_ACTIVITIES[0])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [gpxData, setGpxData] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [athleteNote, setAthleteNote] = useState('')
  const [difficultyNote, setDifficultyNote] = useState('')

  function resetSelection() {
    setSelectedId(null)
    setSelectedFile(null)
    setGpxData(null)
    setUploadError(null)
    setAthleteNote('')
    setDifficultyNote('')
  }

  function simulateDrop() {
    resetSelection()
    setParsed(COROS_ACTIVITIES[0])
    setStage('parsed')
  }

  function pickFile() {
    fileInputRef.current?.click()
  }

  function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de reprendre le même fichier ensuite
    if (!file) return

    resetSelection()
    setSelectedFile(file)

    if (file.name.toLowerCase().endsWith('.gpx')) {
      const reader = new FileReader()
      reader.onload = () => setGpxData(String(reader.result))
      reader.readAsText(file)
    }
    setStage('parsed')
  }

  function syncCoros() {
    setStage('syncing')
    setTimeout(() => setStage('synced'), 900)
  }

  function attachSelected() {
    const activity = COROS_ACTIVITIES.find((a) => a.id === selectedId)
    if (activity) setParsed(activity)
    setSelectedFile(null)
    setGpxData(null)
    setStage('parsed')
  }

  function discard() {
    resetSelection()
    setStage('idle')
  }

  async function confirm() {
    if (selectedFile) {
      const trimmedNote = athleteNote.trim()
      const difficultyValue = difficultyNote.trim() ? Number(difficultyNote) : null
      if (difficultyValue !== null && (!Number.isInteger(difficultyValue) || difficultyValue < 1 || difficultyValue > 10)) {
        setUploadError('La difficulté doit être un entier entre 1 et 10.')
        return
      }

      setUploading(true)
      setUploadError(null)
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        // plannedSessionId volontairement omis : /plan tourne encore sur des
        // identifiants mock, pas de vrai id de séance planifiée à envoyer.
        if (trimmedNote) formData.append('athleteNote', trimmedNote)
        if (difficultyValue !== null) formData.append('difficultyNote', String(difficultyValue))
        const res = await fetch('/api/activities/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('upload failed')
        const activity: UploadedActivity = await res.json()
        confirmRealUpload(activity, gpxData)
        router.push('/activities')
      } catch {
        setUploadError("Échec de l'envoi. Réessaie.")
      } finally {
        setUploading(false)
      }
      return
    }

    confirmUpload(parsed)
    router.push('/activities')
  }

  return (
    <div>
      <h1>Upload activity</h1>
      <p className="opacity-70 mb-6">Attach the .fit or .gpx file from your watch or bike computer.</p>

      <input ref={fileInputRef} type="file" accept=".fit,.gpx" className="hidden" onChange={onFileSelected} />

      {stage === 'idle' && (
        <>
          <div
            onClick={pickFile}
            className="border border-dashed border-divider rounded-md py-16 px-6 text-center cursor-pointer bg-surface max-w-[600px] transition-colors hover:border-accent"
          >
            <svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" className="mx-auto mb-3">
              <path
                opacity="0.25"
                d="M216,144v64a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Z"
              />
              <path d="M92.69,84.69,120,57.37V152a8,8,0,0,0,16,0V57.37l27.31,27.32a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,92.69,84.69ZM224,144v64a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V144a16,16,0,0,1,32,0v56H208V144a16,16,0,0,1,16,0Z" />
            </svg>
            <div className="font-semibold">Drag your .fit or .gpx file here, or click to browse</div>
            <div className="text-text/60 text-[13px] mt-1">Le parcours s&apos;affichera sur la carte pour les fichiers .gpx.</div>
          </div>
          <div className="flex items-center gap-3 my-5 max-w-[600px]">
            <div className="flex-1 h-px bg-divider" />
            <span className="text-text/60 text-xs">or</span>
            <div className="flex-1 h-px bg-divider" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={syncCoros}>
              Synchroniser
            </Button>
            <Button variant="ghost" onClick={simulateDrop}>
              Preview a sample upload (demo)
            </Button>
          </div>
        </>
      )}

      {stage === 'syncing' && <p className="text-text/60">Synchronisation avec COROS…</p>}

      {stage === 'synced' && (
        <div className="max-w-[680px]">
          <h4 className="mb-3">Activités COROS</h4>
          <table className="w-full border-collapse text-sm mb-5">
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Activité</th>
                <th className={thClass}>Distance</th>
                <th className={thClass}>Durée</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {COROS_ACTIVITIES.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`cursor-pointer ${a.id === selectedId ? 'bg-accent-100' : 'hover:bg-text/[0.04]'}`}
                >
                  <td className={`${tdClass} text-text/60`}>{a.date}</td>
                  <td className={tdClass}>{a.title}</td>
                  <td className={`${tdClass} text-text/60`}>{a.distance}</td>
                  <td className={`${tdClass} text-text/60`}>{a.duration}</td>
                  <td className={tdClass}>
                    <Badge variant="outline">Sélectionner</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button disabled={!selectedId} onClick={attachSelected}>
            Attacher à Threshold intervals
          </Button>
        </div>
      )}

      {stage === 'parsed' && (
        <div className="max-w-[680px]">
          <div className="flex gap-2 items-start mb-5">
            {gpxData ? (
              <RouteMap gpxData={gpxData} className="flex-1 h-[220px] rounded-md" />
            ) : (
              <div className="flex-1 h-[220px] border border-dashed border-divider rounded-md bg-surface flex flex-col items-center justify-center gap-2">
                <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" className="opacity-50">
                  <path
                    opacity="0.25"
                    d="M128,16a88,88,0,0,0-88,88c0,75,80,132,83.42,134.5a8,8,0,0,0,9.16,0C136,236,216,179,216,104A88,88,0,0,0,128,16Z"
                  />
                  <path d="M128,8A96.11,96.11,0,0,0,32,104c0,43.13,26.36,74.34,52.29,99.28A280.34,280.34,0,0,0,123.3,235a8,8,0,0,0,9.4,0,280.34,280.34,0,0,0,39-31.72C199.64,178.34,226,147.13,226,104A96.11,96.11,0,0,0,128,8Zm0,208.32C112,203,48,150.72,48,104a80,80,0,0,1,160,0C208,150.72,144,203,128,216.32ZM128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Z" />
                </svg>
                <div className="text-text/60 text-[13px]">
                  {selectedFile ? 'Aperçu du parcours indisponible pour les fichiers .fit' : 'Route preview — connect location data to render the track'}
                </div>
              </div>
            )}
          </div>

          {selectedFile ? (
            <p className="mb-5 text-sm">
              <span className="font-semibold">{selectedFile.name}</span> prêt à être envoyé. Distance, durée, FC et
              dénivelé seront calculés par le serveur après l&apos;envoi.
            </p>
          ) : (
            <div className="flex gap-6 mb-5 flex-wrap">
              <Stat label="Distance" value={parsed.distance} size="sm" />
              <Stat label="Duration" value={parsed.duration} size="sm" />
              <Stat label="Avg pace" value={parsed.pace} size="sm" />
              <Stat label="Avg HR" value={parsed.hr} size="sm" />
              <Stat label="Elevation" value={parsed.elevation} size="sm" />
            </div>
          )}

          {selectedFile && (
            <div className="grid gap-3 max-w-[420px] mb-5">
              <Field label="Athlete note (optional)" htmlFor="sn-athlete-note">
                <Textarea
                  id="sn-athlete-note"
                  maxLength={2000}
                  placeholder="Jambes lourdes mais bonnes sensations…"
                  value={athleteNote}
                  onChange={(e) => setAthleteNote(e.target.value)}
                />
              </Field>
              <Field label="Difficulty (1–10, optional)" htmlFor="sn-difficulty-note">
                <input
                  id="sn-difficulty-note"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  className="w-24 min-h-9 px-2.5 py-1.5 text-sm text-text bg-surface border border-divider rounded-md focus-visible:border-accent focus-visible:outline-none"
                  value={difficultyNote}
                  onChange={(e) => setDifficultyNote(e.target.value)}
                />
              </Field>
            </div>
          )}

          <div className="max-w-[340px] mb-5">
            <Field label="Match to planned workout" htmlFor="sn-match">
              <Select id="sn-match" defaultValue="fri">
                <option value="fri">Fri Aug 7 · Threshold intervals</option>
                <option value="none">No match — log as unplanned</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3 items-center">
            <Button onClick={confirm} disabled={uploading}>
              {uploading ? 'Envoi…' : 'Confirm & save'}
            </Button>
            <Button variant="ghost" onClick={discard} disabled={uploading}>
              Discard
            </Button>
            {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
