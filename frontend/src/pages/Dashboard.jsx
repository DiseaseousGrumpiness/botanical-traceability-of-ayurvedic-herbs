import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { getAllBatches, getHealth } from '../api'
import BatchCard from '../components/BatchCard'
import ConnectionStatus from '../components/ConnectionStatus'
import { countBatches, loadDashboardData } from '../utils/dashboardData'

export default function Dashboard() {
  const [batches, setBatches] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [healthError, setHealthError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const requestId = useRef(0)

  const fetchData = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    setHealthError(null)

    try {
      const data = await loadDashboardData(getHealth, getAllBatches)
      if (currentRequest !== requestId.current) return
      setHealth(data.health)
      setHealthError(data.healthError)
      setBatches(data.batches)
      setLoaded(true)
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setError(err?.message || 'Failed to load batches from the ledger API')
      setBatches([])
      setHealth(null)
      setHealthError(null)
      setLoaded(false)
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    return () => { requestId.current += 1 }
  }, [fetchData])

  const counts = countBatches(batches)
  // A successful GetAllBatches response is stronger evidence than the
  // supplemental health endpoint, which may fail independently.
  const ledgerReadSucceeded = loaded && !error

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="page-title">
              <Leaf size={22} aria-hidden="true" />
              Herb Batch Dashboard
            </h1>
            <p className="page-subtitle">All registered herb batches on the blockchain</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <ConnectionStatus
              connected={ledgerReadSucceeded ? true : health?.fabricConnected}
              loading={loading}
              error={!ledgerReadSucceeded ? (error || healthError) : null}
            />
            <button
              onClick={fetchData}
              className="btn btn-ghost btn-sm"
              aria-label="Refresh batches"
              disabled={loading}
            >
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </button>
            <Link to="/register" className="btn btn-primary btn-sm">
              <Plus size={14} aria-hidden="true" />
              Register Batch
            </Link>
          </div>
        </div>
      </div>

      {/* Supplemental health check status. Batch data comes only from the ledger API. */}
      {!loading && health?.fabricConnected === false && !ledgerReadSucceeded && (
        <div className="alert alert-warning mb-2" role="alert">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Fabric not connected</strong> — The backend is running but could not connect to
            Hyperledger Fabric. Ledger-backed batch reads are currently unavailable.
          </div>
        </div>
      )}

      {!loading && healthError && ledgerReadSucceeded && (
        <div className="alert alert-warning mb-2" role="status">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Health check unavailable</strong> — {healthError}. The ledger batch query succeeded, so these results are live.
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-container" aria-live="polite" aria-busy="true">
          <div className="spinner" role="status">
            <span className="sr-only">Loading batches…</span>
          </div>
          <span className="text-muted">Loading batches…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Error loading batches:</strong> {error}
          </div>
        </div>
      )}

      {/* Batch grid */}
      {!loading && !error && batches.length === 0 && (
        <div className="empty-state">
          <Leaf size={40} className="empty-state-icon" aria-hidden="true" />
          <div className="empty-state-title">No batches registered yet</div>
          <p className="text-sm text-muted mt-1">
            Register the first herb batch to get started.
          </p>
          <Link to="/register" className="btn btn-primary mt-2">
            <Plus size={14} aria-hidden="true" />
            Register Batch
          </Link>
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <>
          <p className="text-sm text-muted mb-2">
            {counts.total} batch{counts.total !== 1 ? 'es' : ''} found
          </p>
          <div className="flex gap-1 flex-wrap mb-2" aria-label="Ledger batch counts">
            <span className="badge badge-pending">Pending: {counts.pending}</span>
            <span className="badge badge-approved">Approved: {counts.approved}</span>
            <span className="badge badge-rejected">Rejected: {counts.rejected}</span>
            {counts.unknown > 0 && <span className="badge badge-default">Unknown: {counts.unknown}</span>}
            <span className="badge badge-transferred">Transferred: {counts.transferred}</span>
          </div>
          <div className="card-grid">
            {batches.map((batch) => (
              <BatchCard key={batch.batchId} batch={batch} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
