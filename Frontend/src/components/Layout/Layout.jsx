import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { Link, useNavigate } from 'react-router-dom'
import { promptInstall } from '@/utils/pwa'
import { 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, isDarkMode } = useThemeStore()
  const navigate = useNavigate()
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const installBtn = document.getElementById('install-button')
    if (installBtn) {
      setShowInstallButton(true)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getThemeIcon = () => {
    if (theme === 'dark') return <MoonIcon className="h-5 w-5" />
    if (theme === 'light') return <SunIcon className="h-5 w-5" />
    return <ComputerDesktopIcon className="h-5 w-5" />
  }

  const handleInstall = async () => {
    await promptInstall()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="text-3xl mb-4">
          🛡️
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col space-y-4">
          <Link
            to="/chat"
            className="p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Chats"
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          </Link>

          <Link
            to="/profile"
            className="p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Profile"
          >
            <UserCircleIcon className="h-6 w-6" />
          </Link>

          <Link
            to="/settings"
            className="p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </Link>
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col space-y-4">
          {/* Install PWA Button */}
          {showInstallButton && (
            <button
              id="install-button"
              onClick={handleInstall}
              className="p-3 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Install App"
              style={{ display: 'none' }}
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={`Theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>

          <button
            onClick={handleLogout}
            className="p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}

export default Layout
