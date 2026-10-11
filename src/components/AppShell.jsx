import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/client'

const links = [
  { to: '/app', label: 'Overview', icon: '⌂', end: true, section: 'STUDENT CAMPUS' },
  { to: '/app/projects', label: 'Projects', icon: '▦' },
  { to: '/app/clubs', label: 'Clubs', icon: '◉' },
  { to: '/app/people', label: 'People & skills', icon: '♧' },
  { to: '/app/venues', label: 'Venues & bookings', icon: '⌂' },
  { to: '/app/equipment', label: 'Equipment requests', icon: '⌘' },
  { to: '/app/my-requests', label: 'My requests', icon: '✓' },
  { to: '/app/knowledge', label: 'Campus knowledge', icon: '▤', section: 'CAMPUS MEMORY' },
  { to: '/app/history', label: 'Historical records', icon: '◷' },
  { to: '/app/documents', label: 'Documents', icon: '▧' },
  { to: '/app/notifications', label: 'Notifications', icon: '♢' },
  { to: '/app/profile', label: 'My profile', icon: '◎', section: 'ACCOUNT' },
  { to: '/app/ai', label: 'AI search', icon: '✳', section: 'DISCOVER' },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitle = links.find((link) => link.to === location.pathname)?.label || 'CampusSphere'
  const initials = (user?.name || user?.email || 'C').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  useEffect(() => { api.get('/api/notifications/unread-count').then((response) => setUnread(response?.unreadCount ?? response?.count ?? 0)).catch(() => setUnread(0)) }, [location.pathname])
  function signOut() { logout(); navigate('/login', { replace: true }) }

  return <div className="app-shell">
    {open && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <NavLink to="/app" className="brand sidebar-brand" onClick={() => setOpen(false)}><span className="brand-mark">C</span><span>Campus<span className="brand-light">Sphere</span></span></NavLink>
      <div className="workspace-switch"><span className="workspace-icon">C</span><span><strong>CampusSphere</strong><small>Campus workspace</small></span><span className="chevron">⌄</span></div>
      <nav className="side-nav" aria-label="Main navigation">
        {links.map((link) => <div key={link.to}>{link.section && <div className="nav-section-label">{link.section}</div>}<NavLink to={link.to} end={link.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span><span>{link.label}</span>{link.to.endsWith('notifications') && unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}</NavLink></div>)}
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">✦</span><strong>Make it happen</strong><p>Great campus ideas start with a connection.</p><button onClick={() => navigate('/app/ai')}>Explore campus <span>→</span></button></div>
        <button className="profile-mini" onClick={signOut} title={`Sign out · ${user?.role || 'member'}`}><span className="avatar">{initials}</span><span className="profile-mini-text"><strong>{user?.name || 'Campus member'}</strong><small>{user?.role || 'Member'} · {user?.email}</small></span><span className="logout-icon">↗</span></button>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><span /><span /><span /></button>
        <div className="breadcrumbs"><span>CampusSphere</span><b>/</b><strong>{pageTitle}</strong></div>
        <div className="topbar-right"><button className="top-search" onClick={() => navigate('/app/ai')}><span>⌕</span> Search campus <kbd>⌘ K</kbd></button><button className="topbar-avatar" onClick={signOut} title={`Sign out · ${user?.role || 'member'}`}>{initials}</button></div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="page-footer"><span>CampusSphere</span><span>Connecting ideas across campus</span></footer>
    </div>
  </div>
}
