import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { searchCode } from '../api'

const EXAMPLE_QUERIES = [
  'Find the authentication logic',
  'Where is the database connection?',
  'Show me error handling code',
  'Find functions that handle user input',
  'Where are API routes defined?'
]

export default function SearchPage() {
  const { id } = useParams()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialQuery = params.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  
  const hasSearched = useRef(false)
  useEffect(() => {
    if (initialQuery && !hasSearched.current) {
      hasSearched.current = true
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearch = async (q) => {
    const searchQuery = q || query
    if (!searchQuery.trim()) return toast.error('Enter a search query')
    setLoading(true)
    setResults(null)
    setAnswer('')
    try {
      const { data } = await searchCode(id, searchQuery)
      setResults(data.results || [])
      setAnswer(data.answer || '')
      if (data.results?.length === 0) toast('No matching files found. Try pushing some code first.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreBar = (score) => {
    const pct = Math.round(score * 100)
    const color = pct > 70 ? 'var(--green)' : pct > 40 ? 'var(--yellow)' : 'var(--text3)'
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:60, height:4, background:'var(--bg3)', borderRadius:2 }}>
          <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:2 }}/>
        </div>
        <span style={{ fontSize:11, color:'var(--text3)' }}>{pct}%</span>
      </div>
    )
  }

  return (
    <div>
      <Navbar />

      <div style={{ borderBottom:'1px solid var(--border)', padding:'12px 24px', background:'var(--bg2)' }}>
        <div className="flex items-center gap-8 text-sm text-muted">
          <Link to={`/repo/${id}`} style={{ textDecoration:'none', color:'var(--text2)' }}>← Back to repo</Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop:40, paddingBottom:60, maxWidth:800 }}>
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:22, fontWeight:600, marginBottom:8 }}>AI Code Search</h1>
          <p className="text-muted text-sm">Search your codebase using natural language. Ask questions about what code does.</p>
        </div>

        {/* Search box */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <input
            className="input"
            style={{ flex:1, fontSize:15, padding:'10px 16px' }}
            placeholder="e.g. Find the user authentication function..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={() => handleSearch()} disabled={loading} style={{ padding:'10px 20px', whiteSpace:'nowrap' }}>
            {loading ? <span className="spinner"/> : 'Search'}
          </button>
        </div>

        {/* Example queries */}
        {!results && !loading && (
          <div>
            <p className="text-xs text-muted mb-8">Try an example:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {EXAMPLE_QUERIES.map((q) => (
                <button key={q} className="btn btn-sm" onClick={() => { setQuery(q); handleSearch(q) }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
            <span className="spinner" style={{ width:32, height:32, borderWidth:3, marginBottom:16, display:'block', margin:'0 auto 16px' }}/>
            <p>Searching across your codebase...</p>
          </div>
        )}

        {/* AI Answer */}
        {answer && !loading && (
          <div className="ai-box mt-24">
            <div className="ai-label">AI Answer</div>
            <p style={{ fontSize:14, lineHeight:1.7 }}>{answer}</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && results.length > 0 && (
          <div className="mt-16">
            <p className="text-sm text-muted mb-12">Found {results.length} matching files</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {results.map((r, i) => (
                <div key={i} className="card">
                  <div className="flex items-center justify-between mb-10">
                    <span className="code-tag">{r.filename}</span>
                    {scoreBar(r.score)}
                  </div>
                  <pre style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:120, overflow:'hidden', fontFamily:'monospace' }}>
                    {r.snippet}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {results && !loading && results.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
            <p>No results found. Make sure you have pushed files to this repository.</p>
          </div>
        )}
      </div>
    </div>
  )
}
