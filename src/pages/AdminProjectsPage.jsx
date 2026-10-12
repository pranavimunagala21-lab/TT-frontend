import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      setProjects(await api.get('/api/projects'))
    } catch (e) {
      setError(e.message)
      setProjects([])
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function decide(project, approved) {
    const reason = approved ? '' : window.prompt(`Reason for rejecting “${project.title}”?`)
    if (!approved && !reason?.trim()) return
    setBusy(`decision-${project.id}`)
    setError('')
    setMessage('')
    try {
      await api.post(`/api/admin/projects/${project.id}/decision`, { approved, reason: reason || null })
      setMessage(`Project “${project.title}” ${approved ? 'approved' : 'rejected'}.`)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  async function remove(project) {
    if (!window.confirm(`Delete “${project.title}” permanently? This cannot be undone.`)) return
    setBusy(`delete-${project.id}`)
    setError('')
    setMessage('')
    try {
      await api.delete(`/api/projects/${project.id}`)
      setMessage(`Project “${project.title}” deleted.`)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  if (!projects && !error) return <LoadingScreen label="Loading all projects…" />

  return <div className="directory-page">
    <div className="page-intro">
      <div><span className="eyebrow">ADMINISTRATION</span><h1>Project Management</h1><p>Review proposals and manage projects saved in CampusSphere.</p></div>
      <button className="button secondary" onClick={refresh}>Refresh</button>
    </div>
    <StatusMessage>{error}</StatusMessage>
    {message && <div className="success-message" role="status">{message}</div>}
    {projects?.length ? <section className="resource-grid">
      {projects.map((project) => <article className="resource-card" key={project.id}>
        <div className="resource-card-head"><span className="resource-symbol">▦</span><span className={`status-pill ${project.status === 'REJECTED' ? 'rejected' : ''}`}>{project.status || 'UNKNOWN'}</span></div>
        <h2>{project.title}</h2>
        <p className="resource-description">{project.description || 'No project description provided.'}</p>
        <dl className="resource-fields">
          <div><dt>Owner</dt><dd>{project.owner?.name || project.owner?.email || 'Unknown'}</dd></div>
          <div><dt>Category</dt><dd>{project.category || 'Uncategorized'}</dd></div>
          <div><dt>Submitted</dt><dd>{formatDate(project.createdAt)}</dd></div>
          <div><dt>Review note</dt><dd>{project.reviewReason || '—'}</dd></div>
        </dl>
        <details className="project-detail-toggle"><summary>Project details</summary>
          {project.problemStatement && <p><strong>Problem:</strong> {project.problemStatement}</p>}
          {project.technologies?.length > 0 && <p><strong>Technologies:</strong> {project.technologies.join(', ')}</p>}
          {project.requiredSkills?.length > 0 && <p><strong>Skills:</strong> {project.requiredSkills.join(', ')}</p>}
          {project.requiredEquipment?.length > 0 && <p><strong>Equipment:</strong> {project.requiredEquipment.join(', ')}</p>}
        </details>
        <div className="admin-actions project-admin-actions">
          {project.status === 'IDEA' && <>
            <button className="button primary" disabled={Boolean(busy)} onClick={() => decide(project, true)}>Approve</button>
            <button className="button secondary" disabled={Boolean(busy)} onClick={() => decide(project, false)}>Reject</button>
          </>}
          <button className="button secondary" disabled={Boolean(busy)} onClick={() => remove(project)}>Delete</button>
        </div>
      </article>)}
    </section> : <div className="empty-state"><h2>No projects yet</h2><p>Submitted projects will appear here with their current review status.</p></div>}
  </div>
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Date unavailable'
}
