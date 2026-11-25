/** Load ledger batches as the primary availability signal. /health is supplemental. */
export async function loadDashboardData(getHealth, getAllBatches) {
  const [healthResult, batchesResult] = await Promise.allSettled([getHealth(), getAllBatches()])

  if (batchesResult.status === 'rejected') throw batchesResult.reason
  if (!Array.isArray(batchesResult.value)) {
    throw new Error('Batch API returned an unexpected response (expected a batch list).')
  }

  const health = healthResult.status === 'fulfilled' ? healthResult.value : null
  const healthError = healthResult.status === 'rejected'
    ? (healthResult.reason?.message || 'Health endpoint request failed')
    : (health && typeof health.fabricConnected === 'boolean' ? null : 'Health endpoint returned an unexpected response')

  return { batches: batchesResult.value, health, healthError }
}

export function countBatches(batches) {
  return batches.reduce((counts, batch) => {
    counts.total += 1
    const quality = String(batch.qualityStatus || '').toUpperCase()
    if (quality === 'APPROVED') counts.approved += 1
    else if (quality === 'REJECTED') counts.rejected += 1
    else if (quality === 'PENDING') counts.pending += 1
    else counts.unknown += 1

    if (String(batch.status || '').toUpperCase() === 'TRANSFERRED') counts.transferred += 1
    return counts
  }, { total: 0, approved: 0, rejected: 0, pending: 0, unknown: 0, transferred: 0 })
}
