import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import StatusMessage from './StatusMessage'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [values, setValues] = useState({ name: '', email: '', password: '', department: '', year: '', bio: '', skills: '', interests: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!values.email.includes('@')) return setError('Enter a valid email address.')
    if (values.password.length < 6) return setError('Password must be at least 6 characters.')
    if (isRegister && !values.name.trim()) return setError('Enter your name.')
    setBusy(true)
    try {
      let authenticated
      if (isRegister) {
        authenticated = await register({
          name: values.name.trim(), email: values.email.trim(), password: values.password,
          department: values.department.trim() || null, year: values.year.trim() || null, bio: values.bio.trim() || null,
          skills: splitList(values.skills), interests: splitList(values.interests),
        })
      } else authenticated = await login({ email: values.email.trim(), password: values.password })
      navigate(authenticated?.role === 'ADMIN' ? '/admin' : '/app', { replace: true })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return <main className="auth-page">
    <section className="auth-aside">
      <Link to="/login" className="brand lockup"><span className="brand-mark">C</span><span>Campus<span className="brand-light">Sphere</span></span></Link>
      <div className="auth-aside-copy">
        <span className="eyebrow light">YOUR CAMPUS, CONNECTED</span>
        <h1>Make good things happen<br /><em>together.</em></h1>
        <p>Find the people, projects, spaces, and knowledge that move campus ideas forward.</p>
        <div className="orbit-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-core">C</span><i className="orbit-dot dot-one" /><i className="orbit-dot dot-two" /><i className="orbit-dot dot-three" /></div>
      </div>
      <div className="auth-footer">A shared space for campus possibility <span>·</span> CampusSphere</div>
    </section>
    <section className="auth-main">
      <div className="auth-mobile-brand"><span className="brand-mark">C</span><strong>CampusSphere</strong></div>
      <div className="auth-card">
        <span className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span>
        <h2>{isRegister ? 'Create your account' : 'Sign in to your campus'}</h2>
        <p className="auth-subtitle">{isRegister ? 'Set up your profile and find your place in the community.' : 'Pick up where your campus community left off.'}</p>
        <StatusMessage>{error}</StatusMessage>
        <form className="form-stack" onSubmit={submit}>
          {isRegister && <label>Full name<input autoComplete="name" value={values.name} onChange={set('name')} placeholder="e.g. Jordan Lee" required maxLength={120} /></label>}
          <label>Email address<input autoComplete="email" type="email" value={values.email} onChange={set('email')} placeholder="you@campus.edu" required /></label>
          <label>Password<input autoComplete={isRegister ? 'new-password' : 'current-password'} type="password" value={values.password} onChange={set('password')} placeholder="At least 6 characters" required minLength={6} /></label>
          {isRegister && <>
            <div className="form-row"><label>Department <span className="optional">Optional</span><input value={values.department} onChange={set('department')} placeholder="Computer Science" maxLength={120} /></label><label>Year <span className="optional">Optional</span><input value={values.year} onChange={set('year')} placeholder="2nd year" maxLength={30} /></label></div>
            <label>Skills <span className="optional">Optional · comma separated</span><input value={values.skills} onChange={set('skills')} placeholder="Design, Python, Robotics" /></label>
            <label>Interests <span className="optional">Optional · comma separated</span><input value={values.interests} onChange={set('interests')} placeholder="Sustainability, Events" /></label>
            <p className="role-note"><span className="tiny-shield">◇</span> New registrations receive a student account.</p>
          </>}
          <button className="button primary auth-submit" disabled={busy}>{busy ? <><span className="button-spinner" /> {isRegister ? 'Creating account…' : 'Signing in…'}</> : <>{isRegister ? 'Create account' : 'Sign in'} <span>→</span></>}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already part of CampusSphere?' : 'New to CampusSphere?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
      </div>
      <div className="auth-bottom-note">By continuing, you agree to use CampusSphere respectfully.</div>
    </section>
  </main>
}

function splitList(value) { return value.split(',').map((part) => part.trim()).filter(Boolean) }
