import { Avatar } from '@/components/ui/Avatar'
import { ContactCoachButton } from '@/components/chat/ContactCoachButton'
import type { CoachAssignment } from '@/lib/types'

function coachDisplayName(coach: CoachAssignment) {
  const { firstName, lastName, email } = coach.user
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || email
}

function memberSince(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(createdAt))
}

export function CoachCard({ coach }: { coach: CoachAssignment }) {
  const name = coachDisplayName(coach)

  return (
    <div className="flex flex-col gap-3 p-5 rounded-md bg-surface">
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div>
          <div className="font-heading font-semibold text-base">{name}</div>
          <div className="text-text/60 text-xs">{coach.user.email}</div>
        </div>
      </div>

      <div className="flex-1 text-sm text-text/70">Coach depuis {memberSince(coach.createdAt)}</div>

      <div className="pt-2 border-t border-divider">
        <ContactCoachButton coachId={coach.id} coachName={name} />
      </div>
    </div>
  )
}
