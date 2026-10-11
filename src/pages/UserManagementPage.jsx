import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

const blank = { name: '', department: '', year: '', bio: '' }
export default function UserManagementPage() {
  const [pageData, setPageData] = useState(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    setBusy(true); setError('')
    try {
      const params = new URLSearchParams({ page: String(page), size: '10', sort: 'createdAt,desc' })
      if (query.trim()) params.set('query', query.trim())
      if (role) params.set('role', role)
      setPageData(await api.get(`/api/users?${params}`))
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }, [page, query, role])
  useEffect(() => { refresh() }, [refresh])
  function beginEdit(account) { setEditing(account); setForm({ name: account.name || '', department: account.department || '', year: account.year || '', bio: account.bio || '' }); setMessage(''); setError('') }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await api.put(`/api/users/${editing.id}`, form); setMessage(`Profile updated for ${editing.name}.`); setEditing(null); await refresh() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function deactivate(account) {
    const approved = window.confirm(`Deactivate ${account.name} (${account.email})? They will lose sign-in access, while their linked projects, requests and campus records are retained.`)
    if (!approved) return
    setBusy(true); setError(''); setMessage('')
    try { await api.delete(`/api/users/${account.id}`); setMessage(`Sign-in access deactivated for ${account.name}. Campus history was retained.`); await refresh() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">ADMINISTRATION</span><h1>User Management</h1><p>Search accounts, edit permitted profile fields, and deactivate student access without deleting campus history.</p></div><button className="button secondary" onClick={refresh} disabled={busy}>Refresh</button></div>
    <StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}
    <div className="directory-search"><input aria-label="Search people" placeholder="Search name or email" value={query} onChange={(e) => { setPage(0); setQuery(e.target.value) }}/><select aria-label="Filter by role" value={role} onChange={(e) => { setPage(0); setRole(e.target.value) }}><option value="">All roles</option><option value="STUDENT">Student</option><option value="ADMIN">Admin</option></select><button className="button secondary" onClick={refresh} disabled={busy}>Search</button></div>
    {editing && <form className="panel workflow-form" onSubmit={save}><h2>Edit {editing.name}</h2><label>Name<input required maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label>Department<input maxLength="120" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}/></label><label>Academic year<input maxLength="30" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}/></label><label>Bio<textarea maxLength="1000" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}/></label><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button> <button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancel</button></form>}
    {pageData ? <div className="panel user-table-wrap"><table className="user-table"><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Role</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pageData.content.map((account) => <tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td>{account.department || '—'}</td><td>{account.year || '—'}</td><td>{account.role}</td><td>{formatDate(account.createdAt)}</td><td>{account.active ? 'Active' : 'Deactivated'}</td><td><button className="text-button" onClick={() => beginEdit(account)}>Edit</button>{account.role === 'STUDENT' && account.active && <button className="text-button danger-text" disabled={busy} onClick={() => deactivate(account)}>Deactivate</button>}</td></tr>)}</tbody></table>{pageData.content.length === 0 && <div className="empty-inline"><p>No matching accounts.</p></div>}<div className="pagination"><button className="button secondary" disabled={pageData.first || busy} onClick={() => setPage((n) => n - 1)}>Previous</button><span>Page {pageData.number + 1} of {Math.max(1, pageData.totalPages)} · {pageData.totalElements} accounts</span><button className="button secondary" disabled={pageData.last || busy} onClick={() => setPage((n) => n + 1)}>Next</button></div></div> : error ? <button className="button secondary" onClick={refresh}>Retry loading users</button> : <LoadingScreen label="Loading user directory…"/>}
  </div>
}
function formatDate(value) { return value ? new Date(value).toLocaleDateString() : '—' }
