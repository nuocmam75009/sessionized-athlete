// Données de démonstration — à remplacer par des appels apiFetch() vers
// sessionized-api une fois les endpoints /plan, /activities disponibles.

export type WorkoutStatus = 'completed' | 'today' | 'upcoming' | 'rest'

export interface WorkoutSegment {
  name: string
  detail: string
  target: string
}

export interface WorkoutActual {
  distance: string
  duration: string
  pace: string
  note: string
}

export interface WorkoutDay {
  id: string
  day: string
  date: string
  title: string
  type: 'rest' | 'session'
  status: WorkoutStatus
  distance: string
  duration: string
  targetZone: string
  segments: WorkoutSegment[]
  coachNote: string
  actual: WorkoutActual | null
}

export interface CorosActivity {
  id: string
  date: string
  title: string
  distance: string
  duration: string
  pace: string
  hr: string
  elevation: string
}

export interface PastEntry {
  date: string
  title: string
  planned: string
  actual: string
  status: WorkoutStatus
}

export const WEEK: WorkoutDay[] = [
  { id: 'mon', day: 'Monday', date: 'Aug 3', title: 'Rest', type: 'rest', status: 'rest', distance: '—', duration: '—', targetZone: '—', segments: [], coachNote: '', actual: null },
  {
    id: 'tue', day: 'Tuesday', date: 'Aug 4', title: '6×800m @ 5k pace', type: 'session', status: 'completed',
    distance: '9.6km', duration: '48min', targetZone: '3:00/rep · HR 172–178',
    segments: [
      { name: 'Warm-up', detail: '15min easy', target: 'Zone 1–2' },
      { name: 'Work', detail: '6×800m @ 5k pace', target: '3:00/rep · HR 172–178' },
      { name: 'Recovery', detail: "2' jog between reps", target: 'Zone 1' },
      { name: 'Cool-down', detail: '10min easy', target: 'Zone 1' },
    ],
    coachNote: '5k pace means controlled, not all-out. Even splits across all six.',
    actual: { distance: '9.8km', duration: '51min', pace: '3:11/rep avg', note: 'Reps drifted from 3:02 to 3:11 — slightly positive split. Good enough to build on.' },
  },
  {
    id: 'wed', day: 'Wednesday', date: 'Aug 5', title: '10km easy', type: 'session', status: 'completed',
    distance: '10km', duration: '55min', targetZone: 'Zone 1–2',
    segments: [{ name: 'Easy run', detail: '10km continuous', target: '5:30/km · Zone 1–2' }],
    coachNote: 'Conversational pace. This is recovery, not training.',
    actual: { distance: '10.2km', duration: '57min', pace: '5:35/km', note: 'Right in zone the whole way.' },
  },
  { id: 'thu', day: 'Thursday', date: 'Aug 6', title: 'Rest', type: 'rest', status: 'rest', distance: '—', duration: '—', targetZone: '—', segments: [], coachNote: '', actual: null },
  {
    id: 'fri', day: 'Friday', date: 'Aug 7', title: 'Threshold intervals', type: 'session', status: 'today',
    distance: '10.5km', duration: '50min', targetZone: '4:15/km · HR 165–172',
    segments: [
      { name: 'Warm-up', detail: '15min easy + 4×20s strides', target: 'Zone 1–2' },
      { name: 'Work', detail: '3×8min @ threshold', target: '4:15/km · HR 165–172' },
      { name: 'Recovery', detail: '3min jog between reps', target: 'Zone 1' },
      { name: 'Cool-down', detail: '10min easy', target: 'Zone 1' },
    ],
    coachNote: "Hold pace even across all three reps. If rep 3 fades, stop there — don't force a 4th.",
    actual: null,
  },
  {
    id: 'sat', day: 'Saturday', date: 'Aug 8', title: '16km long run', type: 'session', status: 'upcoming',
    distance: '16km', duration: '1h32', targetZone: 'Zone 2, neg. split last 4km',
    segments: [
      { name: 'Steady', detail: '12km', target: 'Zone 2' },
      { name: 'Push', detail: 'Final 4km', target: 'Zone 3, negative split' },
    ],
    coachNote: "Save something for the last 4km — that's the point of the session.",
    actual: null,
  },
  {
    id: 'sun', day: 'Sunday', date: 'Aug 9', title: '5km recovery + drills', type: 'session', status: 'upcoming',
    distance: '5km', duration: '30min', targetZone: 'Zone 1',
    segments: [
      { name: 'Jog', detail: '5km easy', target: 'Zone 1' },
      { name: 'Drills', detail: '4×A-skip, 4×high knees', target: 'Form focus' },
    ],
    coachNote: 'Loose and light. Shake yesterday out of your legs.',
    actual: null,
  },
]

export const COROS_ACTIVITIES: CorosActivity[] = [
  { id: 'c1', date: 'Aug 7', title: 'Morning run', distance: '10.6km', duration: '49:32', pace: '4:41/km', hr: '168bpm', elevation: '62m' },
  { id: 'c2', date: 'Aug 5', title: 'Easy run', distance: '10.2km', duration: '57:04', pace: '5:35/km', hr: '142bpm', elevation: '38m' },
  { id: 'c3', date: 'Aug 4', title: 'Track intervals', distance: '9.8km', duration: '51:10', pace: '3:11/rep', hr: '175bpm', elevation: '12m' },
  { id: 'c4', date: 'Aug 1', title: 'Long run', distance: '18.3km', duration: '1:44:20', pace: '5:42/km', hr: '150bpm', elevation: '210m' },
  { id: 'c5', date: 'Jul 29', title: 'Easy run', distance: '8.1km', duration: '45:50', pace: '5:39/km', hr: '138bpm', elevation: '22m' },
]

export const PAST: PastEntry[] = [
  { date: 'Aug 2', title: 'Recovery 5km', planned: '5km · Zone 1', actual: '5.1km', status: 'completed' },
  { date: 'Aug 1', title: 'Long run 18km', planned: '18km · Zone 2', actual: '18.3km', status: 'completed' },
  { date: 'Jul 31', title: '12km steady', planned: '12km · Zone 2', actual: '12km', status: 'completed' },
  { date: 'Jul 30', title: 'Rest', planned: '—', actual: '—', status: 'rest' },
  { date: 'Jul 29', title: 'Easy 8km', planned: '8km · Zone 1', actual: '8.1km', status: 'completed' },
  { date: 'Jul 28', title: '5×1000m @ 10k pace', planned: '5×1000m', actual: '5×1000m', status: 'completed' },
  { date: 'Jul 27', title: 'Rest', planned: '—', actual: '—', status: 'rest' },
]

export function tagVariant(status: WorkoutStatus): 'accent' | 'accent-2' | 'neutral' | 'outline' {
  if (status === 'completed') return 'accent'
  if (status === 'today') return 'accent-2'
  if (status === 'rest') return 'neutral'
  return 'outline'
}

export function labelFor(status: WorkoutStatus): string {
  if (status === 'completed') return 'Completed'
  if (status === 'today') return 'Today'
  if (status === 'rest') return 'Rest'
  return 'Upcoming'
}

export function getTodayWorkout(): WorkoutDay {
  return WEEK.find((w) => w.status === 'today')!
}

export function getWorkout(id: string): WorkoutDay | undefined {
  return WEEK.find((w) => w.id === id)
}
