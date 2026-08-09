'use client'

import { useSyncExternalStore } from 'react'
import type { CorosActivity } from './mock-data'
import type { UploadedActivity } from './types'

// Petit store en mémoire pour l'état qui doit survivre à la navigation
// client entre pages (unité préférée, activité vient d'être uploadée).
//
// lastUpload : démo COROS (pas d'accès à l'API COROS pour l'instant, données
// mock — sera remplacé par un vrai fetch quand l'accès sera disponible).
// lastRealUpload : résultat réel de POST /activities/upload (.fit/.gpx).
// Les deux sont mutuellement exclusifs — confirmer l'un efface l'autre.

interface SessionState {
  unit: 'km' | 'mi'
  uploaded: boolean
  lastUpload: CorosActivity | null
  lastRealUpload: UploadedActivity | null
  lastUploadGpx: string | null
}

let state: SessionState = {
  unit: 'km',
  uploaded: false,
  lastUpload: null,
  lastRealUpload: null,
  lastUploadGpx: null,
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function setUnit(unit: 'km' | 'mi') {
  state = { ...state, unit }
  emit()
}

export function confirmUpload(activity: CorosActivity) {
  state = { ...state, uploaded: true, lastUpload: activity, lastRealUpload: null, lastUploadGpx: null }
  emit()
}

export function confirmRealUpload(activity: UploadedActivity, gpxData: string | null = null) {
  state = { ...state, uploaded: true, lastUpload: null, lastRealUpload: activity, lastUploadGpx: gpxData }
  emit()
}

// Reflète localement le résultat d'un PATCH /activities/:id réussi (édition
// a posteriori de la note athlète / difficulté).
export function patchLastRealUpload(patch: Partial<Pick<UploadedActivity, 'athleteNote' | 'difficultyNote'>>) {
  if (!state.lastRealUpload) return
  state = { ...state, lastRealUpload: { ...state.lastRealUpload, ...patch } }
  emit()
}

export function useSessionState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
