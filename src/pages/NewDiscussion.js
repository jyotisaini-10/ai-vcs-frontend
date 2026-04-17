import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createDiscussion } from '../api'

const categories = [
  { key: 'general', label: 'General', icon: '💬', desc: 'Chat about anything' },
  { key: 'ideas', label: 'Ideas', icon: '💡', desc: 'Share ideas for improvements' },
  { key: 'q&a', label: 'Q&A', icon: '❓', desc: 'Ask and answer questions' },
  { key: 'show', label: 'Show & tell', icon: '🚀', desc: 'Show off your work' },
  { key: 'poll', label: 'Poll', icon: '📊', desc: 'Take a community vote' },
]

export default function NewDiscussion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', body: '', category: 'general' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required')
    setLoading(true)
    try {
      await createDiscussion(id, form)
      toast.success('Discussion started!')
      navigate(`/repo/${id}/discussions`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create discussion')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to={`/repo/${id}/discussions`} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>
            ← Back to discussions
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>Start a new discussion</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>

            {/* Category picker */}
            <div className="form-group">
              <label className="label">Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {categories.map((cat) => (
                  <button key={cat.key} type="button"
                    onClick={() => setForm({ ...form, category: cat.key })}
                    style={{ padding: '10px 8px', borderRadius: 8, border: '1px solid',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      borderColor: form.category === cat.key ? 'var(--accent2)' : 'var(--border)',
                      background: form.category === cat.key ? 'rgba(124,58,237,0.1)' : 'var(--bg)' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{cat.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 500,
                      color: form.category === cat.key ? 'var(--accent2)' : 'var(--text2)' }}>
                      {cat.label}
                    </div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                {categories.find(c => c.key === form.category)?.desc}
              </p>
            </div>

            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input" placeholder="What do you want to discuss?"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="label">Details</label>
              <textarea className="input" style={{ minHeight: 180, fontSize: 13 }}
                placeholder="Provide more context, share your thoughts, or ask your question in detail..."
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>

            <hr className="divider" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Link to={`/repo/${id}/discussions`} className="btn">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ minWidth: 160, justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : 'Start discussion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}