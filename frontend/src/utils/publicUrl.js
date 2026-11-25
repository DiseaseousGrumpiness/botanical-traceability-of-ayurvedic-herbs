/** Build a public verification URL from an explicit demo origin or this browser's origin. */
export function buildVerificationUrl(batchId, publicAppUrl = '', currentOrigin = '') {
  const base = String(publicAppUrl || currentOrigin).trim()
  if (!base || !batchId) return ''

  try {
    const origin = new URL(base)
    if (!['http:', 'https:'].includes(origin.protocol)) return ''
    return new URL(`/verify/${encodeURIComponent(batchId)}`, origin.origin).toString()
  } catch {
    return ''
  }
}
