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
