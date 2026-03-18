import { Link } from 'react-router-dom'
import { GAMES } from '@/types/game'

export function GameSelector() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <img src="/images/logo.png?v=2" alt="" className="h-12 w-12" />
          <h1 className="text-3xl font-black text-white md:text-4xl">
            Combo<span className="text-red-500">Simulator</span>
          </h1>
        </div>
        <p className="mx-auto max-w-xl text-neutral-400">
          Practice combos with timing-graded inputs. Pick a game, pick a character, press keys to the rhythm.
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          by <a href="https://github.com/1-Future" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors">1-Future</a> — free and open source
        </p>
      </div>

      {/* Game grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* How it works */}
      <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-sm font-bold text-red-500">1</div>
            <div>
              <h3 className="text-sm font-medium text-white">Pick a game</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Choose from League, Street Fighter, Tekken, and more</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-sm font-bold text-red-500">2</div>
            <div>
              <h3 className="text-sm font-medium text-white">Choose a combo</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Browse characters and their combos with difficulty ratings</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-sm font-bold text-red-500">3</div>
            <div>
              <h3 className="text-sm font-medium text-white">Press keys to the rhythm</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Get graded on timing accuracy — Perfect, Great, Good, or Miss</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported inputs */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>
          Keyboard
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          Mouse
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
            <rect x="2" y="6" width="20" height="12" rx="4" />
          </svg>
          Controller
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          Mobile (tap)
        </span>
      </div>
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[number] }) {
  const isLive = game.status === 'live'

  const content = (
    <div
      className={`group relative overflow-hidden rounded-xl border p-5 transition-all ${
        isLive
          ? 'border-neutral-700 bg-neutral-900/80 hover:border-neutral-600 hover:bg-neutral-800/80'
          : 'border-neutral-800/50 bg-neutral-900/30 opacity-60'
      }`}
    >
      {/* Status badge */}
      {!isLive && (
        <span className="absolute right-3 top-3 rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
          Coming Soon
        </span>
      )}

      <h3 className="text-lg font-bold text-white">{game.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">{game.description}</p>

      {game.characterCount && (
        <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-600">
          <span>{game.characterCount} characters</span>
          <span>{game.comboCount} combos</span>
        </div>
      )}

      {isLive && (
        <div className="mt-3 text-xs font-medium text-red-500 transition-colors group-hover:text-red-400">
          Play now →
        </div>
      )}
    </div>
  )

  if (isLive) {
    return <Link to={`/${game.id}`}>{content}</Link>
  }
  return content
}
