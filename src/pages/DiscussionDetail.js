import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getDiscussion, addReply, markAnswer, updateDiscussion } from '../api'
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

export default function DiscussionDetail() {
  const { id, discussionId } = useParams()
  const { user } = useAuthStore()
  const [discussion, setDiscussion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getDiscussion(id, discussionId)
      .then(({ data }) => setDiscussion(data.discussion))
      .catch(() => toast.error('Failed to load discussion'))
      .finally(() => setLoading(false))
  }, [id, discussionId])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSubmitting(true)
    try {
      const { data } = await addReply(id, discussionId, { body: reply })
      setDiscussion(data.discussion)
      setReply('')
      toast.success('Reply added!')
    } catch { toast.error('Failed to add reply') }
    finally { setSubmitting(false) }
  }

  const handleMarkAnswer = async (replyId) => {
    try {
      const { data } = await markAnswer(id, discussionId, replyId)
      setDiscussion(data.discussion)
      toast.success('Marked as answer!')
    } catch { toast.error('Failed to mark answer') }
  }

  const handleVote = async () => {
    try {
      const { data } = await updateDiscussion(id, discussionId, { votes: (discussion.votes || 0) + 1 })
      setDiscussion({ ...discussion, votes: data.discussion.votes })
    } catch {}
  }

  const handleLock = async () => {
    try {
      const { data } = await updateDiscussion(id, discussionId, { locked: !discussion.locked })
      setDiscussion({ ...discussion, locked: data.discussion.locked })
      toast.success(data.discussion.locked ? 'Discussion locked' : 'Discussion unlocked')
    } catch {}
  }

  if (loading) return <div><Navbar /><div className="loading-screen"><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/></div></div>
  if (!discussion) return <div><Navbar /><div className="container" style={{ paddingTop: 40 }}>Discussion not found</div></div>

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-8 mb-16 text-sm text-muted">
          <Link to={`/repo/${id}`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Repository</Link>
          <span>/</span>
          <Link to={`/repo/${id}/discussions`} style={{ textDecoration: 'none', color: 'var(--text2)' }}>Discussions</Link>
          <span>/</span>
          <span className="truncate" style={{ maxWidth: 200 }}>{discussion.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20 }}>

          {/* Main */}
          <div>
            {/* Original post */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', padding: '12px 16px', display: 'flex',
                alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {discussion.author?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{discussion.author?.username}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>· {timeAgo(discussion.createdAt)}</span>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, marginLeft: 'auto',
                  background: categoryColors[discussion.category]?.bg,
                  color: categoryColors[discussion.category]?.color }}>
                  {categoryIcons[discussion.category]} {discussion.category}
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{discussion.title}</h1>
                {discussion.body ? (
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{discussion.body}</p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No description provided.</p>
                )}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={handleVote}>
                  ▲ Upvote ({discussion.votes || 0})
                </button>
                <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={handleLock}>
                  {discussion.locked ? '🔓 Unlock' : '🔒 Lock'}
                </button>
              </div>
            </div>

            {/* Replies */}
            {discussion.replies?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>
                  {discussion.replies.length} {discussion.replies.length === 1 ? 'reply' : 'replies'}
                </p>
                {discussion.replies.map((r, i) => (
                  <div key={i} style={{ border: `1px solid ${r.isAnswer ? 'rgba(46,160,67,0.4)' : 'var(--border)'}`,
                    borderRadius: 10, overflow: 'hidden', marginBottom: 10,
                    background: r.isAnswer ? 'rgba(46,160,67,0.04)' : 'transparent' }}>
                    <div style={{ background: r.isAnswer ? 'rgba(46,160,67,0.08)' : 'var(--bg2)',
                      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                      borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>
                        {r.author?.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{r.author?.username}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {timeAgo(r.createdAt)}</span>
                      {r.isAnswer && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: 'rgba(46,160,67,0.15)', color: '#56d364', fontWeight: 500 }}>
                          ✓ Marked as answer
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.body}</p>
                    </div>
                    {discussion.category === 'q&a' && !r.isAnswer && (
                      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-sm" style={{ fontSize: 11, color: '#56d364', borderColor: 'rgba(46,160,67,0.4)' }}
                          onClick={() => handleMarkAnswer(r._id)}>
                          ✓ Mark as answer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            {!discussion.locked ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.username}</span>
                </div>
                <form onSubmit={handleReply} style={{ padding: 16 }}>
                  <textarea className="input" style={{ minHeight: 100, fontSize: 13, marginBottom: 12, resize: 'vertical' }}
                    placeholder="Write a reply..."
                    value={reply} onChange={(e) => setReply(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !reply.trim()}>
                      {submitting ? <span className="spinner"/> : 'Reply'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ padding: 16, background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 10, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                🔒 This discussion is locked
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Category
              </div>
              <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20,
                background: categoryColors[discussion.category]?.bg,
                color: categoryColors[discussion.category]?.color }}>
                {categoryIcons[discussion.category]} {discussion.category}
              </span>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Stats
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Replies</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{discussion.replies?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Votes</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{discussion.votes || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status</span>
                  <span style={{ fontWeight: 500, color: discussion.locked ? '#8b949e' : '#56d364' }}>
                    {discussion.locked ? 'Locked' : 'Open'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Participants
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[discussion.author, ...(discussion.replies?.map(r => r.author) || [])]
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