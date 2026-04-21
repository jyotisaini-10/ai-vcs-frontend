import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import { exploreSearch, getUserProfile, followUser, unfollowUser } from '../api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function Avatar({ username, size = 40 }) {
  const colors = ['#8b5cf6', '#6d28d9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  const color = colors[(username?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.08)'
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  )
}

function UserListModal({ title, users, onClose, onOpenProfile }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '70vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 14 }}>No users yet.</p>
          ) : users.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => { onClose(); onOpenProfile(u.username) }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar username={u.username} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u.username}</div>
                {u.bio && <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text3)' }}>
                <span>{u.followers?.length || 0} followers</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UserProfileModal({ username, currentUserId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [listModal, setListModal] = useState(null) // 'followers' | 'following'

  const load = () => {
    setLoading(true)
    getUserProfile(username)
      .then(r => { setData(r.data); setFollowing(r.data.isFollowing) })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [username])

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      if (following) {
        await unfollowUser(username)
        setFollowing(false)
        setData(d => ({ ...d, user: { ...d.user, followers: d.user.followers.filter(f => f._id !== currentUserId) } }))
        toast.success(`Unfollowed ${username}`)
      } else {
        await followUser(username)
        setFollowing(true)
        setData(d => ({ ...d, user: { ...d.user, followers: [...d.user.followers, { _id: currentUserId }] } }))
        toast.success(`Now following ${username}!`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setFollowLoading(false)
    }
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'today'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  const isSelf = data?.user?._id === currentUserId

  return (
    <>
      {listModal && (
        <UserListModal
          title={listModal === 'followers' ? `Followers of ${username}` : `${username} is following`}
          users={listModal === 'followers' ? (data?.user?.followers || []) : (data?.user?.following || [])}
          onClose={() => setListModal(null)}
          onOpenProfile={(u) => { setListModal(null); onClose(); /* parent can handle */ }}
        />
      )}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16
      }} onClick={onClose}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '88vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
        }} onClick={e => e.stopPropagation()}>

          {/* Modal Header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>User Profile</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} />
              </div>
            ) : data ? (
              <div>
                {/* Profile banner-style header */}
                <div style={{ padding: '28px 28px 20px', display: 'flex', gap: 20, borderBottom: '1px solid var(--border)' }}>
                  <Avatar username={data.user.username} size={80} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{data.user.username}</div>
                        {data.user.bio && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{data.user.bio}</p>}
                      </div>
                      {!isSelf && (
                        <button
                          className={`btn ${following ? '' : 'btn-primary'}`}
                          onClick={handleFollow}
                          disabled={followLoading}
                          style={{ minWidth: 110, justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
                          {followLoading
                            ? <span className="spinner" style={{ width: 14, height: 14 }} />
                            : following ? '✓ Following' : '+ Follow'}
                        </button>
                      )}
                    </div>

                    {/* Follower counts */}
                    <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                      <button onClick={() => setListModal('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text2)', fontSize: 13 }}>
                        <strong style={{ color: 'var(--text)' }}>{data.user.followers?.length || 0}</strong> followers
                      </button>
                      <button onClick={() => setListModal('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text2)', fontSize: 13 }}>
                        <strong style={{ color: 'var(--text)' }}>{data.user.following?.length || 0}</strong> following
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {data.user.location && <span style={{ fontSize: 13, color: 'var(--text3)' }}>📍 {data.user.location}</span>}
                      {data.user.website && <a href={data.user.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>🔗 {data.user.website}</a>}
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>📅 Joined {timeAgo(data.user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Repositories', val: data.repos.length },
                    { label: 'Followers', val: data.user.followers?.length || 0, click: () => setListModal('followers') },
                    { label: 'Following', val: data.user.following?.length || 0, click: () => setListModal('following') }
                  ].map(s => (
                    <div key={s.label} onClick={s.click}
                      style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid var(--border)', cursor: s.click ? 'pointer' : 'default',
                        transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (s.click) e.currentTarget.style.background = 'var(--bg3)' }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Public Repos */}
                <div style={{ padding: '16px 24px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Public Repositories</h3>
                  {data.repos.length === 0 ? (
                    <p style={{ color: 'var(--text3)', fontSize: 13 }}>No public repositories yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.repos.map(repo => (
                        <Link key={repo._id} to={`/repo/${repo._id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                          <div className="card card-hover" style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>{data.user.username}/{repo.name}</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <span className="badge badge-gray">{repo.totalCommits} commits</span>
                                {repo.language && <span className="badge badge-blue">{repo.language}</span>}
                              </div>
                            </div>
                            {repo.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{repo.description}</p>}
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
    </>
  )
}

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const { user: me } = useAuthStore()

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

  useEffect(() => { doSearch(initialQ) }, [])

  const handleSearch = (e) => {
    e?.preventDefault()
    setSearchParams(query ? { q: query } : {})
    doSearch(query)
  }

  const handleTabChange = (t) => { setTab(t); doSearch(query, t) }

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
      {selectedUser && (
        <UserProfileModal
          username={selectedUser}
          currentUserId={me?._id}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Explore</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Discover users and public repositories · Follow developers you like</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, color: 'var(--text3)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input className="input" style={{ width: '100%', paddingLeft: 40, fontSize: 15, padding: '11px 16px 11px 40px' }}
              placeholder="Search users, repositories..." value={query}
              onChange={e => setQuery(e.target.value)} autoFocus />
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
                    {allUsers.length > 4 && <button className="btn btn-sm" onClick={() => handleTabChange('users')}>View all</button>}
                  </div>
                )}
                <div className="explore-users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
                  {(tab === 'all' ? allUsers.slice(0, 4) : allUsers).map(user => (
                    <div key={user._id} className="card" style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                      onClick={() => setSelectedUser(user.username)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(139,92,246,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <Avatar username={user.username} size={46} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{user.username}</div>
                          {user.bio && <p style={{ fontSize: 12, color: 'var(--text2)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bio}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span><strong style={{ color: 'var(--text2)' }}>{user.followers?.length || 0}</strong> followers</span>
                        <span><strong style={{ color: 'var(--text2)' }}>{user.following?.length || 0}</strong> following</span>
                        {user.location && <span>📍 {user.location}</span>}
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
                    {allRepos.length > 6 && <button className="btn btn-sm" onClick={() => handleTabChange('repos')}>View all</button>}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(tab === 'all' ? allRepos.slice(0, 6) : allRepos).map(repo => (
                    <Link key={repo._id} to={`/repo/${repo._id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-hover" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar username={repo.owner?.username} size={24} />
                            <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 14 }}>{repo.owner?.username} / {repo.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {repo.language && <span className="badge badge-blue">{repo.language}</span>}
                            <span className="badge badge-gray">{repo.totalCommits} commits</span>
                          </div>
                        </div>
                        {repo.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 8px', lineHeight: 1.5 }}>{repo.description}</p>}
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          Updated {timeAgo(repo.updatedAt)}
                          {' · '}
                          <span onClick={e => { e.preventDefault(); setSelectedUser(repo.owner?.username) }}
                            style={{ color: 'var(--accent)', cursor: 'pointer' }}>
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
