import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { runIdentification } from '@/services/identificationEngine'
import { buildReport } from '@/services/reportBuilder'
import type { InvestigationReport } from '@/types/report'

/** Real seed-data report for case-001 with a note on EV-002 and one labelled connection. */
export function makeReport(): InvestigationReport {
  const caseData = CASES.find((c) => c.id === 'case-001')!
  const cryptid = CRYPTIDS.find((c) => c.id === caseData.correctCryptidId)!
  const ids = ['EV-001', 'EV-002', 'EV-003']
  const result = runIdentification({
    caseData,
    submittedCryptidId: cryptid.id,
    collectedEvidenceIds: ids,
    cryptids: CRYPTIDS,
    evidence: EVIDENCE,
  })
  return buildReport({
    caseData,
    cryptid,
    result,
    collectedEvidenceIds: ids,
    evidence: EVIDENCE,
    observationNotes: { 'EV-002': 'Bark was peeled in a clean spiral.' },
    connections: [{ id: 'c1', source: 'EV-001', target: 'EV-002', data: { label: 'Same direction of travel' } }],
    filedAt: '2024-10-14T23:47:00.000Z',
  })
}
