import { DashboardStatCard } from './DashboardStatCard'
import type { StatCardConfig } from './types'
import type { DashboardStats } from './types'

export interface DashboardStatsProps {
  cards: StatCardConfig[]
  stats: DashboardStats
  loading: boolean
}

export function DashboardStatsSection({ cards, stats, loading }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <DashboardStatCard
          key={card.key}
          config={card}
          stats={stats}
          loading={loading}
        />
      ))}
    </div>
  )
}
