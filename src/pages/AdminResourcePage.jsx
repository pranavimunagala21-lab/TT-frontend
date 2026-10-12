import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

const schemas = {
  venues: { title: 'Venue Management', endpoint: '/api/venues', fields: [['name','Name'],['building','Building'],['floor','Floor'],['capacity','Capacity','number'],['facilities','Facilities (comma separated)'],['description','Description','textarea'],['status','Status']] },
  equipment: { title: 'Equipment Inventory', endpoint: '/api/equipment', fields: [['name','Name'],['category','Category'],['serialNumber','Serial number'],['quantity','Total quantity','number'],['location','Location'],['description','Description','textarea']] },
  clubs: { title: 'Club Management', endpoint: '/api/clubs', fields: [['name','Name'],['category','Category'],['department','Department'],['description','Description','textarea'],['activities','Activities','textarea'],['history','History','textarea']] },
  knowledge: { title: 'Campus Knowledge Management', endpoint: '/api/knowledge', fields: [['title','Title'],['category','Category'],['description','Description','textarea'],['content','Content','textarea'],['tags','Tags (comma separated)']] },
  history: { title: 'Historical Records', endpoint: '/api/historical-records', fields: [['projectTitle','Record title'],['category','Category'],['department','Department'],['year','Year','number'],['summary','Summary','textarea'],['outcomes','Outcomes','textarea'],['lessonsLearned','Lessons learned','textarea']] },
}
export default function AdminResourcePage({ type }) {
  const schema = schemas[type]
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const refresh = useCallback(async () => { setError(''); try { setItems(itemsArray(await api.get(schema.endpoint))) } catch (e) { setError(e.message) } }, [schema.endpoint])
  useEffect(() => { refresh() }, [refresh])
  function start(item = null) { setEditing(item || {}); const values = {}; schema.fields.forEach(([key]) => { const value = item?.[key]; values[key] = Array.isArray(value) ? value.join(', ') : value ?? '' }); setForm(values); setMessage(''); setError('') }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const body = { ...form }
    schema.fields.forEach(([key]) => { if (key === 'facilities') body[key] = list(body[key]); if (['capacity','quantity','year'].includes(key)) body[key] = body[key] === '' ? null : Number(body[key]) })
    if (type === 'equipment' && !editing) { body.conditionStatus = 'GOOD'; body.availableQuantity = body.quantity; body.status = 'AVAILABLE' }
    try { if (editing?.id) await api.put(`${schema.endpoint}/${editing.id}`, body); else await api.post(schema.endpoint, body); setMessage(`${schema.title.replace(' Management','')} saved.`); setEditing(null); await refresh() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function remove(item) {
    if (type !== 'venues' || !window.confirm(`Delete venue “${item.name}”? Venues with booking history cannot be deleted.`)) return
    setDeleting(item.id); setError(''); setMessage('')
    try { await api.delete(`${schema.endpoint}/${item.id}`); setMessage(`Venue “${item.name}” deleted.`); await refresh() }
    catch (e) { setError(e.message) }
    finally { setDeleting(null) }
  }
  if (!items && error) return <div className="directory-page"><StatusMessage>{error}</StatusMessage><button className="button secondary" onClick={refresh}>Retry</button></div>
  if (!items) return <div className="directory-page"><LoadingScreen label={`Loading ${schema.title.toLowerCase()}…`}/></div>
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">ADMINISTRATION</span><h1>{schema.title}</h1><p>Changes are saved to the existing CampusSphere database.</p></div><button className="button primary" onClick={() => start()}>Add record</button></div><StatusMessage>{error}</StatusMessage>{message && <div className="success-message" role="status">{message}</div>}
    {editing !== null && <form className="panel workflow-form resource-admin-form" onSubmit={save}><h2>{editing?.id ? `Edit ${editing.name || editing.title || editing.projectTitle}` : `Add ${type === 'equipment' ? 'equipment' : 'record'}`}</h2><div className="form-row">{schema.fields.map(([key,label,kind]) => <label key={key}>{label}{kind === 'textarea' ? <textarea required={['name','title','projectTitle','summary','content'].includes(key)} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}/> : <input required={['name','title','projectTitle','building','category'].includes(key)} type={kind || 'text'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}/>}</label>)}</div><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button> <button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancel</button></form>}
    {items.length ? <section className="resource-grid">{items.map((item) => <article className="resource-card" key={item.id}><div className="resource-card-head"><span className="resource-symbol">{type === 'venues' ? '⌂' : type === 'clubs' ? '◉' : type === 'equipment' ? '⌘' : '▤'}</span><span className="status-pill">{item.status || 'ACTIVE'}</span></div><h2>{item.name || item.title || item.projectTitle || 'Campus record'}</h2><p className="resource-description">{item.description || item.summary || item.category || ''}</p>{type !== 'history' && <button className="button secondary full-button" onClick={() => start(item)}>Edit record</button>}{type === 'venues' && <button className="button secondary full-button" disabled={deleting === item.id} onClick={() => remove(item)}>{deleting === item.id ? 'Deleting…' : 'Delete venue'}</button>}</article>)}</section> : <div className="empty-state"><h2>No records yet</h2><p>Create the first record to make it available in campus browsing.</p></div>}
  </div>
}
function itemsArray(value) { return Array.isArray(value) ? value : Array.isArray(value?.content) ? value.content : Array.isArray(value?.items) ? value.items : [] }
function list(value) { return String(value || '').split(',').map((part) => part.trim()).filter(Boolean) }
