import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const { user, isLoading, login, logout } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  if (isLoading) return null

  if (!user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Login
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-800"
      >
        <img src={user.avatar} alt={user.username} className="h-6 w-6 rounded-full" />
        <span className="text-xs text-slate-300">{user.username}</span>
        {user.role === 'admin' && (
          <span className="rounded bg-cyan-600/30 px-1 py-0.5 text-[9px] font-medium text-cyan-400">
            admin
          </span>
        )}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
            <div className="border-b border-slate-700 px-3 py-2">
              <div className="text-xs font-medium text-white">{user.username}</div>
              <div className="text-[10px] text-slate-400">{user.role}</div>
            </div>
            <button
              onClick={() => { logout(); setShowMenu(false) }}
              className="block w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
