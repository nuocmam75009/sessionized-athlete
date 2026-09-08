'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

interface TiltProps {
  children: ReactNode
  /** Posé sur le cadre extérieur — c'est lui qui porte l'arrondi, hérité ensuite. */
  className?: string
  /** Amplitude maximale de l'inclinaison, en degrés. Au-delà de ~10°, la carte
      se déforme visiblement et le texte devient pénible à lire. */
  max?: number
  /** Reflet spéculaire qui suit le pointeur. À couper sur les surfaces déjà
      chargées (cartes, tableaux) où il ajoute du bruit. */
  glare?: boolean
}

/**
 * Inclinaison 3D pilotée par le pointeur. La rotation passe par un ressort :
 * la carte suit la souris avec un temps de retard et revient à plat en
 * s'amortissant, au lieu de coller au curseur comme un miroir.
 *
 * La perspective est ouverte par le cadre extérieur, jamais par l'élément qui
 * tourne — `perspective` ne s'applique qu'aux enfants. Sous
 * prefers-reduced-motion, le composant s'efface et ne rend que ses enfants.
 */
export function Tilt({ children, className = '', max = 7, glare = true }: TiltProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Position du pointeur, normalisée dans [-0.5, 0.5] depuis le centre.
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  // La même position en pourcentage, pour ancrer le reflet.
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)

  const spring = { stiffness: 240, damping: 24, mass: 0.5 }
  // Le pointeur vers le bas doit incliner le haut de la carte vers l'arrière,
  // d'où le signe négatif sur l'axe X.
  const rotateX = useSpring(useTransform(offsetY, (v) => -v * max), spring)
  const rotateY = useSpring(useTransform(offsetX, (v) => v * max), spring)

  const glareBackground = useMotionTemplate`radial-gradient(320px circle at ${glareX}% ${glareY}%, color-mix(in srgb, #ffffff 9%, transparent), transparent 68%)`

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const ratioX = (event.clientX - rect.left) / rect.width
    const ratioY = (event.clientY - rect.top) / rect.height
    offsetX.set(ratioX - 0.5)
    offsetY.set(ratioY - 0.5)
    glareX.set(ratioX * 100)
    glareY.set(ratioY * 100)
  }

  function handlePointerLeave() {
    offsetX.set(0)
    offsetY.set(0)
    glareX.set(50)
    glareY.set(50)
  }

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <div
      ref={frameRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`[perspective:1100px] ${className}`}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full rounded-[inherit]"
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden
            style={{ background: glareBackground }}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        )}
      </motion.div>
    </div>
  )
}
