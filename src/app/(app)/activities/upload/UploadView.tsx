'use client'

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Field, fieldErrorProps, inputClassName, Select, Textarea } from '@/components/ui/Field'
import { RouteMap } from '@/components/ui/RouteMap'
import { clientFetch } from '@/lib/client-fetch'
import { formatDateLabel } from '@/lib/utils'
import type { UploadedActivity, Workout } from '@/lib/types'

type Stage = 'idle' | 'parsed'

// Message choisi d'après le statut plutôt que repris de l'API : ses textes sont
// en français, l'interface en anglais. Le statut suffit à distinguer les refus
// où « réessaie » serait faux — un doublon échouerait à nouveau.
function uploadErrorMessage(status: number): string {
  if (status === 409) return 'This activity has already been uploaded.'
  if (status === 400) return 'This .fit file is invalid or corrupted.'
  return 'Upload failed. Try again.'
}

async function attachGpx(activityId: string, file: File): Promise<boolean> {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await clientFetch(`/api/activities/${activityId}/gpx`, { method: 'POST', body: formData })
    return res.ok
  } catch {
    return false
  }
}

export function UploadView({ initialWorkoutId }: { initialWorkoutId?: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [selectedFitFile, setSelectedFitFile] = useState<File | null>(null)
  const [selectedGpxFile, setSelectedGpxFile] = useState<File | null>(null)
  const [gpxData, setGpxData] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [difficultyError, setDifficultyError] = useState<string | null>(null)
  // Activité créée, mais tracé .gpx refusé : identifiant de l'activité, pour
  // renvoyer vers sa page plutôt que vers un second envoi du .fit.
  const [savedWithoutRoute, setSavedWithoutRoute] = useState<string | null>(null)
  const [athleteNote, setAthleteNote] = useState('')
  const [difficultyNote, setDifficultyNote] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutId, setWorkoutId] = useState(initialWorkoutId ?? 'none')

  useEffect(() => {
    clientFetch('/api/workouts')
      .then((res) => (res.ok ? res.json() : []))
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
  }, [])

  function resetSelection() {
    setSelectedFitFile(null)
    setSelectedGpxFile(null)
    setGpxData(null)
    setUploadError(null)
    setDifficultyError(null)
    setSavedWithoutRoute(null)
    setAthleteNote('')
    setDifficultyNote('')
    setWorkoutId(initialWorkoutId ?? 'none')
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
      setUploadError('Drop at most two files: one .fit and one .gpx.')
      return
    }

    let fitFile: File | null = null
    let gpxFile: File | null = null
    for (const file of list) {
      const name = file.name.toLowerCase()
      if (name.endsWith('.fit')) {
        if (fitFile) {
          setUploadError('Only one .fit file at a time.')
          return
        }
        fitFile = file
      } else if (name.endsWith('.gpx')) {
        if (gpxFile) {
          setUploadError('Only one .gpx file at a time.')
          return
        }
        gpxFile = file
      } else {
        setUploadError('Accepted formats: .fit and .gpx.')
        return
      }
    }

    if (!fitFile && gpxFile) {
      setUploadError('A .fit file is required to create the activity — a .gpx alone is not enough here.')
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
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    e.target.value = '' // permet de reprendre les mêmes fichiers ensuite
    handleFiles(fileArray)
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
      setDifficultyError('Difficulty must be a whole number from 1 to 10.')
      document.getElementById('sn-difficulty-note')?.focus()
      return
    }

    setUploading(true)
    setUploadError(null)
    setDifficultyError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFitFile)
      if (workoutId !== 'none') formData.append('workoutId', workoutId)
      if (trimmedNote) formData.append('athleteNote', trimmedNote)
      if (difficultyValue !== null) formData.append('difficultyNote', String(difficultyValue))
      const res = await clientFetch('/api/activities/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        setUploadError(uploadErrorMessage(res.status))
        return
      }
      const activity: UploadedActivity = await res.json()

      // L'activité existe désormais : un échec du tracé ne doit pas inviter à
      // renvoyer le .fit, qui serait refusé comme doublon.
      if (selectedGpxFile && !(await attachGpx(activity.id, selectedGpxFile))) {
        setSavedWithoutRoute(activity.id)
        return
      }

      router.push('/dashboard')
    } catch {
      setUploadError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1>Upload activity</h1>
      <p className="text-text/50 mt-2 mb-8 max-w-[56ch]">
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
            className="group panel-flat lift border-dashed rounded-xl py-20 px-6 text-center cursor-pointer max-w-[600px] hover:border-accent/60"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 256 256"
              fill="currentColor"
              className="mx-auto mb-4 text-text/35 transition-[color,transform] duration-300 ease-out-3d group-hover:-translate-y-1 group-hover:text-accent"
            >
              <path
                opacity="0.25"
                d="M216,144v64a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Z"
              />
              <path d="M92.69,84.69,120,57.37V152a8,8,0,0,0,16,0V57.37l27.31,27.32a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,92.69,84.69ZM224,144v64a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V144a16,16,0,0,1,32,0v56H208V144a16,16,0,0,1,16,0Z" />
            </svg>
            <div className="font-semibold">Drag your .fit and .gpx files here, or click to browse</div>
            <div className="text-text/45 text-[13px] mt-1.5 max-w-[46ch] mx-auto">
              Drop the .fit and .gpx together to attach the route, or the .fit on its own.
            </div>
          </div>
          {uploadError && (
            <p role="alert" className="text-sm text-danger mt-3 max-w-[600px]">
              {uploadError}
            </p>
          )}
        </>
      )}

      {stage === 'parsed' && selectedFitFile && (
        <div className="max-w-[680px]">
          <div className="flex gap-2 items-start mb-5">
            {gpxData ? (
              <RouteMap gpxData={gpxData} className="flex-1 h-[220px] rounded-lg border border-divider" />
            ) : (
              <div className="flex-1 h-[220px] panel-flat border-dashed rounded-lg flex flex-col items-center justify-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" className="opacity-35">
                  <path
                    opacity="0.25"
                    d="M128,16a88,88,0,0,0-88,88c0,75,80,132,83.42,134.5a8,8,0,0,0,9.16,0C136,236,216,179,216,104A88,88,0,0,0,128,16Z"
                  />
                  <path d="M128,8A96.11,96.11,0,0,0,32,104c0,43.13,26.36,74.34,52.29,99.28A280.34,280.34,0,0,0,123.3,235a8,8,0,0,0,9.4,0,280.34,280.34,0,0,0,39-31.72C199.64,178.34,226,147.13,226,104A96.11,96.11,0,0,0,128,8Zm0,208.32C112,203,48,150.72,48,104a80,80,0,0,1,160,0C208,150.72,144,203,128,216.32ZM128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Z" />
                </svg>
                <div className="text-text/45 text-[13px] max-w-[36ch] text-center">
                  Add a .gpx to preview the route — otherwise the map is built after upload.
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
            ready to upload. Distance, duration, heart rate and elevation are calculated by the server once uploaded.
          </p>

          <div className="grid gap-3 max-w-[420px] mb-5">
            <Field label="Athlete note (optional)" htmlFor="sn-athlete-note">
              <Textarea
                id="sn-athlete-note"
                maxLength={2000}
                placeholder="Heavy legs, but felt good…"
                value={athleteNote}
                onChange={(e) => setAthleteNote(e.target.value)}
              />
            </Field>
            <Field label="Difficulty (1–10, optional)" htmlFor="sn-difficulty-note" error={difficultyError}>
              <input
                id="sn-difficulty-note"
                type="number"
                min={1}
                max={10}
                step={1}
                className={`w-24 ${inputClassName}`}
                value={difficultyNote}
                onChange={(e) => {
                  setDifficultyNote(e.target.value)
                  setDifficultyError(null)
                }}
                {...fieldErrorProps('sn-difficulty-note', difficultyError)}
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
          {savedWithoutRoute ? (
            <p role="alert" className="text-sm text-danger">
              Activity saved, but the .gpx route couldn&apos;t be attached.{' '}
              <Link href={`/activities/${savedWithoutRoute}`} className="text-accent hover:text-accent-700">
                Add it from the activity page →
              </Link>
            </p>
          ) : (
            <div className="flex gap-3 items-center">
              <Button onClick={confirm} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Confirm & save'}
              </Button>
              <Button variant="ghost" onClick={discard} disabled={uploading}>
                Discard
              </Button>
              {uploadError && (
                <span role="alert" className="text-sm text-danger">
                  {uploadError}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
