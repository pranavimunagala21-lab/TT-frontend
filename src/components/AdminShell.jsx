import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../state/AuthContext'

const links = [
  ['/', 'Admin Overview', '⌂'], ['users', 'User Management', '♙'], ['venues', 'Venue Management', '⌂'],
  ['bookings', 'Booking Approvals', '◷'], ['projects', 'Project Approvals', '▦'], ['clubs', 'Club Management', '◉'],
  ['equipment', 'Equipment Inventory', '⌘'], ['equipment-requests', 'Equipment Request Approvals', '✓'],
  ['knowledge', 'Campus Knowledge', '▤'], ['history', 'Historical Records', '◴'],
  ['notifications', 'Notifications', '♢'], ['profile', 'Admin Profile', '◎'],
]

export default function AdminShell() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const active = links.find(([path]) => path === (location.pathname === '/admin' ? '/' : location.pathname.slice('/admin/'.length)))
  const initials = (user?.name || user?.email || 'A').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  function signOut() { logout(); navigate('/login', { replace: true }) }
  return <div className="app-shell admin-shell">
    {open && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setOpen(false)} />}
    <aside className={`sidebar admin-sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand sidebar-brand"><span className="brand-mark">C</span><span>Campus<span className="brand-light">Sphere</span></span></div>
      <div className="workspace-switch"><span className="workspace-icon">A</span><span><strong>Administration</strong><small>Campus control center</small></span></div>
      <nav className="side-nav" aria-label="Admin navigation">
        {links.map(([path, label, icon]) => <NavLink key={path} to={path === '/' ? '/admin' : `/admin/${path}`} end onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{icon}</span><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom"><button className="profile-mini" onClick={signOut} title="Sign out"><span className="avatar">{initials}</span><span className="profile-mini-text"><strong>{user?.name || 'Campus member'}</strong><small>ADMIN · {user?.email}</small></span><span className="logout-icon">↗</span></button></div>
    </aside>
    <div className="main-column"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open admin navigation"><span/><span/><span/></button><div className="breadcrumbs"><span>CampusSphere Admin</span><b>/</b><strong>{active?.[1] || 'Administration'}</strong></div><div className="topbar-right"><span className="role-pill">ADMIN</span><button className="topbar-avatar" onClick={signOut} title="Sign out">{initials}</button></div></header><main className="page-content"><Outlet /></main><footer className="page-footer"><span>CampusSphere Administration</span><span>Campus resource and request management</span></footer></div>
  </div>
}
