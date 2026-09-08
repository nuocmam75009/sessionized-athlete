'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { formatPace } from '@/lib/utils'
import { Specialty } from '@/lib/types'
import type { AthleteProfile, AthleteProfileUpdate } from '@/lib/types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SPECIALTY_LABELS: Record<Specialty, string> = {
  [Specialty.TRAIL]: 'Trail',
  [Specialty.ULTRA_TRAIL]: 'Ultra-trail',
  [Specialty.MIDDLE_DISTANCE_TRACK]: 'Middle distance (track)',
  [Specialty.LONG_DISTANCE_TRACK]: 'Long distance (track)',
  [Specialty.MIDDLE_DISTANCE_ROAD]: 'Middle distance (road)',
  [Specialty.LONG_DISTANCE_ROAD]: 'Long distance (road)',
}

function ZoneRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.08em] text-text/50 mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <div key={i} className="metric min-w-14 px-3 py-1.5 text-[13px] text-center panel-flat rounded-md">
            {v}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AthleteDataView({ athleteProfile }: { athleteProfile: AthleteProfile | null }) {
  const [age, setAge] = useState(athleteProfile?.age?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(athleteProfile?.weightKg?.toString() ?? '')
  const [heightCm, setHeightCm] = useState(athleteProfile?.heightCm?.toString() ?? '')
  const [bmr, setBmr] = useState(athleteProfile?.basalMetabolicRateKcal?.toString() ?? '')
  const [specialty, setSpecialty] = useState<string>(athleteProfile?.specialty ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  async function save() {
    setSaveState('saving')

    const body: AthleteProfileUpdate = {
      age: age.trim() === '' ? undefined : Number(age),
      weightKg: weightKg.trim() === '' ? undefined : Number(weightKg),
      heightCm: heightCm.trim() === '' ? undefined : Number(heightCm),
      basalMetabolicRateKcal: bmr.trim() === '' ? undefined : Number(bmr),
      specialty: specialty === '' ? undefined : (specialty as Specialty),
    }

    try {
      const res = await fetch('/api/users/me/athlete-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSaveState(res.ok ? 'saved' : 'error')
    } catch {
      setSaveState('error')
    }
  }

  return (
    <div>
      <h1>Athlete Data</h1>
      <p className="text-text/50 mt-2 max-w-[52ch]">
        These physiological details help your coach fine-tune your sessions — target zones, load, recovery.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="grid gap-3 max-w-[420px] mt-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age" htmlFor="ad-age">
            <Input id="ad-age" type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Weight (kg)" htmlFor="ad-weight">
            <Input
              id="ad-weight"
              type="number"
              step="0.1"
              min={20}
              max={300}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)" htmlFor="ad-height">
            <Input
              id="ad-height"
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </Field>
          <Field label="Basal metabolic rate (kcal)" htmlFor="ad-bmr">
            <Input id="ad-bmr" type="number" min={500} max={5000} value={bmr} onChange={(e) => setBmr(e.target.value)} />
          </Field>
        </div>

        <Field label="Specialty" htmlFor="ad-specialty">
          <Select id="ad-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="">—</option>
            {Object.values(Specialty).map((value) => (
              <option key={value} value={value}>
                {SPECIALTY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-3 mt-2">
          <Button type="submit" className="w-fit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save changes'}
          </Button>
          {saveState === 'saved' && <span className="text-sm text-success">Saved.</span>}
          {saveState === 'error' && <span className="text-sm text-danger">Échec de l&apos;enregistrement.</span>}
        </div>
      </form>

      {athleteProfile && (athleteProfile.heartRateZonesBpm.length > 0 || athleteProfile.paceZonesSecPerKm.length > 0) && (
        <div className="grid gap-4 max-w-[420px] mt-8 pt-6 border-t border-divider">
          <div className="text-[10px] uppercase tracking-[0.14em] text-accent font-semibold">Synced from Strava</div>
          {athleteProfile.heartRateZonesBpm.length > 0 && (
            <ZoneRow label="Heart rate zones (bpm)" values={athleteProfile.heartRateZonesBpm.map(String)} />
          )}
          {athleteProfile.paceZonesSecPerKm.length > 0 && (
            <ZoneRow label="Pace zones" values={athleteProfile.paceZonesSecPerKm.map(formatPace)} />
          )}
        </div>
      )}
    </div>
  )
}
