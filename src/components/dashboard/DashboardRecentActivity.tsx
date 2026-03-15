import type { RecentActivityItem } from './types'

export interface DashboardRecentActivityProps {
  items: RecentActivityItem[]
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between ${i < items.length - 1 ? 'pb-4 border-b border-gray-700' : ''}`}
          >
            <div>
              <p className="text-white font-medium">{item.title}</p>
              <p className="text-sm text-gray-400">{item.time}</p>
            </div>
            <span className="text-sm text-gray-500">{item.by}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
