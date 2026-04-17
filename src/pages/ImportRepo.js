import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createRepo } from '../api'

export default function ImportRepo() {
  const [form, setForm] = useState({ url: '', username: '', token: '', name: '', isPrivate: false })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.url) return toast.error('Repository URL is required')
    if (!form.name) return toast.error('Repository name is required')
    setLoading(true)
    try {
      const { data } = await createRepo({
        name: form.name,
        description: `Imported from ${form.url}`,
        isPrivate: form.isPrivate
      })
      toast.success('Repository imported successfully!')
      navigate(`/repo/${data.repo._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>Repositories</Link>
          <span className="text-muted">/</span>
          <span style={{ fontSize: 13 }}>Import repository</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Import your project to AI-VCS</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 28 }}>
          Import all the files, including revision history, from another version control system.
        </p>

        <div className="card">
          <form onSubmit={handleSubmit}>

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Your source repository details</h2>

              <div className="form-group">
                <label className="label">The URL for your source repository *</label>
                <input className="input" placeholder="https://github.com/user/repo.git"
                  value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
                <p className="text-xs text-muted mt-8">Learn more about importing git repositories</p>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text2)', margin: '16px 0 12px' }}>
                Please enter your credentials if required for cloning the remote repository.
              </p>

              <div className="form-group">
                <label className="label">Your username for the source repository</label>
                <input className="input" placeholder="username"
                  value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="label">Your access token or password</label>
                <input className="input" type="password" placeholder="ghp_xxxxxxxxxxxx"
                  value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Your new repository details</h2>

              <div className="form-group">
                <label className="label">Repository name *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 14, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    you /
                  </div>
                  <input className="input" placeholder="my-imported-repo"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0 24px' }}>
                {['Public', 'Private'].map((vis) => (
                  <label key={vis} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="radio" name="visibility"
                      checked={form.isPrivate === (vis === 'Private')}
                      onChange={() => setForm({ ...form, isPrivate: vis === 'Private' })}
                      style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{vis}</div>
                      <div className="text-xs text-muted">
                        {vis === 'Public'
                          ? 'Anyone on the internet can see this repository.'
                          : 'You choose who can see this repository.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <Link to="/" className="btn">Cancel</Link>
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ minWidth: 120, justifyContent: 'center' }}>
                  {loading ? <span className="spinner" /> : 'Begin import'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}