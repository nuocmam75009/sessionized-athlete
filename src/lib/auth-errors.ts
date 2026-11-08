// Traduction des refus de l'API (en français) en messages de l'interface (en
// anglais), dans les routes /api/auth/* : le navigateur ne reçoit jamais que
// des messages que l'app maîtrise.
//
// Deux familles de refus restent volontairement génériques, pour ne pas
// révéler quels comptes existent : identifiants invalides à la connexion, et
// email déjà utilisé à l'inscription. Les autres donnent leur raison, comme le
// demande la CNIL pour la politique de mots de passe (délibération
// n° 2022-100, § 36) : un refus sans explication pousse à un mot de passe
// plus faible, ou à l'abandon.

export interface AuthFailure {
  message: string
  // Raisons détaillées d'un mot de passe refusé à l'inscription.
  reasons?: string[]
}

// Débuts des messages de la politique de mots de passe de l'API
// (src/auth/password-policy.ts, PASSWORD_ISSUE_MESSAGES).
const PASSWORD_ISSUES: Array<{ apiPrefix: string; reason: string }> = [
  {
    apiPrefix: 'Mot de passe trop faible',
    reason:
      'Too weak: use at least 8 characters mixing 3 of uppercase, lowercase, digits and symbols, or a passphrase of at least 5 words, or at least 16 digits.',
  },
  {
    apiPrefix: 'Mot de passe trop courant',
    reason: 'Too common or predictable (a common word followed by digits, a sequence or a repetition).',
  },
  {
    apiPrefix: 'Le mot de passe ne doit contenir',
    reason: 'It must not contain your name, your email address or the name of the service.',
  },
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

function tooManyAttempts(body: unknown, retryAfterHeader: string | null): AuthFailure {
  const minutes = retryAfterMinutes(body, retryAfterHeader)
  return {
    message:
      minutes === null
        ? 'Too many attempts. Wait a few minutes before trying again.'
        : `Too many attempts. Try again in ${minutes} min.`,
  }
}

export function loginFailure(status: number, body: unknown, retryAfterHeader: string | null): AuthFailure {
  if (status === 429) return tooManyAttempts(body, retryAfterHeader)
  return { message: 'Invalid credentials' }
}

export function registerFailure(status: number, body: unknown, retryAfterHeader: string | null): AuthFailure {
  if (status === 429) return tooManyAttempts(body, retryAfterHeader)
  if (status === 400) {
    const messages = apiMessages(body)
    const reasons = PASSWORD_ISSUES.filter(({ apiPrefix }) => messages.some((m) => m.includes(apiPrefix))).map(
      ({ reason }) => reason,
    )
    if (reasons.length > 0) return { message: 'Choose another password.', reasons }
  }
  return { message: 'Registration failed' }
}
