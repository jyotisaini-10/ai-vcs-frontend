import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createPull } from '../api'

export default function NewPullRequest() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', body: '', fromBranch: 'feature', toBranch: 'main' })
  const [loading, setLoading] = useState(false)

  const branches = ['main', 'dev', 'feature', 'hotfix', 'release']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required')
    if (form.fromBranch === form.toBranch) return toast.error('Branches must be different')
    setLoading(true)
    try {
      await createPull(id, form)
      toast.success('Pull request created! AI is reviewing...')
      navigate(`/repo/${id}/pulls`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create pull request')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to={`/repo/${id}/pulls`} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>
            ← Back to pull requests
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Open a pull request</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
          Compare changes and request a code merge. AI will automatically review your PR.
        </p>

        {/* Branch comparison */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
          padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="4" cy="4" r="2" stroke="var(--text2)" strokeWidth="1.3"/>
            <circle cx="4" cy="12" r="2" stroke="var(--text2)" strokeWidth="1.3"/>
            <circle cx="12" cy="4" r="2" stroke="var(--text2)" strokeWidth="1.3"/>
            <path d="M4 6v4" stroke="var(--text2)" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M12 6c0 3-3 4-5 4" stroke="var(--text2)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>base:</label>
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '4px 8px' }}
              value={form.toBranch} onChange={(e) => setForm({ ...form, toBranch: e.target.value })}>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <span style={{ color: 'var(--text3)' }}>←</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>compare:</label>
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '4px 8px' }}
              value={form.fromBranch} onChange={(e) => setForm({ ...form, fromBranch: e.target.value })}>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {form.fromBranch !== form.toBranch ? (
            <span style={{ fontSize: 12, color: '#56d364', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Able to merge
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--red)' }}>Branches must be different</span>
          )}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input" placeholder="Short description of changes"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" style={{ minHeight: 140, fontSize: 13 }}
                placeholder="Describe what changes you made and why..."
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>

            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent2)' }}>
              AI will automatically review this pull request after creation.
            </div>

            <hr className="divider" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Link to={`/repo/${id}/pulls`} className="btn">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ minWidth: 160, justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : 'Create pull request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}