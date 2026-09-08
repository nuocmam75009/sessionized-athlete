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
      className="group inline-flex items-center gap-1.5 mb-5 text-[12px] uppercase tracking-[0.09em] text-text/45 transition-colors hover:text-accent"
    >
      {/* La flèche recule au survol : le geste dit le sens du lien avant le mot. */}
      <span className="transition-transform duration-200 ease-out-3d group-hover:-translate-x-0.5">
        ←
      </span>
      Back
    </a>
  )
}
