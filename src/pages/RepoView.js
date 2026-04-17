import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import Navbar from '../components/ui/Navbar'
import { getRepo, getCommits, pushCommit, getFileContent } from '../api'

const SOCKET_URL = 'http://localhost:5000'

export default function RepoView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repo, setRepo] = useState(null)
  const [files, setFiles] = useState([])
  const [commits, setCommits] = useState([])
  const [activeTab, setActiveTab] = useState('code')
  const [activeFile, setActiveFile] = useState(null)
  const [currentPath, setCurrentPath] = useState('')
  const [viewMode, setViewMode] = useState('tree') // 'tree' or 'blob' or 'create'
  const [editorContent, setEditorContent] = useState('')
  const [commitMsg, setCommitMsg] = useState('')
  const [branch, setBranch] = useState('main')
  const [pushing, setPushing] = useState(false)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('lastRepoId', id)
    loadRepo()
    loadCommits()

    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit('join-repo', id)
    socketRef.current.on('ai-analysis-complete', ({ aiMessage, reviewComments, impactScore }) => {
      toast.success(`AI analysis done — impact score: ${impactScore}/10`)
      loadCommits()
    })
    return () => socketRef.current.disconnect()
  }, [id])

  const loadRepo = async (silent = false) => {
    try {
      const { data } = await getRepo(id)
      setRepo(data.repo)
      setFiles(data.files || [])
      setBranch(data.repo.defaultBranch || 'main')
    } catch {
      if (!silent) toast.error('Failed to load repo')
    } finally {
      setLoading(false)
    }
  }

  const loadCommits = async () => {
    try {
      const { data } = await getCommits(id, { limit: 15 })
      setCommits(data.commits || [])
    } catch {}
  }

  const loadFileContent = async (filepath) => {
    try {
      const { data } = await getFileContent(id, filepath, branch)
      setEditorContent(data.content)
      setActiveFile(filepath)
      setCurrentPath(filepath)
      setViewMode('blob')
    } catch { toast.error('Failed to load file') }
  }

  const handlePush = async () => {
    if (!commitMsg.trim()) return toast.error('Commit message is required')
    setPushing(true)
    try {
      await pushCommit(id, {
        files: [{ name: activeFile, content: editorContent }],
        message: commitMsg,
        branch
      })
      toast.success('Pushed! AI is analyzing your code...')
      setCommitMsg('')
      loadCommits()
      await loadRepo(true)
      // go back to tree view
      const parts = activeFile.split('/')
      parts.pop() // remove file name
      handleNavigateToPath(parts.join('/'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Push failed')
    } finally {
      setPushing(false)
    }
  }

  const handleCreateFileSubmit = async (filename, content) => {
    if (!commitMsg.trim()) return toast.error('Commit message is required')
    setPushing(true)
    try {
      const filepath = currentPath ? `${currentPath}/${filename}` : filename
      await pushCommit(id, {
        files: [{ name: filepath, content }],
        message: commitMsg,
        branch
      })
      toast.success('Created! AI is analyzing your code...')
      setCommitMsg('')
      loadCommits()
      await loadRepo(true)
      setViewMode('tree')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Push failed')
    } finally {
      setPushing(false)
    }
  }

  const handleCreateFileClick = () => {
    setActiveFile('')
    setEditorContent('// Add file content here\n')
    setViewMode('create')
  }

  const getTree = () => {
    const result = []
    const folders = new Set()

    files.forEach(f => {
      if (currentPath === '' || f.startsWith(currentPath + '/')) {
        const relPath = currentPath === '' ? f : f.slice(currentPath.length + 1)
        const parts = relPath.split('/')

        if (parts.length === 1) {
          result.push({ name: parts[0], type: 'file', path: f })
        } else {
          folders.add(parts[0])
        }
      }
    })

    Array.from(folders).sort().forEach(folder => {
      result.push({ name: folder, type: 'folder', path: currentPath === '' ? folder : currentPath + '/' + folder })
    })

    return result.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
  }

  const handleNavigateToPath = (path) => {
    setCurrentPath(path)
    setViewMode('tree')
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const getLanguage = (filename) => {
    const ext = filename?.split('.').pop()
    const map = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp', go: 'go',
      rs: 'rust', rb: 'ruby', php: 'php', html: 'html', css: 'css', json: 'json',
      md: 'markdown', sh: 'shell', yaml: 'yaml', yml: 'yaml' }
    return map[ext] || 'plaintext'
  }

  if (loading) return <div><Navbar /><div className="loading-screen"><span className="spinner" style={{width:24,height:24,borderWidth:3}}/></div></div>

  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean)
    return (
      <div className="repo-breadcrumb" style={{ margin: 0, paddingLeft: 8 }}>
        <a className="repo-breadcrumb-link" onClick={() => handleNavigateToPath('')}>{repo?.name}</a>
        {parts.map((part, index) => {
          const pathToHere = parts.slice(0, index + 1).join('/')
          return (
            <span key={index} style={{display:'flex', alignItems:'center', gap:4}}>
              <span className="repo-breadcrumb-sep">/</span>
              <a className="repo-breadcrumb-link" onClick={() => {
                if (viewMode === 'blob' && index === parts.length - 1) return // current file, do nothing
                handleNavigateToPath(pathToHere)
              }}>
                {part}
              </a>
            </span>
          )
        })}
      </div>
    )
  }

  const currentTree = getTree()

  return (
    <div>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <button
              onClick={() => navigate('/')}
              title="Go back to Repositories"
              className="btn btn-ghost"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              <Link to="/" style={{ color: 'var(--blue)', textDecoration: 'none' }}>{repo?.owner?.username}</Link>
              <span className="text-muted" style={{ margin: '0 8px', fontWeight: 400 }}>/</span>
              <span onClick={() => handleNavigateToPath('')} style={{cursor:'pointer'}}>{repo?.name}</span>
            </h1>
            {repo?.isPrivate && <span className="badge badge-gray" style={{ transform: 'translateY(1px)' }}>Private</span>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to={`/repo/${id}/search`} className="btn btn-sm">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8.5 8.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              AI Search
            </Link>
          </div>
        </div>

        {/* GitHub Tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
            Code
          </button>
          <button className={`tab ${activeTab === 'commits' ? 'active' : ''}`} onClick={() => setActiveTab('commits')}>
            Commits ({commits.length})
          </button>
          <button className={`tab ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            Insights
          </button>
        </div>

        {activeTab === 'code' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <select className="input" style={{ width: 150, padding: '4px 8px', fontSize: 13 }} value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="main">main</option>
                  <option value="dev">dev</option>
                  <option value="feature">feature</option>
                </select>
                {viewMode === 'tree' && renderBreadcrumbs()}
              </div>
              
              {viewMode === 'tree' && (
                <button className="btn btn-sm" onClick={handleCreateFileClick}>
                  Add file
                </button>
              )}
            </div>

            {viewMode === 'tree' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: '24px', alignItems: 'start' }}>
                <div className="repo-tree-card" style={{ marginTop: 0 }}>
                  <div className="repo-tree-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '75%' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {commits[0]?.author?.username || repo?.owner?.username}
                      </span>
                      <span className="text-muted" style={{ fontWeight: 400, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Link to={commits[0] ? `/repo/${id}/commit/${commits[0].sha}` : '#'} style={{ color: 'inherit', textDecoration: 'none' }} className="truncate">
                          {commits[0]?.message || 'README update'}
                        </Link>
                      </span>
                    </div>
                    <span>{commits[0] ? timeAgo(commits[0].createdAt) : ''}</span>
                  </div>
                  <div>
                    {currentPath !== '' && (
                      <div className="repo-tree-row">
                        <span className="repo-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3h4l2 2h4v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4z"/></svg>
                        </span>
                        <a onClick={() => {
                          const parts = currentPath.split('/')
                          parts.pop()
                          handleNavigateToPath(parts.join('/'))
                        }}>..</a>
                      </div>
                    )}
                    {currentTree.length === 0 && currentPath === '' && files.length === 0 && (
                      <div className="repo-tree-row text-muted" style={{justifyContent:'center', padding: '24px'}}>
                        No files yet. Add a file to get started.
                      </div>
                    )}
                    {currentTree.map((item) => (
                      <div key={item.path} className="repo-tree-row">
                        <span className={`repo-icon ${item.type === 'folder' ? 'repo-icon-folder' : ''}`}>
                          {item.type === 'folder' ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073H3.75Z"/></svg>
                          )}
                        </span>
                        <a onClick={() => {
                          if (item.type === 'folder') handleNavigateToPath(item.path)
                          else loadFileContent(item.path)
                        }}>
                          {item.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '0 8px' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>About</h2>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
                    {repo?.description || 'No description, website, or topics provided.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Zm.25 1.5h2.5c.066 0 .13.026.177.073l.9 1.2c.464.618 1.18.977 1.95.977h6.75a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25v-10.5a.25.25 0 0 1 .25-.25Z"/></svg>
                      Readme
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A8 8 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
                      Activity
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
                      <strong>0</strong> stars
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM8 5.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 15.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg>
                      <strong>1</strong> watching
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM7.25 13.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
                      <strong>0</strong> forks
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Releases</h3>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>No releases published</p>
                  </div>
                </div>
              </div>
            )}

            {(viewMode === 'blob' || viewMode === 'create') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '20px', alignItems: 'start' }}>
                <div className="card" style={{ padding: '20px', background: 'var(--bg2)' }}>
                  <h3 style={{ fontSize: 14, marginBottom: 16 }}>Commit changes</h3>
                  <textarea className="input" style={{ fontSize: 13, minHeight: 80, marginBottom: 12, resize: 'vertical' }}
                    placeholder={viewMode === 'create' ? "Create file commit message..." : "Update file commit message..."}
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={viewMode === 'create' ? () => handleCreateFileSubmit(activeFile, editorContent) : handlePush} disabled={pushing || (viewMode === 'create' && !activeFile)} style={{flex: 1, justifyContent: 'center'}}>
                      {pushing ? <><span className="spinner" style={{width:14,height:14}}/>Committing...</> : 'Commit changes'}
                    </button>
                    <button className="btn" onClick={() => handleNavigateToPath(currentPath)}>Cancel</button>
                  </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {renderBreadcrumbs()}
                    {viewMode === 'create' && (
                      <input 
                        type="text" 
                        className="input" 
                        style={{ width: 250, padding: '4px 8px', fontSize: 13 }} 
                        placeholder="Filename (e.g. utils.js)" 
                        value={activeFile} 
                        onChange={(e) => setActiveFile(e.target.value)}
                      />
                    )}
                  </div>
                  <div style={{ height: 'calc(100vh - 300px)', minHeight: 500 }}>
                    <Editor
                      height="100%"
                      language={getLanguage(activeFile)}
                      value={editorContent}
                      onChange={(val) => setEditorContent(val)}
                      theme="vs-dark"
                      options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commits List (almost unchanged) */}
        {activeTab === 'commits' && (
          <div style={{ marginTop: 20 }}>
            {commits.length === 0 ? (
              <div className="card text-center text-muted">No commits yet. Push some code!</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {commits.map((c) => (
                  <Link key={c._id} to={`/repo/${id}/commit/${c.sha}`} style={{ textDecoration:'none' }}>
                    <div className="card card-hover" style={{ padding:'16px 20px' }}>
                      <div className="flex items-center justify-between mb-8">
                        <span style={{ fontWeight:600, color:'var(--text)', fontSize:15 }}>{c.message}</span>
                        <span className={`badge ${c.aiStatus === 'complete' ? 'badge-purple' : c.aiStatus === 'failed' ? 'badge-red' : 'badge-gray'}`}>
                          {c.aiStatus === 'complete' ? 'AI reviewed' : c.aiStatus === 'failed' ? 'AI failed' : 'Analyzing...'}
                        </span>
                      </div>
                      {c.aiMessage && (
                        <p className="text-sm mb-8" style={{ color:'var(--accent2)' }}>
                          AI: {c.aiMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-16 text-sm text-muted mt-16">
                        <span className="code-tag">{c.sha.slice(0, 7)}</span>
                        <span>{c.author?.username}</span>
                        <span className="badge badge-blue">{c.branch}</span>
                        <span>{timeAgo(c.createdAt)}</span>
                        {c.impactScore !== null && c.impactScore !== undefined && (
                          <span style={{ color: c.impactScore >= 7 ? 'var(--red)' : c.impactScore >= 4 ? 'var(--yellow)' : 'var(--green)' }}>
                            Impact: {c.impactScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'insights' && (() => {
          const commitAuthors = commits.reduce((acc, c) => {
            const username = c.author?.username || 'Unknown'
            acc[username] = (acc[username] || 0) + 1
            return acc
          }, {})
          const topCommitters = Object.entries(commitAuthors).sort((a,b) => b[1] - a[1]).slice(0, 5)
          const maxCommits = topCommitters.length > 0 ? Math.max(...topCommitters.map(t => t[1])) : 1

          return (
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24, alignItems: 'start' }}>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '8px 0' }}>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text)', fontWeight: 600, borderLeft: '3px solid var(--accent)', background: 'var(--bg3)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Pulse</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Contributors</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Community standards</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Commits</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Code frequency</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Dependency graph</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Network</a>
                  <a style={{ display: 'block', padding: '8px 16px', color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer', fontSize: 13 }}>Forks</a>
                </div>
              </div>

              <div>
                {/* Custom AI Stats */}
                <h2 style={{ fontSize: 20, color: 'var(--text)', marginBottom: 20, fontWeight: 600 }}>Repository Insights</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div className="card" style={{ padding: '24px', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Commits</span>
                    <span style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--text)' }}>{commits.length}</span>
                  </div>
                  
                  <div className="card" style={{ padding: '24px', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contributors</span>
                    <span style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--text)' }}>
                      {Object.keys(commitAuthors).length}
                    </span>
                  </div>

                  <div className="card" style={{ padding: '24px', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg. Impact Score</span>
                    <span style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--text)' }}>
                      {commits.filter(c => c.impactScore !== undefined && c.impactScore !== null).length > 0 
                        ? (commits.filter(c => c.impactScore !== undefined && c.impactScore !== null).reduce((sum, c) => sum + c.impactScore, 0) / commits.filter(c => c.impactScore !== undefined && c.impactScore !== null).length).toFixed(1)
                        : 'N/A'
                      }
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Out of 10</span>
                  </div>
                </div>

                {/* Pulse View */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Pulse Overview Dashboard</h2>
                  <select className="input" style={{ width: 140, padding: '4px 8px', fontSize: 13, background: 'var(--bg2)' }}>
                    <option>Period: All time</option>
                    <option>Period: 1 month</option>
                  </select>
                </div>

                <div className="card" style={{ padding: 0, marginBottom: 20 }}>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Overview</h3>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, background: '#8b5cf6', borderRadius: 4, width: '100%', marginBottom: 10 }}></div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}><strong>0</strong> Active pull requests</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, background: '#22c55e', borderRadius: 4, width: '100%', marginBottom: 10 }}></div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}><strong>0</strong> Active issues</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ color: '#8b5cf6', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.373 1.488a.75.75 0 0 1 1.054.06l2.006 2.25a.75.75 0 0 1 0 .991L6.427 7.042a.75.75 0 0 1-1.127-.996L6.5 4.542H2.5A1.5 1.5 0 0 0 1 6.042v6.5a.75.75 0 0 1-1.5 0v-6.5A3 3 0 0 1 2.5 3.042h4L5.313 1.74a.75.75 0 0 1 .06-1.054ZM10 6a.75.75 0 0 1 .75.75v5.75A1.5 1.5 0 0 1 9.25 14h-6a1.5 1.5 0 0 1-1.5-1.5v-5.75A.75.75 0 0 1 2.5 6h-1a.75.75 0 0 1 0-1.5h7.75A.75.75 0 0 1 10 6Z"/></svg> 
                          <strong>0</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Merged pull requests</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M7.177 3.073L9.573.677A.25.25 0 0 1 10 .854v4.792a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25ZM11 2.5h-1V4h1a1.5 1.5 0 0 1 1.5 1.5v5.636a.25.25 0 0 0 .427.177l2.177-2.177ZM11 2.5Z"/></svg>
                          <strong>0</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Open pull requests</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ color: '#8b5cf6', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>
                          <strong>0</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Closed issues</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>
                          <strong>0</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>New issues</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="card" style={{ padding: '16px' }}>
                     <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>AI Analysis Breakdown</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                         <span style={{ color: 'var(--text2)' }}>Successfully Reviewed</span>
                         <strong style={{ color: 'var(--green)' }}>{commits.filter(c => c.aiStatus === 'complete').length}</strong>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                         <span style={{ color: 'var(--text2)' }}>Failed Analysis</span>
                         <strong style={{ color: 'var(--red)' }}>{commits.filter(c => c.aiStatus === 'failed').length}</strong>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ color: 'var(--text2)' }}>Pending Analysis</span>
                         <strong style={{ color: 'var(--yellow)' }}>{commits.filter(c => c.aiStatus !== 'complete' && c.aiStatus !== 'failed').length}</strong>
                       </div>
                     </div>
                  </div>

                  <div className="card" style={{ padding: '16px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Top Committers</h3>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                         <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>
                      </button>
                    </div>
                    
                    <div style={{ height: 120, position: 'relative', display: 'flex', paddingLeft: 40, paddingBottom: 20 }}>
                      <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ borderBottom: '1px dashed var(--border)', height: 0, width: '100%' }}></div>
                        <div style={{ borderBottom: '1px dashed var(--border)', height: 0, width: '100%' }}></div>
                        <div style={{ borderBottom: '1px dashed var(--border)', height: 0, width: '100%' }}></div>
                      </div>

                      <div style={{ position: 'absolute', left: 0, top: -8, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                        <span>{maxCommits}</span>
                        <span>{Math.max(1, Math.floor(maxCommits/2))}</span>
                        <span>0</span>
                      </div>
                      <div style={{ position: 'absolute', left: -16, top: 60, transform: 'rotate(-90deg)', fontSize: 10, color: 'var(--text3)' }}>
                        Commits
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 16, zIndex: 1, height: '100%' }}>
                        {topCommitters.map(([author, count], i) => (
                          <div key={i} style={{ width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 12, background: '#22c55e', height: `${Math.max((count/maxCommits)*100, 5)}%`, borderRadius: '2px 2px 0 0' }}></div>
                            <div style={{ position: 'absolute', bottom: -4 }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {author[0]?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
