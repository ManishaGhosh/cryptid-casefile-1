import { useEffect, useState } from 'react'

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/**
 * Tracks a CSS media query. Where `matchMedia` does not exist (jsdom, SSR) it returns `fallback`
 * so components render their "wide screen" behaviour by default.
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const [matches, setMatches] = useState<boolean>(() => (hasMatchMedia() ? window.matchMedia(query).matches : fallback))

  useEffect(() => {
    if (!hasMatchMedia()) return
    const mql = window.matchMedia(query)
    const onChange = (): void => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
