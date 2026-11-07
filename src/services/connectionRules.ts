import type { EvidenceConnection } from '@/types/board'

export const MAX_CONNECTION_LABEL = 80

/** True when a new connection source→target is allowed (no self-loop, no duplicate pair). */
export function canConnect(
  source: string,
  target: string,
  existing: EvidenceConnection[],
): boolean {
  if (source === target) return false
  return !existing.some(
    (e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source),
  )
}

/** Builds a connection with a deterministic, direction-independent id. */
export function makeConnection(
  source: string,
  target: string,
  sourceHandle?: string | null,
  targetHandle?: string | null,
): EvidenceConnection {
  const [a, b] = [source, target].sort()
  return {
    id: `conn-${a}__${b}`,
    source,
    target,
    sourceHandle: sourceHandle ?? null,
    targetHandle: targetHandle ?? null,
    type: 'investigator',
    data: { label: '' },
  }
}
