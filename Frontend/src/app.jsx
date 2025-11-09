import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

// Components
import Layout from '@/components/Layout/Layout.jsx'
import ProtectedRoute from '@/components/Auth/ProtectedRoute.jsx'
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx'
import InstallToast from '@/components/UI/InstallToast.jsx'

// Pages
import LoginPage from '@/pages/LoginPage.jsx'
import RegisterPage from '@/pages/RegisterPage.jsx'
import ChatPage from '@/pages/ChatPage.jsx'
import SettingsPage from '@/pages/SettingsPage.jsx'
import ProfilePage from '@/pages/ProfilePage.jsx'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { theme, initTheme } = useThemeStore()

  useEffect(() => {
    // Initialize theme
    initTheme()
    
    console.log('[App] Checking authentication...')
    // Check authentication status
    checkAuth()
  }, [initTheme, checkAuth])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Default to dark mode for Signal-like experience
    if (theme === 'dark' || !theme) {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // Auto theme - prefer dark mode
      root.classList.add('dark')
    }
  }, [theme])

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('[App] Showing loading spinner, isLoading:', isLoading)
    return (
      <div className="min-h-screen bg-dark-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400 dark:text-gray-400">
            Loading SniffGuard...
          </p>
        </div>
      </div>
    )
  }

  console.log('[App] Rendering app, isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)

  return (
    <div className="min-h-screen bg-dark-bg dark:bg-dark-bg transition-colors duration-200">
      <InstallToast />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />

        {/* Protected routes */}
        <Route 
          path="/chat/*" 
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Default redirects */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={isAuthenticated ? "/chat" : "/login"} 
              replace 
            />
          } 
        />
        
        {/* 404 fallback */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The page you're looking for doesn't exist.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </div>
  )
}

export default App