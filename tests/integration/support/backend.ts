import { setupServer } from 'msw/node'

// Backend NestJS simulé. Aucune route par défaut : chaque test déclare
// exactement les réponses dont il a besoin avec backend.use(...).
export const backend = setupServer()

// Même valeur que test.env dans vitest.config.mts.
export const API_URL = 'http://api.test'

export function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

export function validToken(sub = 'athlete-1'): string {
  return makeJwt({ sub, role: 'ATHLETE', email: 'athlete@test.dev', exp: Math.floor(Date.now() / 1000) + 3600 })
}
