import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  displayValue, formatCoordinates, formatLedgerTimestamp, formatQuantity,
  normalizeHistoryResponse, sortHistoryEvents,
} from './traceability.js'

describe('traceability display helpers', () => {
  it('shows empty ledger fields instead of omitting them', () => {
    assert.equal(displayValue(''), 'Not recorded')
    assert.equal(displayValue(null), 'Not recorded')
    assert.equal(displayValue(0), '0')
    assert.equal(formatCoordinates(16.95, null), 'Latitude 16.95; longitude not recorded')
    assert.equal(formatQuantity(5, ''), '5; unit not recorded')
  })

  it('formats valid timestamps and identifies invalid or absent values', () => {
    assert.match(formatLedgerTimestamp('2026-10-09T12:43:00Z', 'en-US'), /2026/)
    assert.equal(formatLedgerTimestamp('not-a-date'), 'Invalid timestamp from ledger')
    assert.equal(formatLedgerTimestamp(null), 'Not recorded')
  })

  it('requires the actual history API list shape and retains event fields', () => {
    const event = { eventId: 'tx-1', timestamp: '2026-10-09T12:43:00Z', stateSnapshot: { status: 'COLLECTED' } }
    assert.deepEqual(normalizeHistoryResponse([event]), [event])
    assert.throws(() => normalizeHistoryResponse({ events: [event] }), /expected an event list/)
    assert.throws(() => normalizeHistoryResponse([null]), /event was malformed/)
  })

  it('sorts valid ledger timestamps chronologically and keeps invalid timestamps visible', () => {
    const events = [{ eventId: 'later', timestamp: '2026-10-10T00:00:00Z' }, { eventId: 'unknown' }, { eventId: 'earlier', timestamp: '2026-10-09T00:00:00Z' }]
    assert.deepEqual(sortHistoryEvents(events).map((event) => event.eventId), ['earlier', 'later', 'unknown'])
  })
})
