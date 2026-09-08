// Métrique : étiquette en capitales sourdes, valeur en chasse fixe. Le mono
// n'est pas décoratif — il aligne les chiffres d'une colonne à l'autre dans les
// grilles de stats du récapitulatif de semaine.
export function Stat({ label, value, size = 'lg' }: { label: string; value: string; size?: 'lg' | 'sm' }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.11em] text-text/45">{label}</div>
      <div
        className={`metric mt-1.5 font-semibold leading-none ${size === 'lg' ? 'text-[26px]' : 'text-[19px]'}`}
      >
        {value}
      </div>
    </div>
  )
}
