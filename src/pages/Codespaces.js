import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos } from '../api'
import useAuthStore from '../store/authStore'

const MACHINES = [
    { id: '2core', label: '2-core', cpu: '2 cores', ram: '8 GB RAM', storage: '32 GB', price: 'Free' },
    { id: '4core', label: '4-core', cpu: '4 cores', ram: '16 GB RAM', storage: '32 GB', price: 'Standard' },
    { id: '8core', label: '8-core', cpu: '8 cores', ram: '32 GB RAM', storage: '64 GB', price: 'Premium' },
]

const EDITORS = [
    { id: 'vscode', label: 'VS Code', icon: '💻' },
    { id: 'jupyter', label: 'JupyterLab', icon: '📓' },
    { id: 'terminal', label: 'Terminal only', icon: '⌨️' },
]

const STATUS_COLORS = {
    running: '#56d364',
    stopped: '#8b949e',
    starting: '#e3b341',
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export default function Codespaces() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [repos, setRepos] = useState([])
    const [codespaces, setCodespaces] = useState(() => {
        const saved = localStorage.getItem('codespaces')
        return saved ? JSON.parse(saved) : []
    })
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({ repoId: '', branch: 'main', machine: '2core', editor: 'vscode' })

    useEffect(() => {
        getRepos().then(({ data }) => setRepos(data.repos)).catch(() => { })
    }, [])

    const saveCodespaces = (updated) => {
        setCodespaces(updated)
        localStorage.setItem('codespaces', JSON.stringify(updated))
    }

    const handleCreate = async () => {
        if (!form.repoId) return toast.error('Select a repository')
        setCreating(true)
        const repo = repos.find(r => r._id === form.repoId)

        // Simulate creation delay
        const newSpace = {
            id: Date.now().toString(),
            repoId: form.repoId,
            repoName: repo?.name || 'unknown',
            branch: form.branch,
            machine: form.machine,
            editor: form.editor,
            status: 'starting',
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            name: `${user?.username}-${repo?.name}-${Math.random().toString(36).slice(2, 6)}`
        }

        const updated = [newSpace, ...codespaces]
        saveCodespaces(updated)
        setShowCreate(false)
        setCreating(false)
        toast.success('Codespace is starting...')

        // Simulate status change to running
        setTimeout(() => {
            const updated2 = updated.map(c =>
                c.id === newSpace.id ? { ...c, status: 'running' } : c
            )
            saveCodespaces(updated2)
            toast.success('Codespace is ready!')
        }, 3000)
    }

    const handleStop = (id) => {
        const updated = codespaces.map(c =>
            c.id === id ? { ...c, status: c.status === 'running' ? 'stopped' : 'running' } : c
        )
        saveCodespaces(updated)
        const space = codespaces.find(c => c.id === id)
        toast.success(space?.status === 'running' ? 'Codespace stopped' : 'Codespace started')
    }

    const handleDelete = (id) => {
        if (!window.confirm('Delete this codespace?')) return
        saveCodespaces(codespaces.filter(c => c.id !== id))
        toast.success('Codespace deleted')
    }

    const handleOpen = (space) => {
        if (space.status !== 'running') return toast.error('Start the codespace first')
        toast.success(`Opening ${space.editor === 'vscode' ? 'VS Code' : space.editor}...`)
        // Navigate to repo
        setTimeout(() => navigate(`/repo/${space.repoId}`), 1000)
    }

    return (
        <div>
            <Navbar />
            <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 960 }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Codespaces</h1>
                        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                            Your cloud development environments
                        </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        New codespace
                    </button>
                </div>

                {/* Usage bar */}
                <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
                    padding: 16, marginBottom: 24
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Monthly usage</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {codespaces.filter(c => c.status === 'running').length * 2}h / 120h free
                        </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 3, background: 'var(--accent2)',
                            width: `${Math.min((codespaces.filter(c => c.status === 'running').length * 2 / 120) * 100, 100)}%`,
                            transition: 'width 0.3s'
                        }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                        Free tier: 120 core hours/month · 2-core machines
                    </p>
                </div>

                {/* Create codespace modal */}
                {showCreate && (
                    <div style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
                        padding: 24, marginBottom: 24
                    }}>
                        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Create a codespace</h2>

                        <div className="form-group">
                            <label className="label">Repository</label>
                            <select className="input" value={form.repoId}
                                onChange={(e) => setForm({ ...form, repoId: e.target.value })}>
                                <option value="">Select a repository</option>
                                {repos.map(r => (
                                    <option key={r._id} value={r._id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Branch</label>
                            <select className="input" value={form.branch}
                                onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                                {['main', 'dev', 'feature', 'hotfix'].map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Machine type</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {MACHINES.map(m => (
                                    <label key={m.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                            border: `1px solid ${form.machine === m.id ? 'var(--accent2)' : 'var(--border)'}`,
                                            borderRadius: 8, cursor: 'pointer',
                                            background: form.machine === m.id ? 'rgba(124,58,237,0.08)' : 'var(--bg)'
                                        }}>
                                        <input type="radio" name="machine" value={m.id}
                                            checked={form.machine === m.id}
                                            onChange={(e) => setForm({ ...form, machine: e.target.value })} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.cpu} · {m.ram} · {m.storage}</div>
                                        </div>
                                        <span style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                            background: m.price === 'Free' ? 'rgba(46,160,67,0.15)' : 'rgba(124,58,237,0.15)',
                                            color: m.price === 'Free' ? '#56d364' : '#a78bfa'
                                        }}>
                                            {m.price}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Editor</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {EDITORS.map(e => (
                                    <button key={e.id} type="button"
                                        onClick={() => setForm({ ...form, editor: e.id })}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                                            cursor: 'pointer', textAlign: 'center',
                                            borderColor: form.editor === e.id ? 'var(--accent2)' : 'var(--border)',
                                            background: form.editor === e.id ? 'rgba(124,58,237,0.08)' : 'var(--bg)'
                                        }}>
                                        <div style={{ fontSize: 20, marginBottom: 4 }}>{e.icon}</div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 500,
                                            color: form.editor === e.id ? 'var(--accent2)' : 'var(--text2)'
                                        }}>
                                            {e.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                                {creating ? <span className="spinner" /> : 'Create codespace'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Codespaces list */}
                {codespaces.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 80, background: 'var(--bg2)',
                        border: '1px solid var(--border)', borderRadius: 12
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>💻</div>
                        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No codespaces</h3>
                        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
                            Create a codespace to start coding in the cloud
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            Create your first codespace
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {codespaces.map((space) => (
                            <div key={space.id} style={{
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: 12, padding: 16
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                                    {/* Status indicator */}
                                    <div style={{ marginTop: 4 }}>
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: STATUS_COLORS[space.status] || '#8b949e',
                                            boxShadow: space.status === 'running' ? `0 0 6px ${STATUS_COLORS.running}` : 'none'
                                        }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontWeight: 600, fontSize: 14, color: 'var(--text)',
                                                fontFamily: 'monospace'
                                            }}>{space.name}</span>
                                            <span style={{
                                                fontSize: 11, padding: '2px 7px', borderRadius: 20,
                                                background: space.status === 'running' ? 'rgba(46,160,67,0.15)' :
                                                    space.status === 'starting' ? 'rgba(210,153,34,0.15)' : 'rgba(110,118,129,0.15)',
                                                color: STATUS_COLORS[space.status]
                                            }}>
                                                {space.status}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.1" />
                                                </svg>
                                                {space.repoName}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                                                    <circle cx="3" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                                                    <circle cx="9" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                                                    <path d="M3 4.5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                                                    <path d="M9 4.5c0 2.5-2.5 3-4 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                                                </svg>
                                                {space.branch}
                                            </span>
                                            <span>{MACHINES.find(m => m.id === space.machine)?.cpu}</span>
                                            <span>{EDITORS.find(e => e.id === space.editor)?.icon} {EDITORS.find(e => e.id === space.editor)?.label}</span>
                                            <span>Last used {timeAgo(space.lastUsed)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <button className="btn btn-primary btn-sm" style={{ fontSize: 12 }}
                                            onClick={() => handleOpen(space)}
                                            disabled={space.status !== 'running'}>
                                            {space.status === 'starting' ? (
                                                <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Starting</>
                                            ) : 'Open'}
                                        </button>
                                        <button className="btn btn-sm" style={{ fontSize: 12 }}
                                            onClick={() => handleStop(space.id)}>
                                            {space.status === 'running' ? 'Stop' : 'Start'}
                                        </button>
                                        <button className="btn btn-danger btn-sm" style={{ fontSize: 12 }}
                                            onClick={() => handleDelete(space.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips */}
                <div style={{
                    marginTop: 32, background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 20
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Tips</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { icon: '⚡', title: 'Auto-suspend', desc: 'Codespaces stop after 30 min of inactivity to save resources' },
                            { icon: '💾', title: 'Persistent storage', desc: 'Your files are saved even when the codespace is stopped' },
                            { icon: '🔄', title: 'Sync settings', desc: 'VS Code settings and extensions sync across codespaces' },
                            { icon: '🌐', title: 'Port forwarding', desc: 'Access your running app from anywhere via forwarded ports' },
                        ].map((tip) => (
                            <div key={tip.title} style={{ display: 'flex', gap: 10 }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{tip.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{tip.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}