import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getPulls, updatePull, deletePull } from '../api'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PullRequestsList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pulls, setPulls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  useEffect(() => { loadPulls() }, [filter])

  const loadPulls = async () => {
    setLoading(true)
    try {
      const { data } = await getPulls(id, { status: filter })
      setPulls(data.pulls)
    } catch { toast.error('Failed to load pull requests') }
    finally { setLoading(false) }
  }

  const handleMerge = async (pullId) => {
    if (!window.confirm('Merge this pull request?')) return
    try {
      await updatePull(id, pullId, { status: 'merged' })
      toast.success('Pull request merged!')
      loadPulls()
    } catch { toast.error('Failed to merge') }
  }

  const handleClose = async (pullId, status) => {
    const newStatus = status === 'open' ? 'closed' : 'open'
    try {
      await updatePull(id, pullId, { status: newStatus })
      toast.success(`Pull request ${newStatus}`)
      loadPulls()
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (pullId) => {
    if (!window.confirm('Delete this pull request?')) return
    try {
      await deletePull(id, pullId)
      setPulls(pulls.filter(p => p._id !== pullId))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const statusColor = (s) => s === 'merged' ? '#a78bfa' : s === 'open' ? '#56d364' : '#8b949e'
  const statusBg = (s) => s === 'merged' ? 'rgba(124,58,237,0.15)' : s === 'open' ? 'rgba(46,160,67,0.15)' : 'rgba(110,118,129,0.15)'
  const statusBorder = (s) => s === 'merged' ? 'rgba(124,58,237,0.4)' : s === 'open' ? 'rgba(46,160,67,0.4)' : 'rgba(110,118,129,0.4)'

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}>
        <div className="flex items-center justify-between mb-16">
          <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>← Back to repo</Link>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/repo/${id}/pulls/new`)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New pull request
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px 10px 0 0',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {['open', 'closed', 'merged'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: filter === s ? 600 : 400,
                background: filter === s ? 'var(--bg3)' : 'transparent',
                color: filter === s ? 'var(--text)' : 'var(--text2)' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Pull requests list */}
        <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
            </div>
          ) : pulls.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>
              <p style={{ marginBottom: 12 }}>No {filter} pull requests</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/repo/${id}/pulls/new`)}>
                Create pull request
              </button>
            </div>
          ) : (
            pulls.map((pull, i) => (
              <div key={pull._id} style={{ padding: '14px 16px',
                borderBottom: i < pulls.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'var(--bg2)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                {/* PR icon */}
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="4" cy="4" r="2" stroke={statusColor(pull.status)} strokeWidth="1.3"/>
                    <circle cx="4" cy="12" r="2" stroke={statusColor(pull.status)} strokeWidth="1.3"/>
                    <circle cx="12" cy="4" r="2" stroke={statusColor(pull.status)} strokeWidth="1.3"/>
                    <path d="M4 6v4" stroke={statusColor(pull.status)} strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M12 6c0 3-3 4-5 4" stroke={statusColor(pull.status)} strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Link to={`/repo/${id}/pulls/${pull._id}`}
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}>
                      {pull.title}
                    </Link>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                      background: statusBg(pull.status), color: statusColor(pull.status),
                      border: `1px solid ${statusBorder(pull.status)}` }}>
                      {pull.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>#{pull._id.slice(-4)}</span>
                    <span style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>
                      {pull.fromBranch}
                    </span>
                    <span>→</span>
                    <span style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>
                      {pull.toBranch}
                    </span>
                    <span>· {pull.author?.username} · {timeAgo(pull.createdAt)}</span>
                    {pull.aiStatus === 'complete' && (
                      <span style={{ color: 'var(--accent2)', fontSize: 11 }}>· AI reviewed</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {pull.status === 'open' && (
                    <button className="btn btn-sm" style={{ fontSize: 11, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', borderColor: 'rgba(124,58,237,0.3)' }}
                      onClick={() => handleMerge(pull._id)}>
                      Merge
                    </button>
                  )}
                  <button className="btn btn-sm" style={{ fontSize: 11 }}
                    onClick={() => handleClose(pull._id, pull.status)}>
                    {pull.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}
                    onClick={() => handleDelete(pull._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}