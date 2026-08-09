import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ContactCoachButton } from '@/components/chat/ContactCoachButton'
import type { CoachListing } from '@/lib/coaches-mock'

export function CoachCard({ coach }: { coach: CoachListing }) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-md bg-surface">
      <div className="flex items-center gap-3">
        <Avatar name={coach.name} />
        <div>
          <div className="font-heading font-semibold text-base">{coach.name}</div>
          <div className="text-accent text-xs font-heading font-semibold uppercase tracking-[0.06em]">
            {coach.headline}
          </div>
        </div>
      </div>

      <p className="text-sm text-text/80 flex-1">{coach.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {coach.specialties.map((s) => (
          <Badge key={s} variant="neutral">
            {s}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text/70">
        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" className="text-accent-2">
          <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54-45.11-39.42a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0l23.21,55.36,59.46,5.15a16,16,0,0,1,9.11,28.06Z" />
        </svg>
        <span className="font-semibold text-text">{coach.rating.toFixed(1)}</span>
        <span>· {coach.athleteCount} athletes · {coach.yearsExperience} ans d&apos;expérience</span>
      </div>

      <div className="pt-2 border-t border-divider">
        <div>
          <span className="font-heading font-semibold text-lg">{coach.pricePerMonth}€</span>
          <span className="text-text/60 text-sm"> /mois</span>
        </div>
        <ContactCoachButton coachId={coach.id} coachName={coach.name} />
      </div>
    </div>
  )
}
