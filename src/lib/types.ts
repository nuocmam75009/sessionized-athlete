export type Role = 'ATHLETE' | 'COACH'
export type ActivitySource = 'FIT' | 'COROS'
export type WarningSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type WarningType = 'INTENSITY' | 'LOAD' | 'PATTERN' | 'RECOVERY'
export type SessionType = 'INTERVALS' | 'TEMPO' | 'EASY' | 'LONG' | 'RACE' | 'OTHER'

export interface User {
  id: string
  email: string
  role: Role
}

// Shape réelle du `user` renvoyé par POST /auth/login et /auth/register —
// dérivé du JWT (sub, pas id).
export interface AuthUser {
  sub: string
  email: string
  role: Role
}

// Réponse de GET/PATCH /users/me — surperset de User avec les champs
// réellement exposés par cet endpoint.
export interface UserProfile extends User {
  firstName: string | null
  lastName: string | null
  createdAt: string
}

// Réponse de GET /users/me/coach — 404 si aucun coach n'est encore assigné.
export interface CoachAssignment {
  id: string
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

export interface AthleteProfile {
  id: string
  userId: string
  coachId?: string
  ftp?: number
  vo2max?: number
  maxHr?: number
}

export interface Activity {
  id: string
  athleteId: string
  plannedSessionId?: string
  source: ActivitySource
  startedAt: string
  durationS: number
  distanceM: number
  avgPaceSecPerKm: number
  avgHr?: number
  tss?: number
  laps: Lap[]
  warnings: Warning[]
}

export interface Lap {
  id: string
  activityId: string
  lapIndex: number
  distanceM: number
  paceSecPerKm: number
  avgHr?: number
  maxHr?: number
  cadence?: number
  power?: number
  source: ActivitySource
}

export interface UploadedActivityLap {
  index: number
  distanceM: number
  durationSec: number
  avgPaceSecPerKm: number
  avgHeartRate?: number
  maxHeartRate?: number
  avgCadence?: number
  avgPower?: number
  avgStanceTimeMs?: number
  avgVerticalOscillationMm?: number
  avgVerticalRatio?: number
  avgStepLengthMm?: number
}

// Réponse de POST /activities/upload — shape réel de l'endpoint, distinct de
// Activity/Lap ci-dessus qui restent la spec cible partagée avec le coach.
export interface UploadedActivity {
  id: string
  athleteId: string
  source: ActivitySource
  sport: string
  subSport: string
  startedAt: string
  totalDistanceM: number
  totalDurationSec: number
  avgHeartRate?: number
  maxHeartRate?: number
  avgCadence?: number
  avgPower?: number
  totalCalories?: number
  elevationGainM: number
  elevationLossM: number
  plannedSessionId: string | null
  laps: UploadedActivityLap[]
  trackPointsCount: number
  coachNote: string | null
  athleteNote: string | null
  difficultyNote: number | null
}

// Corps accepté par PATCH /activities/:id — les deux champs sont
// indépendants, n'envoyer que celui qu'on modifie.
export interface ActivityNoteUpdate {
  athleteNote?: string
  difficultyNote?: number
}

export interface PlannedLap {
  id: string
  sessionId: string
  lapIndex: number
  distanceM: number
  targetPaceMin: number   // sec/km
  targetPaceMax: number   // sec/km
  targetHrMin?: number
  targetHrMax?: number
}

export interface PlannedSession {
  id: string
  athleteId: string
  coachId: string
  scheduledAt: string
  type: SessionType
  title: string
  notes?: string
  laps: PlannedLap[]
}

export interface Warning {
  id: string
  activityId: string
  lapId?: string
  athleteId: string
  type: WarningType
  severity: WarningSeverity
  message: string
  detail: string
  suggestion: string
  seenByAthlete: boolean
  seenByCoach: boolean
  createdAt: string
}

export interface TrainingLoad {
  id: string
  athleteId: string
  date: string
  ctl: number
  atl: number
  tsb: number
  weeklyTss: number
}

// --- Chat (namespace WebSocket /chat + REST /chat/conversations) ---
// `id` sur ChatUserSummary n'est pas listé explicitement dans le contrat
// fourni (seulement firstName/lastName/email) mais est nécessaire pour
// `recipientUserId` côté `typing` — supposé présent comme tout autre objet
// user renvoyé par l'API. À corriger si le champ réel diffère.
export interface ChatUserSummary {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
}

export interface ChatConversation {
  id: string
  coach: {
    id: string // coachProfileId — c'est le targetId attendu par POST /chat/conversations
    user: ChatUserSummary
  }
  messages: ChatMessage[] // messages[0] = dernier message (aperçu liste)
  updatedAt: string
}
