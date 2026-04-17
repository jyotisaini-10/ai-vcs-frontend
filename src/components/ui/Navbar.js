import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [dropOpen, setDropOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dropRef = useRef(null)

  const quotes = [
    "Talk is cheap. Show me the code. — Linus Torvalds",
    "Programs must be written for people to read, and only incidentally for machines to execute. — Abelson & Sussman",
    "Truth can only be found in one place: the code. — Robert C. Martin",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
    "First, solve the problem. Then, write the code. — John Johnson",
    "Experience is the name everyone gives to their mistakes. — Oscar Wilde",
    "Code is like humor. When you have to explain it, it’s bad. — Cory House",
    "Fix the cause, not the symptom. — Steve Maguire",
    "Before software can be reusable it first has to be usable. — Ralph Johnson"
  ]
  const [quote, setQuote] = useState('')
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const menuItems = [
    {
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
      label: 'New repository', sub: 'Create a new repo',
      action: () => { navigate('/new'); setDropOpen(false) }
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
      label: 'New issue', sub: 'Report a bug or request',
      action: () => {
        const repoId = localStorage.getItem('lastRepoId')
        if (repoId) { navigate(`/repo/${repoId}/issues/new`); setDropOpen(false) }
        else { toast.error('Open a repository first!') }
      }
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      label: 'Import repository', sub: 'Import from a URL',
      action: () => { navigate('/import'); setDropOpen(false) }
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
      label: 'New gist', sub: 'Share a code snippet',
      action: () => { navigate('/gist/new'); setDropOpen(false) }
    }
  ]

  const handleIssuesClick = () => {
    const repoId = localStorage.getItem('lastRepoId')
    if (repoId) { navigate(`/repo/${repoId}/issues`); setSidebarOpen(false) }
    else { toast.error('Open a repository first!') }
  }
  const handlePullsClick = () => {
  const repoId = localStorage.getItem('lastRepoId')
  if (repoId) { navigate(`/repo/${repoId}/pulls`); setSidebarOpen(false) }
  else { toast.error('Open a repository first!') }
}
const handleDiscussionsClick = () => {
  const repoId = localStorage.getItem('lastRepoId')
  if (repoId) { navigate(`/repo/${repoId}/discussions`); setSidebarOpen(false) }
  else { toast.error('Open a repository first!') }
}

  const sidebarLinks = [

    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Home', path: '/' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/></svg>, label: 'Issues', path: null },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3h8M5 8h8M5 13h8M2 3h.5M2 8h.5M2 13h.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Pull requests', path: null },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Repositories', path: '/repositories' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>, label: 'Projects', path: '/projects' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" strokeWidth="1.3"/><path d="M8 6v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Discussions', path: '/discussions' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Codespaces', path: '/codespaces' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2v1M8 13v1M2 8h1M13 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Copilot', path: '/copilot' },
  ]

  const linkStyle = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
    borderRadius: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 14,
    marginBottom: 2, transition: 'background 0.1s'
  }

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
    borderRadius: 8, color: 'var(--text2)', fontSize: 14, marginBottom: 2,
    transition: 'background 0.1s', background: 'transparent',
    border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left'
  }

  return (
    <>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 280,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        zIndex: 201, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s ease', display: 'flex', flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
          <Link to="/" onClick={() => setSidebarOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' }}>
            <img src="/logo.svg" alt="AI VCS" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'contain' }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>AI<span style={{ color: 'var(--accent2)' }}>VCS</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{user.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{user.email}</div>
            </div>
          </div>
        )}

        <div style={{ padding: '8px 8px', flex: 1 }}>
          {sidebarLinks.map((item) => (
            item.label === 'Issues' ? (
              <button key={item.label} onClick={handleIssuesClick} style={btnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )  : item.label === 'Pull requests' ? (
  <button 
    key={item.label} 
    onClick={handlePullsClick} 
    style={btnStyle}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >
    <span>{item.icon}</span>
    <span>{item.label}</span>
  </button>
) :item.label === 'Discussions' ? (
  <button key={item.label} onClick={handleDiscussionsClick} style={btnStyle}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
    <span>{item.icon}</span>
    <span>{item.label}</span>
  </button>
) : item.label === 'Codespaces' ? (
              <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)} style={linkStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
) : (
              <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)} style={linkStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </div>

        {user && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Top repositories
            </div>
            <Link to="/" onClick={() => setSidebarOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: 'var(--blue)', textDecoration: 'none', fontSize: 13 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              View all repositories
            </Link>
          </div>
        )}

        {user && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
              Sign out
            </button>
          </div>
        )}
      </div>

      <nav className="navbar">
        <button onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, marginRight: 4 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <img src="/logo.svg" alt="AI VCS" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          AI<span>VCS</span>
        </Link>

        {user && (
          <div style={{ flex: 1, padding: '0 32px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <span style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{quote}"
            </span>
          </div>
        )}

        <div className="navbar-links">
          {user && (
            <>
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button className="btn btn-primary btn-sm"
                  style={{ borderRadius: '6px', padding: '6px 10px', gap: 6 }}
                  onClick={() => setDropOpen(!dropOpen)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                    style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M2 3.5l3.5 3.5L9 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: '10px', minWidth: '220px', zIndex: 999,
                    padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}>
                    <p style={{ fontSize: 11, color: 'var(--text3)', padding: '4px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Create new
                    </p>
                    {menuItems.map((item) => (
                      <button key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 10px', borderRadius: 7, border: 'none',
                          background: 'transparent', color: 'var(--text)', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ color: 'var(--text2)', flexShrink: 0 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, textDecoration: 'none',
                padding: '4px 8px', borderRadius: 20, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm" style={{ color: 'var(--text2)', fontWeight: 500 }}>{user.username}</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
 