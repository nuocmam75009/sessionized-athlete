export type Role = 'ATHLETE' | 'COACH'
export type ActivitySource = 'FIT' | 'COROS' | 'STRAVA'
export type WarningSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type WarningFamily = 'INTENSITY' | 'LOAD' | 'PATTERN' | 'RECOVERY'
export type HeartRateZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
// Intensité d'un lap, telle qu'écrite par la montre dans le fichier .fit.
// Toujours null sur un lap venu de Strava : leur API ne l'expose pas.
export type LapIntensity = 'ACTIVE' | 'REST' | 'WARMUP' | 'COOLDOWN' | 'RECOVERY' | 'INTERVAL' | 'OTHER'
// Étiquettes de l'activité, déduites de Strava. Une activité peut en porter
// plusieurs (une sortie longue au seuil est WORKOUT + LONG_RUN), et un tableau
// vide est normal — ce n'est pas une erreur.
export type ActivityLabel = 'RACE' | 'LONG_RUN' | 'WORKOUT' | 'RECOVERY'

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
  athleteProfile: AthleteProfile | null
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

// Fidèle au model Prisma AthleteProfile — voir sessionized-api/prisma/schema.prisma.
// Sous-objet de UserProfile (GET/PATCH /users/me), pas une réponse à part.
export interface AthleteProfile {
  id: string
  coachId: string | null
  // Remplis par l'athlète lui-même (voir AthleteProfileUpdate).
  age: number | null
  weightKg: number | null
  heightCm: number | null
  basalMetabolicRateKcal: number | null
  specialty: Specialty | null
  // Synchronisées depuis Strava (StravaService.syncZones) — lecture seule,
  // jamais éditées depuis le front.
  heartRateZonesBpm: number[]
  paceZonesSecPerKm: number[]
}

// Corps accepté par PATCH /users/me/athlete-profile — tous les champs sont
// indépendants, n'envoyer que ceux qu'on modifie (voir UpdateAthleteProfileDto
// côté backend, qui n'accepte plus heartRateZonesBpm/paceZonesSecPerKm :
// ces zones viennent uniquement de la sync Strava).
export interface AthleteProfileUpdate {
  age?: number
  weightKg?: number
  heightCm?: number
  basalMetabolicRateKcal?: number
  specialty?: Specialty
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
  // Fichiers rattachés. Le .fit peut arriver après coup sur une activité
  // importée de Strava (POST /activities/:id/fit) et remplace alors ses laps.
  hasFitFile: boolean
  hasGpxFile: boolean
  labels: ActivityLabel[]
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
  intensity: LapIntensity | null
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

// --- Charge d'entraînement (GET /training-load) ---
// Toutes ces valeurs sont des estimations : la charge d’une séance est
// déduite du temps passé dans chaque zone FC, à défaut du ressenti déclaré,
// à défaut de la seule durée. `sourceCounts` dit dans quelle proportion —
// une série majoritairement DURATION ne se lit pas comme une série mesurée.
export type TrainingLoadSource = 'HEART_RATE' | 'PERCEIVED' | 'DURATION'

export interface TrainingLoadPoint {
  // Jour civil UTC, format YYYY-MM-DD.
  date: string
  load: number
  // Condition (moyenne exponentielle 42 jours).
  ctl: number
  // Fatigue (moyenne exponentielle 7 jours).
  atl: number
  // Fraîcheur = CTL - ATL de la veille.
  tsb: number
  // false tant que la CTL n'a pas 42 jours d'historique derrière elle : elle
  // part de zéro et sous-estime alors la condition.
  settled: boolean
}

export interface TrainingLoadSeries {
  from: string
  to: string
  points: TrainingLoadPoint[]
  current: {
    date: string
    ctl: number
    atl: number
    tsb: number
    settled: boolean
  }
  weeklyLoad: number
  // Variation de CTL sur sept jours — la vitesse de montée en charge.
  rampRate: number
  sourceCounts: Record<TrainingLoadSource, number>
  activityCount: number
}

// --- Réponse aérobie (GET /activities/:id/analysis) ---
// Indicateurs qui n'ont de sens que sur un effort régulier : hors de ces
// conditions la réponse est `{ eligible: false, reason }` — ce n’est pas une
// erreur, il n’y a simplement rien à calculer.
export type AerobicRejection = 'NO_HEART_RATE' | 'NO_SPEED' | 'TOO_SHORT' | 'VARIABLE_EFFORT'
export type DecouplingRating = 'GOOD' | 'MODERATE' | 'HIGH'

export interface AerobicHalf {
  durationSec: number
  avgSpeedMPerSec: number
  avgPaceSecPerKm: number
  avgHeartRate: number
  efficiencyFactor: number
}

export interface AerobicAnalysisResult {
  eligible: true
  // Mètres par minute et par battement : monte quand l’athlète va plus vite à
  // FC égale.
  efficiencyFactor: number
  // Perte d’efficacité de la seconde moitié par rapport à la première, en %.
  decouplingPct: number
  rating: DecouplingRating
  first: AerobicHalf
  second: AerobicHalf
  analyzedFromSec: number
  analyzedDurationSec: number
  elevationGainMPerKm: number | null
  // false en terrain vallonné : tant que l’allure n’est pas corrigée de la
  // pente, le découplage n’y est pas interprétable.
  terrainReliable: boolean
}

export type AerobicAnalysis =
  | { eligible: false; reason: AerobicRejection }
  | AerobicAnalysisResult

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

// Valeurs = noms des membres : un enum numérique par défaut sérialise
// Specialty.TRAIL en 0, alors que le backend (AthleteSpecialty côté Prisma)
// attend la chaîne "TRAIL" dans le JSON.
export enum Specialty {
  TRAIL = 'TRAIL',
  ULTRA_TRAIL = 'ULTRA_TRAIL',
  MIDDLE_DISTANCE_TRACK = 'MIDDLE_DISTANCE_TRACK',
  LONG_DISTANCE_TRACK = 'LONG_DISTANCE_TRACK',
  MIDDLE_DISTANCE_ROAD = 'MIDDLE_DISTANCE_ROAD',
  LONG_DISTANCE_ROAD = 'LONG_DISTANCE_ROAD',
}

// --- Répartition du temps par zone (GET /activities/hr-zones) ---
// Forme volontairement générique (min/max/unit plutôt que minBpm/maxBpm) : un
// futur GET /activities/pace-zones renverra la même structure en
// unit "sec_per_km", et alimentera le même composant graphique.
export type ZoneUnit = 'bpm' | 'sec_per_km'

export interface ZoneBucket {
  index: number
  label: string
  min: number
  // null = zone haute ouverte (pas de plafond).
  max: number | null
  seconds: number
}

export interface ZoneDistribution {
  from: string
  to: string
  unit: ZoneUnit
  // Vide quand l'athlète n'a pas de zones synchronisées : ce n'est pas une
  // erreur, les compteurs ci-dessous restent renseignés.
  zones: ZoneBucket[]
  // Somme des zones = temps effectivement mesuré avec un capteur FC. Les
  // pourcentages se calculent là-dessus, pas sur le temps total d'activité.
  totalSeconds: number
  secondsWithoutData: number
  activityCount: number
  activitiesWithDataCount: number
}
