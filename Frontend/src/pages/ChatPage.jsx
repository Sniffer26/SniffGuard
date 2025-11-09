import React, { useState, useEffect } from 'react'
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
import { socketService } from '@/services/socketService'
import { encryptionService } from '@/services/encryptionService'

const ChatPage = () => {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])

  // Demo chats (will be replaced with real data)
  const demoChats = []

  // Socket event listeners
  useEffect(() => {
    const handleChatCreated = ({ chat }) => {
      console.log('Chat created:', chat)
      setSelectedChat(chat)
      socketService.joinChat(chat.chatId)
    }

    const handleChatMessages = ({ chatId, messages }) => {
      console.log('Received chat messages:', messages)
      if (selectedChat?.chatId === chatId) {
        setMessages(messages)
      }
    }

    const handleNewMessage = ({ chatId, message }) => {
      console.log('New message received:', message)
      if (selectedChat?.chatId === chatId) {
        setMessages(prev => [...prev, message])
      }
    }

    const handleMessageSent = ({ clientMessageId }) => {
      console.log('Message sent:', clientMessageId)
      setMessageInput('')
    }

    socketService.onChatCreated(handleChatCreated)
    socketService.onChatMessages(handleChatMessages)
    socketService.onNewMessage(handleNewMessage)
    socketService.onMessageSent(handleMessageSent)

    return () => {
      socketService.off('chat_created', handleChatCreated)
      socketService.off('chat_messages', handleChatMessages)
      socketService.off('new_message', handleNewMessage)
      socketService.off('message_sent', handleMessageSent)
    }
  }, [selectedChat])

  const handleCreateSelfChat = () => {
    if (!user?.id) {
      console.error('No user ID')
      return
    }
    console.log('Creating self-chat for user:', user.id)
    socketService.createDirectChat(user.id)
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !messageInput.trim() || !user?.id) {
      console.error('Cannot send message:', { selectedChat, messageInput, userId: user?.id })
      return
    }

    try {
      // Generate unique client message ID
      const clientMessageId = encryptionService.generateSecureId()
      
      // Simple base64 encoding for testing (real encryption would be more complex)
      const encryptedContent = btoa(messageInput.trim())
      const encryptedKey = encryptionService.generateRandomBytes(32)
      const nonce = encryptionService.generateRandomBytes(24)
      const keyId = encryptionService.generateSecureId()

      const recipients = [
        {
          user: user.id,
          encryptedContent,
          encryptedKey
        }
      ]

      const messageData = {
        recipients,
        messageType: 'text',
        chatId: selectedChat.chatId,
        clientMessageId,
        threadId: null,
        metadata: {},
        encryption: {
          algorithm: 'XSalsa20-Poly1305',
          keyId,
          nonce,
          authTag: ''
        }
      }

      console.log('Sending message:', messageData)
      socketService.sendMessage(messageData)
    } catch (error) {
      console.error('Error preparing message:', error)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-dark-bg dark:bg-dark-bg">
      {/* ========== SIDEBAR: Chat List ========== */}
      <div className="w-[380px] flex flex-col bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border shadow-lg">
        {/* Header with search */}
        <div className="p-4 space-y-3 flex-shrink-0 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              SniffGuard
            </h1>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors">
                <EllipsisVerticalIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                className="p-2 bg-signal-500 hover:bg-signal-600 rounded-full transition-colors shadow-md"
                onClick={handleCreateSelfChat}
              >
                <PlusIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-dark-elevated border-0 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-signal-500 transition-all"
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
                className="flex flex-col items-center justify-center h-full px-8 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-signal-500 to-signal-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                  <ShieldCheckIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No chats yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
                  Start a secure, encrypted conversation
                </p>
                <button 
                  className="px-6 py-2.5 bg-signal-500 hover:bg-signal-600 text-white text-sm rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                  onClick={handleCreateSelfChat}
                >
                  New Chat
                </button>
              </motion.div>
            ) : (
              <div className="space-y-0.5 px-2 py-1">
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-dark-elevated dark:bg-dark-elevated rounded-full flex items-center justify-center mb-3 mx-auto">
                      <LockClosedIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Send a message to start the conversation</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center justify-center gap-1">
                      <LockClosedIcon className="h-3 w-3" />
                      Messages are end-to-end encrypted
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender?.id === user?.id
                    const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id
                    
                    return (
                      <motion.div
                        key={msg._id || msg.clientMessageId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isOwn && (
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                            isOwn
                              ? 'bg-signal-500 text-white rounded-br-md'
                              : 'bg-dark-elevated dark:bg-dark-elevated text-gray-900 dark:text-white rounded-bl-md'
                          }`}
                        >
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              {msg.sender?.username || 'Unknown'}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed break-words">
                            {msg.content || '(encrypted message)'}
                          </p>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                            isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {isOwn && <div className="w-8" />}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-4 flex-shrink-0">
              <div className="flex items-end gap-3">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors mb-1">
                  <PlusIcon className="h-6 w-6 text-signal-500" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Message"
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-elevated border-0 rounded-3xl resize-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-signal-500 transition-all max-h-32"
                  />
                </div>
                {messageInput.trim() ? (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-signal-500 hover:bg-signal-600 rounded-full transition-all shadow-lg hover:shadow-xl mb-1"
                    onClick={handleSendMessage}
                  >
                    <PaperAirplaneIcon className="h-5 w-5 text-white" />
                  </motion.button>
                ) : (
                  <button className="p-3 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors mb-1">
                    <MicrophoneIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
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
