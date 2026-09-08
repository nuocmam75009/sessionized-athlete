import type { ReactNode } from 'react'

interface AuthLayoutProps {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  children: ReactNode
}

// Trois cartes en éventail dans la profondeur : la mise en scène de l'écran
// d'auth. Purement décoratives (aria-hidden) et volontairement muettes — pas de
// fausses métriques qu'on pourrait prendre pour des données réelles, juste les
// silhouettes d'une semaine d'entraînement.
const STACK = [
  { rotate: 'rotateY(19deg) rotateX(9deg)', offset: 'translate(0, 0)', delay: '0s', opacity: 'opacity-100' },
  { rotate: 'rotateY(19deg) rotateX(9deg)', offset: 'translate(46px, 54px)', delay: '-2.4s', opacity: 'opacity-70' },
  { rotate: 'rotateY(19deg) rotateX(9deg)', offset: 'translate(92px, 108px)', delay: '-4.8s', opacity: 'opacity-40' },
]

function CardStack() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {/* Le cadre déborde volontairement à droite : les cartes se font couper
          par le bord du panneau (overflow-hidden) au lieu de flotter au milieu,
          ce qui laisse croire à une scène qui continue hors champ. La
          perspective est posée ici, parent direct des cartes qui pivotent —
          plus haut, elle ne les atteindrait pas. */}
      <div className="absolute right-[-72px] top-1/2 h-[380px] w-[420px] -translate-y-1/2 [perspective:1100px]">
        {[...STACK].reverse().map((card, i) => (
          <div
            key={i}
            className={`absolute left-0 top-0 ${card.opacity}`}
            style={{ transform: `${card.offset} ${card.rotate}` }}
          >
            <div
              className="panel h-[176px] w-[268px] animate-float rounded-xl p-5"
              style={{ animationDelay: card.delay }}
            >
              <div className="h-1.5 w-14 rounded-full bg-accent/70" />
              <div className="mt-4 h-2 w-32 rounded-full bg-text/12" />
              <div className="mt-2.5 h-2 w-24 rounded-full bg-text/8" />
              {/* Silhouette de barres : la forme d'un graphe d'entraînement,
                  sans en être un. */}
              <div className="mt-6 flex items-end gap-1.5">
                {[38, 22, 54, 30, 46, 18, 62].map((h, j) => (
                  <div
                    key={j}
                    className="w-4 rounded-sm bg-linear-to-t from-accent/15 to-accent/60"
                    style={{ height: h }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Écran d'auth générique (login/register) : panneau marketing à gauche,
// formulaire à droite. Aucune dépendance à une app en particulier — le
// contenu marketing et le formulaire sont fournis par l'app appelante.
export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <div className="grid md:grid-cols-[1.05fr_0.95fr] min-h-screen">
      <div className="relative overflow-hidden px-8 md:px-16 py-16 flex flex-col justify-center">
        <CardStack />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--color-accent)]" />
            <span className="font-heading font-semibold text-[11px] tracking-[0.18em] uppercase text-accent">
              {eyebrow}
            </span>
          </div>
          {/* Dégradé descendant sur le titre : la lumière vient du haut, comme
              sur les surfaces — le texte s'éteint vers le bas. */}
          <h1 className="text-4xl md:text-[3.4rem] max-w-[10ch] bg-linear-to-b from-text to-text/45 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-[15px] text-text/55 max-w-[42ch] mt-5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="px-8 md:px-14 py-16 flex flex-col justify-center border-t md:border-t-0 md:border-l border-divider">
        <div className="panel w-full max-w-[380px] rounded-xl p-7 md:p-8">{children}</div>
      </div>
    </div>
  )
}
