'use client'

import Link from 'next/link'
import { Button, buttonClassName } from '@/components/ui/Button'

// Erreur inattendue au rendu d'une page de l'app (réponse de l'API
// inexploitable, bug). Placé dans (app)/, il ne remplace que le contenu : la
// barre latérale reste, l'athlète peut naviguer ailleurs. En production, le
// message d'une erreur serveur est masqué ; seul le digest relie l'écran aux
// logs, d'où la référence affichée.
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p className="text-text/60 mt-2 mb-6 max-w-[52ch]">
        This page couldn&apos;t be displayed. Try again, or go back to your calendar.
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href="/dashboard" className={buttonClassName('ghost')}>
          Back to calendar
        </Link>
      </div>
      {error.digest && <p className="text-xs text-text/60 mt-6">Reference: {error.digest}</p>}
    </div>
  )
}
