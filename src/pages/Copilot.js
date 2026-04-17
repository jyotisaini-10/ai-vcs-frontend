import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'
import { getRepos } from '../api'
import useAuthStore from '../store/authStore'
import Groq from 'groq-sdk'

const SUGGESTIONS = [
    'Explain how my code works',
    'Find bugs in my repository',
    'How do I improve code performance?',
    'Write a README for my project',
    'Suggest best practices for my code',
    'How do I write unit tests?',
    'Explain the commit history',
    'Help me resolve merge conflicts',
]

const SYSTEM_PROMPT = `You are AI-VCS Copilot, an intelligent coding assistant built into AI-VCS (an AI-powered version control system). You help developers with:
- Code review and bug detection
- Writing and improving code
- Explaining code logic
- Git and version control best practices
- Project architecture advice
- Writing documentation and READMEs
- Debugging and problem solving

Be concise, helpful, and use code blocks when showing code. Format responses with markdown.`

export default function Copilot() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi ${user?.username || 'there'}! I'm your AI-VCS Copilot. I can help you with code review, debugging, writing documentation, and much more. What would you like help with today?`,
            id: Date.now()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [repos, setRepos] = useState([])
    const [selectedRepo, setSelectedRepo] = useState('')
    const [conversationHistory, setConversationHistory] = useState([])
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        getRepos().then(({ data }) => setRepos(data.repos)).catch(() => { })
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text) => {
        const messageText = text || input.trim()
        if (!messageText) return

        const userMessage = { role: 'user', content: messageText, id: Date.now() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setLoading(true)

        const repoContext = selectedRepo
            ? `\n\nUser is working on repository: ${repos.find(r => r._id === selectedRepo)?.name || ''}`
            : ''

        const history = [
            ...conversationHistory,
            { role: 'user', content: messageText + repoContext }
        ]

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY || ''}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    max_tokens: 1500,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...history
                    ]
                })
            })

            const data = await response.json()
            const assistantContent = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

            const assistantMessage = { role: 'assistant', content: assistantContent, id: Date.now() }
            setMessages([...updatedMessages, assistantMessage])
            setConversationHistory([...history, { role: 'assistant', content: assistantContent }])
        } catch (err) {
            toast.error('Failed to get response. Check your GROQ_API_KEY.')
            const errorMsg = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: Date.now() }
            setMessages([...updatedMessages, errorMsg])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `Chat cleared! How can I help you, ${user?.username}?`,
            id: Date.now()
        }])
        setConversationHistory([])
        toast.success('Chat cleared')
    }

    const copyMessage = (content) => {
        navigator.clipboard.writeText(content)
        toast.success('Copied!')
    }

    const formatMessage = (content) => {
        const parts = content.split(/(```[\s\S]*?```)/g)
        return parts.map((part, i) => {
            if (part.startsWith('```')) {
                const lines = part.split('\n')
                const lang = lines[0].replace('```', '').trim()
                const code = lines.slice(1, -1).join('\n')
                return (
                    <div key={i} style={{ position: 'relative', marginTop: 10, marginBottom: 10 }}>
                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                            {lang && (
                                <div style={{
                                    padding: '4px 12px', background: 'var(--bg3)', fontSize: 11,
                                    color: 'var(--text3)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between'
                                }}>
                                    <span>{lang}</span>
                                    <button onClick={() => copyMessage(code)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}>
                                        Copy
                                    </button>
                                </div>
                            )}
                            <pre style={{
                                margin: 0, padding: '12px', fontSize: 12, overflowX: 'auto',
                                fontFamily: 'monospace', lineHeight: 1.6, color: 'var(--text)'
                            }}>
                                {code}
                            </pre>
                        </div>
                    </div>
                )
            }

            // Format bold, inline code
            const formatted = part
                .split(/(`[^`]+`)/g)
                .map((p, j) => {
                    if (p.startsWith('`') && p.endsWith('`')) {
                        return <code key={j} style={{
                            background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4,
                            fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--accent2)'
                        }}>{p.slice(1, -1)}</code>
                    }
                    return p.split('\n').map((line, k) => (
                        <span key={k}>
                            {line.split(/(\*\*[^*]+\*\*)/g).map((seg, l) => {
                                if (seg.startsWith('**') && seg.endsWith('**')) {
                                    return <strong key={l}>{seg.slice(2, -2)}</strong>
                                }
                                return seg
                            })}
                            {k < p.split('\n').length - 1 && <br />}
                        </span>
                    ))
                })
            return <span key={i}>{formatted}</span>
        })
    }

    return (
        <div>
            <Navbar />
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: 'calc(100vh - 56px)' }}>

                {/* Left sidebar */}
                <div style={{
                    background: 'var(--bg2)', borderRight: '1px solid var(--border)',
                    padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto'
                }}>

                    {/* Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                            }}>
                                ✨
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>AI Copilot</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                            Your AI coding assistant
                        </p>
                    </div>

                    {/* Repo context */}
                    <div>
                        <label className="label" style={{ marginBottom: 6 }}>Repository context</label>
                        <select className="input" style={{ fontSize: 12 }}
                            value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                            <option value="">No repository selected</option>
                            {repos.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                            Select a repo for context-aware answers
                        </p>
                    </div>

                    {/* Quick actions */}
                    <div>
                        <p style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase',
                            letterSpacing: '0.5px', marginBottom: 8
                        }}>Quick prompts</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {SUGGESTIONS.map((s) => (
                                <button key={s} onClick={() => sendMessage(s)}
                                    style={{
                                        padding: '7px 10px', borderRadius: 6, border: 'none',
                                        background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
                                        fontSize: 12, textAlign: 'left', lineHeight: 1.4, transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 'auto' }}>
                        <button className="btn btn-sm w-full" onClick={clearChat}
                            style={{ justifyContent: 'center', fontSize: 12 }}>
                            Clear conversation
                        </button>
                    </div>
                </div>

                {/* Main chat */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                    {/* Chat header */}
                    <div style={{
                        padding: '12px 20px', borderBottom: '1px solid var(--border)',
                        background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 16
                        }}>
                            ✨
                        </div>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>AI-VCS Copilot</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                                Powered by Llama 3.3 · {messages.length - 1} messages
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            {selectedRepo && (
                                <span style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                    background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                                    border: '1px solid rgba(124,58,237,0.3)'
                                }}>
                                    {repos.find(r => r._id === selectedRepo)?.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{
                                marginBottom: 20,
                                display: 'flex', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}>

                                {/* Avatar */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: msg.role === 'user' ? 'var(--accent)' : 'rgba(124,58,237,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: msg.role === 'user' ? 13 : 16, fontWeight: 600, color: '#fff'
                                }}>
                                    {msg.role === 'user' ? user?.username?.[0]?.toUpperCase() : '✨'}
                                </div>

                                {/* Bubble */}
                                <div style={{ maxWidth: '75%' }}>
                                    <div style={{
                                        fontSize: 11, color: 'var(--text3)', marginBottom: 4,
                                        textAlign: msg.role === 'user' ? 'right' : 'left'
                                    }}>
                                        {msg.role === 'user' ? user?.username : 'AI Copilot'}
                                    </div>
                                    <div style={{
                                        padding: '12px 16px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg2)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                        fontSize: 14, lineHeight: 1.7,
                                        color: msg.role === 'user' ? '#fff' : 'var(--text)'
                                    }}>
                                        {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <button onClick={() => copyMessage(msg.content)}
                                            style={{
                                                marginTop: 4, background: 'none', border: 'none', color: 'var(--text3)',
                                                cursor: 'pointer', fontSize: 11, padding: '2px 0'
                                            }}>
                                            Copy response
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,58,237,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                                }}>✨</div>
                                <div style={{
                                    padding: '12px 16px', borderRadius: '4px 12px 12px 12px',
                                    background: 'var(--bg2)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <textarea
                                ref={inputRef}
                                className="input"
                                style={{ flex: 1, minHeight: 44, maxHeight: 120, resize: 'none', fontSize: 14, paddingTop: 10 }}
                                placeholder="Ask Copilot anything about your code..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                            />
                            <button className="btn btn-primary" onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                style={{ padding: '10px 16px', flexShrink: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M14 8L2 2l3 6-3 6 12-6z" stroke="currentColor" strokeWidth="1.4"
                                        strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            </button>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                            Press Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}