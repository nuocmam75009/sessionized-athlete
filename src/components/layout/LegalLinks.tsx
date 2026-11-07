import Link from 'next/link'

// Mentions légales et politique de confidentialité, accessibles depuis chaque
// écran, connecté ou non : l'information RGPD doit rester à portée à tout moment.
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap gap-x-5 gap-y-1 text-xs text-text/60 ${className}`}>
      <Link href="/legal" className="hover:text-text">
        Legal notice
      </Link>
      <Link href="/privacy" className="hover:text-text">
        Privacy policy
      </Link>
    </nav>
  )
}
