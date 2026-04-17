import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos } from '../api'
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

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '18px 20px', textAlign: 'center', flex: '1 1 120px'
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('repos')

  useEffect(() => {
    getRepos()
      .then(({ data }) => setRepos(data.repos || []))
      .catch(() => toast.error('Failed to load repositories'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const totalCommits = repos.reduce((s, r) => s + (r.totalCommits || 0), 0)
  const publicRepos = repos.filter(r => !r.isPrivate)
  const privateRepos = repos.filter(r => r.isPrivate)

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently'

  const initials = user?.username?.[0]?.toUpperCase() || '?'

  return (
    <div>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>

        {/* ── Left: Avatar + bio ── */}
        <div>
          {/* Avatar */}
          <div style={{
            width: '100%', aspectRatio: '1', maxWidth: 220,
            borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 60%, #4c1d95 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 72, fontWeight: 700, color: '#fff', marginBottom: 16,
            boxShadow: '0 0 0 4px var(--bg), 0 0 0 6px rgba(139,92,246,0.3)',
            flexShrink: 0, userSelect: 'none'
          }}>
            {initials}
          </div>

          {/* Name */}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{user?.username}</h1>
          <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 16 }}>{user?.email}</p>

          {/* Edit / Sign out */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <button
              className="btn w-full"
              style={{ fontSize: 13, justifyContent: 'center', width: '100%' }}
              onClick={() => toast('Profile editing coming soon!', { icon: '🛠️' })}
            >
              Edit profile
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ fontSize: 13, justifyContent: 'center', width: '100%' }}
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

          {/* Info list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📅', label: `Joined ${joinedDate}` },
              { icon: '📦', label: `${repos.length} repositories` },
              { icon: '🔓', label: `${publicRepos.length} public` },
              { icon: '🔒', label: `${privateRepos.length} private` },
              { icon: '💾', label: `${totalCommits} total commits` },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text2)' }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: tabs + content ── */}
        <div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard value={repos.length} label="Repositories" />
            <StatCard value={totalCommits} label="Commits" color="var(--accent2)" />
            <StatCard value={publicRepos.length} label="Public" color="#22c55e" />
            <StatCard value={privateRepos.length} label="Private" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {[
              { id: 'repos', label: `Repositories (${repos.length})` },
              { id: 'activity', label: 'Activity' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--text3)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.15s'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Repositories tab */}
          {activeTab === 'repos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button className="btn btn-primary btn-sm" style={{ fontSize: 12 }} onClick={() => navigate('/new')}>
                  + New repository
                </button>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                </div>
              ) : repos.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 24px',
                  background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 14 }}>No repositories yet</p>
                  <button className="btn btn-primary" onClick={() => navigate('/new')}>Create your first repo</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {repos.map(repo => (
                    <div key={repo._id} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '16px 20px',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(139,92,246,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {repo.name[0].toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/repo/${repo._id}`}
                              style={{ fontWeight: 600, color: 'var(--blue)', fontSize: 15, textDecoration: 'none' }}>
                              {user?.username}/{repo.name}
                            </Link>
                            <span style={{
                              marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                              border: '1px solid var(--border)', color: 'var(--text3)'
                            }}>
                              {repo.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/repo/${repo._id}/issues`} className="btn btn-sm" style={{ fontSize: 11 }}>Issues</Link>
                          <Link to={`/repo/${repo._id}`} className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>Open</Link>
                        </div>
                      </div>
                      {repo.description && (
                        <p style={{ fontSize: 13, color: 'var(--text2)', margin: '6px 0 8px 42px' }}>{repo.description}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text3)', paddingLeft: 42 }}>
                        <span>⏱ Updated {timeAgo(repo.updatedAt)}</span>
                        <span>💾 {repo.totalCommits} commits</span>
                        <span>● JavaScript</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {repos.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 24px',
                  background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <p style={{ color: 'var(--text2)', fontSize: 14 }}>No activity yet. Create a repo and start committing!</p>
                </div>
              ) : (
                repos.map(repo => (
                  <div key={repo._id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: 20 }}>📦</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                        Pushed to <Link to={`/repo/${repo._id}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{user?.username}/{repo.name}</Link>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                        {repo.totalCommits} commit{repo.totalCommits !== 1 ? 's' : ''} · Updated {timeAgo(repo.updatedAt)}
                      </div>
                    </div>
                    <Link to={`/repo/${repo._id}`} className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }}>View</Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
