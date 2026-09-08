@AGENTS.md

# Sessionized — contexte projet pour Claude Code

Ce fichier est destiné à Claude Code. Lis-le intégralement avant de générer du code.

---

## Vue d'ensemble

Sessionized est une plateforme de coaching sportif (course à pied) en deux interfaces web distinctes :

- **sessionized-athlete** : app Next.js pour l'athlète
- **sessionized-coach** : app Next.js pour le coach
- **sessionized-api** : backend NestJS commun aux deux frontends

Ce fichier est utilisé dans les deux projets frontend. Le backend est documenté dans `sessionized-api/README.md`.

---

## Stack frontend

| Élément | Choix |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Langage | TypeScript strict |
| Style | Tailwind CSS |
| Graphes | Recharts |
| Auth | JWT stocké en httpOnly cookie |
| API | REST — `NEXT_PUBLIC_API_URL` (ex: `http://localhost:3001`) |
| Temps réel | WebSocket natif (notifications warnings) |
| Icônes | Tabler Icons (`@tabler/icons-react`) |

---

## Deux apps, un seul backend

Les deux apps Next.js sont des projets **séparés** — deux repos GitHub distincts, deux déploiements Vercel distincts. Elles partagent le même backend NestJS via des appels REST.

```
sessionized-athlete/   → athlete.sessionized.app  (Vercel)
sessionized-coach/     → coach.sessionized.app    (Vercel)
sessionized-api/       → api.sessionized.app      (Hetzner VPS)
```

---

## Identité visuelle

| App | Couleur principale | Usage |
|---|---|---|
| Athlète | Bleu `#185FA5` | Accents, boutons primaires, graphes CTL |
| Coach | Vert `#0F6E56` | Accents, boutons primaires, sidebar active |

Les deux apps ont la même structure de composants et de layout — seules la couleur et les routes changent.

---

## Authentification

- L'utilisateur se connecte avec email + mot de passe
- Le backend renvoie un JWT contenant `{ sub, role, email }`
- Le rôle est soit `ATHLETE` soit `COACH`
- Le JWT est stocké en **httpOnly cookie** (jamais dans localStorage)
- Un middleware Next.js vérifie le cookie sur chaque route protégée
- Si le cookie est absent ou expiré → redirect vers `/login`

```typescript
// Exemple de middleware Next.js
// middleware.ts à la racine du projet
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sessionized_token')
  if (!token) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/activities/:path*', '/plan/:path*'],
}
```

---

## Structure des dossiers (identique dans les deux apps)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── activities/
│   │   ├── page.tsx          ← historique
│   │   └── [id]/
│   │       └── page.tsx      ← analyse détaillée
│   ├── plan/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   ← composants génériques (Button, Badge, Card...)
│   ├── charts/               ← wrappers Recharts (TrainingLoadChart, LapChart...)
│   ├── warnings/             ← WarningBadge, WarningBlock
│   └── layout/               ← Sidebar, TopBar
├── lib/
│   ├── api.ts                ← fetch wrapper avec gestion d'erreurs et auth
│   ├── types.ts              ← interfaces TypeScript partagées
│   └── utils.ts              ← formatPace(), formatDuration(), etc.
└── hooks/
    ├── useAuth.ts
    ├── useActivity.ts
    └── useWebSocket.ts
```

---

## Types TypeScript principaux

Utilise toujours ces interfaces — ne les réinvente pas.

```typescript
// lib/types.ts

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
```

---

## Appels API

Toujours utiliser le wrapper `lib/api.ts` — ne jamais appeler `fetch` directement dans les composants.

```typescript
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',           // envoie le cookie httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login'
    }
    throw new Error(`API error ${res.status}`)
  }

  return res.json()
}
```

---

## Utilitaires à toujours utiliser

```typescript
// lib/utils.ts

// Convertit des secondes/km en "4'05"/km"
export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60)
  const sec = secPerKm % 60
  return `${min}'${String(sec).padStart(2, '0')}"/km`
}

// Convertit des secondes en "52'34""
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}'`
  return `${m}'${String(s).padStart(2, '0')}"`
}

// Convertit des mètres en "8,4 km"
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`
}

// Couleur du delta allure
export function paceColor(delta: number): string {
  if (delta < -10) return 'text-red-600'
  if (delta < -5) return 'text-orange-500'
  return 'text-green-600'
}

// Couleur du TSB
export function tsbColor(tsb: number): string {
  if (tsb < -20) return 'text-red-600'
  if (tsb < 0) return 'text-orange-500'
  return 'text-green-600'
}
```

---

## Pages de l'app athlète (sessionized-athlete)

| Route | Description |
|---|---|
| `/login` | Connexion email + mot de passe |
| `/dashboard` | CTL/ATL/TSB chart, dernières séances, warnings actifs |
| `/activities` | Historique de toutes les activités |
| `/activities/[id]` | Analyse détaillée — laps, graphes, warnings |
| `/activities/upload` | Upload fichier `.fit` + association à une séance planifiée |
| `/plan` | Calendrier des séances prescrites par le coach |

---

## Pages de l'app coach (sessionized-coach)

| Route | Description |
|---|---|
| `/login` | Connexion email + mot de passe |
| `/dashboard` | Vue globale — liste athlètes avec TSB, warnings non lus, revenus |
| `/athletes` | Liste des athlètes encadrés |
| `/athletes/[id]` | Fiche athlète — historique, warnings, graphe charge, note privée |
| `/athletes/[id]/activities/[activityId]` | Analyse séance d'un athlète |
| `/plan` | Calendrier de planification |
| `/plan/new` | Formulaire création séance avec laps cibles |
| `/revenue` | Dashboard Stripe — abonnements, revenus, commission |

---

## Conventions de code

- **Composants** : PascalCase, un composant par fichier
- **Hooks** : camelCase préfixé `use` (ex: `useActivity`)
- **Fonctions utilitaires** : camelCase dans `lib/utils.ts`
- **Pas de `any`** — TypeScript strict activé
- **Server Components par défaut** — `'use client'` uniquement si interaction nécessaire
- **Commentaires** : en français
- **Noms de variables/fonctions** : en anglais
- **Pas de `console.log`** en production — utiliser les erreurs TypeScript

---

## Composants UI prioritaires à créer en premier

Dans cet ordre :

1. `components/layout/Sidebar.tsx` — navigation latérale
2. `components/ui/Badge.tsx` — badges warning (INFO / WARNING / CRITICAL)
3. `components/charts/TrainingLoadChart.tsx` — graphe CTL/ATL/TSB (Recharts)
4. `components/charts/LapChart.tsx` — graphe allure par lap vs cible
5. `components/warnings/WarningBlock.tsx` — bloc warning avec message et suggestion

---

## Variables d'environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

En production :

```env
NEXT_PUBLIC_API_URL=https://api.sessionized.app
```