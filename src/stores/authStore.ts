import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: localStorage.getItem('combosim-token'),
  isLoading: true,

  login: () => {
    window.location.href = '/auth/github'
  },

  logout: () => {
    localStorage.removeItem('combosim-token')
    set({ user: null, token: null })
  },

  checkAuth: async () => {
    // Check for token in URL (from OAuth redirect)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('combosim-token', urlToken)
      set({ token: urlToken })
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    const token = urlToken ?? localStorage.getItem('combosim-token')
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const res = await fetch('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const user: User = await res.json()
        set({ user, token, isLoading: false })
      } else {
        localStorage.removeItem('combosim-token')
        set({ user: null, token: null, isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
