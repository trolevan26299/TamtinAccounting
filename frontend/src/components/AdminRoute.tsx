import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { sysUser } = useAuth()
  if (!sysUser) return <Navigate to="/login" replace />
  if (sysUser.role !== 'admin') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
