import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createIPFSClient } from './ipfs.js'

describe('Kubo IPFS API adapter', () => {
  it('sends actual file bytes to the Kubo add API and returns its CID', async () => {
    let request
    const client = createIPFSClient({
      apiUrl: 'http://127.0.0.1:5001',
      apiToken: 'unit-test-token',
      fetchImpl: async (url, options) => {
        request = { url: String(url), options }
        return { ok: true, async text() { return '{"Name":"report.pdf","Hash":"bafybeigdyrzt123456789","Size":"9"}\n' } }
      },
    })
    const cid = await client.add({ bytes: Buffer.from('%PDF-test'), fileName: 'report.pdf', contentType: 'application/pdf' })
    assert.equal(cid, 'bafybeigdyrzt123456789')
    assert.match(request.url, /\/api\/v0\/add\?pin=true&cid-version=1$/)
    assert.equal(request.options.headers.Authorization, 'Bearer unit-test-token')
    assert.ok(request.options.body instanceof FormData)
    const uploaded = request.options.body.get('file')
    assert.equal(uploaded.name, 'report.pdf')
    assert.equal(await uploaded.text(), '%PDF-test')
  })

  it('does not expose API credentials or endpoint details when unreachable', async () => {
    const client = createIPFSClient({ apiUrl: 'http://127.0.0.1:5001', apiToken: 'must-not-leak', fetchImpl: async () => { throw new Error('socket error') } })
    await assert.rejects(client.add({ bytes: Buffer.from('x'), fileName: 'x.pdf', contentType: 'application/pdf' }), /^Error: The configured IPFS API could not be reached$/)
  })

  it('rejects URLs containing embedded credentials', () => {
    assert.throws(() => createIPFSClient({ apiUrl: 'http://user:password@localhost:5001' }), /without embedded credentials/)
  })
})
