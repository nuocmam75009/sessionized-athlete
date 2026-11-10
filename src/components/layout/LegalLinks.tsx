'use client'

import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'

// Mentions légales et politique de confidentialité, accessibles depuis chaque
// écran, connecté ou non : l'information RGPD doit rester à portée à tout moment.
// Composant client : il est rendu aussi bien par des layouts serveur que par
// l'écran de connexion (client), et lit la langue dans le contexte.
export function LegalLinks({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t.legalLinks.navLabel} className={`flex flex-wrap gap-x-5 gap-y-1 text-xs text-text/60 ${className}`}>
      <Link href="/legal" className="hover:text-text">
        {t.legalLinks.legalNotice}
      </Link>
      <Link href="/privacy" className="hover:text-text">
        {t.legalLinks.privacyPolicy}
      </Link>
    </nav>
  )
}
