import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

interface FightingCharacter {
  id: string
  name: string
  comboCount: number
}

interface GameIndex {
  id: string
  name: string
  characters: FightingCharacter[]
  totalCombos: number
  totalCharacters: number
}

export function FightingCharacterBrowser() {
  const { gameId } = useParams()
  const [gameIndex, setGameIndex] = useState<GameIndex | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!gameId) return
    fetch(`/data/fighting/${gameId}/index.json`)
      .then((r) => r.json())
      .then(setGameIndex)
      .catch(() => setGameIndex(null))
  }, [gameId])

  if (!gameIndex) {
    return (
      <div className="flex h-96 items-center justify-center text-neutral-500">
        Loading...
      </div>
    )
  }

  const filtered = gameIndex.characters.filter(
    (c) => c.comboCount > 0 && c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <Link to="/" className="text-xs text-neutral-500 hover:text-white">
          ← All Games
        </Link>
        <h1 className="mt-2 text-2xl font-black text-white">{gameIndex.name}</h1>
        <p className="text-sm text-neutral-400">
          {gameIndex.totalCharacters} characters, {gameIndex.totalCombos} combos — timing from Dustloop frame data
        </p>
      </div>

      <input
        type="text"
        placeholder="Search characters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((char) => (
          <Link
            key={char.id}
            to={`/${gameId}/${char.id}`}
            className="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all hover:border-neutral-600 hover:bg-neutral-800/50"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-lg font-bold text-neutral-400 group-hover:text-white">
              {char.name[0]}
            </div>
            <h3 className="text-sm font-medium text-white">{char.name}</h3>
            <p className="mt-0.5 text-[10px] text-neutral-500">{char.comboCount} combos</p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-neutral-500">No characters match.</div>
      )}
    </div>
  )
}
