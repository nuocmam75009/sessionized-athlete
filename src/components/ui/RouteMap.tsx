'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/lib/theme'
import type { FeatureGroup, LeafletEvent, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

// Les tuiles sont des images : contrairement au reste de l'interface, elles ne
// suivent pas les variables CSS et doivent être rechargées au changement de
// thème. CARTO sert le même jeu de données OSM dans les deux versions.
const TILE_URL: Record<Theme, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}
const TILE_ATTRIBUTION = '© OpenStreetMap contributors © CARTO'

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

      if (cancelled || !containerRef.current) return

      map = L.map(containerRef.current)
      L.tileLayer(TILE_URL[theme], {
        attribution: TILE_ATTRIBUTION,
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      if (points) {
        const latLngs = points
          .filter((p): p is { latitude: number; longitude: number } => p.latitude != null && p.longitude != null)
          .map((p) => [p.latitude, p.longitude] as [number, number])
        if (latLngs.length === 0) return

        const polyline = L.polyline(latLngs, { color: ROUTE_COLOR[theme], weight: 4 }).addTo(map)
        map.fitBounds(polyline.getBounds())
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
        map?.fitBounds(layer.getBounds())
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
