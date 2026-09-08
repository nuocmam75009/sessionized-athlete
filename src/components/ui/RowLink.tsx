'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

interface RowLinkProps {
  href?: string
  children: ReactNode
}

export function RowLink({ href, children }: RowLinkProps) {
  const router = useRouter()
  return (
    <tr
      onClick={href ? () => router.push(href) : undefined}
      className={href ? 'cursor-pointer transition-colors duration-150 hover:bg-text/[0.05]' : ''}
    >
      {children}
    </tr>
  )
}
