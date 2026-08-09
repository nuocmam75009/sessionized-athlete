// Données de démonstration — à remplacer par un GET /coaches (ou
// équivalent) une fois l'endpoint marketplace disponible côté backend.

export interface CoachListing {
  id: string
  name: string
  headline: string
  bio: string
  specialties: string[]
  yearsExperience: number
  athleteCount: number
  rating: number // sur 5
  pricePerMonth: number // EUR
}

export const COACHES: CoachListing[] = [
  {
    id: 'elena-ruiz',
    name: 'Elena Ruiz',
    headline: 'Marathon & road racing',
    bio: 'Former 2:34 marathoner turned coach. I build patient, data-driven plans for runners chasing a Boston or sub-3 goal.',
    specialties: ['Marathon', 'Half marathon', 'Base building'],
    yearsExperience: 9,
    athleteCount: 24,
    rating: 4.9,
    pricePerMonth: 120,
  },
  {
    id: 'marcus-webb',
    name: 'Marcus Webb',
    headline: 'Trail & ultra distance',
    bio: 'UTMB finisher, coaching trail runners on vert, fueling and pacing for anything from 50k to 100 miles.',
    specialties: ['Trail', 'Ultra', 'Vert training'],
    yearsExperience: 7,
    athleteCount: 18,
    rating: 4.8,
    pricePerMonth: 140,
  },
  {
    id: 'priya-anand',
    name: 'Priya Anand',
    headline: 'Track & speed development',
    bio: 'Ex-collegiate 1500m runner. I work with athletes chasing 5k/10k PRs who want structured interval work that actually progresses.',
    specialties: ['5k/10k', 'Track', 'Speed work'],
    yearsExperience: 6,
    athleteCount: 15,
    rating: 4.9,
    pricePerMonth: 110,
  },
  {
    id: 'tom-eriksen',
    name: 'Tom Eriksen',
    headline: 'Beginner & return-to-running',
    bio: 'I specialize in runners starting out or coming back from injury — conservative progressions, no ego, just consistency.',
    specialties: ['Beginners', 'Injury return', 'Habit building'],
    yearsExperience: 5,
    athleteCount: 31,
    rating: 4.7,
    pricePerMonth: 85,
  },
  {
    id: 'sofia-lindqvist',
    name: 'Sofia Lindqvist',
    headline: 'Triathlon & multisport',
    bio: 'IRONMAN age-group podium finisher. I coach triathletes balancing run training with swim/bike load across a full season.',
    specialties: ['Triathlon', 'IRONMAN', 'Multisport'],
    yearsExperience: 8,
    athleteCount: 20,
    rating: 4.8,
    pricePerMonth: 150,
  },
  {
    id: 'daniel-osei',
    name: 'Daniel Osei',
    headline: 'Masters & longevity',
    bio: 'Coaching runners 40+ who want to keep racing well — smart load management, strength work, and realistic recovery.',
    specialties: ['Masters', 'Strength', 'Longevity'],
    yearsExperience: 11,
    athleteCount: 27,
    rating: 4.9,
    pricePerMonth: 115,
  },
]
