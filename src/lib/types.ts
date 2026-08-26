export type Role = 'ATHLETE' | 'COACH'
export type ActivitySource = 'FIT' | 'COROS' | 'STRAVA'
export type WarningSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type WarningFamily = 'INTENSITY' | 'LOAD' | 'PATTERN' | 'RECOVERY'
export type HeartRateZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'

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

// Fidèle au model Prisma Activity — voir sessionized-api/prisma/schema.prisma.
export interface Activity {
  id: string
  athleteId: string
  source: ActivitySource
  sport: string | null
  subSport: string | null
  startedAt: string
  totalDistanceM: number
  totalDurationSec: number
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgCadence: number | null
  avgPower: number | null
  totalCalories: number | null
  elevationGainM: number | null
  elevationLossM: number | null
  athleteNote: string | null
  difficultyNote: number | null
  workoutId: string | null
  laps: Lap[]
}

// Fidèle au model Prisma Lap.
export interface Lap {
  id: string
  activityId: string
  index: number
  distanceM: number
  durationSec: number
  avgPaceSecPerKm: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgCadence: number | null
  avgPower: number | null
  avgStanceTimeMs: number | null
  avgVerticalOscillationMm: number | null
  avgVerticalRatio: number | null
  avgStepLengthMm: number | null
}

// Réponse de POST /activities/upload : l'Activity créée + le compteur de
// points GPS (calculé à l'upload, jamais stocké/renvoyé par les autres
// endpoints activités).
export type UploadedActivity = Activity & { trackPointsCount: number }

// Corps accepté par PATCH /activities/:id — les deux champs sont
// indépendants, n'envoyer que celui qu'on modifie.
export interface ActivityNoteUpdate {
  athleteNote?: string
  difficultyNote?: number
}

// Réponse de GET /activities/:id/track — un point par seconde, chargé à
// part de UploadedActivity pour ne pas alourdir la réponse d'upload/detail.
export interface TrackPoint {
  id: string
  activityId: string
  timestamp: string
  elapsedSec: number
  distanceM: number | null
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  heartRate: number | null
  cadence: number | null
  power: number | null
  speedMPerSec: number | null
}

// Réponse de GET /activities/:id/route — tracé importé via POST
// /activities/:id/gpx, complémentaire au .fit (pas de physio, juste la carte).
export interface RoutePointRecord {
  id: string
  activityId: string
  timestamp: string | null
  latitude: number
  longitude: number
  altitudeM: number | null
}

// Réponse de POST /activities/:id/gpx.
export interface UploadGpxResult {
  activityId: string
  routePointsCount: number
}

// Réponse de GET /strava/activities — activités Strava récentes de
// l'athlète, pour choisir laquelle importer (voir POST /strava/activities/:id/import).
export interface StravaActivitySummary {
  stravaActivityId: string
  name: string
  sportType: string
  startedAt: string
  distanceM: number
  durationSec: number
  elevationGainM: number
  alreadyImported: boolean
}

// Réponse de POST /strava/activities/:id/import.
export interface StravaImportResult {
  activityId: string
  lapsCount: number
  trackPointsCount: number
}

// Fidèle au model Prisma WorkoutLap.
export interface WorkoutLap {
  id: string
  workoutId: string
  index: number
  targetDistanceM: number | null
  targetPaceSecPerKm: number | null
  targetDurationSec: number | null
  targetHeartRateZone: HeartRateZone | null
}

// Fidèle au model Prisma Workout — remplace l'ancien PlannedSession depuis la
// réorganisation coach/plan/workout/activity (un Plan par athlète, N Workout
// par Plan). GET /workouts renvoie une liste à plat, pas groupée par plan.
export interface Workout {
  id: string
  planId: string
  title: string
  scheduledDate: string
  coachNote: string | null
  targetDistanceM: number | null
  targetDurationSec: number | null
  targetHeartRateZone: HeartRateZone | null
  laps: WorkoutLap[]
  createdAt: string
  updatedAt: string
}

// Fidèle au model Prisma Warning.
export interface Warning {
  id: string
  activityId: string
  family: WarningFamily
  severity: WarningSeverity
  message: string
  suggestion: string | null
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
