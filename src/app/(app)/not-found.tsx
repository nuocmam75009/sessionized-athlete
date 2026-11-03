import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'

// Rendu par notFound() dans une page de l'app, sous la barre latérale. Le
// message ne distingue pas « n'existe pas » de « n'est pas à vous » : la page
// ne doit pas révéler qu'un identifiant appartient à un autre athlète.
export default function AppNotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <p className="text-text/60 mt-2 mb-6 max-w-[52ch]">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/dashboard" className={buttonClassName('secondary')}>
        Back to calendar
      </Link>
    </div>
  )
}
