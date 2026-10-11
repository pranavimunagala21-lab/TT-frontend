import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function AdminPage({ view = 'all' }) {
  const [queues, setQueues] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const refresh = useCallback(async () => {
    setError('')
    try {
      setQueues(await api.get('/api/admin/queues'))
    }
    catch (e) { setError(e.message); setQueues({ bookings: [], equipmentRequests: [], projectProposals: [], clubMemberships: [] }) }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  async function decide(type, id, approved) {
    const reason = approved ? '' : window.prompt('Reason for declining this request:')
    if (!approved && !reason?.trim()) return
    setBusy(`${type}-${id}`); setError(''); setMessage('')
    try {
      await api.post(`/api/admin/${type}/${id}/decision`, { approved, reason: reason || null })
      setMessage('Decision saved and the requester was notified.')
      await refresh()
    } catch (e) { setError(e.message) }
    finally { setBusy('') }
  }
  if (!queues) return <LoadingScreen label="Loading review queues…" />
  const sections = [
    ['bookings', 'Venue bookings', queues.bookings || [], (x) => `${x.venue?.name || 'Venue'} · ${x.purpose || ''}`, (x) => `${x.user?.name || x.user?.email || 'Requester'} · ${date(x.startTime)} · ${x.attendeesCount || 0} attendees · ends ${date(x.endTime)}`],
    ['equipment-requests', 'Equipment requests', queues.equipmentRequests || [], (x) => `${x.quantity || 1} × ${x.equipment?.name || 'Equipment'}`, (x) => `${x.requester?.name || x.requester?.email || 'Requester'}${x.projectTitle ? ` · ${x.projectTitle}` : ''} · ${x.notes || ''}`],
    ['projects', 'Project proposals', queues.projectProposals || [], (x) => x.title, (x) => `${x.owner?.name || x.owner?.email || 'Owner'} · ${x.category || 'Uncategorized'} · ${(x.technologies || []).join(', ')}`],
    ['project-memberships', 'Project team requests', queues.projectMemberships || [], (x) => `${x.user?.name || x.user?.email || 'Student'} → ${x.projectTitle}`, () => 'Student project team request'],
    ['club-memberships', 'Club membership requests', queues.clubMemberships || [], (x) => `${x.user?.name || x.user?.email || 'Member'} → ${x.clubName}`, () => 'Student membership request'],
  ]
  const visibleSections = view === 'all' ? sections : sections.filter(([type]) => type === view)
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">ADMINISTRATION</span><h1>{visibleSections[0]?.[1] || 'Requests'}</h1><p>Requests below are loaded from CampusSphere. Decisions are saved by the backend.</p></div><button className="button secondary" onClick={refresh}>Refresh</button></div>
    <StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}
    {visibleSections.map(([type, title, rows, heading, detail]) => <section className="panel workflow-history" key={type}><div className="panel-heading"><div><span className="eyebrow">PENDING REVIEW</span><h2>{title}</h2></div><span className="count-badge">{rows.length}</span></div>{rows.length ? <div className="activity-list">{rows.map((item) => <article className="activity-item admin-queue-item" key={item.id}><span className="activity-dot"/><div><strong>{heading(item)}</strong><p>{detail(item)}</p>{item.description && <p>{item.description}</p>}</div><div className="admin-actions"><button className="button primary" disabled={busy === `${type}-${item.id}`} onClick={() => decide(type, item.id, true)}>Approve</button><button className="button secondary" disabled={busy === `${type}-${item.id}`} onClick={() => decide(type, item.id, false)}>Decline</button></div></article>)}</div> : <div className="empty-inline"><p>No pending requests.</p></div>}</section>)}
  </div>
}
function date(value) { return value ? new Date(value).toLocaleString() : 'Date not set' }
