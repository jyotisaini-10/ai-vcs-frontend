import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos, deleteRepo, getIssues } from '../api'
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

export default function Dashboard() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Smart search state
  const [askQuery, setAskQuery] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const [askResults, setAskResults] = useState({ repos: [], issues: [], actions: [] })
  const [askLoading, setAskLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const askInputRef = useRef(null)
  const askDropRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    getRepos()
      .then(({ data }) => setRepos(data.repos))
      .catch(() => toast.error('Failed to load repos'))
      .finally(() => setLoading(false))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!askInputRef.current?.contains(e.target) && !askDropRef.current?.contains(e.target)) {
        setAskOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setAskResults({ repos: [], issues: [], actions: [] })
      setAskOpen(false)
      return
    }
    setAskLoading(true)
    setAskOpen(true)
    try {
      const ql = q.toLowerCase()
      // Filter repos
      const matchedRepos = repos.filter(r => r.name.toLowerCase().includes(ql)).slice(0, 5)

      // Fetch issues from all repos and filter
      let matchedIssues = []
      for (const repo of repos.slice(0, 5)) {
        try {
          const { data } = await getIssues(repo._id)
          const issues = (data.issues || []).filter(
            i => i.title?.toLowerCase().includes(ql) || i.body?.toLowerCase().includes(ql)
          ).slice(0, 3)
          issues.forEach(i => matchedIssues.push({ ...i, repoId: repo._id, repoName: repo.name }))
        } catch (_) {}
      }
      matchedIssues = matchedIssues.slice(0, 6)

      // Smart actions
      const actions = [
        { label: `Create repo "${q}"`, icon: '📁', action: () => navigate(`/new?name=${encodeURIComponent(q)}`) },
        { label: `Search code for "${q}"`, icon: '🔍', action: () => repos[0] && navigate(`/repo/${repos[0]._id}/search?q=${encodeURIComponent(q)}`) },
        { label: `Create issue "${q}"`, icon: '⚡', action: () => navigate('/issues/new') },
      ]

      setAskResults({ repos: matchedRepos, issues: matchedIssues, actions })
    } finally {
      setAskLoading(false)
    }
  }, [repos, navigate])

  const handleAskChange = (e) => {
    const val = e.target.value
    setAskQuery(val)
    setActiveIdx(-1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  // Build flat list for keyboard nav
  const flatItems = [
    ...askResults.repos.map(r => ({ type: 'repo', data: r })),
    ...askResults.issues.map(i => ({ type: 'issue', data: i })),
    ...askResults.actions.map(a => ({ type: 'action', data: a })),
  ]

  const handleAskKeyDown = (e) => {
    if (!askOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && flatItems[activeIdx]) {
        const item = flatItems[activeIdx]
        if (item.type === 'repo') navigate(`/repo/${item.data._id}`)
        else if (item.type === 'issue') navigate(`/repo/${item.data.repoId}/issues/${item.data._id}`)
        else if (item.type === 'action') item.data.action()
        setAskOpen(false); setAskQuery('')
      } else {
        // Default enter behavior
        const q = askQuery.trim()
        if (!q) return
        if (q.includes(' ') || q.includes('?')) {
          if (repos.length > 0) navigate(`/repo/${repos[0]._id}/search?q=${encodeURIComponent(q)}`)
          else toast.error('Create a repository first')
        } else {
          navigate(`/new?name=${encodeURIComponent(q)}`)
        }
        setAskOpen(false); setAskQuery('')
      }
    } else if (e.key === 'Escape') {
      setAskOpen(false); setActiveIdx(-1)
    }
  }

  const filtered = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <Navbar />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 24, maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>

        {/* Left sidebar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Top repositories</span>
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/new')}
              style={{ fontSize: 12, padding: '3px 10px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              New
            </button>
          </div>

          <input className="input" style={{ fontSize: 12, marginBottom: 8, padding: '6px 10px' }}
            placeholder="Find a repository..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <p className="text-xs text-muted" style={{ padding: '8px 0' }}>Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted" style={{ padding: '8px 0' }}>No repositories found</p>
            ) : (
              (showAll ? filtered : filtered.slice(0, 4)).map((repo) => (
                <Link key={repo._id} to={`/repo/${repo._id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                    borderRadius: 6, textDecoration: 'none', color: 'var(--text2)', fontSize: 12 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {repo.name[0].toUpperCase()}
                  </div>
                  <span className="truncate" style={{ color: 'var(--blue)' }}>
                    {user?.username}/{repo.name}
                  </span>
                </Link>
              ))
            )}
          </div>

          {filtered.length > 4 && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                fontSize: 12, color: 'var(--blue)', marginTop: 6,
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showAll ? 'Show less' : `Show more (${filtered.length - 4} more)`}
            </button>
          )}
        </div>

        {/* Main feed */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Home</h1>

          {/* Smart Ask Anything Bar */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', opacity: 0.45 }}>🔍</span>
                <input
                  ref={askInputRef}
                  type="text"
                  value={askQuery}
                  placeholder="Ask anything — search repos, issues, create, import..."
                  style={{
                    width: '100%', background: 'var(--bg)', border: `1px solid ${askOpen ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: askOpen ? '8px 8px 0 0' : 8, padding: '10px 14px 10px 36px',
                    fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, border-radius 0.15s',
                    boxShadow: askOpen ? '0 0 0 2px rgba(139,92,246,0.13)' : 'none'
                  }}
                  onChange={handleAskChange}
                  onKeyDown={handleAskKeyDown}
                  onFocus={() => { if (askQuery.trim()) setAskOpen(true) }}
                  autoComplete="off"
                />
                {askLoading && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  </span>
                )}
                {askQuery && !askLoading && (
                  <button onClick={() => { setAskQuery(''); setAskOpen(false); askInputRef.current?.focus() }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
                )}
              </div>

              {/* Dropdown */}
              {askOpen && (
                <div ref={askDropRef} style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                  background: 'var(--bg2)', border: '1px solid var(--accent)',
                  borderTop: 'none', borderRadius: '0 0 10px 10px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)', maxHeight: 400, overflowY: 'auto'
                }}>
                  {askResults.repos.length === 0 && askResults.issues.length === 0 && !askLoading && (
                    <div style={{ padding: '18px 16px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
                      No results found — try actions below
                    </div>
                  )}

                  {/* Repos Section */}
                  {askResults.repos.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Repositories</div>
                      {askResults.repos.map((repo, i) => {
                        const idx = i
                        return (
                          <div key={repo._id}
                            onClick={() => { navigate(`/repo/${repo._id}`); setAskOpen(false); setAskQuery('') }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                              cursor: 'pointer', background: activeIdx === idx ? 'var(--bg3)' : 'transparent',
                              transition: 'background 0.12s'
                            }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onMouseLeave={() => setActiveIdx(-1)}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {repo.name[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{user?.username}/{repo.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{repo.totalCommits} commits · {repo.isPrivate ? 'Private' : 'Public'}</div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 20,
                              background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>repo</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Issues Section */}
                  {askResults.issues.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', borderTop: askResults.repos.length > 0 ? '1px solid var(--border)' : 'none', marginTop: askResults.repos.length > 0 ? 4 : 0 }}>Issues</div>
                      {askResults.issues.map((issue, i) => {
                        const idx = askResults.repos.length + i
                        return (
                          <div key={issue._id}
                            onClick={() => { navigate(`/repo/${issue.repoId}/issues/${issue._id}`); setAskOpen(false); setAskQuery('') }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                              cursor: 'pointer', background: activeIdx === idx ? 'var(--bg3)' : 'transparent',
                              transition: 'background 0.12s'
                            }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onMouseLeave={() => setActiveIdx(-1)}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{issue.status === 'open' ? '🟢' : '🔴'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{issue.repoName} · #{issue.number || issue._id?.slice(-4)}</div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 20,
                              background: issue.status === 'open' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: issue.status === 'open' ? '#22c55e' : '#ef4444',
                              border: `1px solid ${issue.status === 'open' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, whiteSpace: 'nowrap' }}>{issue.status}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions Section */}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
                    <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</div>
                    {askResults.actions.map((action, i) => {
                      const idx = askResults.repos.length + askResults.issues.length + i
                      return (
                        <div key={action.label}
                          onClick={() => { action.action(); setAskOpen(false); setAskQuery('') }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                            cursor: 'pointer', background: activeIdx === idx ? 'var(--bg3)' : 'transparent',
                            transition: 'background 0.12s'
                          }}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseLeave={() => setActiveIdx(-1)}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{action.icon}</span>
                          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{action.label}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text3)', opacity: 0.5 }}>↵</span>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ padding: '6px 14px 8px', fontSize: 11, color: 'var(--text3)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                    <span>↑↓ navigate</span><span>↵ select</span><span>Esc close</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {[
                { label: 'New repo', action: () => navigate('/new') },
                { label: 'New issue', action: () => navigate('/issues/new') },
                { label: 'Import repo', action: () => navigate('/import') },
                { label: 'AI Search', action: () => repos[0] && navigate(`/repo/${repos[0]._id}/search`) },
              ].map((item) => (
                <button key={item.label} onClick={item.action}
                  className="btn btn-sm" style={{ fontSize: 12 }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Your repositories</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{repos.length} total</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
            </div>
          ) : repos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text2)', marginBottom: 16 }}>No repositories yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/new')}>Create your first repo</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {repos.map((repo) => (
                <div key={repo._id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <Link to={`/repo/${repo._id}`}
                        style={{ fontWeight: 600, color: 'var(--blue)', fontSize: 15, textDecoration: 'none' }}>
                        {user?.username}/{repo.name}
                      </Link>
                      <span style={{ marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                        border: '1px solid var(--border)', color: 'var(--text3)' }}>
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}
                      onClick={async (e) => {
                        e.preventDefault()
                        if (!window.confirm('Delete?')) return
                        await deleteRepo(repo._id)
                        setRepos(repos.filter(r => r._id !== repo._id))
                        toast.success('Deleted')
                      }}>
                      Delete
                    </button>
                  </div>
                  {repo.description && (
                    <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>{repo.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 3.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Updated {timeAgo(repo.updatedAt)}
                    </span>
                    <span>{repo.totalCommits} commits</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <circle cx="5" cy="5" r="5"/>
                      </svg>
                      JavaScript
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Latest from AI-VCS</h3>
            {[
              { time: 'Just now', text: 'AI code review with Groq LLaMA is live' },
              { time: '1 day ago', text: 'Semantic search using embeddings added' },
              { time: '2 days ago', text: 'Impact analysis for every commit' },
              { time: '3 days ago', text: 'Conflict resolver with AI suggestions' },
              { time: '5 days ago', text: 'Auto commit message generation' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text3)', marginTop: 5, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{item.time}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Quick stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Repositories', value: repos.length },
                { label: 'Total commits', value: repos.reduce((s, r) => s + (r.totalCommits || 0), 0) },
                { label: 'Public repos', value: repos.filter(r => !r.isPrivate).length },
                { label: 'Private repos', value: repos.filter(r => r.isPrivate).length },
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}