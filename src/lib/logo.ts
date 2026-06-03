import fs from 'fs'
import { LOGO_FILE } from './data-paths'

// Module-level cache: avoids a disk read on every PDF request.
// Invalidated explicitly when the logo is uploaded or removed.
let _cached: string | null | undefined = undefined  // undefined = not yet loaded

export function getLogoData(): string | null {
  if (_cached !== undefined) return _cached
  try {
    _cached = fs.readFileSync(LOGO_FILE, 'utf-8').trim() || null
    return _cached
  } catch {
    _cached = null
    return null
  }
}

export function invalidateLogoCache(): void {
  _cached = undefined
}
