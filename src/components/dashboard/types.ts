import type { ComponentType } from 'react'

/** Dashboard stats from Firebase / API */
export interface DashboardStats {
  totalCategories: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

/** Config for a single stat card */
export interface StatCardConfig {
  label: string
  key: keyof DashboardStats
  icon: ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  format?: (value: number) => string
}

/** Quick action link */
export interface QuickActionConfig {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}

/** System status row */
export interface SystemStatusItem {
  name: string
  status: string
  statusColor?: string
}

/** Recent activity entry */
export interface RecentActivityItem {
  title: string
  time: string
  by: string
}
