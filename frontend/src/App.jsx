import { useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import { Leaf, LayoutDashboard, Plus, Search } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import RegisterBatch from './pages/RegisterBatch'
import BatchDetail from './pages/BatchDetail'
import Verify from './pages/Verify'
import AuthControls from './components/AuthControls'

export default function App() {
  const [identity, setIdentity] = useState(null)
  return (
    <div className="app-wrapper">
      <header>
        <nav className="navbar" aria-label="Main navigation">
          <Link to="/" className="navbar-brand">
            <Leaf size={20} aria-hidden="true" />
            Herb Traceability
          </Link>
          <div className="navbar-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Dashboard"
            >
              <LayoutDashboard size={14} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Dashboard
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Register a new batch"
            >
              <Plus size={14} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Register
            </NavLink>
            <NavLink
              to="/verify"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Verify a batch"
            >
              <Search size={14} style={{ display: 'inline', marginRight: '0.3rem' }} aria-hidden="true" />
              Verify
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="page-content" id="main-content">
        <AuthControls identity={identity} onIdentityChange={setIdentity} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RegisterBatch identity={identity} />} />
          <Route path="/batches/:batchId" element={<BatchDetail identity={identity} />} />
          <Route path="/verify" element={<VerifyLanding />} />
          <Route path="/verify/:batchId" element={<Verify />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

/** Landing page when /verify is visited without a batchId */
function VerifyLanding() {
  return (
    <div className="verify-page">
      <div className="page-header">
        <h1 className="page-title">
          <Search size={22} aria-hidden="true" />
          Verify a Batch
        </h1>
        <p className="page-subtitle">Enter a batch ID to check whether its record is present on the ledger.</p>
      </div>
      <VerifyForm />
    </div>
  )
}

function VerifyForm() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const id = value.trim()
    if (id) navigate(`/verify/${encodeURIComponent(id)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ maxWidth: 480 }}
      aria-label="Verify batch form"
    >
      <div className="form-group">
        <label htmlFor="verify-input">Batch ID</label>
        <input
          id="verify-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. HERB-2025-001"
          aria-required="true"
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary mt-2"
        disabled={!value.trim()}
      >
        <Search size={14} aria-hidden="true" />
        Verify
      </button>
    </form>
  )
}

function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-state-title">404 — Page not found</div>
      <p className="text-sm text-muted mt-1">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary mt-2">
        Go to Dashboard
      </Link>
    </div>
  )
}
