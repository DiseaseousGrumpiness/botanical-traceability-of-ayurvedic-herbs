import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Leaf, ArrowLeft, AlertCircle, CheckCircle, MapPin, Package, User, Calendar, Hash
} from 'lucide-react'
import { createBatch } from '../api'
import { getCommittedWriteFeedback } from '../utils/writeOutcome'

const INITIAL = {
  batchId: '',
  herbName: '',
  scientificName: '',
  collectorId: '',
  collectionLocation: '',
  latitude: '',
  longitude: '',
  collectionDate: '',
  quantity: '',
  unit: '',
}

function validate(fields) {
  const errors = {}

  if (!fields.batchId.trim()) errors.batchId = 'Batch ID is required'
  if (!fields.herbName.trim()) errors.herbName = 'Herb name is required'
  if (!fields.scientificName.trim()) errors.scientificName = 'Scientific name is required'
  if (!fields.collectorId.trim()) errors.collectorId = 'Collector ID is required'
  if (!fields.collectionLocation.trim()) errors.collectionLocation = 'Collection location is required'
  if (!fields.unit.trim()) errors.unit = 'Unit is required'

  // Latitude: -90 to 90
  if (fields.latitude === '') {
    errors.latitude = 'Latitude is required'
  } else {
    const lat = Number(fields.latitude)
    if (!Number.isFinite(lat)) errors.latitude = 'Latitude must be a number'
    else if (lat < -90 || lat > 90) errors.latitude = 'Latitude must be between -90 and 90'
  }

  // Longitude: -180 to 180
  if (fields.longitude === '') {
    errors.longitude = 'Longitude is required'
  } else {
    const lon = Number(fields.longitude)
    if (!Number.isFinite(lon)) errors.longitude = 'Longitude must be a number'
    else if (lon < -180 || lon > 180) errors.longitude = 'Longitude must be between -180 and 180'
  }

  // Quantity > 0
  if (fields.quantity === '') {
    errors.quantity = 'Quantity is required'
  } else {
    const qty = Number(fields.quantity)
    if (!Number.isFinite(qty)) errors.quantity = 'Quantity must be a number'
    else if (qty <= 0) errors.quantity = 'Quantity must be greater than 0'
  }

  // Date YYYY-MM-DD
  if (!fields.collectionDate) {
    errors.collectionDate = 'Collection date is required'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.collectionDate)) {
    errors.collectionDate = 'Date must be in YYYY-MM-DD format'
  }

  return errors
}

export default function RegisterBatch({ identity }) {
  const navigate = useNavigate()
  const [fields, setFields] = useState(INITIAL)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (identity?.role === 'COLLECTOR' && !fields.collectorId) {
      setFields((previous) => ({ ...previous, collectorId: identity.actorId }))
    }
  }, [identity, fields.collectorId])

  const authorized = identity && ['COLLECTOR', 'ADMIN'].includes(identity.role)

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)
    setSuccess(null)

    const errors = validate(fields)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const result = await createBatch({
        batchId: fields.batchId.trim(),
        herbName: fields.herbName.trim(),
        scientificName: fields.scientificName.trim(),
        collectorId: fields.collectorId.trim(),
        collectionLocation: fields.collectionLocation.trim(),
        latitude: Number(fields.latitude),
        longitude: Number(fields.longitude),
        collectionDate: fields.collectionDate,
        quantity: Number(fields.quantity),
        unit: fields.unit.trim(),
      })
      const feedback = getCommittedWriteFeedback(result, 'batch registration')
      setSuccess({ ...result, ...feedback })
      if (feedback.readbackComplete) {
        setFields(INITIAL)
        setFieldErrors({})
      }
    } catch (err) {
      setApiError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="btn btn-ghost btn-sm mb-2" style={{ marginLeft: '-0.5rem' }}>
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <h1 className="page-title">
          <Leaf size={22} aria-hidden="true" />
          Register Herb Batch
        </h1>
        <p className="page-subtitle">Submit a new herb batch to the blockchain</p>
      </div>

      {!authorized && <div className="alert alert-warning mb-2" role="note"><AlertCircle size={16} className="alert-icon" aria-hidden="true" /><div>Registration requires an authenticated Collector or Admin session. Use the staff token field above; authorization is also enforced by the backend.</div></div>}

      {success && (
        <div className={`alert ${success.readbackComplete ? 'alert-success' : 'alert-warning'} mb-2`} role="status">
          <CheckCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>{success.message}</strong>
            <div className="mt-1 text-sm">
              Batch ID: <span className="font-mono">{success.batch?.batchId || fields.batchId}</span>
              {success.batch?.batchId && <> — <Link to={`/batches/${encodeURIComponent(success.batch.batchId)}`}>View batch</Link></>}
            </div>
            {!success.readbackComplete && <p className="text-sm mt-1">The ledger confirmed the write, but the follow-up read was incomplete. The form is retained; refresh or check this batch ID before retrying.</p>}
          </div>
        </div>
      )}

      {apiError && (
        <div className="alert alert-error mb-2" role="alert">
          <AlertCircle size={18} className="alert-icon" aria-hidden="true" />
          <div>
            <strong>Registration not confirmed:</strong> {apiError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form" noValidate aria-label="Register herb batch form">
        {/* Batch Identity */}
        <section className="form-section">
          <div className="form-section-title">
            <Hash size={14} aria-hidden="true" />
            Batch Identity
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label htmlFor="batchId">
                Batch ID <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="batchId"
                name="batchId"
                type="text"
                value={fields.batchId}
                onChange={handleChange}
                className={fieldErrors.batchId ? 'error' : ''}
                placeholder="e.g. HERB-2025-001"
                aria-describedby={fieldErrors.batchId ? 'batchId-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.batchId && (
                <span id="batchId-err" className="field-error" role="alert">{fieldErrors.batchId}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="collectorId">
                Collector ID <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="collectorId"
                name="collectorId"
                type="text"
                value={fields.collectorId}
                onChange={handleChange}
                className={fieldErrors.collectorId ? 'error' : ''}
                placeholder="e.g. FARMER-001"
                aria-describedby={fieldErrors.collectorId ? 'collectorId-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.collectorId && (
                <span id="collectorId-err" className="field-error" role="alert">{fieldErrors.collectorId}</span>
              )}
            </div>
          </div>
        </section>

        {/* Herb Information */}
        <section className="form-section">
          <div className="form-section-title">
            <Leaf size={14} aria-hidden="true" />
            Herb Information
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label htmlFor="herbName">
                Herb Name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="herbName"
                name="herbName"
                type="text"
                value={fields.herbName}
                onChange={handleChange}
                className={fieldErrors.herbName ? 'error' : ''}
                placeholder="e.g. Ashwagandha"
                aria-describedby={fieldErrors.herbName ? 'herbName-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.herbName && (
                <span id="herbName-err" className="field-error" role="alert">{fieldErrors.herbName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="scientificName">
                Scientific Name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="scientificName"
                name="scientificName"
                type="text"
                value={fields.scientificName}
                onChange={handleChange}
                className={fieldErrors.scientificName ? 'error' : ''}
                placeholder="e.g. Withania somnifera"
                aria-describedby={fieldErrors.scientificName ? 'scientificName-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.scientificName && (
                <span id="scientificName-err" className="field-error" role="alert">{fieldErrors.scientificName}</span>
              )}
            </div>
          </div>
        </section>

        {/* Collection Details */}
        <section className="form-section">
          <div className="form-section-title">
            <MapPin size={14} aria-hidden="true" />
            Collection Details
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group span-2">
              <label htmlFor="collectionLocation">
                Collection Location <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="collectionLocation"
                name="collectionLocation"
                type="text"
                value={fields.collectionLocation}
                onChange={handleChange}
                className={fieldErrors.collectionLocation ? 'error' : ''}
                placeholder="e.g. Rajasthan, India"
                aria-describedby={fieldErrors.collectionLocation ? 'collectionLocation-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.collectionLocation && (
                <span id="collectionLocation-err" className="field-error" role="alert">{fieldErrors.collectionLocation}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="latitude">
                Latitude <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={fields.latitude}
                onChange={handleChange}
                className={fieldErrors.latitude ? 'error' : ''}
                placeholder="-90 to 90"
                aria-describedby={fieldErrors.latitude ? 'latitude-err' : 'latitude-hint'}
                aria-required="true"
              />
              {fieldErrors.latitude
                ? <span id="latitude-err" className="field-error" role="alert">{fieldErrors.latitude}</span>
                : <span id="latitude-hint" className="field-hint">Range: -90 to 90</span>
              }
            </div>

            <div className="form-group">
              <label htmlFor="longitude">
                Longitude <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={fields.longitude}
                onChange={handleChange}
                className={fieldErrors.longitude ? 'error' : ''}
                placeholder="-180 to 180"
                aria-describedby={fieldErrors.longitude ? 'longitude-err' : 'longitude-hint'}
                aria-required="true"
              />
              {fieldErrors.longitude
                ? <span id="longitude-err" className="field-error" role="alert">{fieldErrors.longitude}</span>
                : <span id="longitude-hint" className="field-hint">Range: -180 to 180</span>
              }
            </div>

            <div className="form-group">
              <label htmlFor="collectionDate">
                Collection Date <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="collectionDate"
                name="collectionDate"
                type="date"
                value={fields.collectionDate}
                onChange={handleChange}
                className={fieldErrors.collectionDate ? 'error' : ''}
                aria-describedby={fieldErrors.collectionDate ? 'collectionDate-err' : 'collectionDate-hint'}
                aria-required="true"
              />
              {fieldErrors.collectionDate
                ? <span id="collectionDate-err" className="field-error" role="alert">{fieldErrors.collectionDate}</span>
                : <span id="collectionDate-hint" className="field-hint">Format: YYYY-MM-DD</span>
              }
            </div>
          </div>
        </section>

        {/* Quantity */}
        <section className="form-section">
          <div className="form-section-title">
            <Package size={14} aria-hidden="true" />
            Quantity
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label htmlFor="quantity">
                Quantity <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="any"
                value={fields.quantity}
                onChange={handleChange}
                className={fieldErrors.quantity ? 'error' : ''}
                placeholder="e.g. 50"
                aria-describedby={fieldErrors.quantity ? 'quantity-err' : 'quantity-hint'}
                aria-required="true"
              />
              {fieldErrors.quantity
                ? <span id="quantity-err" className="field-error" role="alert">{fieldErrors.quantity}</span>
                : <span id="quantity-hint" className="field-hint">Must be greater than 0</span>
              }
            </div>

            <div className="form-group">
              <label htmlFor="unit">
                Unit <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                value={fields.unit}
                onChange={handleChange}
                className={fieldErrors.unit ? 'error' : ''}
                placeholder="e.g. kg"
                aria-describedby={fieldErrors.unit ? 'unit-err' : undefined}
                aria-required="true"
              />
              {fieldErrors.unit && (
                <span id="unit-err" className="field-error" role="alert">{fieldErrors.unit}</span>
              )}
            </div>
          </div>
        </section>

        <div className="flex gap-1 flex-wrap">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !authorized}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner spinner-sm" role="status" aria-hidden="true" />
                Registering…
              </>
            ) : (
              <>
                <Leaf size={15} aria-hidden="true" />
                Register Batch
              </>
            )}
          </button>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
