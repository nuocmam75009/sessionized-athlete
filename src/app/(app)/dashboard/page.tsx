import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'
import { getTodayWorkout } from '@/lib/mock-data'

export default function DashboardPage() {
  const workout = getTodayWorkout()

  return (
    <div>
      <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
        {workout.day} · {workout.date} · Today
      </div>
      <h1>{workout.title}</h1>
      <div className="flex gap-8 my-6">
        <Stat label="Distance" value={workout.distance} />
        <Stat label="Duration" value={workout.duration} />
        <Stat label="Target zone" value={workout.targetZone} />
      </div>
      <blockquote className="mb-6 pl-4 border-l-2 border-accent-200 italic text-[17px] max-w-[56ch]">
        “{workout.coachNote}”
      </blockquote>
      <div className="flex gap-3">
        <Link href={`/activities/${workout.id}`} className={buttonClassName('primary')}>
          View full breakdown
        </Link>
        <Link href="/activities/upload" className={buttonClassName('secondary')}>
          Upload activity
        </Link>
      </div>
    </div>
  )
}
