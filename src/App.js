import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// ── Lazy-loaded pages (each page is a separate JS chunk) ──────────────────
// This means the browser only downloads code for pages the user actually visits.
const Login            = lazy(() => import('./pages/Login'))
const Register         = lazy(() => import('./pages/Register'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const NewRepo          = lazy(() => import('./pages/NewRepo'))
const Profile          = lazy(() => import('./pages/Profile'))
const RepoView         = lazy(() => import('./pages/RepoView'))      // contains heavy Monaco editor
const CommitDetail     = lazy(() => import('./pages/CommitDetail'))
const SearchPage       = lazy(() => import('./pages/SearchPage'))
const RepoSetup        = lazy(() => import('./pages/RepoSetup'))
const ExplorePage      = lazy(() => import('./pages/ExplorePage'))
const ImportRepo       = lazy(() => import('./pages/ImportRepo'))
const IssuesList       = lazy(() => import('./pages/IssuesList'))
const IssueDetail      = lazy(() => import('./pages/IssueDetail'))
const NewIssue         = lazy(() => import('./pages/NewIssue'))
const PullRequestsList = lazy(() => import('./pages/PullRequestsList'))
const PullRequestDetail= lazy(() => import('./pages/PullRequestDetail'))
const NewPullRequest   = lazy(() => import('./pages/NewPullRequest'))
const RepositoriesList = lazy(() => import('./pages/RepositoriesList'))
const Projects         = lazy(() => import('./pages/Projects'))
const DiscussionsList  = lazy(() => import('./pages/DiscussionsList'))
const DiscussionDetail = lazy(() => import('./pages/DiscussionDetail'))
const NewDiscussion    = lazy(() => import('./pages/NewDiscussion'))
const Codespaces       = lazy(() => import('./pages/Codespaces'))
const Copilot          = lazy(() => import('./pages/Copilot'))

// ── Lightweight page-loading indicator ────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 16,
      background: 'var(--bg)', color: 'var(--text2)'
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent2)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <span style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</span>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { token, loading } = useAuthStore()
  if (loading) return <PageLoader />
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const { fetchMe, token } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
    else useAuthStore.setState({ loading: false })
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private routes */}
          <Route path="/"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/new" element={<PrivateRoute><NewRepo /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><ImportRepo /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="/repositories" element={<PrivateRoute><RepositoriesList /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/codespaces" element={<PrivateRoute><Codespaces /></PrivateRoute>} />
          <Route path="/copilot" element={<PrivateRoute><Copilot /></PrivateRoute>} />

          {/* Repo routes */}
          <Route path="/repo/:id"               element={<PrivateRoute><RepoView /></PrivateRoute>} />
          <Route path="/repo/:id/setup"         element={<PrivateRoute><RepoSetup /></PrivateRoute>} />
          <Route path="/repo/:id/commit/:sha"   element={<PrivateRoute><CommitDetail /></PrivateRoute>} />
          <Route path="/repo/:id/search"        element={<PrivateRoute><SearchPage /></PrivateRoute>} />

          {/* Issues */}
          <Route path="/issues/new"                   element={<PrivateRoute><NewIssue /></PrivateRoute>} />
          <Route path="/repo/:id/issues"              element={<PrivateRoute><IssuesList /></PrivateRoute>} />
          <Route path="/repo/:id/issues/new"          element={<PrivateRoute><NewIssue /></PrivateRoute>} />
          <Route path="/repo/:id/issues/:issueId"     element={<PrivateRoute><IssueDetail /></PrivateRoute>} />

          {/* Pull Requests */}
          <Route path="/repo/:id/pulls"               element={<PrivateRoute><PullRequestsList /></PrivateRoute>} />
          <Route path="/repo/:id/pulls/new"           element={<PrivateRoute><NewPullRequest /></PrivateRoute>} />
          <Route path="/repo/:id/pulls/:pullId"       element={<PrivateRoute><PullRequestDetail /></PrivateRoute>} />

          {/* Discussions */}
          <Route path="/repo/:id/discussions"                   element={<PrivateRoute><DiscussionsList /></PrivateRoute>} />
          <Route path="/repo/:id/discussions/new"               element={<PrivateRoute><NewDiscussion /></PrivateRoute>} />
          <Route path="/repo/:id/discussions/:discussionId"     element={<PrivateRoute><DiscussionDetail /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
