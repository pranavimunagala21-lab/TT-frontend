import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function MyRequestsPage() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(null)
  const refresh = useCallback(async () => {
    setError('')
    try { const [bookings, equipment, projects, clubs] = await Promise.all([api.get('/api/bookings'), api.get('/api/equipment-requests'), api.get('/api/projects/mine'), api.get('/api/clubs/memberships/mine')]); setRequests({ bookings, equipment, projects, clubs }) }
    catch (e) { setError(e.message); setRequests({ bookings: [], equipment: [], projects: [], clubs: [] }) }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  async function cancel(type, request) {
    setBusy(`${type}-${request.id}`); setError(''); setMessage('')
    try { await api.post(type === 'booking' ? `/api/bookings/${request.id}/cancel` : `/api/equipment-requests/${request.id}/cancel`, {}); setMessage('Request cancelled.'); await refresh() }
    catch (e) { setError(e.message) } finally { setBusy(null) }
  }
  if (!requests) return <LoadingScreen label="Loading your requests…" />
  const rows = [
    ...requests.bookings.map((item) => ({ ...item, kind: 'Venue booking', label: item.venue?.name || 'Venue', date: item.startTime, type: 'booking' })),
    ...requests.equipment.map((item) => ({ ...item, kind: 'Equipment request', label: `${item.quantity} × ${item.equipment?.name || 'Equipment'}`, date: item.requestDate, type: 'equipment' })),
    ...requests.projects.map((item) => ({ ...item, kind: 'Project submission', label: item.title, date: item.createdAt, type: 'project' })),
    ...requests.clubs.map((item) => ({ ...item, kind: 'Club membership', label: item.clubName, date: item.joinedAt, type: 'club' })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">STUDENT WORKSPACE</span><h1>My Requests</h1><p>Track bookings, equipment, project submissions and club membership statuses.</p></div><button className="button secondary" onClick={refresh}>Refresh</button></div><StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}{rows.length ? <section className="panel workflow-history"><div className="activity-list">{rows.map((item) => <article className="activity-item" key={`${item.type}-${item.id}`}><span className="activity-dot"/><div><strong>{item.kind}: {item.label}</strong><p>{item.status} · {formatDate(item.date)}{item.endTime ? ` – ${formatDate(item.endTime)}` : ''}</p>{(item.rejectionReason || item.reviewReason) && <p className="error-note">Reason: {item.rejectionReason || item.reviewReason}</p>}{item.notes && <p>{item.notes}</p>}</div>{['booking','equipment'].includes(item.type) && ['PENDING','APPROVED'].includes(String(item.status).toUpperCase()) && <button className="text-button" disabled={busy === `${item.type}-${item.id}`} onClick={() => cancel(item.type, item)}>{busy === `${item.type}-${item.id}` ? 'Cancelling…' : 'Cancel request'}</button>}</article>)}</div></section> : <div className="empty-state"><h2>No requests yet</h2><p>Your venue bookings and equipment requests will appear here.</p></div>}</div>
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : 'Date unavailable' }
