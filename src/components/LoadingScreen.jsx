export default function LoadingScreen({ label = 'Loading…' }) {
  return <div className="loading-screen"><span className="spinner" /><span>{label}</span></div>
}
