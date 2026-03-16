import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function RequireAdmin() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Checking access…</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (status === 'not-admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-200 gap-4 p-4">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-gray-400 text-center max-w-md">
          You are signed in but do not have admin access. Only users with the admin role can use this app.
        </p>
        <a href="/login" className="text-sm text-blue-400 hover:underline">Go to login</a>
      </div>
    )
  }

  return <Outlet />
}
