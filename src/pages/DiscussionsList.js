import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getDiscussions, deleteDiscussion, updateDiscussion } from '../api'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const categoryColors = {
  general: { bg: 'rgba(88,166,255,0.15)', color: '#79c0ff' },
  ideas: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
  'q&a': { bg: 'rgba(46,160,67,0.15)', color: '#56d364' },
  show: { bg: 'rgba(210,153,34,0.15)', color: '#e3b341' },
  poll: { bg: 'rgba(248,81,73,0.15)', color: '#ff7b72' },
}

const categoryIcons = {
  general: '💬', ideas: '💡', 'q&a': '❓', show: '🚀', poll: '📊'
}

export default function DiscussionsList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => { loadDiscussions() }, [categoryFilter])

  const loadDiscussions = async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryFilter) params.category = categoryFilter
      const { data } = await getDiscussions(id, params)
      setDiscussions(data.discussions)
    } catch { toast.error('Failed to load discussions') }
    finally { setLoading(false) }
  }

  const handleDelete = async (e, discId) => {
    e.preventDefault()
    if (!window.confirm('Delete this discussion?')) return
    try {
      await deleteDiscussion(id, discId)
      setDiscussions(discussions.filter(d => d._id !== discId))
      toast.success('Discussion deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handlePin = async (e, disc) => {
    e.preventDefault()
    try {
      const { data } = await updateDiscussion(id, disc._id, { pinned: !disc.pinned })
      setDiscussions(discussions.map(d => d._id === disc._id ? data.discussion : d))
      toast.success(data.discussion.pinned ? 'Pinned!' : 'Unpinned')
    } catch { toast.error('Failed to update') }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 960 }}>

        <div className="flex items-center justify-between mb-20">
          <div>
            <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)', fontSize: 13 }}>← Back to repo</Link>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>Discussions</h1>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/repo/${id}/discussions/new`)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New discussion
          </button>
        </div>

        <div className="side-main-layout">

          {/* Left sidebar - categories */}
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Categories
              </div>
              {[{ key: '', label: 'All discussions', icon: '🗂️' },
                { key: 'general', label: 'General', icon: '💬' },
                { key: 'ideas', label: 'Ideas', icon: '💡' },
                { key: 'q&a', label: 'Q&A', icon: '❓' },
                { key: 'show', label: 'Show & tell', icon: '🚀' },
                { key: 'poll', label: 'Polls', icon: '📊' },
              ].map((cat) => (
                <button key={cat.key} onClick={() => setCategoryFilter(cat.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                    background: categoryFilter === cat.key ? 'var(--bg3)' : 'transparent',
                    color: categoryFilter === cat.key ? 'var(--text)' : 'var(--text2)',
                    fontWeight: categoryFilter === cat.key ? 500 : 400,
                    borderLeft: categoryFilter === cat.key ? '2px solid var(--accent2)' : '2px solid transparent' }}>
                  <span style={{ fontSize: 14 }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
              </div>
            ) : discussions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
                <p style={{ color: 'var(--text2)', marginBottom: 16 }}>No discussions yet</p>
                <button className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/repo/${id}/discussions/new`)}>
                  Start a discussion
                </button>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {discussions.map((disc, i) => (
                  <Link key={disc._id} to={`/repo/${id}/discussions/${disc._id}`}
                    style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ padding: '14px 16px', background: disc.pinned ? 'rgba(124,58,237,0.04)' : 'var(--bg2)',
                      borderBottom: i < discussions.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = disc.pinned ? 'rgba(124,58,237,0.04)' : 'var(--bg2)'}>

                      {/* Category icon */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: categoryColors[disc.category]?.bg || 'var(--bg3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {categoryIcons[disc.category] || '💬'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          {disc.pinned && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20,
                              background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 500 }}>
                              Pinned
                            </span>
                          )}
                          {disc.locked && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20,
                              background: 'rgba(110,118,129,0.15)', color: '#8b949e', fontWeight: 500 }}>
                              Locked
                            </span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{disc.title}</span>
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                            background: categoryColors[disc.category]?.bg || 'var(--bg3)',
                            color: categoryColors[disc.category]?.color || 'var(--text3)' }}>
                            {disc.category}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12 }}>
                          <span>{disc.author?.username}</span>
                          <span>· {timeAgo(disc.createdAt)}</span>
                          <span>· {disc.replies?.length || 0} replies</span>
                          <span>· {disc.votes || 0} votes</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-sm" style={{ fontSize: 11 }}
                          onClick={(e) => handlePin(e, disc)}>
                          {disc.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}
                          onClick={(e) => handleDelete(e, disc._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}