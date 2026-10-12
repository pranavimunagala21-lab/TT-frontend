import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function AdminOverview({ profileOnly = false }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (profileOnly) return
    let active = true
    Promise.all([
      api.get('/api/admin/queues'), api.get('/api/users?role=STUDENT&page=0&size=1'), api.get('/api/users?role=ADMIN&page=0&size=1'),
      api.get('/api/venues'), api.get('/api/equipment'), api.get('/api/bookings'), api.get('/api/equipment-requests'), api.get('/api/projects'),
    ]).then(([queues, students, admins, venues, equipment, bookings, equipmentRequests, projects]) => {
      if (!active) return
      const available = equipment.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0)
      const recent = [...bookings.map((x) => ({ ...x, kind: x.reviewedAt ? 'Booking decision' : 'Venue booking', person: x.user?.name || x.user?.email, date: x.reviewedAt || x.createdAt || x.startTime })),
        ...equipmentRequests.map((x) => ({ ...x, kind: x.reviewedAt ? 'Equipment decision' : 'Equipment request', person: x.requester?.name || x.requester?.email, date: x.reviewedAt || x.requestDate })),
        ...projects.map((x) => ({ ...x, kind: x.reviewedAt ? 'Project decision' : 'Project submission', person: x.owner?.name || x.owner?.email, date: x.reviewedAt || x.createdAt }))]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6)
      setData({ queues, students: students.totalElements, admins: admins.totalElements, projects: projects.length, venues: venues.length, available, recent })
    }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [profileOnly, reload])
  if (profileOnly) return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">ADMIN PROFILE</span><h1>{user?.name || 'Administrator'}</h1><p>Signed in administrator account</p></div></div><section className="panel profile-panel"><h2>Account details</h2><p><strong>Name</strong> · {user?.name}</p><p><strong>Email</strong> · {user?.email}</p><p><strong>Role</strong> · {user?.role}</p></section></div>
  if (error && !data) return <div className="directory-page"><StatusMessage>{error}</StatusMessage><button className="button secondary" onClick={() => location.reload()}>Retry</button></div>
  if (!data) return <LoadingScreen label="Loading live campus administration data…" />
  const metrics = [
    ['Students', data.students], ['Administrators', data.admins], ['Pending bookings', data.queues.bookings?.length || 0],
    ['Projects', data.projects], ['Pending projects', data.queues.projectProposals?.length || 0], ['Pending equipment requests', data.queues.equipmentRequests?.length || 0],
    ['Venues', data.venues], ['Available equipment', data.available],
  ]
  return <div className="directory-page admin-overview"><div className="page-intro"><div><span className="eyebrow">ADMINISTRATION</span><h1>Admin Overview</h1><p>Live totals and pending work from CampusSphere.</p></div><div className="directory-tools"><span className="role-pill">ADMIN · {user?.name}</span><button className="button secondary" onClick={() => { setData(null); setReload((n) => n + 1) }}>Refresh</button></div></div>
    <StatusMessage>{error}</StatusMessage><section className="stat-grid">{metrics.map(([label, value]) => <article className="stat-card" key={label}><div className="stat-card-top"><span>{label}</span></div><strong>{value}</strong><small>Current MySQL records</small></article>)}</section>
    <section className="panel workflow-history"><div className="panel-heading"><div><span className="eyebrow">RECENT REQUESTS & ADMIN ACTIVITY</span><h2>Latest campus activity</h2></div></div>{data.recent.length ? <div className="activity-list">{data.recent.map((item) => <article className="activity-item" key={`${item.kind}-${item.id}`}><span className="activity-dot"/><div><strong>{item.kind}: {item.venue?.name || item.equipment?.name || item.purpose || item.title || 'Request'}</strong><p>{item.person || 'Campus member'} · {item.status} · {item.reviewedBy?.name ? `reviewed by ${item.reviewedBy.name} · ` : ''}{formatDate(item.date)}</p></div></article>)}</div> : <div className="empty-inline"><p>No booking, equipment or project records are available.</p></div>}</section>
  </div>
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : 'Date unavailable' }
