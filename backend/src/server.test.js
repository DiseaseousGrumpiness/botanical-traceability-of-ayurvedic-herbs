import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createApp, parsePrincipalConfig } from './app.js'

const TOKENS = {
  'collector-token-12345678901234567890': { role: 'COLLECTOR', actorId: 'COLLECTOR-01' },
  'processor-token-12345678901234567890': { role: 'PROCESSOR', actorId: 'PROCESSOR-01' },
  'distributor-token-12345678901234567890': { role: 'DISTRIBUTOR', actorId: 'COLLECTOR-01' },
  'retailer-token-12345678901234567890': { role: 'RETAILER', actorId: 'RETAILER-01' },
  'admin-token-123456789012345678901234': { role: 'ADMIN', actorId: 'ADMIN-01' },
}
const batch = {
  batchId: 'BATCH-001', herbName: 'Ashwagandha', scientificName: 'Withania somnifera',
  collectorId: 'COLLECTOR-01', collectionLocation: 'Pune', latitude: 18.5, longitude: 73.8,
  collectionDate: '2026-10-09', quantity: 5, unit: 'kg', qualityStatus: 'PENDING',
  currentOwner: 'COLLECTOR-01', status: 'COLLECTED', createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z',
}

function makeContract() {
  const state = {
    batch: structuredClone(batch), batches: [structuredClone(batch)],
    history: [{ eventId: 'tx-1', batchId: batch.batchId, timestamp: '2026-10-09T00:00:00Z' }],
    lastSubmit: null, calls: [], submitError: null, readErrors: {},
  }
  return {
    state,
    async evaluateTransaction(fn, ...args) {
      state.calls.push({ fn, args })
      if (state.readErrors[fn]) throw new Error(state.readErrors[fn])
      if (fn === 'BatchExists') return Buffer.from('false')
      if (fn === 'GetAllBatches') return Buffer.from(JSON.stringify(state.batches))
      if (fn === 'ReadBatch') {
        if (args[0] !== state.batch.batchId) throw new Error(`batch ${args[0]} does not exist`)
        return Buffer.from(JSON.stringify(state.batch))
      }
      if (fn === 'GetBatchHistory') return Buffer.from(JSON.stringify(state.history.filter((event) => event.batchId === args[0])))
      if (fn === 'GetDocumentCIDs') return Buffer.from('[]')
      throw new Error(`unexpected evaluate ${fn}`)
    },
    async submitTransaction(fn, ...args) {
      state.lastSubmit = { fn, args }
      if (state.submitError) throw new Error(state.submitError)
      if (fn === 'UpdateQualityStatus') {
        if (args[0] !== state.batch.batchId) throw new Error(`batch ${args[0]} does not exist`)
        state.batch.qualityStatus = args[1]
        state.history.push({ eventId: `quality-${state.history.length}`, batchId: args[0], timestamp: '2026-10-10T00:00:00Z' })
      }
      if (fn === 'TransferBatch') {
        if (args[0] !== state.batch.batchId) throw new Error(`batch ${args[0]} does not exist`)
        state.batch.currentOwner = args[1]
        state.batch.status = 'TRANSFERRED'
        state.history.push({ eventId: `transfer-${state.history.length}`, batchId: args[0], timestamp: '2026-10-11T00:00:00Z' })
      }
      if (fn === 'CreateBatch') {
        if (state.batches.some((item) => item.batchId === args[0])) throw new Error(`batch ${args[0]} already exists`)
        state.batch = { ...batch, batchId: args[0], herbName: args[1], scientificName: args[2], collectorId: args[3], collectionLocation: args[4], latitude: Number(args[5]), longitude: Number(args[6]), collectionDate: args[7], quantity: Number(args[8]), unit: args[9], currentOwner: args[3] }
        state.batches.push(state.batch)
        state.history.push({ eventId: `create-${args[0]}`, batchId: args[0], timestamp: '2026-10-09T00:00:00Z' })
      }
    },
  }
}

async function send(app, method, path, body, token) {
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = await response.json()
    return { status: response.status, body: json }
  } finally {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  }
}

describe('dashboard read API regression', () => {
  it('serves actual batch array while health uses a read-only point query', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'GET', '/api/batches')
    assert.equal(result.status, 200)
    assert.deepEqual(result.body, [batch])
    assert.deepEqual(contract.state.calls[0], { fn: 'GetAllBatches', args: [] })
    const health = await send(app, 'GET', '/health')
    assert.deepEqual(health.body, { status: 'ok', service: 'botanical-traceability-api', apiVersion: '2.1.0', fabricConnected: true })
    assert.equal(contract.state.calls.at(-1).fn, 'BatchExists')
  })

  it('returns an empty list for an empty Fabric result and rejects wrong response shapes', async () => {
    const contract = makeContract()
    contract.state.batches = []
    const app = createApp({ contract })
    assert.deepEqual((await send(app, 'GET', '/api/batches')).body, [])
    contract.evaluateTransaction = async () => Buffer.from('{"batches":[]}')
    assert.equal((await send(app, 'GET', '/api/batches')).status, 502)
  })

  it('reports degraded health and unavailable reads when no Fabric contract is connected', async () => {
    const app = createApp({ contract: null })
    const health = await send(app, 'GET', '/health')
    assert.equal(health.status, 200)
    assert.equal(health.body.status, 'degraded')
    assert.equal(health.body.fabricConnected, false)
    assert.equal((await send(app, 'GET', '/api/batches')).status, 503)
  })
})

describe('role-protected write operations', () => {
  it('rejects missing and insufficient credentials for batch registration', async () => {
    const app = createApp({ contract: makeContract(), principals: TOKENS })
    assert.equal((await send(app, 'POST', '/api/batches', {})).status, 401)
    assert.equal((await send(app, 'POST', '/api/batches', {}, 'processor-token-12345678901234567890')).status, 403)
    assert.equal((await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status: 'APPROVED' }, 'collector-token-12345678901234567890')).status, 403)
    assert.equal((await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'D-2', location: 'Pune' }, 'collector-token-12345678901234567890')).status, 403)
  })

  it('registers a batch only for the authenticated collector identity', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS })
    const payload = { ...batch, batchId: 'NEW-001', collectorId: 'COLLECTOR-01' }
    const result = await send(app, 'POST', '/api/batches', payload, 'collector-token-12345678901234567890')
    assert.equal(result.status, 201)
    assert.equal(result.body.writeCommitted, true)
    assert.equal(result.body.readbackComplete, true)
    assert.equal(result.body.history.length, 1)
    assert.equal(contract.state.lastSubmit.fn, 'CreateBatch')
    assert.deepEqual(contract.state.lastSubmit.args, ['NEW-001', 'Ashwagandha', 'Withania somnifera', 'COLLECTOR-01', 'Pune', '18.5', '73.8', '2026-10-09', '5', 'kg'])
    assert.equal((await send(app, 'POST', '/api/batches', { ...payload, collectorId: 'SPOOFED' }, 'collector-token-12345678901234567890')).status, 403)
  })

  it('rejects malformed registration values before invoking Fabric', async () => {
    const invalid = [
      { quantity: -1 }, { quantity: 0 }, { latitude: 91 }, { longitude: -181 },
      { collectionDate: '2026-02-30' }, { collectionDate: 'not-a-date' },
      { herbName: '   ' }, { batchId: 'x'.repeat(129) }, { quantity: null },
    ]
    for (const [index, changes] of invalid.entries()) {
      const contract = makeContract()
      const app = createApp({ contract, principals: TOKENS })
      const result = await send(app, 'POST', '/api/batches', { ...batch, batchId: `NEW-${index}`, ...changes }, 'collector-token-12345678901234567890')
      assert.equal(result.status, 400, JSON.stringify(changes))
      assert.equal(contract.state.lastSubmit, null, JSON.stringify(changes))
    }
  })

  it('rejects duplicate IDs and does not report a failed Fabric submission as committed', async () => {
    const duplicateContract = makeContract()
    const app = createApp({ contract: duplicateContract, principals: TOKENS })
    const duplicate = await send(app, 'POST', '/api/batches', { ...batch }, 'collector-token-12345678901234567890')
    assert.equal(duplicate.status, 409)
    assert.equal(duplicate.body.writeCommitted, undefined)

    const failingContract = makeContract()
    failingContract.state.submitError = 'endorsement rejected'
    const failingApp = createApp({ contract: failingContract, principals: TOKENS })
    const failed = await send(failingApp, 'POST', '/api/batches', { ...batch, batchId: 'NEW-FAILED' }, 'collector-token-12345678901234567890')
    assert.equal(failed.status, 502)
    assert.equal(failed.body.writeCommitted, undefined)
    assert.match(failed.body.error, /Fabric did not confirm/)
  })

  it('keeps registration success explicit if post-commit batch/history reads fail', async () => {
    const contract = makeContract()
    contract.state.readErrors.ReadBatch = 'gateway read timeout'
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'POST', '/api/batches', { ...batch, batchId: 'NEW-PARTIAL' }, 'collector-token-12345678901234567890')
    assert.equal(result.status, 201)
    assert.equal(result.body.writeCommitted, true)
    assert.equal(result.body.readbackComplete, false)
    assert.equal(result.body.batch, null)
    assert.match(result.body.warning, /do not resubmit blindly/)
    assert.doesNotMatch(result.body.message, /do not resubmit blindly/)
  })

  it('uses the deployed two-argument quality signature for both decisions and returns refreshed history', async () => {
    for (const status of ['APPROVED', 'REJECTED']) {
      const contract = makeContract()
      const app = createApp({ contract, principals: TOKENS })
      const result = await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status, actorId: 'untrusted' }, 'processor-token-12345678901234567890')
      assert.equal(result.status, 200)
      assert.deepEqual(contract.state.lastSubmit, { fn: 'UpdateQualityStatus', args: ['BATCH-001', status] })
      assert.equal(result.body.batch.qualityStatus, status)
      assert.equal(result.body.actorAttributionRecorded, false)
      assert.equal(result.body.writeCommitted, true)
      assert.equal(result.body.readbackComplete, true)
      assert.equal(result.body.history.length, 2)
      assert.deepEqual(contract.state.calls.slice(-2).map((call) => call.fn), ['ReadBatch', 'GetBatchHistory'])
    }
  })

  it('enforces quality role and status validation', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS })
    assert.equal((await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status: 'APPROVED' })).status, 401)
    assert.equal((await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status: 'PENDING' }, 'processor-token-12345678901234567890')).status, 400)
    assert.equal(contract.state.lastSubmit, null)
    assert.equal((await send(app, 'PATCH', '/api/batches/NO-BATCH/quality', { status: 'APPROVED' }, 'processor-token-12345678901234567890')).status, 404)
  })

  it('returns a committed-but-unrefreshed outcome when post-commit ledger reads fail', async () => {
    const contract = makeContract()
    contract.state.readErrors.ReadBatch = 'read timeout'
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status: 'APPROVED' }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 200)
    assert.equal(result.body.writeCommitted, true)
    assert.equal(result.body.readbackComplete, false)
    assert.equal(result.body.batch, null)
    assert.match(result.body.warning, /do not resubmit blindly/)
  })

  it('does not claim a quality update committed when Fabric rejects it', async () => {
    const contract = makeContract()
    contract.state.submitError = 'endorsement rejected'
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'PATCH', '/api/batches/BATCH-001/quality', { status: 'APPROVED' }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 502)
    assert.equal(result.body.writeCommitted, undefined)
    assert.equal(contract.state.batch.qualityStatus, 'PENDING')
  })

  it('transfers only for an authenticated current owner and uses deployed argument order', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'DISTRIBUTOR-09', location: 'Mumbai' }, 'distributor-token-12345678901234567890')
    assert.equal(result.status, 200)
    assert.deepEqual(contract.state.lastSubmit, { fn: 'TransferBatch', args: ['BATCH-001', 'DISTRIBUTOR-09', 'Mumbai'] })
    assert.equal(result.body.batch.currentOwner, 'DISTRIBUTOR-09')
    assert.equal(result.body.writeCommitted, true)
    assert.equal(result.body.readbackComplete, true)
    assert.equal(result.body.history.at(-1).eventId, 'transfer-1')
    assert.equal((await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'D-2', location: 'Delhi' }, 'processor-token-12345678901234567890')).status, 403)
    assert.equal((await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'D-2', location: 'Delhi' }, 'retailer-token-12345678901234567890')).status, 403)
  })

  it('keeps a committed transfer explicit if the post-commit history read fails', async () => {
    const contract = makeContract()
    contract.state.readErrors.GetBatchHistory = 'history query timed out'
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'D-2', location: 'Pune' }, 'distributor-token-12345678901234567890')
    assert.equal(result.status, 200)
    assert.equal(result.body.writeCommitted, true)
    assert.equal(result.body.readbackComplete, false)
    assert.equal(result.body.batch.currentOwner, 'D-2')
    assert.equal(result.body.history, null)
    assert.match(result.body.warning, /do not resubmit blindly/)
  })

  it('validates transfer fields, blocks self-transfer, and avoids submission on lookup failures', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS })
    assert.equal((await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'COLLECTOR-01', location: 'Pune' }, 'distributor-token-12345678901234567890')).status, 400)
    assert.equal((await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: '', location: 'Pune' }, 'distributor-token-12345678901234567890')).status, 400)
    assert.equal(contract.state.lastSubmit, null)

    const missing = await send(app, 'POST', '/api/batches/NO-BATCH/transfer', { newOwner: 'D-2', location: 'Pune' }, 'distributor-token-12345678901234567890')
    assert.equal(missing.status, 404)
    assert.equal(contract.state.lastSubmit, null)
  })

  it('does not claim a transfer committed when Fabric rejects it', async () => {
    const contract = makeContract()
    contract.state.submitError = 'endorsement rejected'
    const app = createApp({ contract, principals: TOKENS })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/transfer', { newOwner: 'D-2', location: 'Pune' }, 'distributor-token-12345678901234567890')
    assert.equal(result.status, 502)
    assert.equal(result.body.writeCommitted, undefined)
    assert.equal(contract.state.batch.currentOwner, 'COLLECTOR-01')
    contract.state.submitError = null
    const missing = await send(app, 'POST', '/api/batches/NO-BATCH/transfer', { newOwner: 'D-2', location: 'Pune' }, 'admin-token-123456789012345678901234')
    assert.equal(missing.status, 404)
    assert.equal(missing.body.writeCommitted, undefined)
  })

  it('keeps document writes blocked until the deployed contract supports both document transactions', async () => {
    const contract = makeContract()
    const app = createApp({ contract, principals: TOKENS, documentCIDEnabled: false })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/documents', { cid: 'QmExample', docType: 'LAB_REPORT' }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 501)
    assert.match(result.body.error, /deployed chaincode/)
    assert.equal(contract.state.lastSubmit, null)
  })

  it('uploads real file bytes through the configured IPFS adapter before recording its returned CID', async () => {
    const contract = makeContract()
    let uploaded
    const app = createApp({
      contract,
      principals: TOKENS,
      documentCIDEnabled: true,
      documentGateway: 'http://127.0.0.1:8080/ipfs',
      ipfsClient: { async add(input) { uploaded = input; return 'bafybeigdyrzt123456789' } },
    })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/documents', {
      docType: 'LAB_REPORT', fileName: 'report.pdf', contentType: 'application/pdf', contentBase64: Buffer.from('%PDF-test').toString('base64'),
    }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 201)
    assert.equal(uploaded.fileName, 'report.pdf')
    assert.equal(uploaded.contentType, 'application/pdf')
    assert.equal(Buffer.from(uploaded.bytes).toString(), '%PDF-test')
    assert.deepEqual(contract.state.lastSubmit, { fn: 'AddDocumentCID', args: ['BATCH-001', 'bafybeigdyrzt123456789', 'LAB_REPORT', 'PROCESSOR-01'] })
  })

  it('retrieves document metadata only when document chaincode support is explicitly enabled', async () => {
    const contract = makeContract()
    const app = createApp({ contract, documentCIDEnabled: true, ipfsClient: { async add() { throw new Error('not used') } } })
    const capability = await send(app, 'GET', '/api/capabilities')
    assert.equal(capability.status, 200)
    assert.equal(capability.body.documents.contractSupported, true)
    assert.equal(capability.body.documents.uploadEnabled, true)
    const result = await send(app, 'GET', '/api/batches/BATCH-001/documents')
    assert.equal(result.status, 200)
    assert.deepEqual(result.body, [])
    assert.deepEqual(contract.state.calls.at(-1), { fn: 'GetDocumentCIDs', args: ['BATCH-001'] })
  })

  it('rejects mismatched document bytes before contacting IPFS', async () => {
    let uploads = 0
    const app = createApp({
      contract: makeContract(), principals: TOKENS, documentCIDEnabled: true,
      ipfsClient: { async add() { uploads += 1; return 'bafyunused' } },
    })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/documents', {
      docType: 'LAB_REPORT', fileName: 'fake.pdf', contentType: 'application/pdf', contentBase64: Buffer.from('not a PDF').toString('base64'),
    }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 400)
    assert.equal(uploads, 0)
  })

  it('discloses an unreferenced IPFS CID when Fabric does not confirm document recording', async () => {
    const contract = makeContract()
    contract.state.submitError = 'endorsement rejected'
    const app = createApp({
      contract, principals: TOKENS, documentCIDEnabled: true,
      ipfsClient: { async add() { return 'bafyrealfromipfs123' } },
    })
    const result = await send(app, 'POST', '/api/batches/BATCH-001/documents', {
      docType: 'LAB_REPORT', fileName: 'report.pdf', contentType: 'application/pdf',
      contentBase64: Buffer.from('%PDF-test').toString('base64'),
    }, 'processor-token-12345678901234567890')
    assert.equal(result.status, 502)
    assert.equal(result.body.writeCommitted, undefined)
    assert.match(result.body.error, /uploaded and may remain unreferenced/)
  })
})

describe('authentication configuration', () => {
  it('rejects weak tokens and invalid roles while keeping secrets out of messages', () => {
    assert.throws(() => parsePrincipalConfig('{"short":{"role":"ADMIN","actorId":"x"}}'), /at least 24/)
    assert.throws(() => parsePrincipalConfig('{"long-enough-token-value-12345":{"role":"ROOT","actorId":"x"}}'), /allowed role/)
    assert.deepEqual(parsePrincipalConfig(''), {})
  })
})
