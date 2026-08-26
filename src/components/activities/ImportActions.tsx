import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'

export function ImportActions({ workoutId }: { workoutId?: string }) {
  const uploadHref = workoutId ? `/activities/upload?workoutId=${workoutId}` : '/activities/upload'

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Link href={uploadHref} className={buttonClassName('primary')}>
        Upload activity
      </Link>
    </div>
  )
}
