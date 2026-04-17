import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createRepo } from '../api'

export default function NewRepo() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const defaultName = searchParams.get('name') || ''
  const [form, setForm] = useState({ name: defaultName, description: '', isPrivate: false })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.match(/^[a-zA-Z0-9_.-]+$/)) {
      return toast.error('Name can only contain letters, numbers, hyphens, underscores, and dots')
    }
    setLoading(true)
    try {
      const { data } = await createRepo(form)
      toast.success('Repository created!')
      navigate(`/repo/${data.repo._id}/setup`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create repo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop:40, maxWidth:640 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to="/" className="text-muted text-sm">Repositories</Link>
          <span className="text-muted">/</span>
          <span className="text-sm">New repository</span>
        </div>

        <h1 style={{ fontSize:22, fontWeight:600, marginBottom:24 }}>Create a new repository</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Repository name *</label>
              <input
                className="input"
                placeholder="my-awesome-project"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted mt-8">Letters, numbers, hyphens, underscores, and dots only</p>
            </div>

            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <hr className="divider" />

            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {['Public', 'Private'].map((vis) => (
                <label key={vis} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={form.isPrivate === (vis === 'Private')}
                    onChange={() => setForm({ ...form, isPrivate: vis === 'Private' })}
                    style={{ marginTop:2 }}
                  />
                  <div>
                    <div style={{ fontWeight:500 }}>{vis}</div>
                    <div className="text-xs text-muted">
                      {vis === 'Public' ? 'Anyone can see this repository' : 'Only you can see this repository'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-8">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"/> : 'Create repository'}
              </button>
              <Link to="/" className="btn">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
