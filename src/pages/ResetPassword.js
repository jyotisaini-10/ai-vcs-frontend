import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '../api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token')
      navigate('/login')
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const { data } = await resetPassword({ token, password: form.password })
      toast.success(data.message || 'Password reset successful!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.svg" alt="AI VCS" style={{ width: 64, height: 64, margin: '0 auto 12px', display: 'block', borderRadius: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>Set new <span style={{ color: 'var(--accent)' }}>password</span></h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Enter a new secure password for your account.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <input 
                type="checkbox" 
                id="show-pwd" 
                checked={showPwd} 
                onChange={() => setShowPwd(!showPwd)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="show-pwd" style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>Show passwords</label>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '10px' }}>
              {loading ? <span className="spinner" /> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
