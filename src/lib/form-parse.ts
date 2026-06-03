/** Parse a form string to integer. Returns undefined for NaN or empty. */
export function toInt(v: string): number | undefined {
  const n = parseInt(v)
  return isNaN(n) ? undefined : n
}

/** Parse a form string to integer, returning undefined for non-positive values.
 * Use for fields where 0 is semantically "not set" (e.g. nutrition macros). */
export function toPositiveInt(v: string): number | undefined {
  const n = parseInt(v)
  return isNaN(n) || n <= 0 ? undefined : n
}

/** Parse a form string to float. Returns undefined for NaN or empty. */
export function toFloat(v: string): number | undefined {
  const n = parseFloat(v)
  return isNaN(n) ? undefined : n
}
