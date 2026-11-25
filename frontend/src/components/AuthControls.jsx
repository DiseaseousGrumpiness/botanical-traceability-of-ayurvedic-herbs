import { useState } from 'react'
import { AlertCircle, LockKeyhole, LogOut } from 'lucide-react'
import { getCurrentIdentity, setApiToken } from '../api'

export default function AuthControls({ identity, onIdentityChange }) {
  const [candidate, setCandidate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function authenticate(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setApiToken(candidate)
    try {
      const principal = await getCurrentIdentity()
      onIdentityChange(principal)
      setCandidate('')
    } catch (err) {
      setApiToken(null)
      setError(err.message || 'Authentication failed')
    } finally { setBusy(false) }
  }

  function signOut() {
    setApiToken(null)
    onIdentityChange(null)
    setError(null)
  }

  return (
    <div className="auth-strip" aria-label="Write access session">
      {identity ? (
        <>
          <LockKeyhole size={14} aria-hidden="true" />
          <span>{identity.role} · {identity.actorId}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <LogOut size={13} aria-hidden="true" /> Sign out
          </button>
        </>
      ) : (
        <form onSubmit={authenticate} className="auth-form" aria-label="Authenticate for write access">
          <label htmlFor="role-token">Staff token</label>
          <input id="role-token" type="password" autoComplete="off" value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="Bearer token" required />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={busy || !candidate}>
            {busy ? 'Checking…' : 'Sign in for write access'}
          </button>
          <span className="text-sm text-muted">Public ledger reads need no sign-in.</span>
        </form>
      )}
      {error && <span className="auth-error" role="alert"><AlertCircle size={13} aria-hidden="true" /> {error}</span>}
    </div>
  )
}
