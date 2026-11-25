/**
 * API client for the Botanical Traceability backend.
 * All calls go through the Vite proxy to the configured local backend.
 * No mock data — real errors are surfaced to the caller.
 */

let bearerToken = null

/** Keep the write credential in memory only; it is not persisted in browser storage. */
export function setApiToken(token) {
  bearerToken = token || null
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (bearerToken) headers.set('Authorization', `Bearer ${bearerToken}`)
  const res = await fetch(path, { ...options, headers })

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      (typeof body === 'object' && body.error) ||
      (typeof body === 'string' && body) ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/** GET /health → { status, service, apiVersion, fabricConnected } */
export function getHealth() {
  return request('/health');
}

/** GET /api/auth/me → authenticated role and actor ID (never the token). */
export function getCurrentIdentity() {
  return request('/api/auth/me')
}

/** GET /api/capabilities → enabled write integrations. */
export function getCapabilities() {
  return request('/api/capabilities')
}

/** GET /api/batches → HerbBatch[] */
export function getAllBatches() {
  return request('/api/batches');
}

/** GET /api/batches/:batchId → HerbBatch */
export function getBatch(batchId) {
  return request(`/api/batches/${encodeURIComponent(batchId)}`);
}

/** GET /api/batches/:batchId/history → TraceEvent[] */
export function getBatchHistory(batchId) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/history`);
}

/**
 * POST /api/batches → { message, writeCommitted, readbackComplete, batch, history, warning }
 * @param {Object} data
 * @param {string} data.batchId
 * @param {string} data.herbName
 * @param {string} data.scientificName
 * @param {string} data.collectorId
 * @param {string} data.collectionLocation
 * @param {number} data.latitude
 * @param {number} data.longitude
 * @param {string} data.collectionDate  YYYY-MM-DD
 * @param {number} data.quantity
 * @param {string} data.unit
 */
export function createBatch(data) {
  return request('/api/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/batches/:batchId/quality → committed outcome, refreshed batch/history, and actorAttributionRecorded: false
 * @param {string} batchId
 * @param {{ status: 'APPROVED'|'REJECTED' }} data
 */
export function updateQualityStatus(batchId, data) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/quality`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** POST /api/batches/:batchId/transfer → committed outcome, refreshed batch/history, warning when read-back was incomplete */
export function transferBatch(batchId, data) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/transfer`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** GET /api/batches/:batchId/documents → DocumentCIDRecord[] */
export function getBatchDocuments(batchId) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/documents`)
}

/** POST /api/batches/:batchId/documents using a real file payload for IPFS upload. */
export function uploadBatchDocument(batchId, data) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/documents`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
