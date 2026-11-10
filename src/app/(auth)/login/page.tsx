import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { Suspense } from 'react'
import LoginView from './LoginView'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.login }
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  )
}
