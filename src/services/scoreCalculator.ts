/**
 * Score calculator: pure functions for confidence score computation.
 * No imports from React or the store.
 */

/**
 * Confidence score as an integer percentage in [0, 100].
 * Returns 0 for non-positive totals or non-finite inputs.
 */
export function calculateConfidenceScore(
  matchingCount: number,
  totalAssociated: number,
): number {
  if (
    !Number.isFinite(matchingCount) ||
    !Number.isFinite(totalAssociated) ||
    totalAssociated <= 0
  ) {
    return 0;
  }
  const clamped = Math.min(Math.max(matchingCount, 0), totalAssociated);
  return Math.round((clamped / totalAssociated) * 100);
}

/**
 * Number of distinct collected evidence ids that are in associatedIds.
 */
export function countMatchingEvidence(
  collectedIds: readonly string[],
  associatedIds: readonly string[],
): number {
  const associated = new Set(associatedIds);
  let count = 0;
  for (const id of new Set(collectedIds)) {
    if (associated.has(id)) count += 1;
  }
  return count;
}
