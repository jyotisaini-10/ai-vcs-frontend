import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getPull, updatePull, addPullComment } from '../api'
import useAuthStore from '../store/authStore'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PullRequestDetail() {
  const { id, pullId } = useParams()
  const { user } = useAuthStore()
  const [pull, setPull] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPull(id, pullId)
      .then(({ data }) => setPull(data.pull))
      .catch(() => toast.error('Failed to load pull request'))
      .finally(() => setLoading(false))
  }, [id, pullId])

  const handleMerge = async () => {
    if (!window.confirm('Merge this pull request?')) return
    try {
      const { data } = await updatePull(id, pullId, { status: 'merged' })
      setPull(data.pull)
      toast.success('Pull request merged!')
    } catch { toast.error('Failed to merge') }
  }

  const handleClose = async () => {
    const newStatus = pull.status === 'open' ? 'closed' : 'open'
    try {
      const { data } = await updatePull(id, pullId, { status: newStatus })
      setPull(data.pull)
      toast.success(`Pull request ${newStatus}`)
    } catch { toast.error('Failed to update') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await addPullComment(id, pullId, { body: comment })
      setPull(data.pull)
      setComment('')
      toast.success('Comment added')
    } catch { toast.error('Failed to add comment') }
    finally { setSubmitting(false) }
  }

  const statusColor = (s) => s === 'merged' ? '#a78bfa' : s === 'open' ? '#56d364' : '#8b949e'
  const statusBg = (s) => s === 'merged' ? 'rgba(124,58,237,0.15)' : s === 'open' ? 'rgba(46,160,67,0.15)' : 'rgba(110,118,129,0.15)'
  const statusBorder = (s) => s === 'merged' ? 'rgba(124,58,237,0.4)' : s === 'open' ? 'rgba(46,160,67,0.4)' : 'rgba(110,118,129,0.4)'

  if (loading) return <div><Navbar /><div className="loading-screen"><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/></div></div>
  if (!pull) return <div><Navbar /><div className="container" style={{ paddingTop: 40 }}>Pull request not found</div></div>

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}>

        <div className="flex items-center gap-8 mb-16 text-sm text-muted">
          <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Repository</Link>
          <span>/</span>
          <Link to={`/repo/${id}/pulls`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Pull requests</Link>
          <span>/</span>
          <span>#{pullId.slice(-4)}</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{pull.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: statusBg(pull.status), color: statusColor(pull.status),
              border: `1px solid ${statusBorder(pull.status)}` }}>
              {pull.status}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>{pull.author?.username}</strong> wants to merge
            </span>
            <span style={{ background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
              {pull.fromBranch}
            </span>
            <span style={{ color: 'var(--text3)' }}>→</span>
            <span style={{ background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
              {pull.toBranch}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {timeAgo(pull.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }}>
          <div>
            {/* Body */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                  {pull.author?.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{pull.author?.username}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {timeAgo(pull.createdAt)}</span>
              </div>
              <div style={{ padding: 16 }}>
                {pull.body ? (
                  <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pull.body}</p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No description provided.</p>
                )}
              </div>
            </div>

            {/* AI Review */}
            {pull.aiStatus === 'complete' && pull.aiReview && (
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase',
                  letterSpacing: '0.5px', marginBottom: 8 }}>AI Review</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{pull.aiReview}</p>
              </div>
            )}

            {pull.aiStatus === 'pending' && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text2)', fontSize: 13 }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}/>
                AI is reviewing this pull request...
              </div>
            )}

            {/* Merge box */}
            {pull.status === 'open' && (
              <div style={{ border: '1px solid rgba(46,160,67,0.4)', borderRadius: 10, padding: 16, marginBottom: 16,
                background: 'rgba(46,160,67,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#56d364" strokeWidth="1.5"/>
                    <path d="M6 10l3 3 5-5" stroke="#56d364" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontWeight: 500, color: '#56d364' }}>This branch has no conflicts with the base branch</span>
                </div>
                <button className="btn btn-sm" onClick={handleMerge}
                  style={{ background: '#2ea043', color: '#fff', border: 'none', fontWeight: 500 }}>
                  Merge pull request
                </button>
              </div>
            )}

            {pull.status === 'merged' && (
              <div style={{ border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, padding: 16, marginBottom: 16,
                background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="rgba(124,58,237,0.3)" stroke="#a78bfa" strokeWidth="1.5"/>
                  <path d="M6 10l3 3 5-5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ color: '#a78bfa', fontWeight: 500 }}>Pull request successfully merged</span>
              </div>
            )}

            {/* Comments */}
            {pull.comments?.map((c, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: 'var(--bg2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>
                    {c.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{c.author?.username}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {timeAgo(c.createdAt)}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{user?.username}</span>
              </div>
              <form onSubmit={handleComment} style={{ padding: 16 }}>
                <textarea className="input" style={{ minHeight: 100, fontSize: 13, marginBottom: 12, resize: 'vertical' }}
                  placeholder="Leave a comment..."
                  value={comment} onChange={(e) => setComment(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" className="btn btn-sm" style={{ fontSize: 12 }} onClick={handleClose}>
                    {pull.status === 'open' ? 'Close pull request' : 'Reopen pull request'}
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !comment.trim()}>
                    {submitting ? <span className="spinner"/> : 'Add comment'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Reviewer
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                  AI
                </div>
                AI-VCS Bot
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Labels
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>None yet</span>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Participants
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[pull.author, ...(pull.comments?.map(c => c.author) || [])]
                  .filter((a, i, arr) => a && arr.findIndex(x => x?._id === a?._id) === i)
                  .map((p) => (
                    <div key={p?._id} title={p?.username}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                      {p?.username?.[0]?.toUpperCase()}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}