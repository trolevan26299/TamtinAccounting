import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminRoute from '@/components/AdminRoute'
import Login from '@/pages/Login'
import InvoiceLookup from '@/pages/invoices/InvoiceLookup'
import UserManagement from '@/pages/UserManagement'
import Unauthorized from '@/pages/Unauthorized'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<InvoiceLookup />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
