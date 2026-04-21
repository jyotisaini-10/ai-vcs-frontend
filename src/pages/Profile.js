import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos, updateProfile, getMyFollowers, getMyFollowing } from '../api'
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

function StatCard({ value, label, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '18px 20px', textAlign: 'center', flex: '1 1 120px',
      cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.15s, box-shadow 0.15s'
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(139,92,246,0.1)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

function FollowListModal({ title, users, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '70vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 14 }}>No users yet.</p>
          ) : users.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>{u.username?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u.username}</div>
                {u.bio && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.bio}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                <span>{u.followers?.length || 0} followers</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    currentPassword: '',
    newPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('profile')

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        username: form.username,
        bio: form.bio,
        location: form.location,
        website: form.website,
      }
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const { data } = await updateProfile(payload)
      onSave(data.user)
      toast.success('Profile updated!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = {
    fontSize: 13, color: 'var(--text2)', marginBottom: 4,
    display: 'block', fontWeight: 500
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
          {[{ id: 'profile', label: '👤 Profile' }, { id: 'password', label: '🔒 Password' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 16px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t.id ? 'var(--text)' : 'var(--text3)',
              borderBottom: tab === t.id ? '2px solid #8b5cf6' : '2px solid transparent',
              marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'profile' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {form.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{form.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.email}</div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input name="username" value={form.username} onChange={handle} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  Bio <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({form.bio.length}/160)</span>
                </label>
                <textarea name="bio" value={form.bio} onChange={handle}
                  maxLength={160} rows={3}
                  placeholder="Tell us a little about yourself..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input name="location" value={form.location} onChange={handle}
                  placeholder="City, Country" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input name="website" value={form.website} onChange={handle}
                  placeholder="https://yourwebsite.com" style={inputStyle} />
              </div>
            </>
          )}

          {tab === 'password' && (
            <>
              <div style={{
                padding: '12px 16px', background: 'rgba(139,92,246,0.08)',
                borderRadius: 8, border: '1px solid rgba(139,92,246,0.2)',
                fontSize: 13, color: 'var(--text2)'
              }}>
                🔒 Leave blank if you don't want to change your password.
              </div>
              <div>
                <label style={labelStyle}>Current Password</label>
                <input name="currentPassword" type="password" value={form.currentPassword}
                  onChange={handle} placeholder="Enter current password" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <input name="newPassword" type="password" value={form.newPassword}
                  onChange={handle} placeholder="Min 6 characters" style={inputStyle} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '16px 24px', borderTop: '1px solid var(--border)'
        }}>
          <button onClick={onClose} className="btn" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn btn-primary" style={{ fontSize: 13, minWidth: 100 }}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('repos')
  const [showEdit, setShowEdit] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [followModal, setFollowModal] = useState(null) // 'followers' | 'following'

  useEffect(() => {
    getRepos()
      .then(({ data }) => setRepos(data.repos || []))
      .catch(() => toast.error('Failed to load repositories'))
      .finally(() => setLoading(false))
    getMyFollowers().then(r => setFollowers(r.data.users || [])).catch(() => {})
    getMyFollowing().then(r => setFollowing(r.data.users || [])).catch(() => {})
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
      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={(updatedUser) => setUser(updatedUser)}
        />
      )}
      {followModal && (
        <FollowListModal
          title={followModal === 'followers' ? `Your Followers (${followers.length})` : `You're Following (${following.length})`}
          users={followModal === 'followers' ? followers : following}
          onClose={() => setFollowModal(null)}
        />
      )}

      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '32px 20px',
        display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32
      }}>
        {/* Left */}
        <div>
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

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{user?.username}</h1>
          <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>{user?.email}</p>

          {user?.bio && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{user.bio}</p>
          )}
          {user?.location && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>📍 {user.location}</p>
          )}
          {user?.website && (
            <p style={{ fontSize: 13, marginBottom: 10 }}>
              <a href={user.website} target="_blank" rel="noreferrer"
                style={{ color: 'var(--blue)' }}>🔗 {user.website}</a>
            </p>
          )}

          {/* Followers / Following — above Edit profile */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <button onClick={() => setFollowModal('followers')} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--text2)', fontSize: 14, textAlign: 'left'
            }}>
              <strong style={{ color: 'var(--text)', fontSize: 15 }}>{followers.length}</strong>
              <span style={{ marginLeft: 4 }}>followers</span>
            </button>
            <button onClick={() => setFollowModal('following')} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--text2)', fontSize: 14, textAlign: 'left'
            }}>
              <strong style={{ color: 'var(--text)', fontSize: 15 }}>{following.length}</strong>
              <span style={{ marginLeft: 4 }}>following</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <button className="btn w-full"
              style={{ fontSize: 13, justifyContent: 'center', width: '100%' }}
              onClick={() => setShowEdit(true)}>
              Edit profile
            </button>
            <button className="btn btn-danger btn-sm"
              style={{ fontSize: 13, justifyContent: 'center', width: '100%' }}
              onClick={handleLogout}>
              Sign out
            </button>
          </div>

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

        {/* Right */}
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard value={repos.length} label="Repositories" />
            <StatCard value={totalCommits} label="Commits" color="var(--accent2)" />
            <StatCard value={followers.length} label="Followers" color="var(--accent)" onClick={() => setFollowModal('followers')} />
            <StatCard value={following.length} label="Following" onClick={() => setFollowModal('following')} />
          </div>

          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {[
              { id: 'repos', label: `Repositories (${repos.length})` },
              { id: 'activity', label: 'Activity' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
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