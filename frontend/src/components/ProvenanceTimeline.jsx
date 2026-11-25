import { User, MapPin } from 'lucide-react'
import { displayValue, formatLedgerTimestamp, sortHistoryEvents } from '../utils/traceability'

/**
 * Displays a list of TraceEvent objects as a vertical timeline.
 *
 * TraceEvent shape:
 *   eventId, batchId, eventType, actorId, actorRole,
 *   location, description, timestamp, stateSnapshot, isDelete
 */
export default function ProvenanceTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No provenance events recorded yet</div>
        <p className="text-sm text-muted">The ledger API returned no history entries for this batch.</p>
      </div>
    )
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = sortHistoryEvents(events)

  return (
    <div className="timeline" role="list" aria-label="Provenance timeline">
      {sorted.length === 1 && <p className="text-sm text-muted" role="note">Only one ledger modification is recorded for this batch. No additional history events were returned by the ledger.</p>}
      {sorted.map((event, idx) => (
        <TimelineEvent key={event.eventId || `${event.batchId || 'event'}-${event.timestamp || idx}`} event={event} isLatest={idx === sorted.length - 1} />
      ))}
    </div>
  )
}

function TimelineEvent({ event, isLatest }) {
  const {
    eventType,
    actorId,
    actorRole,
    location,
    description,
    timestamp,
    eventId,
    batchId,
    stateSnapshot,
    isDelete,
  } = event

  const formattedTime = formatLedgerTimestamp(timestamp)
  const validTimestamp = timestamp && Number.isFinite(Date.parse(timestamp))

  return (
    <div className="timeline-item" role="listitem">
      <div className={`timeline-dot${isDelete ? ' dot-delete' : ''}`} aria-hidden="true" />
      <div className="timeline-card">
        <div className="timeline-header">
          <span className="timeline-event-type">
            {eventType || 'Event'}
            {isLatest && (
              <span
                className="badge badge-approved"
                style={{ marginLeft: '0.5rem', fontSize: '0.68rem' }}
              >
                Latest
              </span>
            )}
          </span>
          <time className="timeline-time" dateTime={validTimestamp ? timestamp : undefined}>{formattedTime}</time>
        </div>

        {(eventId || batchId) && <div className="text-sm text-muted" style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>
          {eventId && <>Ledger transaction: {eventId}</>}
          {eventId && batchId && ' · '}
          {batchId && <>Batch: {batchId}</>}
        </div>}

        {(actorId || actorRole) && (
          <div className="timeline-actor">
            <User size={12} aria-hidden="true" />
            {actorId}
            {actorRole && actorId && ' · '}
            {actorRole && <span style={{ fontStyle: 'italic' }}>{actorRole}</span>}
          </div>
        )}

        {location && (
          <div className="timeline-location">
            <MapPin size={12} aria-hidden="true" />
            {location}
          </div>
        )}

        {description && <p className="timeline-description">{description}</p>}
        {stateSnapshot && typeof stateSnapshot === 'object' && (
          <details className="text-sm" style={{ marginTop: '0.4rem' }}>
            <summary>Ledger state at this event</summary>
            <dl className="detail-grid" style={{ marginTop: '0.35rem' }}>
              {Object.entries(stateSnapshot).map(([field, value]) => (
                <div className="detail-item" key={field}>
                  <dt className="detail-label">{field}</dt>
                  <dd className="detail-value" style={{ margin: 0 }}>{displayValue(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </div>
  )
}
