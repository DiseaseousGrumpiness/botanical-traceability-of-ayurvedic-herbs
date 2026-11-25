import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Leaf, AlertCircle, CheckCircle, XCircle, Clock, MapPin, Package, User, Calendar, Hash, Search } from 'lucide-react'
import { getBatch, getBatchHistory } from '../api'
import { QualityBadge, StatusBadge } from '../components/StatusBadge'
import ProvenanceTimeline from '../components/ProvenanceTimeline'
import { displayValue, formatCoordinates, formatLedgerTimestamp, formatQuantity, normalizeHistoryResponse } from '../utils/traceability'
import { buildVerificationUrl } from '../utils/publicUrl'

export default function Verify() {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyError, setHistoryError] = useState(null)
  const requestId = useRef(0)

  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL || ''
  const verifyUrl = buildVerificationUrl(
    batchId || '',
    publicAppUrl,
    typeof window !== 'undefined' ? window.location.origin : '',
  )

  const fetchData = useCallback(async () => {
    const currentRequest = ++requestId.current
    if (!batchId) {
      setBatch(null)
      setHistory([])
      setError('No batch ID was provided.')
      setHistoryError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setHistoryError(null)
    setBatch(null)
    setHistory([])

    const [batchResult, historyResult] = await Promise.allSettled([
      getBatch(batchId),
      getBatchHistory(batchId),
    ])

    if (currentRequest !== requestId.current) return
    if (batchResult.status === 'fulfilled') {
      if (batchResult.value && typeof batchResult.value === 'object' && !Array.isArray(batchResult.value)) {
        setBatch(batchResult.value)
      } else {
        setError('Batch API returned an unexpected response.')
      }
    } else {
      const status = batchResult.reason?.status
      if (status === 404) {
        setError(`Batch "${batchId}" was not found. It may not have been registered yet.`)
      } else {
        setError(batchResult.reason?.message || 'Failed to load batch from the ledger API.')
      }
    }

    if (historyResult.status === 'fulfilled') {
      try {
        setHistory(normalizeHistoryResponse(historyResult.value))
      } catch (historyShapeError) {
        setHistoryError(historyShapeError.message)
      }
    } else {
      setHistoryError(historyResult.reason?.message || 'History could not be loaded from the ledger API.')
    }

    if (currentRequest === requestId.current) setLoading(false)
  }, [batchId])

  useEffect(() => {
    fetchData()
    return () => { requestId.current += 1 }
  }, [fetchData])

  return (
    <div className="verify-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Search size={14} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-sm text-muted">Public Verification — No authentication required</span>
        </div>

        {!loading && batch && (
          <div className="verify-hero">
            <div className="verify-hero-id">
              <Hash size={12} style={{ display: 'inline', marginRight: '0.25rem' }} aria-hidden="true" />
              {batch.batchId}
            </div>
            <div className="verify-hero-name">{displayValue(batch.herbName)}</div>
            {batch.scientificName && (
              <div className="verify-hero-scientific">{batch.scientificName}</div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <QualityBadge status={batch.qualityStatus} />
              <StatusBadge status={batch.status} />
            </div>
          </div>
        )}

        {!loading && !batch && !error && (
          <h1 className="page-title">
            <Search size={22} aria-hidden="true" />
            Verify Batch
          </h1>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container" aria-live="polite" aria-busy="true">
          <div className="spinner" role="status">
            <span className="sr-only">Verifying batch…</span>
          </div>
          <span className="text-muted">Verifying batch on blockchain…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-error mb-2" role="alert">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Verification failed:</strong> {error}
          </div>
        </div>
      )}

      {!loading && batch && (
        <>
          {/* Quality status highlight */}
          <div className="alert alert-success mb-2" role="status">
            <CheckCircle size={18} className="alert-icon" aria-hidden="true" />
            <div><strong>Ledger record found</strong> — these details and the recorded quality status were returned by the batch API. A ledger record does not independently verify the physical herb or the truth of submitted information.</div>
          </div>
          <QualityHighlight status={batch.qualityStatus} />

          {/* QR code */}
          <div className="qr-section mb-2">
            <div className="qr-section-title">Scan to Verify</div>
            <QRCodeSVG
              value={verifyUrl}
              size={160}
              level="M"
              includeMargin
              aria-label={`QR code for verifying batch ${batchId}`}
            />
            <div className="qr-url" aria-label="Verification URL">{verifyUrl}</div>
            {!publicAppUrl && <p className="text-sm text-muted">This QR uses the address currently open in this browser. For a phone scan, start the app with the laptop's local IPv4 address configured; see the README LAN demo instructions.</p>}
          </div>

          {/* Batch details */}
          <div className="card mb-2">
            <div className="card-title mb-2">Batch Details</div>
            <div className="detail-grid">
              <DetailItem icon={<Hash size={13} />} label="Batch ID" value={batch.batchId} mono />
              <DetailItem icon={<Leaf size={13} />} label="Herb Name" value={batch.herbName} />
              <DetailItem icon={<Leaf size={13} />} label="Scientific Name" value={batch.scientificName} mono />
              <DetailItem icon={<User size={13} />} label="Collector ID" value={batch.collectorId} />
              <DetailItem icon={<User size={13} />} label="Current Owner" value={batch.currentOwner} />
              <DetailItem icon={<MapPin size={13} />} label="Collection Location" value={batch.collectionLocation} />
              <DetailItem
                icon={<MapPin size={13} />}
                label="GPS Coordinates"
                value={formatCoordinates(batch.latitude, batch.longitude)}
                mono
              />
              <DetailItem icon={<Calendar size={13} />} label="Collection Date" value={batch.collectionDate} />
              <DetailItem
                icon={<Package size={13} />}
                label="Quantity"
                value={formatQuantity(batch.quantity, batch.unit)}
              />
              <DetailItem icon={<Clock size={13} />} label="Created At" value={formatLedgerTimestamp(batch.createdAt)} />
              <DetailItem icon={<Clock size={13} />} label="Updated At" value={formatLedgerTimestamp(batch.updatedAt)} />
            </div>
          </div>

          {/* Provenance chain */}
          <div className="card">
            <div className="card-title mb-2">
              <Clock size={15} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Full Provenance Chain ({history.length} event{history.length !== 1 ? 's' : ''})
            </div>
            {historyError && <div className="alert alert-error mb-2" role="alert"><AlertCircle size={16} className="alert-icon" aria-hidden="true" /><div><strong>History unavailable:</strong> {historyError}</div></div>}
            {!historyError && <ProvenanceTimeline events={history} />}
          </div>

          <div className="mt-2 text-center">
            <Link to={`/batches/${encodeURIComponent(batch.batchId)}`} className="btn btn-secondary btn-sm">
              View Full Details
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function QualityHighlight({ status }) {
  if (!status) return <div className="alert alert-warning mb-2" role="note"><Clock size={18} className="alert-icon" aria-hidden="true" /><div>Quality status was not recorded in the batch response.</div></div>
  const normalized = status.toUpperCase()

  if (normalized === 'APPROVED') {
    return (
      <div className="alert alert-success mb-2" role="status">
        <CheckCircle size={18} className="alert-icon" aria-hidden="true" />
        <div>
          <strong>Quality status recorded: APPROVED</strong> — The ledger records this status; the contract does not identify an authenticated human inspector.
        </div>
      </div>
    )
  }
  if (normalized === 'REJECTED') {
    return (
      <div className="alert alert-error mb-2" role="status">
        <XCircle size={18} className="alert-icon" aria-hidden="true" />
        <div>
          <strong>Quality status recorded: REJECTED</strong> — The ledger records this status; the contract does not identify an authenticated human inspector.
        </div>
      </div>
    )
  }
  return (
    <div className="alert alert-warning mb-2" role="status">
      <Clock size={18} className="alert-icon" aria-hidden="true" />
      <div>
        <strong>Quality status recorded: PENDING</strong> — No approved or rejected status is currently recorded.
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value, mono }) {
  return (
    <div className="detail-item">
      <span className="detail-label">
        <span aria-hidden="true" style={{ marginRight: '0.2rem', display: 'inline-flex', verticalAlign: 'middle' }}>{icon}</span>
        {label}
      </span>
      <span className={`detail-value${mono ? ' mono' : ''}`}>{displayValue(value)}</span>
    </div>
  )
}
