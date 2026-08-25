// Convertit des secondes/km en "4'05"/km"
export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60)
  const sec = secPerKm % 60
  return `${min}'${String(sec).padStart(2, '0')}"/km`
}

// Convertit des secondes en "52'34""
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}'`
  return `${m}'${String(s).padStart(2, '0')}"`
}

// Convertit des mètres en "8,4 km"
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`
}

// Couleur du delta allure
export function paceColor(delta: number): string {
  if (delta < -10) return 'text-red-600'
  if (delta < -5) return 'text-orange-500'
  return 'text-green-600'
}

// Couleur du TSB
export function tsbColor(tsb: number): string {
  if (tsb < -20) return 'text-red-600'
  if (tsb < 0) return 'text-orange-500'
  return 'text-green-600'
}

// Convertit un ISO datetime en "Tue, Aug 4"
export function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))
}

// Deux dates tombent le même jour calendaire (comparaison locale)
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
