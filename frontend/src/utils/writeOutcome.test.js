import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getCommittedWriteFeedback } from './writeOutcome.js'

describe('ledger write feedback', () => {
  it('accepts only explicit backend commit confirmation', () => {
    assert.throws(() => getCommittedWriteFeedback({ message: 'Updated' }, 'quality update'), /did not confirm/)
    assert.throws(() => getCommittedWriteFeedback({ writeCommitted: false }, 'transfer'), /did not confirm/)
  })

  it('distinguishes a fully read-back commit from a committed write with refresh failure', () => {
    assert.deepEqual(getCommittedWriteFeedback({
      writeCommitted: true, readbackComplete: true, message: 'Quality status APPROVED committed.',
    }, 'quality update'), {
      readbackComplete: true,
      message: 'Quality status APPROVED committed.',
      warning: null,
    })
    assert.deepEqual(getCommittedWriteFeedback({
      writeCommitted: true, readbackComplete: false, warning: 'Refresh the ledger.',
    }, 'transfer'), {
      readbackComplete: false,
      message: 'transfer committed on the blockchain.',
      warning: 'Refresh the ledger.',
    })
  })
})
