/**
 * Shows the Hyperledger Fabric connection state.
 * Accepts: connected (bool | null), loading (bool), error (string | null)
 */
export default function ConnectionStatus({ connected, loading, error }) {
  if (loading) {
    return (
      <span className="connection-status unknown" aria-live="polite">
        <span className="connection-dot" aria-hidden="true" />
        Checking…
      </span>
    )
  }

  if (error) {
    return (
      <span className="connection-status disconnected" aria-live="polite" title={error}>
        <span className="connection-dot" aria-hidden="true" />
        Backend offline
      </span>
    )
  }

  if (connected === true) {
    return (
      <span className="connection-status connected" aria-live="polite">
        <span className="connection-dot" aria-hidden="true" />
        Fabric connected
      </span>
    )
  }

  if (connected === false) {
    return (
      <span className="connection-status disconnected" aria-live="polite">
        <span className="connection-dot" aria-hidden="true" />
        Fabric disconnected
      </span>
    )
  }

  return null
}
