'use client'

import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export function useAuth() {
  const router = useRouter()

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return { logout }
}
