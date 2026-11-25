/** Display helpers for values returned by the ledger API. */
export function displayValue(value) {
  if (value === null || value === undefined || value === '') return 'Not recorded'
  return String(value)
}

export function formatLedgerTimestamp(value, locale) {
  if (value === null || value === undefined || value === '') return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp from ledger'
  return date.toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function formatCoordinates(latitude, longitude) {
  const hasLatitude = latitude !== null && latitude !== undefined && latitude !== ''
  const hasLongitude = longitude !== null && longitude !== undefined && longitude !== ''
  if (hasLatitude && hasLongitude) return `${latitude}, ${longitude}`
  if (hasLatitude) return `Latitude ${latitude}; longitude not recorded`
  if (hasLongitude) return `Latitude not recorded; longitude ${longitude}`
  return 'Not recorded'
}

export function formatQuantity(quantity, unit) {
  const hasQuantity = quantity !== null && quantity !== undefined && quantity !== ''
  const hasUnit = unit !== null && unit !== undefined && unit !== ''
  if (hasQuantity && hasUnit) return `${quantity} ${unit}`
  if (hasQuantity) return `${quantity}; unit not recorded`
  if (hasUnit) return `Quantity not recorded; unit ${unit}`
  return 'Not recorded'
}

export function normalizeHistoryResponse(value) {
  if (!Array.isArray(value)) throw new Error('History API returned an unexpected response (expected an event list).')
  if (value.some((event) => !event || typeof event !== 'object' || Array.isArray(event))) {
    throw new Error('History API returned an unexpected response (an event was malformed).')
  }
  return value
}

export function sortHistoryEvents(events) {
  return [...events].sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : Number.NaN
    const tb = b.timestamp ? Date.parse(b.timestamp) : Number.NaN
    if (!Number.isFinite(ta)) return Number.isFinite(tb) ? 1 : 0
    if (!Number.isFinite(tb)) return -1
    return ta - tb
  })
}
