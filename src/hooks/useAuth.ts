import { useCallback, useEffect, useState } from 'react'
import { auth, onAuthStateChanged, getIdTokenResult, type User } from '../firebase'

export type AdminState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'not-admin'; user: User }
  | { status: 'admin'; user: User }

export function useAuth() {
  const [state, setState] = useState<AdminState>({ status: 'loading' })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'unauthenticated' })
        return
      }
      const token = await getIdTokenResult(user)
      const role = (token.claims as Record<string, unknown>)?.role
      if (role === 'admin') {
        setState({ status: 'admin', user })
      } else {
        setState({ status: 'not-admin', user })
      }
    })
    return () => unsub()
  }, [])

  const logout = useCallback(async () => {
    await auth.signOut()
  }, [])

  const user =
    state.status === 'admin' || state.status === 'not-admin'
      ? { name: state.user.displayName ?? state.user.email ?? 'User', email: state.user.email ?? '' }
      : null

  return { ...state, user, logout }
}

