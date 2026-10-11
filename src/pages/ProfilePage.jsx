import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import StatusMessage from '../components/StatusMessage'

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [form, setForm] = useState({ name: '', department: '', year: '', bio: '', skills: '', interests: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setForm({ name: user?.name || '', department: user?.department || '', year: user?.year || '', bio: user?.bio || '', skills: (user?.skills || []).join(', '), interests: (user?.interests || []).join(', ') }), [user])
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await api.put(`/api/users/${user.id}`, { ...form, skills: list(form.skills), interests: list(form.interests) }); await refreshProfile(); setMessage('Your profile was updated.') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">STUDENT ACCOUNT</span><h1>My Profile</h1><p>{user?.email} · {user?.role}</p></div></div><StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}<form className="panel workflow-form profile-edit-form" onSubmit={save}><label>Full name<input required maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label>Department<input maxLength="120" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}/></label><label>Academic year<input maxLength="30" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}/></label><label>Bio<textarea maxLength="1000" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}/></label><label>Skills <span className="optional">Comma separated</span><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}/></label><label>Interests <span className="optional">Comma separated</span><input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })}/></label><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></form></div>
}
function list(value) { return value.split(',').map((item) => item.trim()).filter(Boolean) }
