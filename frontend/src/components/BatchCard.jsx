import { Link } from 'react-router-dom'
import { Leaf, MapPin, User, Calendar, Package, Hash } from 'lucide-react'
import { QualityBadge, StatusBadge } from './StatusBadge'

/**
 * Reusable card component for displaying a summary of an HerbBatch.
 */
export default function BatchCard({ batch }) {
  const {
    batchId,
    herbName,
    scientificName,
    collectionLocation,
    collectorId,
    collectionDate,
    quantity,
    unit,
    qualityStatus,
    status,
  } = batch

  return (
    <article className="card" aria-label={`Batch: ${batchId}`}>
      <div className="card-header">
        <div>
          <div className="card-title">
            <Leaf size={15} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--color-primary)' }} aria-hidden="true" />
            {herbName}
          </div>
          {scientificName && (
            <div className="card-subtitle">{scientificName}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
          <QualityBadge status={qualityStatus} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="card-meta">
        <span className="card-meta-item">
          <Hash size={12} aria-hidden="true" />
          <span className="font-mono">{batchId}</span>
        </span>
        {collectionLocation && (
          <span className="card-meta-item">
            <MapPin size={12} aria-hidden="true" />
            {collectionLocation}
          </span>
        )}
        {collectorId && (
          <span className="card-meta-item">
            <User size={12} aria-hidden="true" />
            {collectorId}
          </span>
        )}
        {collectionDate && (
          <span className="card-meta-item">
            <Calendar size={12} aria-hidden="true" />
            {collectionDate}
          </span>
        )}
        {quantity != null && (
          <span className="card-meta-item">
            <Package size={12} aria-hidden="true" />
            {quantity} {unit}
          </span>
        )}
      </div>

      <div className="card-footer">
        <Link to={`/batches/${encodeURIComponent(batchId)}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
        <Link
          to={`/verify/${encodeURIComponent(batchId)}`}
          className="btn btn-ghost btn-sm"
        >
          Verify
        </Link>
      </div>
    </article>
  )
}
