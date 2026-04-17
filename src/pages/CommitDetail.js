import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getCommit, resolveConflict } from '../api'

function DiffBlock({ diff }) {
  const lines = diff.after?.split('\n') || []
  const beforeLines = diff.before?.split('\n') || []

  return (
    <div className="diff-block">
      <div className="diff-header">
        <span style={{ color: diff.type === 'added' ? 'var(--green)' : diff.type === 'deleted' ? 'var(--red)' : 'var(--blue)' }}>
          {diff.type === 'added' ? '+++ ' : diff.type === 'deleted' ? '--- ' : '~~~ '}
        </span>
        {diff.file}
      </div>
      <div style={{ maxHeight:320, overflowY:'auto' }}>
        {lines.slice(0, 80).map((line, i) => {
          const wasLine = beforeLines[i]
          const isAdd = line !== wasLine && wasLine !== undefined
          const isDel = !line && wasLine
          return (
            <div key={i} className={`diff-line ${isAdd ? 'diff-line-add' : ''}`}>
              <span className="diff-line-num">{i + 1}</span>
              <span>{line || ' '}</span>
            </div>
          )
        })}
        {lines.length > 80 && (
          <div className="diff-line" style={{ color:'var(--text3)', justifyContent:'center' }}>
            ... {lines.length - 80} more lines
          </div>
        )}
      </div>
    </div>
  )
}

function ConflictResolver({ repoId }) {
  const [form, setForm] = useState({ base: '', ours: '', theirs: '', filename: '' })
  const [resolved, setResolved] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    if (!form.ours || !form.theirs) return toast.error('Ours and theirs are required')
    setLoading(true)
    try {
      const { data } = await resolveConflict(repoId, form)
      setResolved(data.resolved)
      toast.success('AI resolved the conflict!')
    } catch {
      toast.error('Resolution failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="card mt-16">
      <div className="ai-label">AI Conflict Resolver</div>
      <p className="text-sm text-muted mb-16">Paste conflicting code blocks below and let AI suggest a resolution.</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label className="label">Filename</label>
          <input className="input" placeholder="app.js" value={form.filename}
            onChange={(e) => setForm({ ...form, filename: e.target.value })} />
        </div>
        <div>
          <label className="label">Base (common ancestor)</label>
          <textarea className="input" style={{ minHeight:80, fontSize:12, fontFamily:'monospace' }}
            placeholder="Original code before both changes..."
            value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label className="label" style={{ color:'var(--green)' }}>Ours (current branch)</label>
          <textarea className="input" style={{ minHeight:120, fontSize:12, fontFamily:'monospace', borderColor:'rgba(46,160,67,0.4)' }}
            placeholder="Your version of the code..."
            value={form.ours} onChange={(e) => setForm({ ...form, ours: e.target.value })} />
        </div>
        <div>
          <label className="label" style={{ color:'var(--blue)' }}>Theirs (incoming branch)</label>
          <textarea className="input" style={{ minHeight:120, fontSize:12, fontFamily:'monospace', borderColor:'rgba(88,166,255,0.4)' }}
            placeholder="Their version of the code..."
            value={form.theirs} onChange={(e) => setForm({ ...form, theirs: e.target.value })} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleResolve} disabled={loading} style={{ marginBottom:16 }}>
        {loading ? <><span className="spinner"/> Resolving...</> : 'Resolve with AI'}
      </button>
      {resolved && (
        <div>
          <label className="label" style={{ color:'var(--accent2)' }}>Resolved code</label>
          <pre style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)',
            padding:14, fontSize:12, overflowX:'auto', color:'var(--text)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
            {resolved}
          </pre>
          <button className="btn btn-sm mt-8" onClick={() => { navigator.clipboard.writeText(resolved); toast.success('Copied!') }}>
            Copy resolved code
          </button>
        </div>
      )}
    </div>
  )
}

export default function CommitDetail() {
  const { id, sha } = useParams()
  const [commit, setCommit] = useState(null)
  const [diffs, setDiffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('diff')

  useEffect(() => {
    getCommit(id, sha)
      .then(({ data }) => {
        setCommit(data.commit)
        setDiffs(data.diffs || [])
      })
      .catch(() => toast.error('Failed to load commit'))
      .finally(() => setLoading(false))
  }, [id, sha])

  if (loading) return <div><Navbar /><div className="loading-screen"><span className="spinner" style={{width:24,height:24,borderWidth:3}}/></div></div>
  if (!commit) return <div><Navbar /><div className="container" style={{paddingTop:40}}>Commit not found</div></div>

  const impactClass = !commit.impactScore ? '' : commit.impactScore >= 7 ? 'impact-high' : commit.impactScore >= 4 ? 'impact-med' : 'impact-low'
  const errorCount = commit.reviewComments?.filter((c) => c.severity === 'error').length || 0
  const warnCount = commit.reviewComments?.filter((c) => c.severity === 'warning').length || 0

  return (
    <div>
      <Navbar />

      <div style={{ borderBottom:'1px solid var(--border)', padding:'12px 24px', background:'var(--bg2)' }}>
        <div className="flex items-center gap-8 text-sm text-muted">
          <Link to="/" style={{ textDecoration:'none', color:'var(--text2)' }}>Repos</Link>
          <span>/</span>
          <Link to={`/repo/${id}`} style={{ textDecoration:'none', color:'var(--text2)' }}>Repository</Link>
          <span>/</span>
          <span className="code-tag">{sha.slice(0, 7)}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop:24, paddingBottom:48 }}>
        {/* Commit header */}
        <div className="card mb-16">
          <div className="flex items-center justify-between mb-12">
            <h1 style={{ fontSize:18, fontWeight:600, flex:1 }}>{commit.message}</h1>
            {commit.impactScore !== null && commit.impactScore !== undefined && (
              <div className={`impact-ring ${impactClass}`}>{commit.impactScore}</div>
            )}
          </div>

          {/* AI message */}
          {commit.aiMessage && (
            <div className="ai-box mb-12">
              <div className="ai-label">AI commit message</div>
              <p style={{ fontSize:13 }}>{commit.aiMessage}</p>
            </div>
          )}

          {commit.impactSummary && (
            <div className="ai-box mb-12">
              <div className="ai-label">Impact analysis</div>
              <p style={{ fontSize:13 }}>{commit.impactSummary}</p>
            </div>
          )}

          <div className="flex items-center gap-12 text-xs text-muted flex-wrap">
            <span>{commit.author?.username}</span>
            <span className="code-tag font-mono">{commit.sha.slice(0, 7)}</span>
            <span className="badge badge-blue">{commit.branch}</span>
            <span>{new Date(commit.createdAt).toLocaleString()}</span>
            <span className={`badge ${commit.aiStatus === 'complete' ? 'badge-purple' : 'badge-gray'}`}>
              {commit.aiStatus === 'complete' ? 'AI reviewed' : commit.aiStatus}
            </span>
            {errorCount > 0 && <span className="badge badge-red">{errorCount} errors</span>}
            {warnCount > 0 && <span className="badge badge-yellow">{warnCount} warnings</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => setActiveTab('diff')}>
            Files changed ({diffs.length})
          </button>
          <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
            AI Review ({commit.reviewComments?.length || 0})
          </button>
          <button className={`tab ${activeTab === 'resolve' ? 'active' : ''}`} onClick={() => setActiveTab('resolve')}>
            Conflict Resolver
          </button>
        </div>

        {activeTab === 'diff' && (
          <div>
            {diffs.length === 0 ? (
              <p className="text-muted">No diff available for this commit.</p>
            ) : (
              diffs.map((d, i) => <DiffBlock key={i} diff={d} />)
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            {!commit.reviewComments || commit.reviewComments.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'var(--text2)' }}>
                {commit.aiStatus === 'pending' ? 'AI is still analyzing this commit...' : 'No issues found by AI review.'}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {commit.reviewComments.map((c, i) => (
                  <div key={i} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid var(--${c.severity === 'error' ? 'red' : c.severity === 'warning' ? 'yellow' : 'blue'})`, borderRadius:'0 8px 8px 0' }}>
                    <div className="flex items-center gap-8 mb-6">
                      <span className={`badge ${c.severity === 'error' ? 'badge-red' : c.severity === 'warning' ? 'badge-yellow' : 'badge-blue'}`}>
                        {c.severity}
                      </span>
                      <span className="code-tag">{c.file}</span>
                      {c.line && <span className="text-xs text-muted">Line {c.line}</span>}
                    </div>
                    <p style={{ fontSize:13, lineHeight:1.6 }}>{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resolve' && <ConflictResolver repoId={id} />}
      </div>
    </div>
  )
}
