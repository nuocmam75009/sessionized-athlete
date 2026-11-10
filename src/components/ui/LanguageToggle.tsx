'use client'

import { useOptimistic, useTransition } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { setLocale } from '@/lib/i18n/actions'
import { LOCALE_NAMES, LOCALES, type Locale } from '@/lib/i18n/config'

// Interrupteur à deux positions, EN | FR, dont le curseur glisse vers la
// langue choisie. Vertical dans la barre latérale repliée à 72px, où la
// version horizontale déborderait.
//
// Deux boutons à bascule (aria-pressed) dans un groupe nommé, plutôt qu'un
// role="switch" : un switch dit « activé / désactivé », pas « laquelle des
// deux ». Le nom accessible commence par le code affiché (WCAG 2.5.3 : on doit
// pouvoir dire « clique sur FR » en commande vocale), suivi du nom de la
// langue écrit dans cette langue (« FR Français ») pour le lecteur d'écran,
// qui le prononce correctement grâce à l'attribut lang.
export function LanguageToggle({
  orientation = 'horizontal',
  className = '',
}: {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  const { locale, t } = useI18n()
  const [isPending, startTransition] = useTransition()
  // Le curseur part dès le clic ; les textes basculent tous ensemble quand la
  // page re-rendue par la Server Function arrive, à la fin de la transition.
  const [shownLocale, setShownLocale] = useOptimistic(locale)

  function select(next: Locale) {
    if (next === shownLocale) return
    startTransition(async () => {
      setShownLocale(next)
      await setLocale(next)
    })
  }

  const vertical = orientation === 'vertical'
  const offset = LOCALES.indexOf(shownLocale) * 100

  return (
    <div
      role="group"
      aria-label={t.language.groupLabel}
      aria-busy={isPending || undefined}
      className={`relative inline-flex shrink-0 rounded-full border border-divider bg-surface/60 p-0.5 shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] ${
        vertical ? 'flex-col' : 'flex-row'
      } ${className}`}
    >
      {/* Le curseur fait la taille d'un bouton et se décale d'un bouton par
          rang : translate en pourcentage de sa propre taille. */}
      <span
        aria-hidden
        className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-accent shadow-[0_4px_12px_-6px_var(--color-accent)] motion-safe:transition-transform motion-safe:duration-300 ease-out-3d"
        style={{ transform: vertical ? `translateY(${offset}%)` : `translateX(${offset}%)` }}
      />
      {LOCALES.map((code) => {
        const active = code === shownLocale
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={`${code.toUpperCase()} ${LOCALE_NAMES[code]}`}
            onClick={() => select(code)}
            className={`relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold tracking-[0.04em] transition-colors duration-200 cursor-pointer ${
              active ? 'text-bg' : 'text-text/60 hover:text-text'
            }`}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
