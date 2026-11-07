import type { PersistedState } from '@/types/persistence'

const CASE_STATUSES: readonly string[] = ['new', 'in-progress', 'identified', 'closed']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function everyValue(v: unknown, pred: (x: unknown) => boolean): boolean {
  return isRecord(v) && Object.values(v).every(pred)
}

function isPosition(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.x === 'number' &&
    Number.isFinite(v.x) &&
    typeof v.y === 'number' &&
    Number.isFinite(v.y)
  )
}

function isConnection(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.source === 'string' &&
    typeof v.target === 'string'
  )
}

function isReport(v: unknown): boolean {
  return isRecord(v) && typeof v.caseId === 'string'
}

/** Deep structural check of untrusted persisted data. */
export function isValidPersistedShape(data: unknown): data is PersistedState {
  if (!isRecord(data)) return false
  if (typeof data.schemaVersion !== 'string') return false
  return (
    everyValue(data.caseStatuses, (s) => typeof s === 'string' && CASE_STATUSES.includes(s)) &&
    everyValue(data.collectedEvidence, isStringArray) &&
    everyValue(data.observationNotes, (s) => typeof s === 'string') &&
    everyValue(data.nodePositions, isPosition) &&
    everyValue(data.connections, (c) => Array.isArray(c) && c.every(isConnection)) &&
    isStringArray(data.unlockedCryptidIds) &&
    everyValue(data.reports, isReport)
  )
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values))
}

function pick<T>(
  source: Record<string, T>,
  keep: (key: string, value: T) => boolean
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [k, v] of Object.entries(source)) {
    if (keep(k, v)) out[k] = v
  }
  return out
}

/**
 * Drops entries referencing ids that do not exist in seed data and
 * deduplicates arrays. Does not mutate its input.
 */
export function sanitizePersistedState(
  data: PersistedState,
  knownCaseIds: Iterable<string>,
  knownEvidenceIds: Iterable<string>,
  knownCryptidIds: Iterable<string>
): PersistedState {
  const cases = new Set(knownCaseIds)
  const evidence = new Set(knownEvidenceIds)
  const cryptids = new Set(knownCryptidIds)

  const collectedEvidence: Record<string, string[]> = {}
  for (const [caseId, ids] of Object.entries(data.collectedEvidence)) {
    if (!cases.has(caseId)) continue
    collectedEvidence[caseId] = dedupe(ids.filter((id) => evidence.has(id)))
  }

  const nodePositions = pick(data.nodePositions, (key) => {
    const sep = key.indexOf(':')
    if (sep < 0) return false
    return cases.has(key.slice(0, sep)) && evidence.has(key.slice(sep + 1))
  })

  const connections: Record<string, PersistedState['connections'][string]> = {}
  for (const [caseId, edges] of Object.entries(data.connections)) {
    if (!cases.has(caseId)) continue
    const seen = new Set<string>()
    connections[caseId] = edges.filter((e) => {
      if (seen.has(e.id) || !evidence.has(e.source) || !evidence.has(e.target)) return false
      seen.add(e.id)
      return true
    })
  }

  return {
    schemaVersion: data.schemaVersion,
    caseStatuses: pick(data.caseStatuses, (k) => cases.has(k)),
    collectedEvidence,
    observationNotes: pick(data.observationNotes, (k) => evidence.has(k)),
    nodePositions,
    connections,
    unlockedCryptidIds: dedupe(data.unlockedCryptidIds.filter((id) => cryptids.has(id))),
    reports: pick(data.reports, (k, r) => cases.has(k) && cases.has(r.caseId)),
  }
}
