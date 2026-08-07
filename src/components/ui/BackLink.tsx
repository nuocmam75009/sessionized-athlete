'use client'

import { useRouter } from 'next/navigation'

export function BackLink({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()
  return (
    <a
      href={fallbackHref}
      onClick={(e) => {
        e.preventDefault()
        router.back()
      }}
      className="inline-block mb-4 text-[13px] text-accent hover:text-accent-700"
    >
      ← Back
    </a>
  )
}
