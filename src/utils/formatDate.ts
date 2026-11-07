/**
 * Formats an ISO 8601 date string into a bureau-style display date.
 * e.g. "2024-10-14T00:00:00.000Z" → "14 OCT 2024"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Returns a timestamp string in bureau format.
 * e.g. "14 OCT 2024 — 23:47 UTC"
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${day} ${month} ${year} — ${hours}:${minutes} UTC`
}
