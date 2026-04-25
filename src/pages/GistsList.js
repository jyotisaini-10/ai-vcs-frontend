import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getGists } from '../api'

export default function GistsList() {
  const [gists, setGists] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getGists()
      .then(({ data }) => setGists(data.gists))
      .catch(() => toast.error('Failed to load gists'))
      .finally(() => setLoading(false))
  }, [])

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>My Gists</h1>
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>Manage your saved code snippets.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/gist/new')}>
            New Gist
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}/>
          </div>
        ) : gists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No gists yet</h3>
            <p style={{ color: 'var(--text3)', marginBottom: 20 }}>Create your first snippet to share with others.</p>
            <button className="btn btn-primary" onClick={() => navigate('/gist/new')}>Create your first gist</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {gists.map((gist) => (
              <div key={gist._id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)', margin: 0 }} className="truncate">
                      {gist.title}
                    </h3>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                      {gist.language}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Created {timeAgo(gist.createdAt)} · {gist.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(gist.content)
                    toast.success('Copied to clipboard!')
                  }}>
                    Copy
                  </button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--accent)' }} onClick={() => navigate(`/gist/new?edit=${gist._id}`)} disabled>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
