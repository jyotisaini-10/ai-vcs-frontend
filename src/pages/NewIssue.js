import { useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createIssue } from '../api'

export default function NewIssue() {
  const { id } = useParams()
  const [form, setForm] = useState({ title: '', body: '', label: 'bug' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required')
    if (!id) return toast.error('No repository selected')
    setLoading(true)
    try {
      await createIssue(id, form)
      toast.success('Issue created!')
      navigate(`/repo/${id}/issues`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create issue')
    } finally { setLoading(false) }
  }

  const labels = ['bug', 'feature', 'enhancement', 'question', 'documentation']
  const labelColors = {
    bug: '#ff7b72', feature: '#a78bfa', enhancement: '#79c0ff',
    question: '#e3b341', documentation: '#56d364'
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to={id ? `/repo/${id}/issues` : '/'} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>
            ← Back to issues
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>Create a new issue</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input" placeholder="Short, descriptive title"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 13 }}
                placeholder="Describe the issue in detail..."
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="label">Label</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {labels.map((l) => (
                  <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      border: '1px solid', cursor: 'pointer',
                      background: form.label === l ? 'rgba(124,58,237,0.2)' : 'transparent',
                      borderColor: form.label === l ? 'var(--accent)' : 'var(--border)',
                      color: form.label === l ? labelColors[l] : 'var(--text2)' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Link to={id ? `/repo/${id}/issues` : '/'} className="btn">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ minWidth: 140, justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : 'Submit new issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}