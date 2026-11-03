'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/lib/theme'
import type { FeatureGroup, LeafletEvent, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface GpxStats {
  distanceM: number
  elevationGainM: number
  elevationLossM: number
  totalTimeMs: number
}

interface GpxLayer extends FeatureGroup {
  get_distance(): number
  get_elevation_gain(): number
  get_elevation_loss(): number
  get_total_time(): number
}

export interface RoutePoint {
  latitude: number | null
  longitude: number | null
}

// Le fond de carte ne suit pas les variables CSS : il faut le recharger au
// changement de thème, d'où un style par thème.
//
// OpenFreeMap sert des tuiles vectorielles OpenMapTiles, sans compte, sans clé
// d'API et sans quota (projet libre financé par dons). Ses styles `positron` et
// `dark` sont les portages des fonds CARTO Positron et Dark Matter utilisés
// auparavant : rendu identique, mais `basemaps.cartocdn.com` exige désormais
// une clé et estampille les tuiles d'un filigrane « API KEY REQUIRED ».
const STYLE_URL: Record<Theme, string> = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
}
const TILE_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> © OpenStreetMap contributors'

// Miroirs de --color-accent : Leaflet dessine le tracé dans un canvas et
// n'interprète pas les variables CSS. À garder alignés sur globals.css.
const ROUTE_COLOR: Record<Theme, string> = {
  dark: '#3b9dfa',
  light: '#1b6fc9',
}

interface RouteMapProps {
  // Fournir soit gpxData (aperçu client d'un fichier .gpx avant envoi), soit
  // points (trace GPS persistée, rechargée depuis GET /activities/:id/track).
  gpxData?: string
  points?: RoutePoint[]
  onStats?: (stats: GpxStats) => void
  className?: string
}

export function RouteMap({ gpxData, points, onStats, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    let map: LeafletMap | undefined
    let cancelled = false

    async function init() {
      const leaflet = await import('leaflet')
      const L = leaflet.default
      // Pont Leaflet ↔ MapLibre : les tuiles vectorielles sont rendues au WebGL
      // dans le tilePane, sous les calques Leaflet habituels (tracé, marqueurs).
      const { maplibreGL } = await import('@maplibre/maplibre-gl-leaflet')

      if (cancelled || !containerRef.current) return

      // minZoom 1 : au zoom 0 les deux moteurs se désynchronisent (cf. README
      // du pont). maxZoom 20 reprend le plafond de l'ancien calque raster —
      // les tuiles vectorielles s'arrêtent au zoom 14 et sont sur-zoomées
      // au-delà, sans perte de netteté puisqu'elles sont redessinées.
      map = L.map(containerRef.current, { minZoom: 1, maxZoom: 20 })

      // Le calque GL lit le centre de la carte à son ajout : il ne peut être
      // posé qu'une fois la vue cadrée sur la trace.
      const addBaseLayer = (target: LeafletMap) =>
        maplibreGL({
          style: STYLE_URL[theme],
          // Le pont recopie sinon l'attribution déduite du style dans le
          // contrôle Leaflet, en double de la nôtre.
          attributionControl: false,
        }).addTo(target)

      if (points) {
        const latLngs = points
          .filter((p): p is { latitude: number; longitude: number } => p.latitude != null && p.longitude != null)
          .map((p) => [p.latitude, p.longitude] as [number, number])
        if (latLngs.length === 0) return

        const polyline = L.polyline(latLngs, { color: ROUTE_COLOR[theme], weight: 4 }).addTo(map)
        map.fitBounds(polyline.getBounds())
        map.attributionControl.addAttribution(TILE_ATTRIBUTION)
        addBaseLayer(map)
        return
      }

      if (!gpxData) return

      // leaflet-gpx est un vieux plugin sans wrapper CJS/ESM : il s'attend à
      // trouver `L` en global (référence nue non déclarée, résolue via
      // window en mode strict) avant de s'exécuter.
      ;(window as unknown as { L: typeof L }).L = L
      await import('leaflet-gpx')
      if (cancelled) return

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })

      const GPX = (L as unknown as { GPX: new (data: string, options?: object) => GpxLayer }).GPX
      const gpxLayer = new GPX(gpxData, {
        async: true,
        polyline_options: { color: ROUTE_COLOR[theme], weight: 4 },
      })
      gpxLayer.on('loaded', (e: LeafletEvent) => {
        const layer = e.target as GpxLayer
        // Le parsing est asynchrone : l'effet peut avoir été nettoyé entretemps,
        // et poser le calque GL rouvrirait un contexte WebGL sur une carte morte.
        if (cancelled || !map) return
        map.fitBounds(layer.getBounds())
        map.attributionControl.addAttribution(TILE_ATTRIBUTION)
        addBaseLayer(map)
        onStats?.({
          distanceM: layer.get_distance(),
          elevationGainM: layer.get_elevation_gain(),
          elevationLossM: layer.get_elevation_loss(),
          totalTimeMs: layer.get_total_time(),
        })
      })
      gpxLayer.addTo(map)
    }

    init()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [gpxData, points, onStats, theme])

  return <div ref={containerRef} className={className ?? 'w-full h-[220px] rounded-md'} />
}
