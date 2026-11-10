import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { getI18n } from '@/lib/i18n/server'

// Rendu par notFound() dans une page de l'app, sous la barre latérale. Le
// message ne distingue pas « n'existe pas » de « n'est pas à vous » : la page
// ne doit pas révéler qu'un identifiant appartient à un autre athlète.
export default async function AppNotFound() {
  const { t } = await getI18n()
  return (
    <div>
      <h1>{t.notFound.title}</h1>
      <p className="text-text/60 mt-2 mb-6 max-w-[52ch]">{t.notFound.body}</p>
      <Link href="/dashboard" className={buttonClassName('secondary')}>
        {t.notFound.backToCalendar}
      </Link>
    </div>
  )
}
