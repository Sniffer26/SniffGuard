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
    <div className="h-screen flex bg-dark-bg dark:bg-dark-bg">
      {/* ========== SIDEBAR: Chat List ========== */}
      <div className="w-[420px] flex flex-col bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border">
        {/* Header with search */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chats
            </h1>
            <div className="flex items-center gap-2">
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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-elevated border-0 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {demoChats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full px-8 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <ShieldCheckIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Your chats are empty
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
                  Start a new secure conversation with end-to-end encryption
                </p>
                <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors shadow-md hover:shadow-lg">
                  Start New Chat
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
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-bg">
        {selectedChat ? (
          // Active chat
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">U</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-surface rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">User Name</h2>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Messages will go here */}
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-4">
              <div className="flex items-end gap-3">
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                  <PaperClipIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-elevated border-0 rounded-2xl resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-all max-h-32"
                  />
                  <button className="absolute right-3 bottom-3 p-1.5 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-full transition-colors">
                    <FaceSmileIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                {messageInput.trim() ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full transition-colors shadow-md hover:shadow-lg"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 text-white" />
                  </motion.button>
                ) : (
                  <button className="p-3 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                    <MicrophoneIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
              {/* Encryption indicator */}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <LockClosedIcon className="h-3 w-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md px-8"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl">
                <ShieldCheckIcon className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to SniffGuard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                The most secure messaging platform
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Select a chat or start a new conversation
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                <div className="p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border">
                  <LockClosedIcon className="h-6 w-6 text-primary-500 mb-2" />
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">E2E Encrypted</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Military-grade encryption</p>
                </div>
                <div className="p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-500 mb-2" />
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Privacy First</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">No data collection</p>
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
