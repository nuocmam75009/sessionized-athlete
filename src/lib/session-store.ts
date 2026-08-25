'use client'

import { useSyncExternalStore } from 'react'

// Petit store en mémoire pour l'état qui doit survivre à la navigation
// client entre pages — pour l'instant juste la préférence d'unité.

interface SessionState {
  unit: 'km' | 'mi'
}

let state: SessionState = {
  unit: 'km',
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

export function useSessionState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
