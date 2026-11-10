'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import { formatPace } from '@/lib/utils'
import { Specialty } from '@/lib/types'
import type { AthleteProfile, AthleteProfileUpdate } from '@/lib/types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function ZoneRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.08em] text-text/60 mb-2">{label}</span>
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

export function AthleteDataView({
  athleteProfile,
  loadFailed,
}: {
  athleteProfile: AthleteProfile | null
  loadFailed: boolean
}) {
  const { t } = useI18n()
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
      const res = await clientFetch('/api/users/me/athlete-profile', {
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
      <h1>{t.athleteData.title}</h1>
      <p className="text-text/60 mt-2 max-w-[52ch]">
        {t.athleteData.intro}
      </p>
      {/* Sans ce message, un échec de chargement se lirait comme un profil
          jamais rempli. */}
      {loadFailed && (
        <p role="alert" className="text-danger mt-4">
          {t.athleteData.loadFailed}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="grid gap-3 max-w-[420px] mt-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.athleteData.age} htmlFor="ad-age">
            <Input id="ad-age" type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label={t.athleteData.weight} htmlFor="ad-weight">
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
          <Field label={t.athleteData.height} htmlFor="ad-height">
            <Input
              id="ad-height"
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </Field>
          <Field label={t.athleteData.bmr} htmlFor="ad-bmr">
            <Input id="ad-bmr" type="number" min={500} max={5000} value={bmr} onChange={(e) => setBmr(e.target.value)} />
          </Field>
        </div>

        <Field label={t.athleteData.specialty} htmlFor="ad-specialty">
          <Select id="ad-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="">—</option>
            {Object.values(Specialty).map((value) => (
              <option key={value} value={value}>
                {t.athleteData.specialties[value]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-3 mt-2">
          <Button type="submit" className="w-fit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? t.common.saving : t.common.saveChanges}
          </Button>
          {saveState === 'saved' && (
            <span role="status" className="text-sm text-success">
              {t.common.saved}
            </span>
          )}
          {saveState === 'error' && (
            <span role="alert" className="text-sm text-danger">
              {t.common.saveChangesFailed}
            </span>
          )}
        </div>
      </form>

      {athleteProfile && (athleteProfile.heartRateZonesBpm.length > 0 || athleteProfile.paceZonesSecPerKm.length > 0) && (
        <div className="grid gap-4 max-w-[420px] mt-8 pt-6 border-t border-divider">
          <div className="text-[10px] uppercase tracking-[0.14em] text-accent font-semibold">
            {t.athleteData.syncedFromStrava}
          </div>
          {athleteProfile.heartRateZonesBpm.length > 0 && (
            <ZoneRow label={t.athleteData.heartRateZones} values={athleteProfile.heartRateZonesBpm.map(String)} />
          )}
          {athleteProfile.paceZonesSecPerKm.length > 0 && (
            <ZoneRow label={t.athleteData.paceZones} values={athleteProfile.paceZonesSecPerKm.map(formatPace)} />
          )}
        </div>
      )}
    </div>
  )
}
