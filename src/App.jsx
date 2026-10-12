import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './state/AuthContext'
import AuthPage from './components/AuthPage'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import DirectoryPage from './pages/DirectoryPage'
import NotificationsPage from './pages/NotificationsPage'
import AiSearchPage from './pages/AiSearchPage'
import AdminPage from './pages/AdminPage'
import AdminProjectsPage from './pages/AdminProjectsPage'
import LoadingScreen from './components/LoadingScreen'
import AdminShell from './components/AdminShell'
import AdminOverview from './pages/AdminOverview'
import UserManagementPage from './pages/UserManagementPage'
import MyRequestsPage from './pages/MyRequestsPage'
import ProfilePage from './pages/ProfilePage'
import AdminResourcePage from './pages/AdminResourcePage'

const directories = [
  { path: 'projects', title: 'Projects', endpoint: '/api/projects', fields: [['category','Category'],['status','Status'],['description','About'],['technologies','Technologies'],['requiredSkills','Skills needed'],['reviewReason','Review note']] },
  { path: 'clubs', title: 'Clubs', endpoint: '/api/clubs', fields: [['department','Department'],['category','Category'],['description','About'],['activities','Activities'],['achievements','Achievements']] },
  { path: 'people', title: 'People & skills', endpoint: '/api/users', paged: true, fields: [['role','Role'],['department','Department'],['year','Year'],['skills','Skills'],['interests','Interests']] },
  { path: 'venues', title: 'Venues', endpoint: '/api/venues', fields: [['building','Building'],['capacity','Capacity'],['facilities','Facilities'],['status','Status']] },
  { path: 'equipment', title: 'Equipment', endpoint: '/api/equipment', fields: [['category','Category'],['availableQuantity','Available'],['quantity','Total'],['status','Status']] },
  { path: 'knowledge', title: 'Knowledge', endpoint: '/api/knowledge', paged: true, fields: [['category','Category'],['recordDate','Record date'],['projectTitle','Project'],['description','Summary'],['tags','Tags']] },
  { path: 'history', title: 'Historical records', endpoint: '/api/historical-records', paged: true, fields: [['category','Category'],['department','Department'],['year','Year'],['summary','Summary'],['outcomes','Outcomes'],['eventDate','Event date']] },
  { path: 'documents', title: 'Documents', endpoint: '/api/documents', fields: [['documentType','Type'],['originalFileName','File'],['projectTitle','Project'],['clubName','Club'],['uploadedAt','Uploaded']] },
]

export default function App() {
  const { status, user } = useAuth()
  if (status === 'checking') return <LoadingScreen label="Restoring your session…" />
  return <Routes>
    <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace /> : <AuthPage mode="login" />} />
    <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace /> : <AuthPage mode="register" />} />
    <Route path="/" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/app') : '/login'} replace />} />
    <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminShell /> : user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />}>
      <Route index element={<AdminOverview />} />
      <Route path="users" element={<UserManagementPage />} />
      <Route path="venues" element={<AdminResourcePage type="venues" />} />
      <Route path="bookings" element={<AdminPage view="bookings" />} />
      <Route path="projects" element={<AdminProjectsPage />} />
      <Route path="clubs" element={<AdminResourcePage type="clubs" />} />
      <Route path="equipment" element={<AdminResourcePage type="equipment" />} />
      <Route path="equipment-requests" element={<AdminPage view="equipment-requests" />} />
      <Route path="knowledge" element={<AdminResourcePage type="knowledge" />} />
      <Route path="history" element={<AdminResourcePage type="history" />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<AdminOverview profileOnly />} />
    </Route>
    <Route path="/app" element={user?.role !== 'ADMIN' && user ? <AppShell /> : user ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />}>
      <Route index element={user?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Dashboard />} />
      {directories.map((directory) => <Route key={directory.path} path={directory.path} element={<DirectoryPage config={directory} />} />)}
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="my-requests" element={<MyRequestsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="admin" element={<Navigate to="/admin" replace />} />
      <Route path="ai" element={<AiSearchPage />} />
    </Route>
    <Route path="*" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/app') : '/login'} replace />} />
  </Routes>
}
