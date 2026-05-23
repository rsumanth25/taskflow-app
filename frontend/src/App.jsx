import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './AuthContext'
import { LoginPage, SignupPage } from './AuthPages'
import Layout from './Layout'
import Dashboard from './Dashboard'
import { NewProjectPage } from './Projects'
import ProjectPage from './ProjectPage'
import MyTasksPage from './MyTasks'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg3)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: 'var(--bg3)' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: 'var(--bg3)' } },
          }}
        />
        <Routes>
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/my-tasks" element={<PrivateRoute><Layout><MyTasksPage /></Layout></PrivateRoute>} />
          <Route path="/projects/new" element={<PrivateRoute><Layout><NewProjectPage /></Layout></PrivateRoute>} />
          <Route path="/projects/:projectId" element={<PrivateRoute><Layout><ProjectPage /></Layout></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
