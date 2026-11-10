import Link from 'next/link'
import { LegalLinks } from '@/components/layout/LegalLinks'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Pages lisibles sans compte (on les consulte avant de s'inscrire) : hors de
// (app), donc hors du matcher du proxy, et sans barre latérale.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-6 md:px-10 py-10">
      <div className="mx-auto max-w-[720px]">
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="font-heading font-semibold tracking-[-0.01em]">
            Sessionized
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-divider pt-4">
          <LegalLinks />
        </footer>
      </div>
    </div>
  )
}
