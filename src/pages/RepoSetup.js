import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepo } from '../api'
import useAuthStore from '../store/authStore'

function CopyBox({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden'
      }}>
        <code style={{ flex: 1, padding: '10px 14px', fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace', overflow: 'auto', whiteSpace: 'nowrap' }}>
          {value}
        </code>
        <button onClick={copy} style={{
          padding: '10px 16px', background: copied ? 'var(--green)' : 'var(--bg3)',
          border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer',
          color: copied ? '#fff' : 'var(--text2)', fontSize: 12, fontWeight: 500,
          transition: 'background 0.2s, color 0.2s', whiteSpace: 'nowrap', flexShrink: 0
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: 'var(--bg2)', border: 'none', cursor: 'pointer',
        color: 'var(--text)', fontWeight: 600, fontSize: 14, textAlign: 'left'
      }}>
        {title}
        <span style={{ fontSize: 18, color: 'var(--text3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
      </button>
      {open && (
        <div style={{ padding: '16px 18px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function RepoSetup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [repo, setRepo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRepo(id)
      .then(({ data }) => setRepo(data.repo))
      .catch(() => toast.error('Failed to load repo'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div><Navbar /><div className="loading-screen"><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} /></div></div>
  )

  const repoUrl = `http://localhost:5000/repos/${user?.username}/${repo?.name}.git`
  const username = user?.username || 'you'
  const repoName = repo?.name || 'my-repo'

  return (
    <div>
      <Navbar />

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ color: 'var(--text3)', fontSize: 13, textDecoration: 'none' }}>Repositories</Link>
        <span style={{ color: 'var(--text3)' }}>/</span>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{repoName}</span>
        {repo?.isPrivate && <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, border: '1px solid var(--border)', color: 'var(--text3)' }}>Private</span>}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>

        {/* Success banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))',
          border: '1px solid rgba(139,92,246,0.35)', borderRadius: 12, marginBottom: 28
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>✓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 3 }}>
              Repository <span style={{ color: '#a78bfa' }}>{username}/{repoName}</span> created!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              {repo?.description || 'Your new repository is ready. Push your first commit below.'}
            </div>
          </div>
          <button
            onClick={() => navigate(`/repo/${id}`)}
            className="btn btn-primary"
            style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 13 }}
          >
            Go to editor →
          </button>
        </div>

        {/* Quick setup */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Quick setup — if you've done this kind of thing before</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Get started by using AI-VCS directly in your browser</p>
          <CopyBox value={repoUrl} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => navigate(`/repo/${id}`)} className="btn btn-primary" style={{ fontSize: 13 }}>
              🖊 Open Editor
            </button>
            <button onClick={() => navigate(`/import`)} className="btn btn-sm" style={{ fontSize: 13 }}>
              ⬇️ Import existing
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, fontWeight: 600 }}>
          …or follow one of the guides below
        </div>

        <Section title="🆕  Create a new repository on the command line" defaultOpen={true}>
          <CopyBox value={`echo "# ${repoName}" >> README.md\ngit init\ngit add README.md\ngit commit -m "first commit"\ngit branch -M main\ngit remote add origin ${repoUrl}\ngit push -u origin main`} />
        </Section>

        <Section title="📤  Push an existing repository from the command line">
          <CopyBox value={`git remote add origin ${repoUrl}\ngit branch -M main\ngit push -u origin main`} />
        </Section>

        <Section title="📥  Import code from another repository">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            You can initialize this repository with code from a GitHub repo or any other hosted repository.
          </p>
          <button onClick={() => navigate('/import')} className="btn btn-primary" style={{ fontSize: 13 }}>
            Begin import
          </button>
        </Section>

        {/* Footer actions */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24,
          padding: '18px 22px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginRight: 4, alignSelf: 'center' }}>Next steps:</span>
          <button onClick={() => navigate(`/repo/${id}/issues/new`)} className="btn btn-sm" style={{ fontSize: 12 }}>⚡ Create an issue</button>
          <button onClick={() => navigate(`/repo/${id}/issues`)} className="btn btn-sm" style={{ fontSize: 12 }}>📋 View issues</button>
          <button onClick={() => navigate(`/repo/${id}/pulls`)} className="btn btn-sm" style={{ fontSize: 12 }}>🔀 Pull requests</button>
          <button onClick={() => navigate(`/repo/${id}/discussions`)} className="btn btn-sm" style={{ fontSize: 12 }}>💬 Discussions</button>
          <button onClick={() => navigate(`/repo/${id}`)} className="btn btn-sm btn-primary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            Open repository →
          </button>
        </div>
      </div>
    </div>
  )
}
