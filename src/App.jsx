import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AuthGuard from './guards/AuthGuard'
import { supabase } from './supabaseClient'

// A password-reset email link signs the user in with a short-lived recovery
// session. If Supabase sent them to the Site URL instead of /reset-password
// (e.g. that path isn't in the allowed Redirect URLs), still route them to
// the page where they can actually set the new password.
function PasswordRecoveryRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <PasswordRecoveryRedirect />
      <Routes>
        <Route path="/" element={<Dashboard mode="public" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/app"
          element={
            <AuthGuard>
              <Dashboard mode="app" />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
