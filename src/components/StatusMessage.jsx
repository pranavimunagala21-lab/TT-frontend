export default function StatusMessage({ children, tone = 'error' }) {
  if (!children) return null
  return <div className={`status-message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}
