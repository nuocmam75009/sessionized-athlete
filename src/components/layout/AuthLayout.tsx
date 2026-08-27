import type { ReactNode } from 'react'

interface AuthLayoutProps {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  children: ReactNode
}

// Écran d'auth générique (login/register) : panneau marketing à gauche,
// formulaire à droite. Aucune dépendance à une app en particulier — le
// contenu marketing et le formulaire sont fournis par l'app appelante.
export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <div className="grid md:grid-cols-[1.1fr_0.9fr] min-h-screen">
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center max-w-xl">
        <div className="font-heading font-semibold text-xs tracking-[0.14em] uppercase text-accent mb-4">{eyebrow}</div>
        <h1 className="text-4xl md:text-5xl max-w-[9.5ch]">{title}</h1>
        <p className="text-base opacity-75 max-w-[44ch] mt-3">{description}</p>
      </div>
      <div className="px-8 md:px-16 py-16 flex flex-col justify-center border-t md:border-t-0 md:border-l border-divider">
        <div className="max-w-[360px] w-full">{children}</div>
      </div>
    </div>
  )
}
