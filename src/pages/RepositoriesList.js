import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos, deleteRepo } from '../api'
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

export default function RepositoriesList() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    getRepos()
      .then(({ data }) => setRepos(data.repos))
      .catch(() => toast.error('Failed to load repos'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = repos.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'public' && !r.isPrivate) || (filter === 'private' && r.isPrivate)
    return matchSearch && matchFilter
  })

  const handleDelete = async (e, id) => {
    e.preventDefault()
    if (!window.confirm('Delete this repository?')) return
    try {
      await deleteRepo(id)
      setRepos(repos.filter(r => r._id !== id))
      toast.success('Repository deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 900 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-24">
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Repositories</h1>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/new')}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New repository
          </button>
        </div>

        {/* Search and filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 200 }}
            placeholder="Find a repository..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'public', 'private'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                  cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 500 : 400,
                  background: filter === f ? 'var(--bg3)' : 'transparent',
                  color: filter === f ? 'var(--text)' : 'var(--text2)' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', value: repos.length, color: 'var(--text)' },
            { label: 'Public', value: repos.filter(r => !r.isPrivate).length, color: '#56d364' },
            { label: 'Private', value: repos.filter(r => r.isPrivate).length, color: '#8b949e' },
            { label: 'Total commits', value: repos.reduce((s, r) => s + (r.totalCommits || 0), 0), color: 'var(--accent2)' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Repo list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg2)',
            border: '1px solid var(--border)', borderRadius: 12 }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
              {search ? `No repositories matching "${search}"` : 'No repositories yet'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/new')}>
              Create your first repo
            </button>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {filtered.map((repo, i) => (
              <Link key={repo._id} to={`/repo/${repo._id}`}
                style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ padding: '16px 20px', background: 'var(--bg2)',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg2)'}>
                  <div className="flex items-center justify-between">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-8 mb-8">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {repo.name[0].toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--blue)', fontSize: 15 }}>
                            {user?.username}/{repo.name}
                          </span>
                          <span style={{ marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                            border: '1px solid var(--border)', color: 'var(--text3)' }}>
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </span>
                        </div>
                      </div>
                      {repo.description && (
                        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, paddingLeft: 40 }}>
                          {repo.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12,
                        color: 'var(--text3)', paddingLeft: 40 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M6 3.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          Updated {timeAgo(repo.updatedAt)}
                        </span>
                        <span>{repo.totalCommits || 0} commits</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="#f1e05a">
                            <circle cx="5" cy="5" r="5" fill="#f1e05a"/>
                          </svg>
                          JavaScript
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 1l1.2 2.4L9 3.8 6.9 5.9l.5 3.1L5 7.6l-2.4 1.4.5-3.1L1 3.8l2.8-.4z" stroke="currentColor" strokeWidth="0.8"/>
                          </svg>
                          {repo.stars || 0}
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm"
                      onClick={(e) => handleDelete(e, repo._id)}
                      style={{ marginLeft: 16, flexShrink: 0, fontSize: 12 }}>
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
  )
}