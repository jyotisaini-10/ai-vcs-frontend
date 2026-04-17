import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      const { data } = await register(form)
      setAuth(data.user, data.token)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src="/logo.svg" alt="AI VCS" style={{ width: 64, height: 64, margin: '0 auto 12px', display: 'block', borderRadius: 16 }} />
          <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing: '-0.3px' }}>Create your <span style={{ color:'var(--accent)' }}>account</span></h1>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Join AI-VCS and start building.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Username</label>
              <input className="input" placeholder="yourname" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text3)', padding: 4, lineHeight: 0,
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                  tabIndex={-1}
                  title={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? (
                    /* Open eye — password is visible, click to hide */
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M1.679 7.932c.412-.621 1.242-1.75 2.366-2.717C5.175 4.242 6.527 3.5 8 3.5c1.473 0 2.824.742 3.955 1.715 1.124.967 1.954 2.096 2.366 2.717a.119.119 0 010 .136c-.412.621-1.242 1.75-2.366 2.717C10.825 11.758 9.473 12.5 8 12.5c-1.473 0-2.824-.742-3.955-1.715C2.92 9.818 2.09 8.69 1.679 8.068a.119.119 0 010-.136zM8 2c-1.981 0-3.67.992-4.933 2.078C1.797 5.169.88 6.423.43 7.1a1.619 1.619 0 000 1.798c.45.678 1.367 1.932 2.637 3.024C4.329 13.008 6.019 14 8 14c1.981 0 3.67-.992 4.933-2.078 1.27-1.092 2.187-2.346 2.637-3.024a1.619 1.619 0 000-1.798c-.45-.678-1.367-1.932-2.637-3.024C11.671 2.992 9.981 2 8 2zm0 8a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                  ) : (
                    /* Closed eye — password is hidden, click to show */
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M8 2c1.981 0 3.67.992 4.933 2.078 1.27 1.092 2.187 2.346 2.637 3.024a1.619 1.619 0 010 1.798c-.45.678-1.367 1.932-2.637 3.024C11.671 13.008 9.981 14 8 14c-1.981 0-3.67-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.9a1.619 1.619 0 010-1.798c.45-.678 1.367-1.932 2.637-3.024C4.329 2.992 6.019 2 8 2zM1.679 8.068a.119.119 0 000 .136c.412.621 1.242 1.75 2.366 2.717C5.175 11.758 6.527 12.5 8 12.5c1.473 0 2.824-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.119.119 0 000-.136c-.412-.621-1.242-1.75-2.366-2.717C10.825 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
                      <path d="M.22 1.22a.75.75 0 011.06 0l13.5 13.5a.75.75 0 11-1.06 1.06L.22 2.28a.75.75 0 010-1.06z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent:'center', padding:'10px' }}>
              {loading ? <span className="spinner"/> : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:16, color:'var(--text2)', fontSize:13 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
