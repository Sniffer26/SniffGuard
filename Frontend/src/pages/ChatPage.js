import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

const ChatPage = () => {
  const { user } = useAuthStore()

  return (
    <div className="h-screen flex">
      {/* Chat list sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.displayName || user?.username}
            </p>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No conversations yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start a new chat to begin messaging
                </p>
              </div>
            </div>
          </div>

          {/* New chat button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to SniffGuard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a chat to start messaging securely
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
