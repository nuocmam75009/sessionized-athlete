'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Décalage en secondes — sert à cascader les blocs d'une même page. */
  delay?: number
}

// Entrée des blocs de page : le contenu monte et se redresse depuis une légère
// bascule arrière. La rotation part de la base (transformOrigin en bas) pour que
// le bloc semble se relever plutôt que pivoter sur son centre.
//
// La perspective est portée par un cadre extérieur : `perspective` ne s'applique
// qu'aux enfants directs, donc l'hériter d'un conteneur de page plus haut ne
// marcherait pas — sans ce cadre, rotateX écrase le bloc au lieu de l'incliner.
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <div className="[perspective:1200px]">
      <motion.div
        className={className}
        style={{ transformOrigin: '50% 100%' }}
        initial={{ opacity: 0, y: 16, rotateX: -7 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.16, 0.84, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </div>
  )
}
