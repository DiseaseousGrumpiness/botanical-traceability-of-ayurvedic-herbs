import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { connectFabric } from './fabric.js'
import { createApp, parsePrincipalConfig } from './app.js'
import { createIPFSClient } from './ipfs.js'

export function parseList(value, fallback) {
  const values = String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  return values.length ? values : fallback
}

export async function startServer() {
  let fabric
  let contract
  try {
    fabric = await connectFabric()
    contract = fabric.contract
  } catch (error) {
    // Do not log configuration values, certificate paths, or credentials.
    console.error('Fabric Gateway setup failed:', error.code || 'CONFIGURATION_OR_CONNECTION_ERROR')
  }

  let principals
  try { principals = parsePrincipalConfig(process.env.AUTH_TOKENS_JSON) }
  catch (error) {
    console.error('Write authentication configuration is invalid:', error.message)
    principals = {}
  }

  let ipfsClient = null
  try { ipfsClient = createIPFSClient({ apiUrl: process.env.IPFS_API_URL, apiToken: process.env.IPFS_API_TOKEN || '' }) }
  catch (error) { console.error('IPFS adapter disabled:', error.message) }

  const app = createApp({
    contract,
    principals,
    corsOrigins: parseList(process.env.BOTANICAL_WEB_ORIGINS || process.env.WEB_ORIGINS, ['http://localhost:5174', 'http://127.0.0.1:5174']),
    documentCIDEnabled: process.env.DOCUMENT_CID_ENABLED === 'true' && process.env.DOCUMENT_CID_CHAINCODE_SEQUENCE === '3',
    documentGateway: process.env.IPFS_GATEWAY_URL || '',
    ipfsClient,
  })
  const port = Number(process.env.BOTANICAL_API_PORT || process.env.PORT || 3001)
  const host = process.env.BACKEND_HOST || '127.0.0.1'
  const server = app.listen(port, host, () => {
    console.log(`Botanical Traceability API listening on http://${host}:${port}`)
    console.log(contract ? 'Fabric Gateway configured; readiness is checked by /health.' : 'Fabric Gateway unavailable; API is in degraded mode.')
    console.log(Object.keys(principals).length ? 'Role-based write authentication is configured.' : 'Writes are disabled until role tokens are configured.')
  })

  function shutdown() {
    server.close(() => {
      fabric?.close()
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  return { app, server, fabric }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await startServer()
