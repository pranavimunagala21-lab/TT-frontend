import { useCallback, useEffect, useState } from 'react'
import { api, getPageItems } from '../api/client'
import LoadingScreen from '../components/LoadingScreen'
import StatusMessage from '../components/StatusMessage'

export default function NotificationsPage() {
  const [items, setItems] = useState(null)
  const [unread, setUnread] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const refresh = useCallback(async () => {
    setError('')
    const [list, count] = await Promise.allSettled([api.get('/api/notifications?page=0&size=40'), api.get('/api/notifications/unread-count')])
    if (list.status === 'fulfilled') setItems(getPageItems(list.value))
    else { setItems([]); setError(list.reason.message) }
    if (count.status === 'fulfilled') setUnread(typeof count.value === 'number' ? count.value : count.value?.count ?? count.value?.unreadCount ?? 0)
  }, [])
  useEffect(() => { refresh() }, [refresh])
  async function markRead(id) {
    setBusy(id); setError('')
    try { await api.patch(`/api/notifications/${id}/read`, {}); await refresh() }
    catch (e) { setError(e.message) }
    finally { setBusy(null) }
  }
  if (items === null) return <LoadingScreen label="Loading notifications..." />
  return <div className="directory-page"><div className="page-intro"><div><span className="eyebrow">YOUR UPDATES</span><h1>Notifications</h1><p>Important decisions and activity from your campus workflows.</p></div><span className="count-badge">{unread == null ? 'Unread' : `${unread} unread`}</span></div><StatusMessage>{error}</StatusMessage>
    {items.length ? <section className="notification-list">{items.map((item, i) => <article className={`notification-item ${item.read ? '' : 'unread'}`} key={item.id ?? i}><span className="notification-mark">{item.read ? '✓' : '•'}</span><div className="notification-content"><div className="notification-title-row"><strong>{item.title || humanize(item.type) || 'Campus update'}</strong>{item.createdAt && <time>{formatDate(item.createdAt)}</time>}</div><p>{item.message}</p>{item.type && <span className="notification-type">{humanize(item.type)}</span>}</div>{!item.read && <button className="text-button" disabled={busy === item.id} onClick={() => markRead(item.id)}>{busy === item.id ? 'Saving...' : 'Mark read'}</button>}</article>)}</section> : <div className="empty-state"><span className="empty-icon">♡</span><h2>You’re all caught up</h2><p>New campus updates will appear here.</p></div>}
  </div>
}
function humanize(value = '') { return String(value).toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : date.toLocaleString() }
