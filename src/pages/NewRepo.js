import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { createRepo, pushCommit, generateRepoSummary } from '../api'

export default function NewRepo() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const defaultName = searchParams.get('name') || ''
  const [form, setForm] = useState({ name: defaultName, description: '', isPrivate: false })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(f => {
      const path = f.webkitRelativePath || f.name
      if (path.includes('node_modules/') || path.includes('.git/') || path.includes('dist/') || path.includes('build/')) return false
      if (f.size > 2 * 1024 * 1024) return false // skip > 2MB
      return true
    })
    setSelectedFiles(prev => {
      const existingPaths = new Set(prev.map(p => p.webkitRelativePath || p.name))
      const newFiles = files.filter(f => !existingPaths.has(f.webkitRelativePath || f.name))
      return [...prev, ...newFiles]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.match(/^[a-zA-Z0-9_.-]+$/)) {
      return toast.error('Name can only contain letters, numbers, hyphens, underscores, and dots')
    }
    setLoading(true)
    try {
      const { data } = await createRepo(form)
      const repoId = data.repo._id

      if (selectedFiles.length > 0) {
        toast.loading('Uploading files...', { id: 'upload' })
        const filePromises = selectedFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve({ name: file.webkitRelativePath || file.name, content: e.target.result })
            reader.onerror = () => resolve(null)
            reader.readAsText(file)
          })
        })
        const uploadedFiles = await Promise.all(filePromises)
        const validFiles = uploadedFiles.filter(f => f && f.content && !f.content.includes('\u0000'))
        
        await pushCommit(repoId, {
          files: validFiles,
          message: 'Initial commit from device',
          branch: 'main'
        })
      }

      toast.success('Repository created!')
      navigate(selectedFiles.length > 0 ? `/repo/${repoId}` : `/repo/${repoId}/setup`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create repo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop:40, maxWidth:640 }}>
        <div className="flex items-center gap-8 mb-24">
          <Link to="/" className="text-muted text-sm">Repositories</Link>
          <span className="text-muted">/</span>
          <span className="text-sm">New repository</span>
        </div>

        <h1 style={{ fontSize:22, fontWeight:600, marginBottom:24 }}>Create a new repository</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Repository name *</label>
              <input
                className="input"
                placeholder="my-awesome-project"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted mt-8">Letters, numbers, hyphens, underscores, and dots only</p>
            </div>

            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <hr className="divider" />

            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {['Public', 'Private'].map((vis) => (
                <label key={vis} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={form.isPrivate === (vis === 'Private')}
                    onChange={() => setForm({ ...form, isPrivate: vis === 'Private' })}
                    style={{ marginTop:2 }}
                  />
                  <div>
                    <div style={{ fontWeight:500 }}>{vis}</div>
                    <div className="text-xs text-muted">
                      {vis === 'Public' ? 'Anyone can see this repository' : 'Only you can see this repository'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <hr className="divider" />

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="label">Initialize with files from device (Optional)</label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <label className="btn btn-sm">
                  Upload Folder
                  <input type="file" hidden webkitdirectory="true" directory="true" onChange={handleFileChange} />
                </label>
                <label className="btn btn-sm">
                  Upload Files
                  <input type="file" hidden multiple onChange={handleFileChange} />
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted">
                  {selectedFiles.length} file(s) selected to upload.
                  <button type="button" onClick={() => setSelectedFiles([])} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>Clear</button>
                </div>
              )}
            </div>

            <div className="flex gap-8">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"/> : 'Create repository'}
              </button>
              <Link to="/" className="btn">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
