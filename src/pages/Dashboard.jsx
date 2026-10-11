import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getPageItems } from '../api/client'
import { useAuth } from '../state/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.allSettled([
      api.get('/api/projects'), api.get('/api/clubs'), api.get('/api/venues'),
      api.get('/api/equipment'), api.get('/api/notifications/unread-count'),
      api.get('/api/knowledge?page=0&size=5'),
    ]).then((results) => {
      if (!active) return
      const value = results.map((result) => result.status === 'fulfilled' ? result.value : null)
      setData({ projects: getPageItems(value[0]), clubs: getPageItems(value[1]), venues: getPageItems(value[2]), equipment: getPageItems(value[3]), unread: typeof value[4] === 'number' ? value[4] : value[4]?.count ?? value[4]?.unreadCount ?? null, knowledge: getPageItems(value[5]) })
      if (results.every((result) => result.status === 'rejected')) setError('Campus data could not be loaded. Check your connection and try again.')
    })
    return () => { active = false }
  }, [])
  if (!data) return <LoadingScreen label="Loading your campus overview..." />
  const stats = [
    ['Projects', data.projects, '/app/projects', 'Ideas in motion'],
    ['Clubs', data.clubs, '/app/clubs', 'Campus communities'],
    ['Venues', data.venues, '/app/venues', 'Spaces to meet'],
    ['Equipment', data.equipment, '/app/equipment', 'Shared resources'],
  ]
  return <div className="dashboard-page">
    <StatusMessage>{error}</StatusMessage>
    <section className="welcome-banner"><div><span className="eyebrow light">CAMPUS WORKSPACE</span><h1>Good to have you here, {firstName(user?.name)}.</h1><p>Here’s what’s happening across your campus community.</p></div><div className="welcome-orbit"><span>CS</span></div></section>
    <div className="section-heading"><div><span className="eyebrow">YOUR CAMPUS AT A GLANCE</span><h2>Explore the community</h2></div><span className="live-indicator"><i /> Live campus data</span></div>
    <section className="stat-grid">{stats.map(([label, items, to, sub], index) => <Link to={to} key={label} className={`stat-card stat-tone-${index}`}><div className="stat-card-top"><span>{label}</span><span className="stat-arrow">↗</span></div><strong>{items.length}</strong><small>{sub}</small></Link>)}</section>
    <div className="dashboard-columns"><section className="panel profile-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR PROFILE</span><h2>Campus identity</h2></div><span className="avatar large">{initials(user?.name)}</span></div><h3>{user?.name || 'Campus member'}</h3><p className="muted">{user?.email}</p><div className="profile-facts"><div><span>Role</span><strong>{user?.role || 'Member'}</strong></div>{user?.department && <div><span>Department</span><strong>{user.department}</strong></div>}{user?.year && <div><span>Year</span><strong>{user.year}</strong></div>}</div>{user?.bio && <p className="profile-bio">{user.bio}</p>}<Pills label="Skills" values={user?.skills} /><Pills label="Interests" values={user?.interests} /></section>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">CAMPUS MEMORY</span><h2>Recently shared knowledge</h2></div><Link className="text-link" to="/app/knowledge">Browse all ↗</Link></div>{data.knowledge.length ? <div className="activity-list">{data.knowledge.slice(0, 4).map((item, i) => <article className="activity-item" key={item.id ?? i}><span className="activity-dot" /><div><strong>{item.title || item.name || 'Knowledge record'}</strong><p>{item.category || 'Campus knowledge'}{item.recordDate ? ` · ${item.recordDate}` : ''}</p></div></article>)}</div> : <div className="empty-inline"><span className="empty-icon">◇</span><p>No knowledge records are available yet.</p><Link to="/app/knowledge">Explore knowledge</Link></div>}</section>
    </div>
    <section className="quick-links"><div><span className="eyebrow">KEEP EXPLORING</span><h2>Find your next connection</h2></div><div className="quick-link-list"><Link to="/app/people">Discover people <span>↗</span></Link><Link to="/app/ai">Search campus <span>↗</span></Link><Link to="/app/notifications">Notifications {data.unread != null && <b>{data.unread}</b>} <span>↗</span></Link></div></section>
  </div>
}

function firstName(name) { return (name || 'there').trim().split(/\s+/)[0] }
function initials(name) { return (name || 'C').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }
function Pills({ label, values }) { return Array.isArray(values) && values.length ? <div className="profile-pills"><span>{label}</span><div>{values.slice(0, 6).map((value) => <i key={value}>{value}</i>)}</div></div> : null }
