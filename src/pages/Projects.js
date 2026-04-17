import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'

const INITIAL_PROJECTS = [
  {
    id: 1, title: 'Sprint 1', description: 'Initial development sprint',
    columns: {
      todo: [
        { id: 1, title: 'Setup project structure', label: 'feature' },
        { id: 2, title: 'Design database schema', label: 'feature' },
      ],
      inProgress: [
        { id: 3, title: 'Build auth system', label: 'enhancement' },
      ],
      done: [
        { id: 4, title: 'Create repository', label: 'bug' },
      ]
    }
  }
]

const labelColors = {
  bug: { bg: 'rgba(248,81,73,0.15)', color: '#ff7b72' },
  feature: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
  enhancement: { bg: 'rgba(88,166,255,0.15)', color: '#79c0ff' },
  question: { bg: 'rgba(210,153,34,0.15)', color: '#e3b341' },
}

const COLUMNS = [
  { key: 'todo', label: 'To do', color: '#8b949e' },
  { key: 'inProgress', label: 'In progress', color: '#79c0ff' },
  { key: 'done', label: 'Done', color: '#56d364' },
]

export default function Projects() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [activeProject, setActiveProject] = useState(0)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewCard, setShowNewCard] = useState(null)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardLabel, setNewCardLabel] = useState('feature')
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const project = projects[activeProject]

  const handleNewProject = () => {
    if (!newProjectTitle.trim()) return toast.error('Title required')
    const newProj = {
      id: Date.now(), title: newProjectTitle, description: '',
      columns: { todo: [], inProgress: [], done: [] }
    }
    setProjects([...projects, newProj])
    setActiveProject(projects.length)
    setNewProjectTitle('')
    setShowNewProject(false)
    toast.success('Project created!')
  }

  const handleAddCard = (colKey) => {
    if (!newCardTitle.trim()) return toast.error('Card title required')
    const newCard = { id: Date.now(), title: newCardTitle, label: newCardLabel }
    const updated = projects.map((p, i) => {
      if (i !== activeProject) return p
      return { ...p, columns: { ...p.columns, [colKey]: [...p.columns[colKey], newCard] } }
    })
    setProjects(updated)
    setNewCardTitle('')
    setNewCardLabel('feature')
    setShowNewCard(null)
    toast.success('Card added!')
  }

  const handleDeleteCard = (colKey, cardId) => {
    const updated = projects.map((p, i) => {
      if (i !== activeProject) return p
      return { ...p, columns: { ...p.columns, [colKey]: p.columns[colKey].filter(c => c.id !== cardId) } }
    })
    setProjects(updated)
  }

  const handleDragStart = (colKey, cardId) => setDragging({ colKey, cardId })

  const handleDrop = (targetCol) => {
    if (!dragging || dragging.colKey === targetCol) { setDragging(null); setDragOver(null); return }
    const updated = projects.map((p, i) => {
      if (i !== activeProject) return p
      const card = p.columns[dragging.colKey].find(c => c.id === dragging.cardId)
      const fromCol = p.columns[dragging.colKey].filter(c => c.id !== dragging.cardId)
      const toCol = [...p.columns[targetCol], card]
      return { ...p, columns: { ...p.columns, [dragging.colKey]: fromCol, [targetCol]: toCol } }
    })
    setProjects(updated)
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '24px 24px 48px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-24">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600 }}>Projects</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Plan and track your work with kanban boards
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewProject(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New project
          </button>
        </div>

        {/* New project form */}
        {showNewProject && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: 16, marginBottom: 20 }}>
            <input className="input" style={{ marginBottom: 10 }}
              placeholder="Project title" value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewProject()} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleNewProject}>Create</button>
              <button className="btn btn-sm" onClick={() => setShowNewProject(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Project tabs */}
        {projects.length > 1 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
            {projects.map((p, i) => (
              <button key={p.id} onClick={() => setActiveProject(i)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  cursor: 'pointer', fontSize: 13, fontWeight: activeProject === i ? 500 : 400,
                  background: activeProject === i ? 'var(--accent)' : 'transparent',
                  color: activeProject === i ? '#fff' : 'var(--text2)' }}>
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Kanban board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {COLUMNS.map((col) => (
            <div key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key) }}
              onDrop={() => handleDrop(col.key)}
              style={{ background: dragOver === col.key ? 'rgba(124,58,237,0.05)' : 'var(--bg2)',
                border: `1px solid ${dragOver === col.key ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                borderRadius: 12, padding: 14, minHeight: 400, transition: 'all 0.15s' }}>

              {/* Column header */}
              <div className="flex items-center justify-between mb-12">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }}/>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{col.label}</span>
                  <span style={{ background: 'var(--bg3)', color: 'var(--text3)', fontSize: 11,
                    padding: '1px 7px', borderRadius: 20 }}>
                    {project.columns[col.key].length}
                  </span>
                </div>
                <button onClick={() => setShowNewCard(col.key)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                    fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>
                  +
                </button>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {project.columns[col.key].map((card) => (
                  <div key={card.id} draggable
                    onDragStart={() => handleDragStart(col.key, card.id)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                      padding: '10px 12px', cursor: 'grab', transition: 'border-color 0.1s',
                      opacity: dragging?.cardId === card.id ? 0.5 : 1 }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6e7681'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div className="flex items-center justify-between mb-6">
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{card.title}</span>
                      <button onClick={() => handleDeleteCard(col.key, card.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                          fontSize: 12, padding: '0 2px', opacity: 0.6 }}>
                        ✕
                      </button>
                    </div>
                    {card.label && (
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
                        background: labelColors[card.label]?.bg || 'var(--bg3)',
                        color: labelColors[card.label]?.color || 'var(--text3)' }}>
                        {card.label}
                      </span>
                    )}
                  </div>
                ))}

                {/* Add card form */}
                {showNewCard === col.key ? (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                    <input className="input" style={{ fontSize: 12, marginBottom: 8 }}
                      placeholder="Card title" value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCard(col.key)}
                      autoFocus />
                    <select className="input" style={{ fontSize: 12, marginBottom: 8 }}
                      value={newCardLabel} onChange={(e) => setNewCardLabel(e.target.value)}>
                      {['bug', 'feature', 'enhancement', 'question'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }}
                        onClick={() => handleAddCard(col.key)}>Add</button>
                      <button className="btn btn-sm" style={{ fontSize: 11 }}
                        onClick={() => setShowNewCard(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewCard(col.key)}
                    style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8,
                      padding: '8px 12px', color: 'var(--text3)', cursor: 'pointer', fontSize: 12,
                      width: '100%', textAlign: 'left', transition: 'all 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6e7681'; e.currentTarget.style.color = 'var(--text2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
                    + Add card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}