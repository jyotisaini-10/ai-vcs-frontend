import axios from 'axios'

const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : 'https://ai-vcs-backend.vercel.app/api'

const api = axios.create({
  baseURL: BASE_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.patch('/auth/profile', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)

// Repos
export const getRepos = (params) => api.get('/repos', { params })
export const createRepo = (data) => api.post('/repos', data)
export const getRepo = (id) => api.get(`/repos/${id}`)
export const updateRepo = (id, data) => api.patch(`/repos/${id}`, data)
export const deleteRepo = (id) => api.delete(`/repos/${id}`)
export const getFileTree = (id, params) => api.get(`/repos/${id}/tree`, { params })
export const getFileContent = (id, filepath, branch) => api.get(`/repos/${id}/file`, { params: { filepath, branch } })

// Commits
export const pushCommit = (repoId, data) => api.post(`/repos/${repoId}/commit`, data)
export const getCommits = (repoId, params) => api.get(`/repos/${repoId}/commits`, { params })
export const getCommit = (repoId, sha) => api.get(`/repos/${repoId}/commits/${sha}`)
export const resolveConflict = (repoId, data) => api.post(`/repos/${repoId}/resolve`, data)

// Search
export const searchCode = (repoId, query) => api.post(`/repos/${repoId}/search`, { query })

// Explore (global user + repo search)
export const exploreSearch = (params) => api.get('/explore', { params })
export const getUserProfile = (username) => api.get(`/explore/user/${username}`)
export const followUser = (username) => api.post(`/explore/user/${username}/follow`)
export const unfollowUser = (username) => api.delete(`/explore/user/${username}/follow`)
export const getMyFollowers = () => api.get('/explore/me/followers')
export const getMyFollowing = () => api.get('/explore/me/following')

// Issues
export const getIssues = (repoId, params) => api.get(`/repos/${repoId}/issues`, { params })
export const createIssue = (repoId, data) => api.post(`/repos/${repoId}/issues`, data)
export const getIssue = (repoId, issueId) => api.get(`/repos/${repoId}/issues/${issueId}`)
export const updateIssue = (repoId, issueId, data) => api.patch(`/repos/${repoId}/issues/${issueId}`, data)
export const addComment = (repoId, issueId, data) => api.post(`/repos/${repoId}/issues/${issueId}/comments`, data)
export const deleteIssue = (repoId, issueId) => api.delete(`/repos/${repoId}/issues/${issueId}`)

// Pull Requests
export const getPulls = (repoId, params) => api.get(`/repos/${repoId}/pulls`, { params })
export const createPull = (repoId, data) => api.post(`/repos/${repoId}/pulls`, data)
export const getPull = (repoId, pullId) => api.get(`/repos/${repoId}/pulls/${pullId}`)
export const updatePull = (repoId, pullId, data) => api.patch(`/repos/${repoId}/pulls/${pullId}`, data)
export const addPullComment = (repoId, pullId, data) => api.post(`/repos/${repoId}/pulls/${pullId}/comments`, data)
export const deletePull = (repoId, pullId) => api.delete(`/repos/${repoId}/pulls/${pullId}`)

// Discussions
export const getDiscussions = (repoId, params) => api.get(`/repos/${repoId}/discussions`, { params })
export const createDiscussion = (repoId, data) => api.post(`/repos/${repoId}/discussions`, data)
export const getDiscussion = (repoId, id) => api.get(`/repos/${repoId}/discussions/${id}`)
export const updateDiscussion = (repoId, id, data) => api.patch(`/repos/${repoId}/discussions/${id}`, data)
export const deleteDiscussion = (repoId, id) => api.delete(`/repos/${repoId}/discussions/${id}`)
export const addReply = (repoId, discussionId, data) => api.post(`/repos/${repoId}/discussions/${discussionId}/replies`, data)
export const markAnswer = (repoId, discussionId, replyId) => api.patch(`/repos/${repoId}/discussions/${discussionId}/replies/${replyId}/answer`)
export const addDiscussionComment = (repoId, id, data) => api.post(`/repos/${repoId}/discussions/${id}/comments`, data)

export default api