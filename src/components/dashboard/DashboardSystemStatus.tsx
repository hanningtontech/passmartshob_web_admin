import type { SystemStatusItem } from './types'

export interface DashboardSystemStatusProps {
  items: SystemStatusItem[]
}

export function DashboardSystemStatus({ items }: DashboardSystemStatusProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-gray-400">{item.name}</span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-400">{item.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
