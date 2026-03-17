import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { UserMenu } from './UserMenu'

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3 md:h-14 md:px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-xs font-bold md:h-8 md:w-8 md:text-sm">
              CS
            </div>
            <span className="hidden text-lg font-bold text-white sm:inline">ComboSimulator</span>
            <span className="text-sm font-bold text-white sm:hidden">ComboSim</span>
          </Link>

          <nav className="flex items-center gap-0.5">
            <Link
              to="/"
              className={`rounded-lg px-2 py-1 text-xs transition-colors md:px-3 md:py-1.5 md:text-sm ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Champions
            </Link>
            <Link
              to="/editor"
              className={`rounded-lg px-2 py-1 text-xs transition-colors md:px-3 md:py-1.5 md:text-sm ${
                location.pathname === '/editor'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Editor
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:ml-2 md:p-2"
              aria-label="Settings"
            >
              <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <UserMenu />
          </nav>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
