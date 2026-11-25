import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Leaf, AlertCircle, RefreshCw, Search,
  MapPin, Package, User, Calendar, Hash, Clock,
  CheckCircle, XCircle, ShieldCheck
} from 'lucide-react'
import { getBatch, getBatchHistory, updateQualityStatus, transferBatch, getCapabilities, getBatchDocuments, uploadBatchDocument } from '../api'
import { QualityBadge, StatusBadge } from '../components/StatusBadge'
import ProvenanceTimeline from '../components/ProvenanceTimeline'
import { displayValue, formatCoordinates, formatLedgerTimestamp, formatQuantity, normalizeHistoryResponse } from '../utils/traceability'
import { getCommittedWriteFeedback } from '../utils/writeOutcome'

export default function BatchDetail({ identity }) {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyError, setHistoryError] = useState(null)
  const requestId = useRef(0)
  const [transferForm, setTransferForm] = useState({ newOwner: '', location: '' })
  const [transferBusy, setTransferBusy] = useState(false)
  const [transferMessage, setTransferMessage] = useState(null)
  const [transferError, setTransferError] = useState(null)
  const [transferWarning, setTransferWarning] = useState(null)
  const [documentCapability, setDocumentCapability] = useState(null)
  const [documents, setDocuments] = useState([])
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentBusy, setDocumentBusy] = useState(false)
  const [documentMessage, setDocumentMessage] = useState(null)
  const [documentError, setDocumentError] = useState(null)
  const canTransfer = identity && ['PROCESSOR', 'DISTRIBUTOR', 'RETAILER', 'ADMIN'].includes(identity.role)
  const canAttachDocument = identity && ['PROCESSOR', 'ADMIN'].includes(identity.role)

  const fetchData = useCallback(async ({ preserveCurrent = false } = {}) => {
    const currentRequest = ++requestId.current
    if (!batchId) {
      setBatch(null)
      setHistory([])
      setError('No batch ID was provided.')
      setHistoryError(null)
      setLoading(false)
      return { batchAvailable: false, historyAvailable: false }
    }
    if (!preserveCurrent) setLoading(true)
    setError(null)
    setHistoryError(null)
    if (!preserveCurrent) {
      setBatch(null)
      setHistory([])
    }

    const [batchResult, historyResult] = await Promise.allSettled([
      getBatch(batchId),
      getBatchHistory(batchId),
    ])

    if (currentRequest !== requestId.current) return null
    let batchAvailable = false
    let historyAvailable = false
    if (batchResult.status === 'fulfilled') {
      if (batchResult.value && typeof batchResult.value === 'object' && !Array.isArray(batchResult.value)) {
        setBatch(batchResult.value)
        batchAvailable = true
      } else {
        setError('Batch API returned an unexpected response.')
      }
    } else {
      const status = batchResult.reason?.status
      if (status === 404) {
        setError(`Batch "${batchId}" not found on the blockchain.`)
      } else {
        setError(batchResult.reason?.message || 'Failed to load batch from the ledger API.')
      }
    }

    if (historyResult.status === 'fulfilled') {
      try {
        setHistory(normalizeHistoryResponse(historyResult.value))
        historyAvailable = true
      } catch (historyShapeError) {
        setHistoryError(historyShapeError.message)
      }
    } else {
      setHistoryError(historyResult.reason?.message || 'History could not be loaded from the ledger API.')
    }

    if (currentRequest === requestId.current && !preserveCurrent) setLoading(false)
    return { batchAvailable, historyAvailable }
  }, [batchId])

  useEffect(() => {
    fetchData()
    return () => { requestId.current += 1 }
  }, [fetchData])

  useEffect(() => {
    let active = true
    async function loadDocumentSupport() {
      setDocumentLoading(true)
      try {
        const capabilities = await getCapabilities()
        if (!active) return
        setDocumentCapability(capabilities.documents || { enabled: false, reason: 'The API did not report document support.' })
        if (capabilities.documents?.contractSupported && batchId) {
          const result = await getBatchDocuments(batchId)
          if (active) setDocuments(Array.isArray(result) ? result : [])
        }
      } catch (err) { if (active) setDocumentError(err.message || 'Could not load document support from the API.') }
      finally { if (active) setDocumentLoading(false) }
    }
    loadDocumentSupport()
    return () => { active = false }
  }, [batchId])

  async function submitTransfer(event) {
    event.preventDefault()
    setTransferError(null)
    setTransferMessage(null)
    setTransferWarning(null)
    setTransferBusy(true)
    try {
      const result = await transferBatch(batchId, transferForm)
      const feedback = getCommittedWriteFeedback(result, 'ownership transfer')
      if (result.batch) setBatch(result.batch)
      if (Array.isArray(result.history)) setHistory(normalizeHistoryResponse(result.history))
      setTransferMessage(feedback.message)
      setTransferWarning(feedback.warning)
      if (feedback.readbackComplete) setTransferForm({ newOwner: '', location: '' })
      try {
        const refreshed = await fetchData({ preserveCurrent: true })
        if (refreshed?.batchAvailable && refreshed.historyAvailable) setTransferWarning(null)
      }
      catch { setTransferWarning('The transfer was committed, but the page could not refresh. Use Refresh to query the ledger before retrying.') }
    } catch (err) { setTransferError(err.message || 'Transfer failed') }
    finally { setTransferBusy(false) }
  }

  async function submitDocument(event) {
    event.preventDefault()
    const form = event.currentTarget
    const file = form.elements.documentFile.files?.[0]
    if (!file) { setDocumentError('Choose a PDF, JPEG, or PNG document first.'); return }
    if (file.size > 8 * 1024 * 1024) { setDocumentError('Document must be smaller than 8 MiB.'); return }
    setDocumentBusy(true)
    setDocumentError(null)
    setDocumentMessage(null)
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Could not read the selected file'))
        reader.readAsDataURL(file)
      })
      const result = await uploadBatchDocument(batchId, {
        fileName: file.name,
        contentType: file.type,
        docType: form.elements.docType.value,
        contentBase64: String(dataUrl).split(',')[1],
      })
      setDocuments(Array.isArray(result.documents) ? result.documents : [])
      setDocumentMessage(result.message)
      form.reset()
    } catch (err) { setDocumentError(err.message || 'Document upload failed') }
    finally { setDocumentBusy(false) }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="btn btn-ghost btn-sm mb-2" style={{ marginLeft: '-0.5rem' }}>
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Dashboard
        </Link>

        {!loading && batch && (
          <>
            <h1 className="page-title">
              <Leaf size={22} aria-hidden="true" />
              {displayValue(batch.herbName)}
            </h1>
            <p className="page-subtitle" style={{ fontStyle: 'italic' }}>{displayValue(batch.scientificName)}</p>
          </>
        )}

        {!loading && !batch && !error && (
          <h1 className="page-title">Batch Details</h1>
        )}

        {loading && (
          <h1 className="page-title">Loading…</h1>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container" aria-live="polite" aria-busy="true">
          <div className="spinner" role="status">
            <span className="sr-only">Loading batch details…</span>
          </div>
          <span className="text-muted">Loading batch details…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {!loading && batch && (
        <>
          {/* Batch info card */}
          <div className="card mb-2">
            <div className="card-header">
              <div>
                <div className="card-title">Batch Information</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  {displayValue(batch.batchId)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <QualityBadge status={batch.qualityStatus} />
                <StatusBadge status={batch.status} />
              </div>
            </div>

            <div className="divider" />

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

          {/* Quality Inspection */}
          <QualityInspectionCard
            batchId={batch.batchId}
            currentQualityStatus={batch.qualityStatus}
            identity={identity}
            onSuccess={async (writeResult) => {
              const refreshed = await fetchData({ preserveCurrent: true })
              // The quality endpoint returns ReadBatch after commit. Keep that
              // authoritative result visible even if the follow-up refresh fails.
              if (writeResult?.batch) {
                setBatch(writeResult.batch)
                setError(null)
              }
              if (Array.isArray(writeResult?.history)) {
                setHistory(writeResult.history)
                setHistoryError(null)
              }
              return refreshed
            }}
          />

          {/* Authorized supply-chain actions */}
          <div className="card mb-2">
            <div className="card-title mb-1">Other Actions</div>
            <p className="text-sm text-muted mb-2">
              Transfer uses the deployed contract. Document CID attachment remains disabled until the compatible chaincode upgrade and IPFS service are configured.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <section aria-labelledby="transfer-title">
                <h2 className="card-title" id="transfer-title">Transfer Batch</h2>
                <p className="text-sm text-muted">Deployed signature: TransferBatch(batchID, newOwner, location). The backend requires an authenticated current owner or Admin.</p>
                {!canTransfer && <p className="text-sm text-muted" role="note">Sign in with a Processor, Distributor, Retailer, or Admin token to transfer.</p>}
                {transferMessage && <div className="alert alert-success" role="status">{transferMessage}</div>}
                {transferWarning && <div className="alert alert-warning" role="alert">{transferWarning}</div>}
                {transferError && <div className="alert alert-error" role="alert">{transferError}</div>}
                <form className="form-grid form-grid-2" onSubmit={submitTransfer}>
                  <div className="form-group"><label htmlFor="transfer-new-owner">New owner</label><input id="transfer-new-owner" value={transferForm.newOwner} onChange={(e) => setTransferForm((prev) => ({ ...prev, newOwner: e.target.value }))} required maxLength={128} disabled={!canTransfer || transferBusy} /></div>
                  <div className="form-group"><label htmlFor="transfer-location">Transfer location</label><input id="transfer-location" value={transferForm.location} onChange={(e) => setTransferForm((prev) => ({ ...prev, location: e.target.value }))} required maxLength={256} disabled={!canTransfer || transferBusy} /></div>
                  <button className="btn btn-primary" type="submit" disabled={!canTransfer || transferBusy || !transferForm.newOwner.trim() || !transferForm.location.trim()}>{transferBusy ? 'Transferring…' : 'Transfer ownership'}</button>
                </form>
                <p className="text-sm text-muted">The chaincode event names the previous owner stored on the batch; it does not independently authenticate that person. Fabric records the backend identity as transaction submitter.</p>
              </section>

              <section aria-labelledby="documents-title">
                <h2 className="card-title" id="documents-title">Documents</h2>
                {documentLoading && <p className="text-sm text-muted" aria-live="polite">Checking deployed contract and IPFS support…</p>}
                {documentError && <div className="alert alert-error" role="alert">{documentError}</div>}
                {documentCapability && !documentCapability.contractSupported && <UnavailableAction name="Add Document CID" description="Upload a document to IPFS and record its CID" reason={documentCapability.reason || 'The deployed contract does not support document CID transactions.'} />}
                {documentCapability?.contractSupported && <>
                  {!documentCapability.uploadEnabled && <div className="alert alert-warning" role="note">Document records can be read, but uploads are unavailable: {documentCapability.reason || 'IPFS is not configured.'}</div>}
                  {documentCapability.uploadEnabled && !canAttachDocument && <p className="text-sm text-muted">Document upload requires an authenticated Processor or Admin token.</p>}
                  {documentCapability.uploadEnabled && canAttachDocument && <form className="form" onSubmit={submitDocument}>
                    <div className="form-group"><label htmlFor="doc-type">Document type</label><select id="doc-type" name="docType" defaultValue="LAB_REPORT"><option value="LAB_REPORT">Lab report</option><option value="CERTIFICATE">Certificate</option><option value="OTHER">Other</option></select></div>
                    <div className="form-group"><label htmlFor="doc-file">Document file (PDF, JPEG, PNG; max 8 MiB)</label><input id="doc-file" name="documentFile" type="file" accept="application/pdf,image/jpeg,image/png" required /></div>
                    <button className="btn btn-primary" type="submit" disabled={documentBusy}>{documentBusy ? 'Uploading to IPFS…' : 'Upload and attach document'}</button>
                  </form>}
                  {documentMessage && <div className="alert alert-success" role="status">{documentMessage}</div>}
                  {documents.map((document) => <div className="card-meta-item" key={document.txId || document.cid}>
                    <strong>{document.docType}</strong> · {document.cid} · {formatLedgerTimestamp(document.timestamp)}
                    {documentCapability.gateway && <> · <a href={`${documentCapability.gateway.replace(/\/+$/, '')}/${encodeURIComponent(document.cid)}`} target="_blank" rel="noreferrer">Open IPFS content</a></>}
                  </div>)}
                </>}
              </section>
            </div>
          </div>

          {/* QR / Verify link */}
          <div className="card mb-2">
            <div className="card-title mb-1">
              <Search size={15} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Public Verification
            </div>
            <p className="text-sm text-muted mb-2">
              Anyone can verify this batch using the public verify page — no login required.
            </p>
            <Link
              to={`/verify/${encodeURIComponent(batch.batchId)}`}
              className="btn btn-secondary btn-sm"
            >
              <Search size={13} aria-hidden="true" />
              Open Verify Page
            </Link>
          </div>

          {/* Provenance timeline */}
          <div className="card">
            <div className="card-title mb-2">
              <Clock size={15} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Provenance Chain ({history.length} event{history.length !== 1 ? 's' : ''})
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button onClick={fetchData} className="btn btn-ghost btn-sm" aria-label="Refresh batch and history" disabled={loading}>
                <RefreshCw size={13} aria-hidden="true" />
                Refresh
              </button>
            </div>
            {historyError && <div className="alert alert-error mb-2" role="alert"><AlertCircle size={16} className="alert-icon" aria-hidden="true" /><div><strong>History unavailable:</strong> {historyError}</div></div>}
            {!historyError && <ProvenanceTimeline events={history} />}
          </div>
        </>
      )}
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

function UnavailableAction({ name, description, reason }) {
  return (
    <div className="unavailable-section" role="note" aria-label={`${name}: not available`}>
      <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--color-text-light)' }} />
      <div>
        <span className="unavailable-label">{name}</span>
        {' '}— {description}
        <div style={{ fontSize: '0.75rem', marginTop: '0.1rem', color: 'var(--color-text-light)' }}>
          ⚠ Not yet available — {reason}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quality Inspection Card
// Calls PATCH /api/batches/:batchId/quality
//
// The deployed v1.1 transaction accepts only batchID and status. It does not
// authenticate or record a human inspector; Fabric records the backend's
// configured identity as the transaction submitter.
// ---------------------------------------------------------------------------

function QualityInspectionCard({ batchId, currentQualityStatus, identity, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [submitWarning, setSubmitWarning] = useState(null)

  async function submit(decision) {
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmitWarning(null)

    setSubmitting(true)
    try {
      const result = await updateQualityStatus(batchId, {
        status: decision,
      })
      const feedback = getCommittedWriteFeedback(result, 'quality update')
      const updatedStatus = result.batch?.qualityStatus
      setSubmitSuccess({ decision, message: feedback.message, updatedStatus })
      setSubmitWarning(feedback.warning)
      // Refresh the current status and ledger history after the transaction.
      if (onSuccess) {
        try {
          const refreshed = await onSuccess(result)
          if (refreshed?.batchAvailable && refreshed.historyAvailable) setSubmitWarning(null)
        }
        catch { setSubmitWarning('The quality update was committed, but the page could not refresh. Use Refresh to query the ledger before retrying.') }
      }
    } catch (err) {
      setSubmitError(err.message || 'Quality update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const alreadyDecided =
    currentQualityStatus === 'APPROVED' || currentQualityStatus === 'REJECTED'
  const authorized = identity && ['PROCESSOR', 'ADMIN'].includes(identity.role)

  return (
    <div className="card mb-2" aria-labelledby="qc-card-title">
      <div className="card-header">
        <div>
          <div className="card-title" id="qc-card-title">
            <ShieldCheck size={15} style={{ display: 'inline', marginRight: '0.35rem' }} aria-hidden="true" />
            Quality Inspection
          </div>
          <div className="text-sm text-muted" style={{ marginTop: '0.15rem' }}>
            Current status: <QualityBadge status={currentQualityStatus} />
          </div>
        </div>
      </div>

      {/* Attribution limitation of the deployed chaincode */}
      <div className="alert alert-warning mb-2" role="note">
        <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--color-warning, #b45309)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This deployed contract records the quality status and update time only. It does not
          authenticate or record a human inspector ID or role; the transaction is signed by
          the backend's configured Fabric identity. The backend requires an authenticated
          Processor or Admin token before allowing this operation.
        </span>
      </div>

      {/* Success */}
      {submitSuccess && (
        <div
          className="alert alert-success mb-2"
          role="status"
        >
          <CheckCircle size={16} className="alert-icon" aria-hidden="true" />
          <div>{submitSuccess.message}{submitSuccess.updatedStatus && <>. Recorded quality status: <strong>{submitSuccess.updatedStatus}</strong>.</>}</div>
        </div>
      )}
      {submitWarning && <div className="alert alert-warning mb-2" role="alert">{submitWarning}</div>}

      {!authorized && <p className="text-sm text-muted" role="note">Quality updates require an authenticated Processor or Admin token.</p>}

      {/* API error */}
      {submitError && (
        <div className="alert alert-error mb-2" role="alert">
          <AlertCircle size={16} className="alert-icon" aria-hidden="true" />
          <div><strong>Update not confirmed:</strong> {submitError}</div>
        </div>
      )}

      {alreadyDecided && !submitSuccess && (
        <div className="alert alert-warning mb-2" role="note">
          <AlertCircle size={16} className="alert-icon" aria-hidden="true" />
          <div>
            This batch already has a quality decision (<strong>{currentQualityStatus}</strong>).
            You can override it below.
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="form"
        aria-label="Quality inspection form"
        noValidate
      >
        <div className="flex gap-1 flex-wrap mt-2">
          <button
            type="button"
            className="btn btn-approve"
            onClick={() => submit('APPROVED')}
            disabled={submitting || !authorized}
            aria-busy={submitting}
          >
            {submitting
              ? <span className="spinner spinner-sm" role="status" aria-hidden="true" />
              : <CheckCircle size={14} aria-hidden="true" />}
            Approve
          </button>
          <button
            type="button"
            className="btn btn-reject"
            onClick={() => submit('REJECTED')}
            disabled={submitting || !authorized}
            aria-busy={submitting}
          >
            {submitting
              ? <span className="spinner spinner-sm" role="status" aria-hidden="true" />
              : <XCircle size={14} aria-hidden="true" />}
            Reject
          </button>
        </div>
      </form>
    </div>
  )
}
