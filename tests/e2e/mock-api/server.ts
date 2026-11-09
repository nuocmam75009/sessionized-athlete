import { createHash, randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

// API NestJS simulée pour les tests système du front : mêmes routes, mêmes
// formes de réponse et mêmes messages d'erreur que sessionized-api, sur des
// données en mémoire. Elle fixe le contrat que le front attend ; le
// comportement réel de l'API (IDOR, doublons, parsing .fit) est couvert par
// ses propres tests (Jest + Supertest).
//
// Lancement autonome, pour une recette manuelle sur données fictives :
//   npm run mock-api   puis   API_URL=http://localhost:4010 npm run dev
//
// Fichier exécuté directement par Node (--experimental-strip-types) : seules
// des annotations de type effaçables sont permises, et aucun import relatif.

export const MOCK_API_PORT = 4010
export const PASSWORD = 'Passw0rd!'
export const XSS_TITLE = '<img src=x onerror=alert(1)>'

type Role = 'ATHLETE' | 'COACH'

interface MockUser {
  id: string
  email: string
  role: Role
  firstName: string
  lastName: string
}

// Un compte par scénario, pour que les tests tournent en parallèle sans se
// marcher dessus (un import de T09 n'apparaît pas dans le calendrier de T16).
export const USERS = {
  athlete: { id: 'cmuserathlete00000000000a', email: 'athlete@test.dev', role: 'ATHLETE', firstName: 'Ada', lastName: 'Runner' },
  uploader: { id: 'cmuseruploader0000000000a', email: 'uploader@test.dev', role: 'ATHLETE', firstName: 'Uma', lastName: 'Loader' },
  duplicate: { id: 'cmuserduplicate000000000a', email: 'duplicate@test.dev', role: 'ATHLETE', firstName: 'Dan', lastName: 'Twice' },
  strava: { id: 'cmuserstrava000000000000a', email: 'strava@test.dev', role: 'ATHLETE', firstName: 'Sam', lastName: 'Strava' },
  // Connecté à Strava, mais tokens inutilisables (clé de chiffrement changée,
  // accès retiré depuis Strava) : la synchronisation répond 409.
  stravaRevoked: { id: 'cmuserrevokedstrava00000a', email: 'strava-revoked@test.dev', role: 'ATHLETE', firstName: 'Rae', lastName: 'Revoked' },
  other: { id: 'cmuserother0000000000000a', email: 'other@test.dev', role: 'ATHLETE', firstName: 'Otto', lastName: 'Other' },
  // Inscrits avant la case de consentement : aucune date d'accord. Le premier
  // consent pendant T24 ; le second n'y répond jamais, pour l'audit axe de
  // l'écran de consentement (T18), qui tourne en parallèle.
  legacy: { id: 'cmuserlegacy000000000000a', email: 'legacy@test.dev', role: 'ATHLETE', firstName: 'Leo', lastName: 'Legacy' },
  legacyAudit: { id: 'cmuserlegacyaudit0000000a', email: 'legacy-audit@test.dev', role: 'ATHLETE', firstName: 'Lia', lastName: 'Legacy' },
  // Supprime son compte pendant T25 : à ne pas réutiliser ailleurs.
  deleter: { id: 'cmuserdeleter00000000000a', email: 'deleter@test.dev', role: 'ATHLETE', firstName: 'Del', lastName: 'Eter' },
  // Se déconnecte (T26) : son jeton est révoqué, il ne doit gêner aucun autre test.
  leaver: { id: 'cmuserleaver000000000000a', email: 'leaver@test.dev', role: 'ATHLETE', firstName: 'Lou', lastName: 'Leaver' },
  coach: { id: 'cmusercoach0000000000000a', email: 'coach@test.dev', role: 'COACH', firstName: 'Cleo', lastName: 'Coach' },
} satisfies Record<string, MockUser>

export const ATHLETE_ACTIVITY_ID = 'cmactivityathlete0000000a'
export const OTHER_ATHLETE_ACTIVITY_ID = 'cmactivityother000000000a'

// Jeton au format JWT, signature factice : ni le front ni ses tests ne
// vérifient la signature (seul le backend détient le secret).
export function makeToken(user: MockUser, expiresInSec = 3600): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ sub: user.id, email: user.email, role: user.role, iat: now, exp: now + expiresInSec }),
    'mock-signature',
  ].join('.')
}

// En-tête minimal d'un fichier .fit : taille, protocole, profil, taille des
// données, puis la signature ".FIT" aux octets 8 à 11 — ce que l'API vérifie
// en premier. `seed` rend chaque fichier unique, donc non détecté comme doublon.
export function fitFileBuffer(seed: string = randomBytes(8).toString('hex')): Buffer {
  const header = Buffer.from([14, 0x10, 0x52, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54, 0, 0])
  return Buffer.concat([header, Buffer.from(seed)])
}

// --- Données ---------------------------------------------------------------

interface Activity {
  id: string
  athleteId: string
  source: 'FIT' | 'STRAVA'
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
  hasFitFile: boolean
  hasGpxFile: boolean
  labels: string[]
  laps: unknown[]
}

interface Workout {
  id: string
  planId: string
  title: string
  scheduledDate: string
  coachNote: string | null
  targetDistanceM: number | null
  targetDurationSec: number | null
  targetHeartRateZone: string | null
  laps: unknown[]
  createdAt: string
  updatedAt: string
}

function todayAt(hours: number, minutes = 0, dayOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function makeActivity(overrides: Partial<Activity> & Pick<Activity, 'id' | 'athleteId'>): Activity {
  return {
    source: 'FIT',
    sport: 'running',
    subSport: null,
    startedAt: todayAt(8),
    totalDistanceM: 8400,
    totalDurationSec: 2700,
    avgHeartRate: 148,
    maxHeartRate: 171,
    avgCadence: 172,
    avgPower: null,
    totalCalories: 560,
    elevationGainM: 42,
    elevationLossM: 40,
    athleteNote: null,
    difficultyNote: null,
    workoutId: null,
    hasFitFile: true,
    hasGpxFile: false,
    labels: [],
    laps: [],
    ...overrides,
  }
}

// Fractionné de l'activité de référence, pour le graphe d'allure et la
// sélection de laps (T33) : échauffement, 6 × (2 min vite, 1 min 30 trot),
// retour au calme. 45 min, comme son totalDurationSec.
const REFERENCE_SEGMENTS = [
  { intensity: 'WARMUP', durationSec: 900, speed: 3.2, heartRate: 140 },
  ...Array.from({ length: 11 }, (_, i) =>
    i % 2 === 0
      ? { intensity: 'INTERVAL', durationSec: 120, speed: 5, heartRate: 172 }
      : { intensity: 'RECOVERY', durationSec: 90, speed: 2.4, heartRate: 150 },
  ),
  { intensity: 'COOLDOWN', durationSec: 630, speed: 3, heartRate: 138 },
]

function referenceLaps() {
  let start = 0
  return REFERENCE_SEGMENTS.map((segment, index) => {
    const lap = {
      id: `cmlapathlete${String(index).padStart(13, '0')}`,
      activityId: ATHLETE_ACTIVITY_ID,
      index,
      intensity: segment.intensity,
      distanceM: segment.speed * segment.durationSec,
      durationSec: segment.durationSec,
      startElapsedSec: start,
      avgPaceSecPerKm: 1000 / segment.speed,
      avgHeartRate: segment.heartRate,
      maxHeartRate: segment.heartRate + 6,
      avgCadence: null,
      avgPower: null,
      avgStanceTimeMs: null,
      avgVerticalOscillationMm: null,
      avgVerticalRatio: null,
      avgStepLengthMm: null,
    }
    start += segment.durationSec
    return lap
  })
}

// Un point toutes les 5 s, comme le jeu de démo de l'API.
function referenceTrack() {
  const points: Array<Record<string, number>> = []
  let elapsedSec = 0
  let distanceM = 0
  for (const segment of REFERENCE_SEGMENTS) {
    for (let t = 0; t < segment.durationSec; t += 5) {
      points.push({
        elapsedSec,
        distanceM,
        latitude: 48.83 + distanceM * 0.000009,
        longitude: 2.44,
        heartRate: segment.heartRate,
        speedMPerSec: segment.speed,
      })
      elapsedSec += 5
      distanceM += segment.speed * 5
    }
  }
  return points
}

const activities: Activity[] = [
  makeActivity({
    id: ATHLETE_ACTIVITY_ID,
    athleteId: USERS.athlete.id,
    startedAt: todayAt(8, 0, -2),
    laps: referenceLaps(),
  }),
  makeActivity({ id: OTHER_ATHLETE_ACTIVITY_ID, athleteId: USERS.other.id, athleteNote: 'Note privée de Otto' }),
]

const workoutsByAthlete: Record<string, Workout[]> = {
  // T16 : séance du jour dont le titre et la note sont piégés par le coach.
  [USERS.athlete.id]: [
    {
      id: 'cmworkoutxss000000000000a',
      planId: 'cmplanathlete00000000000a',
      title: XSS_TITLE,
      scheduledDate: todayAt(7),
      coachNote: '<script>window.__xss = 1</script>',
      targetDistanceM: 10000,
      targetDurationSec: null,
      targetHeartRateZone: 'Z2',
      laps: [],
      createdAt: todayAt(0, 0, -7),
      updatedAt: todayAt(0, 0, -7),
    },
  ],
}

const uploadedHashes = new Set<string>()
const stravaConnected = new Set<string>([USERS.strava.id, USERS.stravaRevoked.id])
// Date du consentement aux données de santé, comme User.healthDataConsentAt :
// tous les athlètes l'ont donné, sauf le compte « legacy ».
const healthDataConsentAt = new Map<string, string>(
  Object.values(USERS)
    .filter((u) => u.role === 'ATHLETE' && u.id !== USERS.legacy.id && u.id !== USERS.legacyAudit.id)
    .map((u) => [u.id, '2026-11-01T08:00:00.000Z']),
)
const deletedUsers = new Set<string>()
// Jetons révoqués par POST /auth/logout (Redis côté API réelle).
const revokedTokens = new Set<string>()
let idCounter = 0

function nextId(prefix: string): string {
  idCounter += 1
  return `cm${prefix}${String(idCounter).padStart(23 - prefix.length, '0')}`
}

// --- HTTP ------------------------------------------------------------------

function send(res: ServerResponse, status: number, body: object | null) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

// Erreurs au format des exceptions NestJS.
function error(res: ServerResponse, status: number, message: string) {
  const labels: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
  }
  send(res, status, { statusCode: status, message, error: labels[status] ?? 'Error' })
}

function toWebRequest(req: IncomingMessage): Request {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  return new Request(`http://localhost${req.url ?? '/'}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
    duplex: 'half',
  } as RequestInit)
}

function authenticate(req: IncomingMessage): MockUser | null {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  if (revokedTokens.has(token)) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null
    return Object.values(USERS).find((u) => u.id === payload.sub) ?? null
  } catch {
    return null
  }
}

function trainingLoad(user: MockUser) {
  const points = Array.from({ length: 90 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (89 - i))
    const ctl = 30 + i * 0.2
    const atl = 35 + 8 * Math.sin(i / 5)
    return {
      date: date.toISOString().slice(0, 10),
      load: Math.round(40 + 30 * Math.abs(Math.sin(i))),
      ctl: Number(ctl.toFixed(1)),
      atl: Number(atl.toFixed(1)),
      tsb: Number((ctl - atl).toFixed(1)),
      settled: i >= 42,
    }
  })
  const last = points[points.length - 1]
  const count = activities.filter((a) => a.athleteId === user.id).length
  return {
    from: points[0].date,
    to: last.date,
    points,
    current: { date: last.date, ctl: last.ctl, atl: last.atl, tsb: last.tsb, settled: true },
    weeklyLoad: 310,
    rampRate: 1.4,
    sourceCounts: { HEART_RATE: count, PERCEIVED: 0, DURATION: 0 },
    activityCount: count,
  }
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const method = req.method ?? 'GET'
  const path = url.pathname

  if (method === 'GET' && path === '/health') return send(res, 200, { ok: true })

  if (method === 'POST' && path === '/auth/login') {
    const { email, password } = (await toWebRequest(req).json()) as { email?: string; password?: string }
    const user = Object.values(USERS).find((u) => u.email === email && !deletedUsers.has(u.id))
    // Même réponse que le compte existe ou non (voir AuthService.login).
    if (!user || password !== PASSWORD) return error(res, 401, 'Identifiants invalides')
    return send(res, 200, { accessToken: makeToken(user), user: { sub: user.id, email: user.email, role: user.role } })
  }

  const user = authenticate(req)
  if (!user) return error(res, 401, 'Unauthorized')

  if (method === 'POST' && path === '/auth/logout') {
    revokedTokens.add((req.headers.authorization ?? '').split(' ')[1])
    res.writeHead(204).end()
    return
  }

  const ownActivities = () => activities.filter((a) => a.athleteId === user.id)

  if (method === 'GET' && path === '/users/me') {
    return send(res, 200, {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: todayAt(0, 0, -30),
      healthDataConsentAt: healthDataConsentAt.get(user.id) ?? null,
      athleteProfile: {
        id: `profile-${user.id}`,
        coachId: null,
        age: 31,
        weightKg: 64,
        heightCm: 172,
        basalMetabolicRateKcal: 1500,
        specialty: 'LONG_DISTANCE_ROAD',
        heartRateZonesBpm: [120, 140, 155, 168, 180],
        paceZonesSecPerKm: [],
      },
    })
  }
  // Droits RGPD (T24, T25), réservés aux athlètes comme dans UsersController.
  if (path === '/users/me/health-consent' || path === '/users/me/export' || (method === 'DELETE' && path === '/users/me')) {
    if (user.role !== 'ATHLETE') return error(res, 403, 'Forbidden resource')

    if (method === 'POST' && path === '/users/me/health-consent') {
      const { healthDataConsent } = (await toWebRequest(req).json()) as { healthDataConsent?: unknown }
      if (healthDataConsent !== true) {
        return error(res, 400, 'Le consentement au traitement des données de santé doit valoir true')
      }
      // Un consentement déjà donné garde sa date d'origine.
      if (!healthDataConsentAt.has(user.id)) healthDataConsentAt.set(user.id, new Date().toISOString())
      return send(res, 200, { healthDataConsentAt: healthDataConsentAt.get(user.id) })
    }

    if (method === 'GET' && path === '/users/me/export') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="sessionized-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      })
      res.end(
        JSON.stringify({
          format: 'sessionized-export/2',
          exportedAt: new Date().toISOString(),
          account: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            healthDataConsentAt: healthDataConsentAt.get(user.id) ?? null,
          },
          activities: ownActivities(),
        }),
      )
      return
    }

    if (method === 'DELETE' && path === '/users/me') {
      const { password } = (await toWebRequest(req).json()) as { password?: unknown }
      if (typeof password !== 'string' || !password) return error(res, 400, 'password should not be empty')
      // 403 et non 401 : la session reste valide (PersonalDataService).
      if (password !== PASSWORD) return error(res, 403, 'Mot de passe incorrect')
      deletedUsers.add(user.id)
      res.writeHead(204)
      res.end()
      return
    }
  }

  if (method === 'GET' && path === '/users/me/coach') return error(res, 404, 'Aucun coach assigné')
  if (method === 'GET' && path === '/users/coaches') return send(res, 200, [])

  if (method === 'GET' && path === '/strava/status') return send(res, 200, { connected: stravaConnected.has(user.id) })
  if (method === 'POST' && path === '/strava/sync') {
    // T21 : même corps que StravaReconnectRequiredException côté API.
    if (user.id === USERS.stravaRevoked.id) {
      return send(res, 409, {
        statusCode: 409,
        error: 'Conflict',
        code: 'STRAVA_RECONNECT_REQUIRED',
        message: 'Connexion Strava à renouveler : token illisible',
      })
    }
    // T17 : la synchronisation fait apparaître une sortie Strava du jour.
    const already = ownActivities().some((a) => a.source === 'STRAVA')
    if (stravaConnected.has(user.id) && !already) {
      activities.push(
        makeActivity({
          id: nextId('strava'),
          athleteId: user.id,
          source: 'STRAVA',
          sport: 'Run',
          startedAt: todayAt(6, 30),
          hasFitFile: false,
        }),
      )
    }
    // Même forme que StravaService.syncActivities côté API.
    return send(res, 201, { importedCount: already ? 0 : 1 })
  }

  if (method === 'GET' && path === '/workouts') return send(res, 200, workoutsByAthlete[user.id] ?? [])
  if (method === 'GET' && path === '/training-load') return send(res, 200, trainingLoad(user))

  if (method === 'GET' && path === '/activities') return send(res, 200, ownActivities())
  if (method === 'GET' && path === '/activities/hr-zones') {
    return send(res, 200, {
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      unit: 'bpm',
      zones: [],
      totalSeconds: 0,
      secondsWithoutData: 0,
      activityCount: 0,
      activitiesWithDataCount: 0,
    })
  }

  if (method === 'POST' && path === '/activities/upload') {
    const form = await toWebRequest(req).formData()
    const file = form.get('file')
    if (!(file instanceof File)) return error(res, 400, 'Aucun fichier fourni')
    if (!file.name.toLowerCase().endsWith('.fit')) return error(res, 400, 'Seuls les fichiers .fit sont acceptés')

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length < 12 || bytes.subarray(8, 12).toString('latin1') !== '.FIT') {
      return error(res, 400, 'Fichier .fit invalide ou corrompu')
    }

    // Doublon détecté sur l'empreinte du fichier, par athlète (comme l'API).
    const hash = `${user.id}:${createHash('sha256').update(bytes).digest('hex')}`
    if (uploadedHashes.has(hash)) return error(res, 409, 'Cette activité a déjà été importée')
    uploadedHashes.add(hash)

    const workoutId = form.get('workoutId')
    const activity = makeActivity({
      id: nextId('upload'),
      athleteId: user.id,
      startedAt: new Date().toISOString(),
      workoutId: typeof workoutId === 'string' ? workoutId : null,
    })
    activities.push(activity)
    return send(res, 201, { ...activity, trackPointsCount: 0 })
  }

  const activityMatch = path.match(/^\/activities\/([^/]+)(?:\/(track|route|analysis|gpx|fit))?$/)
  if (activityMatch) {
    const [, id, sub] = activityMatch
    // Une activité d'un autre athlète est introuvable, pas interdite : on ne
    // confirme pas son existence.
    const activity = ownActivities().find((a) => a.id === id)
    if (!activity) return error(res, 404, 'Activité introuvable')

    if (method === 'GET' && !sub) return send(res, 200, activity)
    if (method === 'PATCH' && !sub) {
      Object.assign(activity, await toWebRequest(req).json())
      return send(res, 200, activity)
    }
    // Une trace synthétique pour l'activité de référence : de quoi afficher la
    // carte (T31) et le graphe d'allure (T33). Les autres activités n'en ont pas.
    if (method === 'GET' && sub === 'track' && id === ATHLETE_ACTIVITY_ID) {
      return send(res, 200, referenceTrack())
    }
    if (method === 'GET' && (sub === 'track' || sub === 'route')) return send(res, 200, [])
    if (method === 'GET' && sub === 'analysis') return send(res, 200, { eligible: false, reason: 'TOO_SHORT' })
    if (method === 'POST' && sub === 'gpx') return send(res, 201, { activityId: id, routePointsCount: 0 })
  }

  return error(res, 404, `Cannot ${method} ${path}`)
}

export function startMockApi(port = MOCK_API_PORT) {
  const server = createServer((req, res) => {
    route(req, res).catch(() => error(res, 400, 'Requête invalide'))
  })
  server.listen(port, () => {
    process.stdout.write(`API simulée sur http://localhost:${port}\n`)
  })
  return server
}

// Démarré seulement quand le fichier est exécuté directement : les tests
// l'importent aussi, pour ses jeux de données et makeToken().
if (/mock-api[\\/]server\.ts$/.test(process.argv[1] ?? '')) startMockApi()
