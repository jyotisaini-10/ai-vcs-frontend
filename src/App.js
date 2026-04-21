import Copilot from './pages/Copilot'
import Codespaces from './pages/Codespaces'
import DiscussionsList from './pages/DiscussionsList'
import DiscussionDetail from './pages/DiscussionDetail'
import NewDiscussion from './pages/NewDiscussion'
import Projects from './pages/Projects'
import RepositoriesList from './pages/RepositoriesList'
import PullRequestsList from './pages/PullRequestsList'
import PullRequestDetail from './pages/PullRequestDetail'
import NewPullRequest from './pages/NewPullRequest'
import IssuesList from './pages/IssuesList'
import IssueDetail from './pages/IssueDetail'
import NewIssue from './pages/NewIssue'
import ImportRepo from './pages/ImportRepo'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RepoView from './pages/RepoView'
import CommitDetail from './pages/CommitDetail'
import SearchPage from './pages/SearchPage'
import NewRepo from './pages/NewRepo'
import RepoSetup from './pages/RepoSetup'
import Profile from './pages/Profile'
import ExplorePage from './pages/ExplorePage'

function PrivateRoute({ children }) {
  const { token, loading } = useAuthStore()
  if (loading) return <div className="loading-screen">Loading...</div>
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/new" element={<PrivateRoute><NewRepo /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/repo/:id/issues" element={<PrivateRoute><IssuesList /></PrivateRoute>} />
        <Route path="/repo/:id/issues/new" element={<PrivateRoute><NewIssue /></PrivateRoute>} />
        <Route path="/repo/:id/issues/:issueId" element={<PrivateRoute><IssueDetail /></PrivateRoute>} />
        <Route path="/issues/new" element={<PrivateRoute><NewIssue /></PrivateRoute>} />
        <Route path="/repo/:id/pulls" element={<PrivateRoute><PullRequestsList /></PrivateRoute>} />
        <Route path="/repo/:id/pulls/new" element={<PrivateRoute><NewPullRequest /></PrivateRoute>} />
        <Route path="/repo/:id/pulls/:pullId" element={<PrivateRoute><PullRequestDetail /></PrivateRoute>} />
        <Route path="/repositories" element={<PrivateRoute><RepositoriesList /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/repo/:id/discussions" element={<PrivateRoute><DiscussionsList /></PrivateRoute>} />
        <Route path="/repo/:id/discussions/new" element={<PrivateRoute><NewDiscussion /></PrivateRoute>} />
        <Route path="/repo/:id/discussions/:discussionId" element={<PrivateRoute><DiscussionDetail /></PrivateRoute>} />
        <Route path="/import" element={<PrivateRoute><ImportRepo /></PrivateRoute>} />
        <Route path="/repo/:id/setup" element={<PrivateRoute><RepoSetup /></PrivateRoute>} />
        <Route path="/repo/:id" element={<PrivateRoute><RepoView /></PrivateRoute>} />
        <Route path="/codespaces" element={<PrivateRoute><Codespaces /></PrivateRoute>} />
        <Route path="/copilot" element={<PrivateRoute><Copilot /></PrivateRoute>} />
        <Route path="/repo/:id/commit/:sha" element={<PrivateRoute><CommitDetail /></PrivateRoute>} />
        <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
        <Route path="/repo/:id/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
