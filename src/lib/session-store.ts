'use client'

import { useSyncExternalStore } from 'react'
import type { CorosActivity } from './mock-data'

// Petit store en mémoire pour l'état qui doit survivre à la navigation
// client entre pages (unité préférée, activité vient d'être uploadée).
// À remplacer par les données renvoyées par l'API une fois branchée.

interface SessionState {
  unit: 'km' | 'mi'
  uploaded: boolean
  lastUpload: CorosActivity | null
  lastUploadGpx: string | null
}

let state: SessionState = {
  unit: 'km',
  uploaded: false,
  lastUpload: null,
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

export function confirmUpload(activity: CorosActivity, gpxData: string | null = null) {
  state = { ...state, uploaded: true, lastUpload: activity, lastUploadGpx: gpxData }
  emit()
}

export function useSessionState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
