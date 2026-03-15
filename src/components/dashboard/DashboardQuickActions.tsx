import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { QuickActionConfig } from './types'

export interface DashboardQuickActionsProps {
  actions: QuickActionConfig[]
}

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.path} to={action.path}>
              <Button className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white">
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
