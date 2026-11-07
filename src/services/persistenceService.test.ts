import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
  selectPersistable,
  type PersistableSlice,
} from './persistenceService'
import { MemoryStorage } from '@/test/memoryStorage'

function slice(): PersistableSlice {
  return {
    caseStatuses: { 'case-001': 'in-progress' },
    collectedEvidence: { 'case-001': ['EV-001'] },
    observationNotes: { 'EV-001': 'note' },
    nodePositions: { 'case-001:EV-001': { x: 10, y: 20 } },
    connections: { 'case-001': [{ id: 'e1', source: 'EV-001', target: 'EV-002' }] },
    unlockedCryptidIds: ['cryptid-001'],
    reports: {},
  }
}

function throwingStorage(): Storage {
  const s = new MemoryStorage()
  s.getItem = () => {
    throw new Error('denied')
  }
  s.setItem = () => {
    throw new Error('quota')
  }
  return s
}

describe('persistenceService', () => {
  let storage: MemoryStorage
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    storage = new MemoryStorage()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => warn.mockRestore())

  it('returns null when key is missing', () => {
    expect(loadPersistedState(storage)).toBeNull()
  })

  it('round-trips saved state', () => {
    expect(savePersistedState(slice(), storage)).toBe(true)
    expect(loadPersistedState(storage)).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...slice(),
    })
  })

  it('writes only the seven persistable keys', () => {
    const state = { ...slice(), lastIdentificationResult: { outcome: 'success' }, act: () => 1 }
    savePersistedState(state, storage)
    const written = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    expect(Object.keys(written).sort()).toEqual(
      ['schemaVersion', ...Object.keys(slice())].sort()
    )
    expect(Object.keys(selectPersistable(state))).toHaveLength(7)
  })

  it('returns null and warns on corrupt JSON', () => {
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadPersistedState(storage)).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('removes key on schema version mismatch', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...slice(), schemaVersion: '0' }))
    expect(loadPersistedState(storage)).toBeNull()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it.each([
    ['array', '[]'],
    ['null', 'null'],
    ['number', '5'],
    ['missing keys', JSON.stringify({ schemaVersion: '1' })],
    [
      'bad status',
      JSON.stringify({ schemaVersion: '1', ...slice(), caseStatuses: { 'case-001': 'x' } }),
    ],
    [
      'NaN position (null in JSON)',
      JSON.stringify({
        schemaVersion: '1',
        ...slice(),
        nodePositions: { a: { x: null, y: 0 } },
      }),
    ],
  ])('returns null for invalid shape: %s', (_name, raw) => {
    storage.setItem(STORAGE_KEY, raw)
    expect(loadPersistedState(storage)).toBeNull()
  })

  it('parses hand-written valid JSON with the current schema version', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, ...slice() }),
    )
    expect(loadPersistedState(storage)).toEqual({ schemaVersion: CURRENT_SCHEMA_VERSION, ...slice() })
  })

  it.each(Object.keys(slice()) as Array<keyof PersistableSlice>)(
    'returns null when required field "%s" is missing',
    (key) => {
      const data: Record<string, unknown> = { schemaVersion: CURRENT_SCHEMA_VERSION, ...slice() }
      delete data[key]
      storage.setItem(STORAGE_KEY, JSON.stringify(data))
      expect(() => loadPersistedState(storage)).not.toThrow()
      expect(loadPersistedState(storage)).toBeNull()
    },
  )

  it('tolerates throwing storage', () => {
    const bad = throwingStorage()
    expect(loadPersistedState(bad)).toBeNull()
    expect(savePersistedState(slice(), bad)).toBe(false)
  })

  it('sanitizes unknown ids on load', () => {
    savePersistedState(
      { ...slice(), unlockedCryptidIds: ['cryptid-001', 'cryptid-001', 'nope'] },
      storage
    )
    expect(loadPersistedState(storage)?.unlockedCryptidIds).toEqual(['cryptid-001'])
  })

  it('clearPersistedState removes the key', () => {
    savePersistedState(slice(), storage)
    clearPersistedState(storage)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
})
