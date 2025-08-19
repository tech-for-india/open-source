import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import ChatPage from './pages/ChatPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminChatsPage from './pages/AdminChatsPage'
import AdminReportsPage from './pages/AdminReportsPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/app" /> : <LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/app" />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
            <Layout>
              <AdminUsersPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/chats" element={
          <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
            <Layout>
              <AdminChatsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/reports" element={
          <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
            <Layout>
              <AdminReportsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/app" />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
