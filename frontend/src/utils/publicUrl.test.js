import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildVerificationUrl } from './publicUrl.js'

describe('public QR verification URL', () => {
  it('uses an explicitly configured LAN origin instead of the laptop browser origin', () => {
    assert.equal(
      buildVerificationUrl('BATCH / 01', 'http://192.168.1.25:5174', 'http://127.0.0.1:5174'),
      'http://192.168.1.25:5174/verify/BATCH%20%2F%2001',
    )
  })

  it('uses the current browser origin when no external demo origin is configured', () => {
    assert.equal(buildVerificationUrl('BATCH-01', '', 'http://localhost:5174'), 'http://localhost:5174/verify/BATCH-01')
  })

  it('rejects invalid or non-web origins without creating a misleading QR URL', () => {
    assert.equal(buildVerificationUrl('BATCH-01', 'javascript:alert(1)', 'http://localhost:5174'), '')
    assert.equal(buildVerificationUrl('BATCH-01', 'not a url', ''), '')
  })
})
