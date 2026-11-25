import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { parseResult } from './fabric.js'

const ROLES = new Set(['COLLECTOR', 'PROCESSOR', 'DISTRIBUTOR', 'RETAILER', 'ADMIN'])

export function createApp({ contract, principals = {}, corsOrigins = ['http://localhost:5174', 'http://127.0.0.1:5174'], documentCIDEnabled = false, documentGateway = '', ipfsClient = null }) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      return callback(null, corsOrigins.includes(origin) ? origin : false)
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  }))
  app.use((_, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Cache-Control', 'no-store')
    next()
  })
  app.use(express.json({ limit: '12mb', strict: true }))

  function getPrincipal(req) {
    const header = req.get('authorization') || ''
    const match = /^Bearer ([\x21-\x7E]{24,8192})$/.exec(header)
    if (!match) return null
    const token = Buffer.from(match[1])
    for (const [candidate, principal] of Object.entries(principals)) {
      const expected = Buffer.from(candidate)
      if (token.length === expected.length && crypto.timingSafeEqual(token, expected)) return principal
    }
    return null
  }

  function requireRole(...roles) {
    return (req, res, next) => {
      const principal = getPrincipal(req)
      if (!principal) return res.status(401).json({ error: 'A valid bearer token is required for this operation' })
      req.principal = principal
      if (!roles.includes(principal.role)) return res.status(403).json({ error: 'Your role is not permitted to perform this operation' })
      next()
    }
  }

  function requiredString(value, field, maxLength = 256) {
    if (typeof value !== 'string' || !value.trim()) throw httpError(400, `${field} is required and must be a string`)
    const result = value.trim()
    if (result.length > maxLength) throw httpError(400, `${field} must be at most ${maxLength} characters`)
    return result
  }

  function parseFiniteNumber(value, field) {
    if (value === '' || value === null || value === undefined) throw httpError(400, `${field} must be a valid number`)
    const number = Number(value)
    if (!Number.isFinite(number)) throw httpError(400, `${field} must be a valid finite number`)
    return number
  }

  function parseDate(value) {
    const date = requiredString(value, 'collectionDate', 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, 'collectionDate must use YYYY-MM-DD format')
    const parsed = new Date(`${date}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw httpError(400, 'collectionDate is not a valid calendar date')
    return date
  }

  function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
  }

  async function readCommittedState(batchId) {
    const [batchResult, historyResult] = await Promise.allSettled([
      Promise.resolve().then(() => contract.evaluateTransaction('ReadBatch', batchId)).then(parseResult),
      Promise.resolve().then(() => contract.evaluateTransaction('GetBatchHistory', batchId)).then(parseResult),
    ])
    const batch = batchResult.status === 'fulfilled' && batchResult.value &&
      typeof batchResult.value === 'object' && !Array.isArray(batchResult.value)
      ? batchResult.value
      : null
    const history = historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)
      ? historyResult.value
      : null
    return { batch, history, readbackComplete: batch !== null && history !== null }
  }

  function committedWritePayload(message, state) {
    const warning = state.readbackComplete
      ? null
      : 'The ledger accepted the transaction, but the follow-up batch/history read was incomplete. Refresh before relying on displayed state; do not resubmit blindly.'
    return {
      message,
      writeCommitted: true,
      readbackComplete: state.readbackComplete,
      batch: state.batch,
      history: state.history,
      warning,
    }
  }

  function writeResponse(res, status, message, state) {
    return res.status(status).json(committedWritePayload(message, state))
  }

  function transactionNotConfirmed(operation) {
    return httpError(502, `Fabric did not confirm the ${operation}. Check the ledger state before retrying.`)
  }

  app.get('/health', asyncRoute(async (_req, res) => {
    let fabricConnected = false
    if (contract) {
      try {
        // A read-only state lookup checks Gateway connectivity without scanning
        // every batch in parallel with the dashboard's GetAllBatches request.
        await contract.evaluateTransaction('BatchExists', '__health_check__')
        fabricConnected = true
      } catch { fabricConnected = false }
    }
    res.json({ status: fabricConnected ? 'ok' : 'degraded', service: 'botanical-traceability-api', apiVersion: '2.1.0', fabricConnected })
  }))

  app.get('/api/auth/me', (req, res) => {
    const principal = getPrincipal(req)
    if (!principal) return res.status(401).json({ error: 'Invalid or missing bearer token' })
    res.json({ role: principal.role, actorId: principal.actorId })
  })

  app.use('/api', (_req, res, next) => {
    if (!contract) return res.status(503).json({ error: 'Fabric service is unavailable' })
    next()
  })

  app.get('/api/capabilities', (_req, res) => res.json({
    transfer: true,
    documents: {
      contractSupported: Boolean(documentCIDEnabled),
      uploadEnabled: Boolean(documentCIDEnabled && ipfsClient),
      gateway: documentGateway || null,
      reason: !documentCIDEnabled
        ? 'Disabled for deployed v1.1 sequence 2: it lacks AddDocumentCID and GetDocumentCIDs. Enable only after the approved sequence 3 upgrade.'
        : (!ipfsClient ? 'IPFS_API_URL is not configured.' : null),
    },
  }))

  app.get('/api/batches', asyncRoute(async (_req, res) => {
    const result = parseResult(await contract.evaluateTransaction('GetAllBatches'))
    if (result === null) return res.json([])
    if (!Array.isArray(result)) throw httpError(502, 'Fabric returned an unexpected batch list response')
    res.json(result)
  }))

  app.get('/api/batches/:batchId', asyncRoute(async (req, res) => {
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    try {
      const batch = parseResult(await contract.evaluateTransaction('ReadBatch', batchId))
      if (!batch || typeof batch !== 'object' || Array.isArray(batch)) throw httpError(502, 'Fabric returned an unexpected batch response')
      res.json(batch)
    } catch (error) {
      if (error.status) throw error
      if (/does not exist|not found/i.test(error.message)) return res.status(404).json({ error: 'Batch not found', batchId })
      throw error
    }
  }))

  app.get('/api/batches/:batchId/history', asyncRoute(async (req, res) => {
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    const result = parseResult(await contract.evaluateTransaction('GetBatchHistory', batchId))
    if (result === null) return res.json([])
    if (!Array.isArray(result)) throw httpError(502, 'Fabric returned an unexpected history response')
    res.json(result)
  }))

  app.post('/api/batches', requireRole('COLLECTOR', 'ADMIN'), asyncRoute(async (req, res) => {
    const body = req.body ?? {}
    const batchId = requiredString(body.batchId, 'batchId', 128)
    const herbName = requiredString(body.herbName, 'herbName')
    const scientificName = requiredString(body.scientificName, 'scientificName')
    const location = requiredString(body.collectionLocation, 'collectionLocation')
    const collectorId = requiredString(body.collectorId, 'collectorId', 128)
    if (req.principal.role !== 'ADMIN' && collectorId !== req.principal.actorId) throw httpError(403, 'collectorId must match the authenticated collector')
    const latitude = parseFiniteNumber(body.latitude, 'latitude')
    const longitude = parseFiniteNumber(body.longitude, 'longitude')
    const collectionDate = parseDate(body.collectionDate)
    const quantity = parseFiniteNumber(body.quantity, 'quantity')
    if (quantity <= 0) throw httpError(400, 'quantity must be greater than zero')
    if (latitude < -90 || latitude > 90) throw httpError(400, 'latitude must be between -90 and 90')
    if (longitude < -180 || longitude > 180) throw httpError(400, 'longitude must be between -180 and 180')
    const unit = requiredString(body.unit, 'unit', 32)
    try {
      await contract.submitTransaction('CreateBatch', batchId, herbName, scientificName, collectorId, location, String(latitude), String(longitude), collectionDate, String(quantity), unit)
    } catch (error) {
      if (/already exists|already registered/i.test(error.message)) throw httpError(409, 'Batch ID is already registered')
      throw transactionNotConfirmed('batch registration')
    }
    const state = await readCommittedState(batchId)
    writeResponse(res, 201, 'Batch registration committed on the blockchain.', state)
  }))

  app.patch('/api/batches/:batchId/quality', requireRole('PROCESSOR', 'ADMIN'), asyncRoute(async (req, res) => {
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    const status = requiredString(req.body?.status, 'status', 16)
    if (status !== 'APPROVED' && status !== 'REJECTED') throw httpError(400, 'status must be either APPROVED or REJECTED')
    try { await contract.submitTransaction('UpdateQualityStatus', batchId, status) }
    catch (error) {
      if (/does not exist|not found/i.test(error.message)) throw httpError(404, 'Batch not found')
      throw transactionNotConfirmed('quality update')
    }
    const state = await readCommittedState(batchId)
    res.status(200).json({ ...committedWritePayload(`Quality status ${status} committed on the blockchain.`, state), actorAttributionRecorded: false })
  }))

  app.post('/api/batches/:batchId/transfer', requireRole('PROCESSOR', 'DISTRIBUTOR', 'RETAILER', 'ADMIN'), asyncRoute(async (req, res) => {
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    const newOwner = requiredString(req.body?.newOwner, 'newOwner', 128)
    const location = requiredString(req.body?.location, 'location')
    let current
    try { current = parseResult(await contract.evaluateTransaction('ReadBatch', batchId)) }
    catch (error) {
      if (/does not exist|not found/i.test(error.message)) throw httpError(404, 'Batch not found')
      throw error
    }
    if (!current) throw httpError(404, 'Batch not found')
    if (typeof current !== 'object' || Array.isArray(current) || typeof current.currentOwner !== 'string') {
      throw httpError(502, 'Fabric returned an unexpected current-owner response')
    }
    if (req.principal.role !== 'ADMIN' && current.currentOwner !== req.principal.actorId) throw httpError(403, 'Only the authenticated current owner may transfer this batch')
    if (newOwner === current.currentOwner) throw httpError(400, 'newOwner must differ from the current owner')
    try { await contract.submitTransaction('TransferBatch', batchId, newOwner, location) }
    catch (error) {
      if (/does not exist|not found/i.test(error.message)) throw httpError(404, 'Batch not found')
      throw transactionNotConfirmed('ownership transfer')
    }
    const state = await readCommittedState(batchId)
    writeResponse(res, 200, `Transfer to ${newOwner} committed on the blockchain.`, state)
  }))

  app.get('/api/batches/:batchId/documents', asyncRoute(async (req, res) => {
    if (!documentCIDEnabled) return res.status(501).json({ error: 'Document CID transactions are unavailable: the deployed chaincode does not expose AddDocumentCID or GetDocumentCIDs' })
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    const result = parseResult(await contract.evaluateTransaction('GetDocumentCIDs', batchId))
    res.json(Array.isArray(result) ? result : [])
  }))

  app.post('/api/batches/:batchId/documents', requireRole('PROCESSOR', 'ADMIN'), asyncRoute(async (req, res) => {
    if (!documentCIDEnabled) return res.status(501).json({ error: 'Document CID transactions are unavailable: the deployed chaincode does not expose AddDocumentCID or GetDocumentCIDs' })
    if (!ipfsClient) return res.status(503).json({ error: 'IPFS upload is unavailable because IPFS_API_URL is not configured' })
    const batchId = requiredString(req.params.batchId, 'batchId', 128)
    const docType = requiredString(req.body?.docType, 'docType', 64)
    const fileName = requiredString(req.body?.fileName, 'fileName', 255)
    const contentType = requiredString(req.body?.contentType, 'contentType', 80).toLowerCase()
    const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
    if (!allowedTypes.has(contentType)) throw httpError(400, 'Only PDF, JPEG, and PNG documents are accepted')
    const encoded = req.body?.contentBase64
    if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > 12 * 1024 * 1024 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      throw httpError(400, 'contentBase64 must contain a valid base64-encoded file smaller than 8 MiB')
    }
    const bytes = Buffer.from(encoded, 'base64')
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw httpError(400, 'Document must be smaller than 8 MiB')
    const validSignature = contentType === 'application/pdf'
      ? bytes.subarray(0, 5).toString('ascii') === '%PDF-'
      : (contentType === 'image/png'
        ? bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    if (!validSignature) throw httpError(400, 'Document bytes do not match their declared PDF, JPEG, or PNG type')

    let cid
    try { cid = await ipfsClient.add({ bytes, fileName, contentType }) }
    catch (error) { throw httpError(502, error.message || 'IPFS upload failed') }

    try { await contract.submitTransaction('AddDocumentCID', batchId, cid, docType, req.principal.actorId) }
    catch (error) {
      const missingBatch = /does not exist|not found/i.test(error.message)
      throw httpError(missingBatch ? 404 : 502, `${missingBatch ? 'Batch not found. ' : 'Fabric did not confirm recording the document. '}IPFS CID ${cid} was uploaded and may remain unreferenced; check ledger state before retrying.`)
    }
    let documents = null
    try {
      const result = parseResult(await contract.evaluateTransaction('GetDocumentCIDs', batchId))
      if (Array.isArray(result)) documents = result
    } catch { /* The submit already committed; report the read-back limitation below. */ }
    const readbackComplete = documents !== null
    res.status(201).json({
      message: readbackComplete
        ? 'Document uploaded to IPFS and its CID recorded on the ledger.'
        : 'Document CID recording committed on the blockchain, but the document list could not be confirmed. Refresh before retrying.',
      writeCommitted: true,
      readbackComplete,
      cid,
      documents,
    })
  }))

  app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.path }))
  app.use((error, _req, res, _next) => {
    const unavailable = error.code === 'ECONNREFUSED' || error.code === 'UNAVAILABLE' || /ECONNREFUSED|connection refused/i.test(error.message || '')
    const status = error.status || (unavailable ? 503 : 500)
    console.error('[API error]', error.code || (unavailable ? 'FABRIC_UNAVAILABLE' : 'REQUEST_FAILED'))
    res.status(status).json({ error: status === 500 ? 'Request failed' : error.message })
  })
  return app
}

export function parsePrincipalConfig(raw = '') {
  if (!raw.trim()) return {}
  let parsed
  try { parsed = JSON.parse(raw) } catch { throw new Error('AUTH_TOKENS_JSON must be valid JSON') }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('AUTH_TOKENS_JSON must be an object')
  const entries = Object.entries(parsed)
  if (!entries.length) return {}
  const result = {}
  for (const [token, principal] of entries) {
    if (token.length < 24) throw new Error('Each configured bearer token must contain at least 24 characters')
    if (!principal || !ROLES.has(principal.role) || typeof principal.actorId !== 'string' || !principal.actorId.trim()) throw new Error('Each token must map to an allowed role and non-empty actorId')
    result[token] = { role: principal.role, actorId: principal.actorId.trim() }
  }
  return result
}

function httpError(status, message) { const error = new Error(message); error.status = status; return error }
