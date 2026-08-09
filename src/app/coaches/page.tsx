import Link from 'next/link'
import { CoachCard } from '@/components/marketplace/CoachCard'
import { COACHES } from '@/lib/coaches-mock'

export default function CoachesPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center px-8 py-4 border-b border-divider">
        <Link href="/login" className="font-heading font-semibold text-lg">
          Sessionized
        </Link>
        <Link href="/login" className="ml-auto text-sm text-accent hover:text-accent-700">
          Log in
        </Link>
      </nav>

      <main className="px-6 md:px-8 py-10 max-w-[1100px] mx-auto">
        <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
          Marketplace
        </div>
        <h1>Find your coach</h1>
        <p className="opacity-70 mb-8">
          {COACHES.length} coachs disponibles — parcours leurs spécialités et choisis celui qui correspond à ton objectif.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COACHES.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      </main>
    </div>
  )
}
