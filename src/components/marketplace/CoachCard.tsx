import { Avatar } from '@/components/ui/Avatar'
import { ContactCoachButton } from '@/components/chat/ContactCoachButton'
import { Tilt } from '@/components/ui/Tilt'
import type { CoachAssignment } from '@/lib/types'

function coachDisplayName(coach: CoachAssignment) {
  const { firstName, lastName, email } = coach.user
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || email
}

function memberSince(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(createdAt))
}

// La grille de coachs est le seul endroit où l'inclinaison au pointeur est
// justifiée : on parcourt des cartes côte à côte pour comparer, et le relief
// dit laquelle on survole mieux qu'un changement de teinte. Amplitude réduite —
// la carte contient un bouton, elle ne doit pas fuir sous le curseur.
export function CoachCard({ coach }: { coach: CoachAssignment }) {
  const name = coachDisplayName(coach)

  return (
    <Tilt className="h-full rounded-lg" max={5}>
      <div className="panel flex h-full flex-col gap-3.5 rounded-lg p-5">
        <div className="flex items-center gap-3.5">
          <Avatar name={name} size={48} />
          <div className="min-w-0">
            <div className="font-heading font-semibold text-[15px] tracking-[-0.01em] truncate">{name}</div>
            <div className="text-text/45 text-xs truncate">{coach.user.email}</div>
          </div>
        </div>

        <div className="flex-1 text-sm text-text/55">Coach depuis {memberSince(coach.createdAt)}</div>

        <div className="pt-3 border-t border-divider">
          <ContactCoachButton coachId={coach.id} coachName={name} />
        </div>
      </div>
    </Tilt>
  )
}
