import { create } from 'zustand'
import { getMe } from '../api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, loading: false })
  },

  setUser: (user) => {
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, loading: false })
  },

  fetchMe: async () => {
    try {
      const { data } = await getMe()
      set({ user: data.user, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, loading: false })
    }
  }
}))

export default useAuthStore
