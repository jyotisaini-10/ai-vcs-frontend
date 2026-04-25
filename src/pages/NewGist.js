import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createGist } from '../api'

export default function NewGist() {
  const [form, setForm] = useState({ title: '', content: '', language: 'javascript', isPublic: true })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      return toast.error('Please fill in both title and content')
    }

    setLoading(true)
    try {
      const { data } = await createGist(form)
      toast.success('Gist created successfully!')
      // Redirect to the gist detail page or dashboard
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create gist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Create a new gist</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Share a snippet of code with anyone.</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Gist description (Title)</label>
              <input
                className="input"
                placeholder="Example: My cool helper function"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Language</label>
              <select 
                className="input"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                style={{ background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="text">Plain Text</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Content</label>
              <textarea
                className="input"
                style={{ minHeight: 300, fontFamily: 'monospace', fontSize: 13, lineHeight: '1.5', padding: 12 }}
                placeholder="Paste your code here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <input 
                type="checkbox" 
                id="is-public"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              <label htmlFor="is-public" style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
                Make this gist public
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 24px' }}>
                {loading ? <span className="spinner" /> : 'Create Gist'}
              </button>
              <button type="button" className="btn" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
