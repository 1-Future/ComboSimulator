import type { Champion } from '@/types/champion'

interface ChampionCardProps {
  champion: Champion
  onClick: (champion: Champion) => void
  isSelected: boolean
}

const difficultyLabels = ['', 'Easy', 'Medium', 'Hard']
const difficultyColors = ['', 'text-green-400', 'text-yellow-400', 'text-red-400']

export function ChampionCard({ champion, onClick, isSelected }: ChampionCardProps) {
  return (
    <button
      onClick={() => onClick(champion)}
      className={`group flex flex-col items-center rounded-xl border p-3 transition-all hover:scale-105 ${
        isSelected
          ? 'border-cyan-500 bg-cyan-950/50 shadow-lg shadow-cyan-500/20'
          : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
      }`}
    >
      <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-lg bg-slate-700">
        <img
          src={champion.portrait ?? `/images/champions/${champion.thumbnail}`}
          alt={champion.name}
          className="relative z-10 h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-neutral-500">
          {champion.name[0]}
        </div>
      </div>
      <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
        {champion.name}
      </span>
      <div className="mt-1 flex items-center gap-1">
        <span className={`text-[10px] ${difficultyColors[champion.difficulty]}`}>
          {difficultyLabels[champion.difficulty]}
        </span>
        <span className="text-[10px] text-neutral-500">{champion.comboCount} combos</span>
      </div>
    </button>
  )
}
