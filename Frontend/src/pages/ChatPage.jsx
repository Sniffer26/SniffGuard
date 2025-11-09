import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EllipsisVerticalIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const ChatPage = () => {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)

  // Demo chats (will be replaced with real data)
  const demoChats = []

  return (
    <div className="h-screen flex overflow-hidden bg-dark-bg dark:bg-dark-bg">
      {/* ========== SIDEBAR: Chat List ========== */}
      <div className="w-[360px] flex flex-col bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border">
        {/* Header with search */}
        <div className="p-3 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Chats
            </h1>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 bg-primary-500 hover:bg-primary-600 rounded-full transition-colors">
                <PlusIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-dark-elevated border-0 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence>
            {demoChats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full px-6 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  No chats yet
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
                  Start a secure conversation
                </p>
                <button className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-full font-medium transition-colors shadow-md hover:shadow-lg">
                  New Chat
                </button>
              </motion.div>
            ) : (
              <div className="space-y-1 px-2">
                {/* Chat items will go here */}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========== MAIN: Chat Area ========== */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-bg min-w-0">
        {selectedChat ? (
          // Active chat
          <>
            {/* Chat Header */}
            <div className="h-14 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">U</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-surface rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-white">User Name</h2>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    Online
                  </p>
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {/* Messages will go here */}
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                  <PaperClipIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message..."
                    rows={1}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-elevated border-0 rounded-xl resize-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-all max-h-24"
                  />
                  <button className="absolute right-2 bottom-2 p-1 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors">
                    <FaceSmileIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                {messageInput.trim() ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-2.5 bg-primary-500 hover:bg-primary-600 rounded-full transition-colors shadow-md">
                    <PaperAirplaneIcon className="h-4 w-4 text-white" />
                  </motion.button>
                ) : (
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                    <MicrophoneIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
              {/* Encryption indicator */}
              <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                <LockClosedIcon className="h-3 w-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center p-6 min-h-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-sm"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
                <ShieldCheckIcon className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to SniffGuard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Secure messaging platform
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                Select a chat or start a conversation
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border">
                  <LockClosedIcon className="h-5 w-5 text-primary-500 mb-1" />
                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-0.5">E2E Encrypted</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Military-grade</p>
                </div>
                <div className="p-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border">
                  <ShieldCheckIcon className="h-5 w-5 text-primary-500 mb-1" />
                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-0.5">Privacy First</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">No tracking</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
