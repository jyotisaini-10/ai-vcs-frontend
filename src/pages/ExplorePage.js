import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import { exploreSearch, getUserProfile } from '../api'
import toast from 'react-hot-toast'

function Avatar({ username, size = 40 }) {
  const colors = ['#8b5cf6', '#6d28d9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  const color = colors[(username?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  )
}

function UserProfileModal({ username, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserProfile(username)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [username])

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'today'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '85vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>User Profile</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, display: 'inline-block' }} />
            </div>
          ) : data ? (
            <div>
              {/* Profile Info */}
              <div style={{ padding: '24px', display: 'flex', gap: 20, borderBottom: '1px solid var(--border)' }}>
                <Avatar username={data.user.username} size={72} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {data.user.username}
                  </div>
                  {data.user.bio && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}>{data.user.bio}</p>}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {data.user.location && (
                      <span style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 1C4.015 1 2 3.015 2 5.5c0 3.5 4.5 6.5 4.5 6.5s4.5-3 4.5-6.5C11 3.015 8.985 1 6.5 1z" stroke="currentColor" strokeWidth="1.2"/></svg>
                        {data.user.location}
                      </span>
                    )}
                    {data.user.website && (
                      <a href={data.user.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 6.5h4M6.5 4.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        {data.user.website}
                      </a>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>Joined {timeAgo(data.user.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span className="badge badge-gray">{data.repos.length} public repos</span>
                  </div>
                </div>
              </div>

              {/* Public Repositories */}
              <div style={{ padding: '16px 24px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Public Repositories</h3>
                {data.repos.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 13 }}>No public repositories yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.repos.map(repo => (
                      <Link key={repo._id} to={`/repo/${repo._id}`} onClick={onClose}
                        style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="card card-hover" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>
                              {data.user.username}/{repo.name}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span className="badge badge-gray">{repo.totalCommits} commits</span>
                              {repo.language && <span className="badge badge-blue">{repo.language}</span>}
                            </div>
                          </div>
                          {repo.description && (
                            <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.4 }}>{repo.description}</p>
                          )}
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Updated {timeAgo(repo.updatedAt)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>User not found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('all') // 'all' | 'users' | 'repos'
  const [selectedUser, setSelectedUser] = useState(null)
  const navigate = useNavigate()

  const doSearch = useCallback(async (q, type = tab) => {
    setLoading(true)
    try {
      const { data } = await exploreSearch({ q, type })
      setResults(data)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    doSearch(initialQ)
  }, [])

  const handleSearch = (e) => {
    e?.preventDefault()
    setSearchParams(query ? { q: query } : {})
    doSearch(query)
  }

  const handleTabChange = (t) => {
    setTab(t)
    doSearch(query, t)
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'today'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  const allUsers = results?.users || []
  const allRepos = results?.repos || []

  return (
    <div>
      <Navbar />
      {selectedUser && <UserProfileModal username={selectedUser} onClose={() => setSelectedUser(null)} />}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Explore</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Search for users and public repositories across AI-VCS</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, color: 'var(--text3)' }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              className="input"
              style={{ width: '100%', paddingLeft: 40, fontSize: 15, padding: '11px 16px 11px 40px' }}
              placeholder="Search users, repositories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '11px 24px', fontSize: 14 }}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Search'}
          </button>
        </form>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          {[
            { key: 'all', label: `All (${allUsers.length + allRepos.length})` },
            { key: 'users', label: `Users (${allUsers.length})` },
            { key: 'repos', label: `Repos (${allRepos.length})` }
          ].map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => handleTabChange(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} />
            <p style={{ color: 'var(--text2)', marginTop: 16 }}>Searching...</p>
          </div>
        )}

        {!loading && results && (
          <div>
            {/* Users Section */}
            {(tab === 'all' || tab === 'users') && allUsers.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                {tab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Users</h2>
                    {allUsers.length > 3 && (
                      <button className="btn btn-sm" onClick={() => handleTabChange('users')}>View all</button>
                    )}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {(tab === 'all' ? allUsers.slice(0, 4) : allUsers).map(user => (
                    <div key={user._id} className="card card-hover" style={{ padding: '16px', cursor: 'pointer' }}
                      onClick={() => setSelectedUser(user.username)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar username={user.username} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14, marginBottom: 2 }}>
                            {user.username}
                          </div>
                          {user.bio && (
                            <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.bio}
                            </p>
                          )}
                          {user.location && (
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>📍 {user.location}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                        <span className="badge badge-gray">View profile →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repos Section */}
            {(tab === 'all' || tab === 'repos') && allRepos.length > 0 && (
              <div>
                {tab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Repositories</h2>
                    {allRepos.length > 5 && (
                      <button className="btn btn-sm" onClick={() => handleTabChange('repos')}>View all</button>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(tab === 'all' ? allRepos.slice(0, 6) : allRepos).map(repo => (
                    <Link key={repo._id} to={`/repo/${repo._id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-hover" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar username={repo.owner?.username} size={24} />
                            <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>
                              {repo.owner?.username} / {repo.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {repo.language && <span className="badge badge-blue">{repo.language}</span>}
                            <span className="badge badge-gray">{repo.totalCommits} commits</span>
                          </div>
                        </div>
                        {repo.description && (
                          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 8px', lineHeight: 1.5 }}>{repo.description}</p>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          Updated {timeAgo(repo.updatedAt)}
                          {' · '}
                          <span onClick={e => { e.preventDefault(); setSelectedUser(repo.owner?.username) }}
                            style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                            View {repo.owner?.username}'s profile
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {allUsers.length === 0 && allRepos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
                  {results.query ? `No results for "${results.query}"` : 'Nothing to show yet'}
                </h3>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>
                  {results.query ? 'Try a different search term.' : 'Be the first to create a public repository!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
