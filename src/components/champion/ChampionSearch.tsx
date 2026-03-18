import { useComboStore } from '@/stores/comboStore'
import type { ChampionRole } from '@/types/champion'

const roles: ChampionRole[] = ['fighter', 'assassin', 'mage', 'marksman', 'tank', 'support']

export function ChampionSearch() {
  const searchQuery = useComboStore((s) => s.searchQuery)
  const roleFilter = useComboStore((s) => s.roleFilter)
  const difficultyFilter = useComboStore((s) => s.difficultyFilter)
  const setSearchQuery = useComboStore((s) => s.setSearchQuery)
  const setRoleFilter = useComboStore((s) => s.setRoleFilter)
  const setDifficultyFilter = useComboStore((s) => s.setDifficultyFilter)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search champions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <select
        value={roleFilter ?? ''}
        onChange={(e) => setRoleFilter(e.target.value || null)}
        className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
      >
        <option value="">All Roles</option>
        {roles.map((role) => (
          <option key={role} value={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={difficultyFilter ?? ''}
        onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : null)}
        className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
      >
        <option value="">All Difficulties</option>
        <option value="1">Easy</option>
        <option value="2">Medium</option>
        <option value="3">Hard</option>
      </select>
    </div>
  )
}
