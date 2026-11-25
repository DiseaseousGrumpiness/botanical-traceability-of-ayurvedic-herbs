import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { countBatches, loadDashboardData } from './dashboardData.js'

describe('dashboard ledger loading', () => {
  it('keeps successfully returned ledger batches available when the separate health request fails', async () => {
    const batches = [{ batchId: 'LEDGER-001', qualityStatus: 'PENDING' }]
    const result = await loadDashboardData(
      async () => { throw new Error('health check unavailable') },
      async () => batches,
    )
    assert.equal(result.batches, batches)
    assert.equal(result.health, null)
    assert.equal(result.healthError, 'health check unavailable')
  })

  it('surfaces a batch API failure and rejects a mismatched response shape', async () => {
    await assert.rejects(loadDashboardData(async () => ({}), async () => { throw new Error('Fabric unavailable') }), /Fabric unavailable/)
    await assert.rejects(loadDashboardData(async () => ({}), async () => ({ batches: [] })), /expected a batch list/)
  })

  it('counts statuses directly from ledger records', () => {
    assert.deepEqual(countBatches([
      { qualityStatus: 'APPROVED', status: 'COLLECTED' },
      { qualityStatus: 'REJECTED', status: 'TRANSFERRED' },
      { qualityStatus: 'PENDING', status: 'COLLECTED' },
      { status: 'COLLECTED' },
    ]), { total: 4, approved: 1, rejected: 1, pending: 1, unknown: 1, transferred: 1 })
  })
})
