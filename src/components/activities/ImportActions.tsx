'use client'

import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'

export function ImportActions({ workoutId }: { workoutId?: string }) {
  const { t } = useI18n()
  const uploadHref = workoutId ? `/activities/upload?workoutId=${workoutId}` : '/activities/upload'

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Link href={uploadHref} className={buttonClassName('primary')}>
        {t.common.uploadActivity}
      </Link>
    </div>
  )
}
