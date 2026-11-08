// Copie le worker de MapLibre dans public/, d'où la carte le charge
// (RouteMap.tsx, setWorkerUrl). Lancé avant `next dev` et `next build`.
//
// Depuis la version 6, MapLibre cherche son worker à côté de son propre
// fichier (new URL('./maplibre-gl-worker.mjs', import.meta.url)) : une fois
// le module regroupé par Next dans un morceau de _next/static, ce chemin
// n'existe plus (404), et la carte reste vide. Copié depuis node_modules à
// chaque build, le worker est toujours de la même version que la bibliothèque.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const source = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', 'maplibre-gl-worker.mjs')
const target = join(process.cwd(), 'public', 'maplibre', 'maplibre-gl-worker.mjs')

mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
console.log(`Worker MapLibre copié dans ${target}`)
