'use client'

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { RouteMap } from '@/components/ui/RouteMap'
import { formatDateLabel } from '@/lib/utils'
import type { UploadedActivity, Workout } from '@/lib/types'

type Stage = 'idle' | 'parsed'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [selectedFitFile, setSelectedFitFile] = useState<File | null>(null)
  const [selectedGpxFile, setSelectedGpxFile] = useState<File | null>(null)
  const [gpxData, setGpxData] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [athleteNote, setAthleteNote] = useState('')
  const [difficultyNote, setDifficultyNote] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutId, setWorkoutId] = useState('none')

  useEffect(() => {
    fetch('/api/workouts')
      .then((res) => (res.ok ? res.json() : []))
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
  }, [])

  function resetSelection() {
    setSelectedFitFile(null)
    setSelectedGpxFile(null)
    setGpxData(null)
    setUploadError(null)
    setAthleteNote('')
    setDifficultyNote('')
    setWorkoutId('none')
  }

  function pickFile() {
    fileInputRef.current?.click()
  }

  // Accepte un .fit seul, un .gpx seul (pour compléter une activité déjà
  // uploadée depuis /activities/:id), ou les deux ensemble en une seule
  // dépose : le .fit crée l'activité, le .gpx lui attache son tracé carte.
  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    resetSelection()

    if (list.length > 2) {
      setUploadError('Dépose au maximum deux fichiers : un .fit et un .gpx.')
      return
    }

    let fitFile: File | null = null
    let gpxFile: File | null = null
    for (const file of list) {
      const name = file.name.toLowerCase()
      if (name.endsWith('.fit')) {
        if (fitFile) {
          setUploadError('Un seul fichier .fit à la fois.')
          return
        }
        fitFile = file
      } else if (name.endsWith('.gpx')) {
        if (gpxFile) {
          setUploadError('Un seul fichier .gpx à la fois.')
          return
        }
        gpxFile = file
      } else {
        setUploadError('Formats acceptés : .fit et .gpx.')
        return
      }
    }

    if (!fitFile && gpxFile) {
      setUploadError('Un fichier .fit est nécessaire pour créer l’activité — le .gpx seul ne suffit pas ici.')
      return
    }

    setSelectedFitFile(fitFile)
    setSelectedGpxFile(gpxFile)

    if (gpxFile) {
      const reader = new FileReader()
      reader.onload = () => setGpxData(String(reader.result))
      reader.readAsText(gpxFile)
    }
    setStage('parsed')
  }

  function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    e.target.value = '' // permet de reprendre les mêmes fichiers ensuite
    if (!files || files.length === 0) return
    handleFiles(files)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function discard() {
    resetSelection()
    setStage('idle')
  }

  async function confirm() {
    if (!selectedFitFile) return

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
      formData.append('file', selectedFitFile)
      if (workoutId !== 'none') formData.append('workoutId', workoutId)
      if (trimmedNote) formData.append('athleteNote', trimmedNote)
      if (difficultyValue !== null) formData.append('difficultyNote', String(difficultyValue))
      const res = await fetch('/api/activities/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('upload failed')
      const activity: UploadedActivity = await res.json()

      if (selectedGpxFile) {
        const gpxFormData = new FormData()
        gpxFormData.append('file', selectedGpxFile)
        const gpxRes = await fetch(`/api/activities/${activity.id}/gpx`, { method: 'POST', body: gpxFormData })
        if (!gpxRes.ok) throw new Error('gpx upload failed')
      }

      router.push('/activities')
    } catch {
      setUploadError("Échec de l'envoi. Réessaie.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1>Upload activity</h1>
      <p className="opacity-70 mb-6">
        Attach the .fit file from your watch, and optionally a .gpx for the route — drop both at once.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".fit,.gpx"
        multiple
        className="hidden"
        onChange={onFileSelected}
      />

      {stage === 'idle' && (
        <>
          <div
            onClick={pickFile}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="border border-dashed border-divider rounded-md py-16 px-6 text-center cursor-pointer bg-surface max-w-[600px] transition-colors hover:border-accent"
          >
            <svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" className="mx-auto mb-3">
              <path
                opacity="0.25"
                d="M216,144v64a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Z"
              />
              <path d="M92.69,84.69,120,57.37V152a8,8,0,0,0,16,0V57.37l27.31,27.32a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,92.69,84.69ZM224,144v64a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V144a16,16,0,0,1,32,0v56H208V144a16,16,0,0,1,16,0Z" />
            </svg>
            <div className="font-semibold">Drag your .fit and .gpx files here, or click to browse</div>
            <div className="text-text/60 text-[13px] mt-1">
              Dépose le .fit et le .gpx ensemble pour associer le tracé, ou un seul fichier à la fois.
            </div>
          </div>
          {uploadError && <p className="text-sm text-red-600 mt-3 max-w-[600px]">{uploadError}</p>}
        </>
      )}

      {stage === 'parsed' && selectedFitFile && (
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
                  Ajoute un .gpx pour prévisualiser le tracé — sinon la carte sera calculée après envoi.
                </div>
              </div>
            )}
          </div>

          <p className="mb-5 text-sm">
            <span className="font-semibold">{selectedFitFile.name}</span>
            {selectedGpxFile && (
              <>
                {' '}+ <span className="font-semibold">{selectedGpxFile.name}</span>
              </>
            )}{' '}
            prêt{selectedGpxFile ? 's' : ''} à être envoyé{selectedGpxFile ? 's' : ''}. Distance, durée, FC et
            dénivelé seront calculés par le serveur après l&apos;envoi.
          </p>

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

          <div className="max-w-[340px] mb-5">
            <Field label="Match to planned workout" htmlFor="sn-match">
              <Select id="sn-match" value={workoutId} onChange={(e) => setWorkoutId(e.target.value)}>
                <option value="none">No match — log as unplanned</option>
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {formatDateLabel(w.scheduledDate)} · {w.title}
                  </option>
                ))}
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
