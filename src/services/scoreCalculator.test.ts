import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateConfidenceScore, countMatchingEvidence } from './scoreCalculator';

describe('calculateConfidenceScore', () => {
  it('computes rounded percentages', () => {
    expect(calculateConfidenceScore(3, 4)).toBe(75);
    expect(calculateConfidenceScore(0, 4)).toBe(0);
    expect(calculateConfidenceScore(4, 4)).toBe(100);
    expect(calculateConfidenceScore(1, 3)).toBe(33);
    expect(calculateConfidenceScore(2, 3)).toBe(67);
  });

  it('returns 0 for a cryptid with no associated evidence', () => {
    expect(calculateConfidenceScore(0, 0)).toBe(0);
  });

  it('returns 0 when total is 0', () => {
    expect(calculateConfidenceScore(5, 0)).toBe(0);
    expect(calculateConfidenceScore(0, 0)).toBe(0);
  });

  it('clamps matching above total to 100 and negative to 0', () => {
    expect(calculateConfidenceScore(9, 4)).toBe(100);
    expect(calculateConfidenceScore(-3, 4)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(calculateConfidenceScore(NaN, 4)).toBe(0);
    expect(calculateConfidenceScore(2, Infinity)).toBe(0);
  });

  /** **Validates: Requirements IR-003, CI-002, AC-CI-002** */
  it('Property 1: Confidence Score Bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (m, t) => {
          const s = calculateConfidenceScore(m, t);
          return Number.isInteger(s) && s >= 0 && s <= 100;
        },
      ),
    );
  });
});

describe('countMatchingEvidence', () => {
  it('counts overlap', () => {
    expect(countMatchingEvidence(['a', 'b', 'x'], ['a', 'b', 'c'])).toBe(2);
  });

  it('counts duplicates once', () => {
    expect(countMatchingEvidence(['a', 'a', 'a'], ['a', 'b'])).toBe(1);
  });

  it('returns 0 with no overlap', () => {
    expect(countMatchingEvidence(['x'], ['a', 'b'])).toBe(0);
    expect(countMatchingEvidence([], ['a'])).toBe(0);
  });
});
