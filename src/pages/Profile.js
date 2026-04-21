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

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: checked ? '#8b5cf6' : 'var(--bg3)',
      border: '1px solid ' + (checked ? '#7c3aed' : 'var(--border)'),
      position: 'relative', transition: 'background 0.2s, border-color 0.2s'
    }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </div>
  )
}

function SettingsModal({ user, onClose, onSave }) {
  const [tab, setTab] = useState('notifications')
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aivcs_notifs') || '{}') } catch { return {} }
  })
  const [appearance, setAppearance] = useState(() => localStorage.getItem('aivcs_theme') || 'dark')
  const [privacy, setPrivacy] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aivcs_privacy') || '{}') } catch { return {} }
  })

  const notifItems = [
    { key: 'follows', label: 'New followers', desc: 'When someone follows you' },
    { key: 'commits', label: 'Commit activity', desc: 'When someone commits to your repos' },
    { key: 'issues', label: 'Issue mentions', desc: 'When someone opens or comments on issues' },
    { key: 'pulls', label: 'Pull requests', desc: 'When PRs are opened or reviewed' },
    { key: 'discussions', label: 'Discussions', desc: 'When someone starts or replies to a discussion' },
    { key: 'ai', label: 'AI analysis complete', desc: 'When AI finishes reviewing your commits' },
  ]

  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    localStorage.setItem('aivcs_notifs', JSON.stringify(updated))
    toast.success(`${updated[key] ? 'Enabled' : 'Disabled'} ${notifItems.find(n => n.key === key)?.label}`)
  }

  const tabs = [
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'privacy', label: '🔒 Privacy' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'account', label: '⚙️ Account' },
  ]

  const sectionTitle = (t) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4 }}>{t}</div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '88vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Settings</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: '2px 0 0' }}>Manage your account preferences</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{ width: 180, borderRight: '1px solid var(--border)', padding: '12px 8px', flexShrink: 0, overflowY: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8,
                border: 'none', background: tab === t.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
                fontWeight: tab === t.id ? 600 : 400, fontSize: 13,
                cursor: 'pointer', marginBottom: 2, transition: 'background 0.15s'
              }}
                onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <div>
                {sectionTitle('Email Notifications')}
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.5 }}>
                  Choose which activities send you notifications.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {notifItems.map((item, i) => (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: i < notifItems.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>
                      </div>
                      <Toggle checked={!!notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', fontSize: 13, color: 'var(--text2)' }}>
                  💡 Notification preferences are saved locally. Email delivery coming soon.
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {tab === 'privacy' && (
              <div>
                {sectionTitle('Profile Privacy')}
                {[
                  { key: 'showEmail', label: 'Show email on profile', desc: 'Let others see your email address' },
                  { key: 'showActivity', label: 'Show activity', desc: 'Display your recent commit activity publicly' },
                  { key: 'allowFollow', label: 'Allow followers', desc: 'Let other users follow your profile' },
                ].map((item, i, arr) => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>
                    </div>
                    <Toggle
                      checked={privacy[item.key] !== false}
                      onChange={() => {
                        const updated = { ...privacy, [item.key]: privacy[item.key] === false ? true : false }
                        setPrivacy(updated)
                        localStorage.setItem('aivcs_privacy', JSON.stringify(updated))
                        toast.success('Privacy setting updated')
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* APPEARANCE */}
            {tab === 'appearance' && (
              <div>
                {sectionTitle('Theme')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'dark', label: '🌙 Dark', desc: 'Dark background, light text' },
                    { id: 'light', label: '☀️ Light', desc: 'Light background (coming soon)' },
                    { id: 'system', label: '💻 System', desc: 'Follow your OS preference (coming soon)' },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => { if (opt.id === 'dark') { setAppearance(opt.id); localStorage.setItem('aivcs_theme', opt.id); toast.success('Theme set to Dark') } else toast('Coming soon!') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${appearance === opt.id ? '#8b5cf6' : 'var(--border)'}`,
                        background: appearance === opt.id ? 'rgba(139,92,246,0.08)' : 'var(--bg)',
                        transition: 'border-color 0.15s, background 0.15s'
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{opt.desc}</div>
                      </div>
                      {appearance === opt.id && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#8b5cf6" strokeWidth="1.5"/>
                          <path d="M5 8l2 2 4-4" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {tab === 'account' && (
              <div>
                {sectionTitle('Account Info')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Username', value: user?.username },
                    { label: 'Email', value: user?.email },
                    { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 28 }}>
                  {sectionTitle('Danger Zone')}
                  <div style={{ padding: '16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Delete account</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>Once deleted, all your data will be permanently removed.</div>
                    <button className="btn btn-danger btn-sm" onClick={() => toast.error('Please contact support to delete your account.')}>
                      Delete my account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
  const [showSettings, setShowSettings] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [followModal, setFollowModal] = useState(null)

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
      {showSettings && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
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
          {/* Action buttons row — like GitHub's profile header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {/* Share Profile */}
            <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={() => {
                const url = `${window.location.origin}/profile`
                navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!')).catch(() => toast.error('Copy failed'))
              }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="10.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="2.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="10.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 5.5l5-2.5M4 7.5l5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Share profile
            </button>
            {/* Settings */}
            <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={() => setShowSettings(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.636 2.636l1.06 1.06M10.304 10.304l1.06 1.06M2.636 11.364l1.06-1.06M10.304 3.696l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Settings
            </button>
          </div>

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