import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getIssues, updateIssue, deleteIssue } from '../api'

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

export default function IssuesList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [labelFilter, setLabelFilter] = useState('')

  useEffect(() => {
    loadIssues()
  }, [filter, labelFilter])

  const loadIssues = async () => {
    setLoading(true)
    try {
      const params = { status: filter }
      if (labelFilter) params.label = labelFilter
      const { data } = await getIssues(id, params)
      setIssues(data.issues)
    } catch { toast.error('Failed to load issues') }
    finally { setLoading(false) }
  }

  const handleClose = async (issueId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    try {
      await updateIssue(id, issueId, { status: newStatus })
      toast.success(`Issue ${newStatus}`)
      loadIssues()
    } catch { toast.error('Failed to update issue') }
  }

  const handleDelete = async (issueId) => {
    if (!window.confirm('Delete this issue?')) return
    try {
      await deleteIssue(id, issueId)
      setIssues(issues.filter(i => i._id !== issueId))
      toast.success('Issue deleted')
    } catch { toast.error('Failed to delete') }
  }

  const openCount = issues.filter(i => i.status === 'open').length
  const closedCount = issues.filter(i => i.status === 'closed').length

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-8">
            <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>
              ← Back to repo
            </Link>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/repo/${id}/issues/new`)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New issue
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px 10px 0 0',
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setFilter('open')}
              style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === 'open' ? 600 : 400,
                background: filter === 'open' ? 'var(--bg3)' : 'transparent', color: filter === 'open' ? 'var(--text)' : 'var(--text2)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="7" cy="7" r="2" fill="currentColor"/>
              </svg>
              {filter === 'open' ? issues.length : '?'} Open
            </button>
            <button onClick={() => setFilter('closed')}
              style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === 'closed' ? 600 : 400,
                background: filter === 'closed' ? 'var(--bg3)' : 'transparent', color: filter === 'closed' ? 'var(--text)' : 'var(--text2)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Closed
            </button>
          </div>

          {/* Label filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['', 'bug', 'feature', 'enhancement', 'question', 'documentation'].map((l) => (
              <button key={l} onClick={() => setLabelFilter(l)}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${l && labelFilter === l ? labelColors[l]?.border : 'var(--border)'}`,
                  background: l && labelFilter === l ? labelColors[l]?.bg : 'transparent',
                  color: l && labelFilter === l ? labelColors[l]?.color : 'var(--text2)' }}>
                {l || 'All labels'}
              </button>
            ))}
          </div>
        </div>

        {/* Issues list */}
        <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
            </div>
          ) : issues.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ display: 'block', margin: '0 auto 12px' }}>
                <circle cx="20" cy="20" r="17" stroke="var(--border)" strokeWidth="2"/>
                <circle cx="20" cy="20" r="6" fill="var(--border)"/>
              </svg>
              <p style={{ marginBottom: 12 }}>No {filter} issues found</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/repo/${id}/issues/new`)}>
                Create new issue
              </button>
            </div>
          ) : (
            issues.map((issue, i) => (
              <div key={issue._id}
                style={{ padding: '14px 16px', borderBottom: i < issues.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg2)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                {/* Status icon */}
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {issue.status === 'open' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#2ea043" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="2.5" fill="#2ea043"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#8b949e" strokeWidth="1.5"/>
                      <path d="M5 8l2.5 2.5L11 5.5" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Link to={`/repo/${id}/issues/${issue._id}`}
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}>
                      {issue.title}
                    </Link>
                    {issue.label && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                        background: labelColors[issue.label]?.bg,
                        color: labelColors[issue.label]?.color,
                        border: `1px solid ${labelColors[issue.label]?.border}` }}>
                        {issue.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    #{issue._id.slice(-4)} opened {timeAgo(issue.createdAt)} by {issue.author?.username}
                    {issue.comments?.length > 0 && ` · ${issue.comments.length} comment${issue.comments.length > 1 ? 's' : ''}`}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={() => handleClose(issue._id, issue.status)}>
                    {issue.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button className="btn btn-danger btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={() => handleDelete(issue._id)}>
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