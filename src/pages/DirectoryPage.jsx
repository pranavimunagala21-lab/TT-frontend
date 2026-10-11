import { useEffect, useState } from 'react'
import { api, getPageItems } from '../api/client'
import { downloadDocument } from '../api/documents'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'
import { useAuth } from '../state/AuthContext'

export default function DirectoryPage({ config }) {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const [workflow, setWorkflow] = useState([])
  const [forms, setForms] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', description: '', category: '', problemStatement: '', technologies: '', requiredSkills: '' })
  const [details, setDetails] = useState({})
  const [minCapacity, setMinCapacity] = useState('')
  const [relatedProjects, setRelatedProjects] = useState([])
  const [timeRange, setTimeRange] = useState({ startTime: '', endTime: '' })
  const [availabilityIds, setAvailabilityIds] = useState(null)
  const [facilityFilter, setFacilityFilter] = useState('')
  const paged = config.paged
  useEffect(() => { load() }, [config.endpoint])
  useEffect(() => {
    const endpoint = config.path === 'venues' ? '/api/bookings' : config.path === 'equipment' ? '/api/equipment-requests' : null
    if (endpoint) api.get(endpoint).then(setWorkflow).catch(() => setWorkflow([]))
  }, [config.path])
  useEffect(() => { if (config.path === 'equipment') api.get('/api/projects').then(setRelatedProjects).catch(() => setRelatedProjects([])) }, [config.path])
  async function load(search = '') {
    setItems(null); setError('')
    try {
      const params = new URLSearchParams()
      if (paged) { params.set('page', '0'); params.set('size', '40') }
      if (search.trim() && ['people','knowledge','history','projects','clubs','venues','equipment'].includes(config.path)) params.set('query', search.trim())
      if (config.path === 'venues' && minCapacity) params.set('minCapacity', minCapacity)
      const url = `${config.endpoint}${params.size ? `?${params}` : ''}`
      setItems(getPageItems(await api.get(url)))
    } catch (e) { setError(e.message); setItems([]) }
  }
  async function submit(event) { event.preventDefault(); await load(query) }
  async function download(item) {
    setError(''); setBusyId(item.id)
    try { await downloadDocument(item.id, item.fileName || item.name || item.title) }
    catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }
  async function requestClub(item) {
    setBusyId(item.id); setError(''); setMessage('')
    try { await api.post(`/api/clubs/${item.id}/membership-requests`, {}); setMessage(`Membership request sent to ${item.name}.`) }
    catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }
  async function createProject(event) {
    event.preventDefault(); setBusyId('create'); setError(''); setMessage('')
    try {
      const split = (value) => value.split(',').map((x) => x.trim()).filter(Boolean)
      await api.post('/api/projects', { ...createForm, technologies: split(createForm.technologies), requiredSkills: split(createForm.requiredSkills) })
      setMessage('Project proposal submitted for review.'); setShowCreate(false); setCreateForm({ title: '', description: '', category: '', problemStatement: '', technologies: '', requiredSkills: '' }); await load(query)
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  async function uploadProjectDocument(event, project) {
    event.preventDefault(); const form = new FormData(event.currentTarget); form.set('projectId', project.id)
    setBusyId(`upload-${project.id}`); setError(''); setMessage('')
    try {
      await api.post('/api/documents', form)
      const docs = await api.get(`/api/projects/${project.id}/documents`)
      setDetails((prev) => ({ ...prev, [project.id]: { ...prev[project.id], docs } }))
      setMessage('Document uploaded and attached to this project.')
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  async function toggleDetails(item) {
    if (details[item.id]) { setDetails((prev) => ({ ...prev, [item.id]: null })); return }
    setBusyId(`detail-${item.id}`); setError('')
    try {
      const [members, docs, similar] = config.path === 'projects'
        ? await Promise.all([api.get(`/api/projects/${item.id}/members`), api.get(`/api/projects/${item.id}/documents`).catch(() => []), api.get(`/api/projects/${item.id}/similar`)]).then((x) => [x[0], x[1], x[2]])
        : await Promise.all([api.get(`/api/clubs/${item.id}/members`), api.get(`/api/clubs/${item.id}/projects`)]).then((x) => [x[0], x[1], []])
      setDetails((prev) => ({ ...prev, [item.id]: { members, docs, similar } }))
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  async function addProjectMember(event, project) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); const userId = Number(form.get('userId'))
    setBusyId(`member-${project.id}`); setError('')
    try {
      await api.post(`/api/projects/${project.id}/members`, { userId })
      const members = await api.get(`/api/projects/${project.id}/members`)
      setDetails((prev) => ({ ...prev, [project.id]: { ...prev[project.id], members } }))
      setMessage('Team member added.'); formElement.reset()
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  async function removeProjectMember(project, member) {
    setBusyId(`member-${project.id}`); setError('')
    try {
      await api.delete(`/api/projects/${project.id}/members/${member.user?.id}`)
      const members = await api.get(`/api/projects/${project.id}/members`)
      setDetails((prev) => ({ ...prev, [project.id]: { ...prev[project.id], members } }))
      setMessage('Team member removed.')
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  async function submitWorkflow(event, item) {
    event.preventDefault(); setBusyId(item.id); setError(''); setMessage('')
    const form = forms[item.id] || {}
    try {
      if (config.path === 'venues') {
        await api.post('/api/bookings', { venueId: item.id, startTime: form.startTime, endTime: form.endTime, purpose: form.purpose, attendeesCount: Number(form.attendeesCount || 1) })
        setWorkflow(await api.get('/api/bookings'))
        setMessage('Booking request submitted. Its status is shown below.')
      } else {
        await api.post('/api/equipment-requests', { equipmentId: item.id, projectId: form.projectId ? Number(form.projectId) : null, quantity: Number(form.quantity || 1), expectedReturnDate: form.expectedReturnDate || null, notes: form.notes || '' })
        setWorkflow(await api.get('/api/equipment-requests'))
        setMessage('Equipment request submitted. Its status is shown below.')
      }
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }
  async function cancelWorkflow(entry) {
    const endpoint = config.path === 'venues' ? `/api/bookings/${entry.id}/cancel` : `/api/equipment-requests/${entry.id}/cancel`
    setBusyId(entry.id); setError(''); setMessage('')
    try { await api.post(endpoint, {}); setWorkflow(await api.get(config.path === 'venues' ? '/api/bookings' : '/api/equipment-requests')); setMessage('Request cancelled.') }
    catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }
  async function equipmentAction(entry, action) {
    setBusyId(entry.id); setError(''); setMessage('')
    try {
      if (action === 'checkout') await api.post(`/api/equipment-requests/${entry.id}/checkout`, {})
      else {
        const condition = window.prompt('Returned condition: EXCELLENT, GOOD, FAIR, or NEEDS_REPAIR', 'GOOD')
        if (!condition) return
        await api.post(`/api/equipment-requests/${entry.id}/return?condition=${encodeURIComponent(condition)}`, {})
      }
      setWorkflow(await api.get('/api/equipment-requests')); setMessage(action === 'checkout' ? 'Equipment checkout recorded.' : 'Equipment return recorded.')
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }
  async function searchAvailability(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusyId('availability')
    try {
      const params = new URLSearchParams({ startTime: toDateTime(timeRange.startTime), endTime: toDateTime(timeRange.endTime) })
      const result = await api.get(`/api/bookings/availability?${params}`)
      setAvailabilityIds(result.filter((x) => x.available).map((x) => x.venueId))
      setMessage(`${result.filter((x) => x.available).length} venues available for that time.`)
    } catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }
  function field(item, name, value) { setForms((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), [name]: value } })) }
  const visible = (items || []).filter((item) => {
    if (availabilityIds && config.path === 'venues' && !availabilityIds.includes(item.id)) return false
    if (facilityFilter && config.path === 'venues' && !(item.facilities || []).some((f) => String(f).toLowerCase().includes(facilityFilter.toLowerCase()))) return false
    if (paged || !query.trim()) return true
    const haystack = [item.title, item.name, item.description, item.category, item.department, ...(item.requiredSkills || []), ...(item.technologies || [])].join(' ').toLowerCase()
    return haystack.includes(query.toLowerCase())
  })
  return <div className="directory-page">
    <div className="page-intro"><div><span className="eyebrow">CAMPUS DIRECTORY</span><h1>{config.title}</h1><p>Explore shared campus information. Records labelled DEMO are illustrative.</p></div><div className="directory-tools">{config.path === 'projects' && <button className="button primary" onClick={() => setShowCreate((v) => !v)}>Propose project</button>}<span className="count-badge">{items ? `${visible.length} ${visible.length === 1 ? 'result' : 'results'}` : 'Loading'}</span></div></div>
    <form className="directory-search" onSubmit={submit}><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} aria-label={`Search ${config.title}`} />{config.path === 'venues' && <><input type="number" min="1" aria-label="Minimum capacity" placeholder="Min capacity" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} /><input aria-label="Facility filter" placeholder="Facility" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} /></>}<button className="button secondary">Search</button></form>
    {config.path === 'venues' && <form className="directory-search availability-search" onSubmit={searchAvailability}><label>Availability start <input type="datetime-local" required value={timeRange.startTime} onChange={(e) => setTimeRange((x) => ({ ...x, startTime: e.target.value }))}/></label><label>End <input type="datetime-local" required value={timeRange.endTime} onChange={(e) => setTimeRange((x) => ({ ...x, endTime: e.target.value }))}/></label><button className="button secondary" disabled={busyId === 'availability'}>{busyId === 'availability' ? 'Checking…' : 'Find available venues'}</button>{availabilityIds && <button type="button" className="text-button" onClick={() => setAvailabilityIds(null)}>Clear time filter</button>}</form>}
    {showCreate && <form className="panel workflow-form proposal-form" onSubmit={createProject}><h2>Submit a project proposal</h2><input required maxLength="200" placeholder="Project title" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} /><input required placeholder="Category" value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))} /><textarea required placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} /><textarea placeholder="Problem statement" value={createForm.problemStatement} onChange={(e) => setCreateForm((f) => ({ ...f, problemStatement: e.target.value }))} /><input placeholder="Technologies, comma separated" value={createForm.technologies} onChange={(e) => setCreateForm((f) => ({ ...f, technologies: e.target.value }))} /><input placeholder="Skills needed, comma separated" value={createForm.requiredSkills} onChange={(e) => setCreateForm((f) => ({ ...f, requiredSkills: e.target.value }))} /><div><button className="button primary" disabled={busyId === 'create'}>{busyId === 'create' ? 'Submitting…' : 'Submit proposal'}</button> <button type="button" className="button secondary" onClick={() => setShowCreate(false)}>Cancel</button></div></form>}
    <StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}
    {items === null ? <LoadingScreen label={`Loading ${config.title.toLowerCase()}...`} /> : visible.length ? <section className="resource-grid">{visible.map((item, index) => <article className="resource-card" key={item.id ?? index}><div className="resource-card-head"><span className="resource-symbol">{symbol(config.path)}</span>{item.status && <span className={`status-pill ${String(item.status).toLowerCase()}`}>{humanize(item.status)}</span>}</div><h2>{item.title || item.name || item.fileName || 'Untitled record'}</h2>{item.description && <p className="resource-description">{item.description}</p>}<dl className="resource-fields">{config.fields.map(([key, label]) => { const value = item[key] ?? nestedValue(item, key); if (value == null || value === '') return null; return <div key={key}><dt>{label}</dt><dd>{formatValue(value)}</dd></div> })}</dl>{config.path === 'documents' && <button className="button secondary full-button" disabled={busyId === item.id} onClick={() => download(item)}>{busyId === item.id ? 'Preparing download...' : 'Download document ↓'}</button>}
      {config.path === 'venues' && <form className="workflow-form" onSubmit={(e) => submitWorkflow(e, item)}><strong>Request a booking</strong><input type="datetime-local" required aria-label="Start time" onChange={(e) => field(item, 'startTime', e.target.value)} /><input type="datetime-local" required aria-label="End time" onChange={(e) => field(item, 'endTime', e.target.value)} /><input required placeholder="Purpose" maxLength="1000" onChange={(e) => field(item, 'purpose', e.target.value)} /><input type="number" min="1" max={item.capacity || undefined} required placeholder="Attendees" onChange={(e) => field(item, 'attendeesCount', e.target.value)} /><button className="button primary" disabled={busyId === item.id}>{busyId === item.id ? 'Sending...' : 'Request booking'}</button></form>}
      {config.path === 'equipment' && <form className="workflow-form" onSubmit={(e) => submitWorkflow(e, item)}><strong>Request equipment</strong><input type="number" min="1" max={item.availableQuantity || 1} required defaultValue="1" aria-label="Quantity" onChange={(e) => field(item, 'quantity', e.target.value)} /><input type="date" aria-label="Expected return date" onChange={(e) => field(item, 'expectedReturnDate', e.target.value)} /><select aria-label="Related project (optional)" defaultValue="" onChange={(e) => field(item, 'projectId', e.target.value)}><option value="">No project link</option>{relatedProjects.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select><input placeholder="Notes (optional)" onChange={(e) => field(item, 'notes', e.target.value)} /><button className="button primary" disabled={busyId === item.id || (item.availableQuantity ?? 0) < 1}>{busyId === item.id ? 'Sending...' : 'Request item'}</button></form>}
      {config.path === 'clubs' && <button className="button secondary full-button" disabled={busyId === item.id} onClick={() => requestClub(item)}>{busyId === item.id ? 'Sending…' : 'Request membership'}</button>}
      {config.path === 'projects' && ['PLANNING','ACTIVE'].includes(String(item.status).toUpperCase()) && item.owner?.id !== user?.id && user?.role === 'STUDENT' && <button className="button secondary full-button" disabled={busyId === `join-${item.id}`} onClick={async () => { setBusyId(`join-${item.id}`); setError(''); setMessage(''); try { await api.post(`/api/projects/${item.id}/membership-requests`, {}); setMessage('Project team request sent to the owner for review.'); if (details[item.id]) { const members = await api.get(`/api/projects/${item.id}/members`); setDetails((prev) => ({ ...prev, [item.id]: { ...prev[item.id], members } })) } } catch (e) { setError(e.message) } finally { setBusyId('') } }}>{busyId === `join-${item.id}` ? 'Sending…' : 'Request to join team'}</button>}
      {['projects','clubs'].includes(config.path) && <button className="text-button" disabled={busyId === `detail-${item.id}`} onClick={() => toggleDetails(item)}>{details[item.id] ? 'Hide details' : busyId === `detail-${item.id}` ? 'Loading…' : 'View team and related records'}</button>}
      {details[item.id] && <div className="resource-fields detail-panel"><strong>{config.path === 'projects' ? 'Team' : 'Members'}</strong>{details[item.id].members?.length ? details[item.id].members.map((m) => <div key={m.id}><dt>{m.user?.name || 'Member'}</dt><dd>{m.role} · {m.status}{config.path === 'projects' && (user?.role === 'ADMIN' || item.owner?.id === user?.id) && m.user?.id !== item.owner?.id && <button className="text-button" disabled={busyId === `member-${item.id}`} onClick={() => removeProjectMember(item, m)}>Remove</button>}</dd></div>) : <p>No team members listed.</p>}{config.path === 'projects' && (user?.role === 'ADMIN' || item.owner?.id === user?.id) && <form className="workflow-form" onSubmit={(e) => addProjectMember(e, item)}><input name="userId" type="number" min="1" required placeholder="Campus user ID"/><button className="button secondary" disabled={busyId === `member-${item.id}`}>{busyId === `member-${item.id}` ? 'Saving…' : 'Add team member'}</button></form>}{config.path === 'projects' && <><strong>Documents</strong>{details[item.id].docs?.map((doc) => <div key={doc.id}>{doc.originalFileName || doc.fileName || doc.title || 'Project file'} <button className="text-button" onClick={() => download(doc)}>Download</button></div>)}{(user?.role === 'ADMIN' || item.owner?.id === user?.id) && <form className="workflow-form" onSubmit={(e) => uploadProjectDocument(e, item)}><input name="title" required placeholder="Document title"/><input name="description" placeholder="Short description"/><input name="file" type="file" required accept=".pdf,.txt,.csv,.png,.jpg,.jpeg"/><button className="button secondary" disabled={busyId === `upload-${item.id}`}>{busyId === `upload-${item.id}` ? 'Uploading…' : 'Upload project document'}</button></form>}<strong>Similar projects</strong>{details[item.id].similar?.map((p) => <div key={p.id}>{p.title}</div>)}</>}{config.path === 'clubs' && <><strong>Club projects</strong>{details[item.id].docs?.map((p) => <div key={p.id}>{p.title}</div>)}</>}</div>}
      </article>)}</section> : <div className="empty-state"><span className="empty-icon">{symbol(config.path)}</span><h2>No {config.title.toLowerCase()} found</h2><p>{query ? 'Try a different search term.' : 'There is no information available here yet.'}</p></div>}
    {workflow.length > 0 && ['venues','equipment'].includes(config.path) && <section className="panel workflow-history"><div className="panel-heading"><div><span className="eyebrow">YOUR WORKFLOW</span><h2>{config.path === 'venues' ? 'Booking requests' : 'Equipment requests'}</h2></div></div><div className="activity-list">{workflow.map((entry) => <article className="activity-item" key={entry.id}><span className="activity-dot"/><div><strong>{entry.venue?.name || entry.equipment?.name || entry.purpose || 'Request'}</strong><p>{humanize(entry.status || 'Pending')}{entry.startTime ? ` · ${new Date(entry.startTime).toLocaleString()}` : ''}{entry.expectedReturnDate ? ` · Return ${entry.expectedReturnDate}` : ''}</p></div>{config.path === 'equipment' && String(entry.status).toUpperCase() === 'APPROVED' && <button className="text-button" disabled={busyId === entry.id} onClick={() => equipmentAction(entry, 'checkout')}>Check out</button>}{config.path === 'equipment' && String(entry.status).toUpperCase() === 'CHECKED_OUT' && <button className="text-button" disabled={busyId === entry.id} onClick={() => equipmentAction(entry, 'return')}>Return item</button>}{['PENDING','APPROVED'].includes(String(entry.status).toUpperCase()) && <button className="text-button" disabled={busyId === entry.id} onClick={() => cancelWorkflow(entry)}>{busyId === entry.id ? 'Saving...' : 'Cancel request'}</button>}</article>)}</div></section>}
  </div>
}
function nestedValue(item, key) { return key === 'projectTitle' ? item.projectTitle ?? item.project?.title : key === 'clubName' ? item.clubName ?? item.club?.name : key === 'uploadedAt' ? item.uploadedAt : undefined }
function formatValue(value) { if (Array.isArray(value)) return value.length ? value.join(', ') : ''; return typeof value === 'object' ? JSON.stringify(value) : String(value) }
function humanize(value) { return String(value).toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
function symbol(path) { return ({ projects: '⌘', clubs: '◉', people: '♧', venues: '⌂', equipment: '▣', knowledge: '✧', documents: '▤' })[path] || '◇' }
function toDateTime(value) { return value?.length === 16 ? `${value}:00` : value }
