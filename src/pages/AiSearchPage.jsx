import { useState } from 'react'
import { api, getPageItems } from '../api/client'
import { useAuth } from '../state/AuthContext'
import StatusMessage from '../components/StatusMessage'

export default function AiSearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('search')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [indexMessage, setIndexMessage] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null)
    try {
      const response = await api.post(mode === 'assistant' ? '/api/ai/assistant' : '/api/ai/search?page=0&size=20', { query: query.trim() })
      setResult(response)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  async function indexEmbeddings() {
    setIndexMessage(''); setError(''); setBusy(true)
    try { const response = await api.post('/api/ai/embeddings/index', {}); setIndexMessage(response?.message || 'Embedding index request completed.') }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const results = getPageItems(result)
  const sources = result?.sourceReferences || result?.sources || result?.references || []
  return <div className="ai-page"><section className="ai-hero"><span className="eyebrow light">CAMPUS DISCOVERY</span><h1>Find the signal<br /><em>in your campus.</em></h1><p>Search projects, shared knowledge, milestones, and more using the information available to you.</p><div className="ai-orb"><span>✳</span></div></section>
    <section className="ai-workspace"><div className="ai-tabs"><button className={mode === 'search' ? 'selected' : ''} onClick={() => setMode('search')}>Search records</button><button className={mode === 'assistant' ? 'selected' : ''} onClick={() => setMode('assistant')}>Ask campus assistant</button></div><form className="ai-query" onSubmit={submit}><textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === 'assistant' ? 'Ask a question about projects, campus knowledge, or past work...' : 'Try “sustainability projects using data science”'} maxLength={500} required /><div className="ai-query-footer"><span>{query.length}/500 · Results respect your access</span><button className="button primary" disabled={busy || !query.trim()}>{busy ? 'Searching...' : mode === 'assistant' ? 'Ask question ↗' : 'Search campus ↗'}</button></div></form><StatusMessage>{error}</StatusMessage>{indexMessage && <div className="success-message">{indexMessage}</div>}
      {result && <section className="ai-results">{mode === 'assistant' ? <><h2>Campus assistant</h2><p className="assistant-answer">{result.answer || result.response || result.message || 'No answer was returned.'}</p>{sources.length > 0 && <div className="source-list"><strong>Supporting sources</strong>{sources.map((source, i) => <div key={source.id ?? i}><span>{typeof source === 'string' ? source : source.title || source.name || 'Campus source'}</span><small>{typeof source === 'string' ? '' : source.resourceType || source.type || source.reference || ''}</small></div>)}</div>}</> : <><div className="panel-heading"><h2>Search results</h2><span className="count-badge">{result.totalElements ?? results.length} found</span></div>{results.length ? <div className="ai-result-list">{results.map((item, i) => <article key={item.id ?? i}><span className="result-type">{item.resourceType || item.type || 'Campus record'}</span><h3>{item.title || item.name || 'Untitled record'}</h3><p>{item.explanation || item.description || item.summary || 'Relevant campus information.'}</p>{item.relevance != null && <small>Relevance {Math.round(Number(item.relevance) * 100)}% · </small>}{item.reference && <small>{item.reference}</small>}</article>)}</div> : <p className="muted">No matching records were returned for this query.</p>}</>}</section>}
    </section>
    {user?.role === 'ADMIN' && <section className="admin-tool"><div><span className="eyebrow">ADMINISTRATOR</span><h2>Knowledge indexing</h2><p>Refresh the campus search index from existing records.</p></div><button className="button secondary" disabled={busy} onClick={indexEmbeddings}>{busy ? 'Working...' : 'Refresh index'}</button></section>}
  </div>
}
