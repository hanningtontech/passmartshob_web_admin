import type { StatCardConfig } from './types'
import type { DashboardStats } from './types'
import { Skeleton } from '@/components/ui/skeleton'

export interface DashboardStatCardProps {
  config: StatCardConfig
  stats: DashboardStats
  loading: boolean
}

export function DashboardStatCard({ config, stats, loading }: DashboardStatCardProps) {
  const Icon = config.icon
  const value = config.format ? config.format(stats[config.key]) : String(stats[config.key])

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{config.label}</h3>
        <div className={`${config.iconBg} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-gray-700" />
      ) : (
        <p className="text-3xl font-bold text-white">{value}</p>
      )}
    </div>
  )
}
