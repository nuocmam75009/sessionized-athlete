// Traduction des refus de l'API (en français) en messages de l'interface,
// dans la langue de l'athlète, par les routes /api/auth/* : le navigateur ne
// reçoit jamais que des messages que l'app maîtrise.
//
// Deux familles de refus restent volontairement génériques, pour ne pas
// révéler quels comptes existent : identifiants invalides à la connexion, et
// email déjà utilisé à l'inscription. Les autres donnent leur raison, comme le
// demande la CNIL pour la politique de mots de passe (délibération
// n° 2022-100, § 36) : un refus sans explication pousse à un mot de passe
// plus faible, ou à l'abandon.

import type { NextRequest } from 'next/server'
import { LOCALE_COOKIE_NAME, resolveLocale, type Locale } from './i18n/config'
import { getDictionary, type Dictionary } from './i18n/dictionaries'

export interface AuthFailure {
  message: string
  // Raisons détaillées d'un mot de passe refusé à l'inscription.
  reasons?: string[]
}

// Langue d'une requête vers /api/auth/* : même règle que pour les pages
// (cookie de langue, puis Accept-Language), lue sur la requête elle-même.
export function requestLocale(request: NextRequest): Locale {
  return resolveLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value, request.headers.get('accept-language'))
}

// Débuts des messages de la politique de mots de passe de l'API
// (src/auth/password-policy.ts, PASSWORD_ISSUE_MESSAGES).
const PASSWORD_ISSUES: Array<{ apiPrefix: string; reason: (t: Dictionary) => string }> = [
  { apiPrefix: 'Mot de passe trop faible', reason: (t) => t.auth.api.passwordTooWeak },
  { apiPrefix: 'Mot de passe trop courant', reason: (t) => t.auth.api.passwordTooCommon },
  { apiPrefix: 'Le mot de passe ne doit contenir', reason: (t) => t.auth.api.passwordPersonal },
]

function apiMessages(body: unknown): string[] {
  const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined
  if (typeof message === 'string') return [message]
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string')
  return []
}

// Délai avant de pouvoir réessayer : corps de la réponse (verrouillage du
// compte) ou en-tête Retry-After (limite par IP).
function retryAfterMinutes(body: unknown, retryAfterHeader: string | null): number | null {
  const fromBody =
    body && typeof body === 'object' && 'retryAfterSec' in body && typeof body.retryAfterSec === 'number'
      ? body.retryAfterSec
      : null
  const seconds = fromBody ?? (retryAfterHeader ? Number(retryAfterHeader) : NaN)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : null
}

function tooManyAttempts(body: unknown, retryAfterHeader: string | null, t: Dictionary): AuthFailure {
  const minutes = retryAfterMinutes(body, retryAfterHeader)
  return {
    message: minutes === null ? t.auth.api.tooManyAttempts : t.auth.api.tooManyAttemptsRetryIn(minutes),
  }
}

export function loginFailure(
  status: number,
  body: unknown,
  retryAfterHeader: string | null,
  locale: Locale,
): AuthFailure {
  const t = getDictionary(locale)
  if (status === 429) return tooManyAttempts(body, retryAfterHeader, t)
  return { message: t.auth.api.invalidCredentials }
}

export function registerFailure(
  status: number,
  body: unknown,
  retryAfterHeader: string | null,
  locale: Locale,
): AuthFailure {
  const t = getDictionary(locale)
  if (status === 429) return tooManyAttempts(body, retryAfterHeader, t)
  if (status === 400) {
    const messages = apiMessages(body)
    const reasons = PASSWORD_ISSUES.filter(({ apiPrefix }) => messages.some((m) => m.includes(apiPrefix))).map(
      ({ reason }) => reason(t),
    )
    if (reasons.length > 0) return { message: t.auth.api.choosePassword, reasons }
  }
  return { message: t.auth.api.registrationFailed }
}
