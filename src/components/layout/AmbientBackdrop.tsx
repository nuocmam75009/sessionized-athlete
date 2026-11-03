// Arrière-plan d'ambiance, commun à toutes les pages : deux halos d'accent et
// un sol en perspective. C'est ce qui donne au fond noir une profondeur — sans
// lui, les cartes flottent sur du vide plat.
//
// Les halos sont des radial-gradients, pas des disques passés au `filter:
// blur()`. Un flou de 120px sur une surface de 70vw × 70vh est l'une des
// opérations les plus chères qu'un navigateur puisse faire, et l'animer en
// scale forçait une re-rastérisation à chaque image : le fond mangeait des
// frames en permanence et retardait la première peinture. Un dégradé radial
// donne exactement le même halo, rastérisé une fois, pour presque rien.
//
// Pas d'animation non plus : le dynamisme de l'interface vient des réactions au
// pointeur (survol, inclinaison), pas d'un décor qui tourne en boucle et
// dispute des frames au défilement.
// Les deux teintes passent par --halo-accent / --halo-accent-2, redéfinies par
// thème dans globals.css : sur fond clair, la même intensité qu'en sombre
// virerait au lavis bleu.
const HALOS = `
  radial-gradient(58% 52% at 10% -6%, var(--halo-accent) 0%, transparent 62%),
  radial-gradient(52% 48% at 94% 104%, var(--halo-accent-2) 0%, transparent 64%)
`

export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: HALOS }} />
      {/* Sol en perspective : ancré en bas, il fixe l'horizon et donne l'échelle
          de profondeur à laquelle les cartes se soulèvent au survol. Statique,
          peint une seule fois. */}
      <div className="grid-floor absolute inset-x-0 bottom-0 h-[46vh] opacity-50" />
    </div>
  )
}
