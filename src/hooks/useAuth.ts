'use client'

import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return { logout }
}
