import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getIssue, updateIssue, addComment } from '../api'
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

const labelColors = {
  bug: { bg: 'rgba(248,81,73,0.15)', color: '#ff7b72', border: 'rgba(248,81,73,0.4)' },
  feature: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: 'rgba(124,58,237,0.4)' },
  enhancement: { bg: 'rgba(88,166,255,0.15)', color: '#79c0ff', border: 'rgba(88,166,255,0.4)' },
  question: { bg: 'rgba(210,153,34,0.15)', color: '#e3b341', border: 'rgba(210,153,34,0.4)' },
  documentation: { bg: 'rgba(46,160,67,0.15)', color: '#56d364', border: 'rgba(46,160,67,0.4)' },
}

export default function IssueDetail() {
  const { id, issueId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getIssue(id, issueId)
      .then(({ data }) => setIssue(data.issue))
      .catch(() => toast.error('Failed to load issue'))
      .finally(() => setLoading(false))
  }, [id, issueId])

  const handleClose = async () => {
    const newStatus = issue.status === 'open' ? 'closed' : 'open'
    try {
      const { data } = await updateIssue(id, issueId, { status: newStatus })
      setIssue(data.issue)
      toast.success(`Issue ${newStatus}`)
    } catch { toast.error('Failed to update') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await addComment(id, issueId, { body: comment })
      setIssue(data.issue)
      setComment('')
      toast.success('Comment added')
    } catch { toast.error('Failed to add comment') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div><Navbar /><div className="loading-screen"><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/></div></div>
  if (!issue) return <div><Navbar /><div className="container" style={{ paddingTop: 40 }}>Issue not found</div></div>

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-8 mb-16 text-sm text-muted">
          <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Repository</Link>
          <span>/</span>
          <Link to={`/repo/${id}/issues`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Issues</Link>
          <span>/</span>
          <span>#{issueId.slice(-4)}</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{issue.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: issue.status === 'open' ? 'rgba(46,160,67,0.15)' : 'rgba(110,118,129,0.15)',
              color: issue.status === 'open' ? '#56d364' : '#8b949e',
              border: `1px solid ${issue.status === 'open' ? 'rgba(46,160,67,0.4)' : 'rgba(110,118,129,0.4)'}` }}>
              {issue.status === 'open' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7" cy="7" r="2" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
              {issue.status}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong>{issue.author?.username}</strong> opened this issue {timeAgo(issue.createdAt)}
              · {issue.comments?.length || 0} comments
            </span>
            {issue.label && (
              <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                background: labelColors[issue.label]?.bg,
                color: labelColors[issue.label]?.color,
                border: `1px solid ${labelColors[issue.label]?.border}` }}>
                {issue.label}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }}>
          {/* Main content */}
          <div>
            {/* Original post */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                    {issue.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{issue.author?.username}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {timeAgo(issue.createdAt)}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 20 }}>Author</span>
              </div>
              <div style={{ padding: 16, minHeight: 80 }}>
                {issue.body ? (
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{issue.body}</p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No description provided.</p>
                )}
              </div>
            </div>

            {/* Comments */}
            {issue.comments?.map((c, i) => (
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
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{c.body}</p>
                </div>
              </div>
            ))}

            {/* Close/reopen line */}
            {issue.comments?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--text3)', fontSize: 13 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                <span>{issue.status === 'closed' ? 'Issue was closed' : 'Issue is still open'}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
              </div>
            )}

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
                  <button type="button" className="btn btn-sm"
                    onClick={handleClose}
                    style={{ fontSize: 12 }}>
                    {issue.status === 'open' ? 'Close issue' : 'Reopen issue'}
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
                Label
              </div>
              {issue.label ? (
                <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                  background: labelColors[issue.label]?.bg,
                  color: labelColors[issue.label]?.color,
                  border: `1px solid ${labelColors[issue.label]?.border}` }}>
                  {issue.label}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>None yet</span>
              )}
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Participants
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[issue.author, ...(issue.comments?.map(c => c.author) || [])]
                  .filter((a, i, arr) => a && arr.findIndex(x => x?._id === a?._id) === i)
                  .map((participant) => (
                    <div key={participant?._id} title={participant?.username}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                      {participant?.username?.[0]?.toUpperCase()}
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