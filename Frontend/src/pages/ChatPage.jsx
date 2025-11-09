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
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-dark-bg">
      {/* ========== SIDEBAR: Chat List ========== */}
      <div className="w-[340px] flex flex-col bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border">
        {/* Header */}
        <div className="h-[60px] px-5 flex items-center justify-between flex-shrink-0 border-b border-gray-100 dark:border-dark-border">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Signal
          </h1>
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              onClick={handleCreateSelfChat}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {demoChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 bg-signal-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                No messages yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start a conversation
              </p>
            </div>
          ) : (
            <div>
              {/* Chat items will go here */}
            </div>
          )}
        </div>
      </div>

      {/* ========== MAIN: Chat Area ========== */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg min-w-0">
        {selectedChat ? (
          // Active chat
          <>
            {/* Chat Header */}
            <div className="h-[60px] bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-signal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">U</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-surface rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-base text-gray-900 dark:text-white">User Name</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tap for more info
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 min-h-0">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-xs">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center mb-3 mx-auto">
                      <LockClosedIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your chats are secured with end-to-end encryption</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Tap to learn more</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender?.id === user?.id
                    const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id
                    
                    return (
                      <div
                        key={msg._id || msg.clientMessageId}
                        className={`flex gap-2 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isOwn && (
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            ) : (
                              <div className="w-9" />
                            )}
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                            isOwn
                              ? 'bg-signal-500 text-white rounded-tr-sm'
                              : 'bg-gray-100 dark:bg-dark-elevated text-gray-900 dark:text-white rounded-tl-sm'
                          }`}
                        >
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-medium mb-1 opacity-80">
                              {msg.sender?.username || 'Unknown'}
                            </p>
                          )}
                          <p className="text-[15px] leading-[1.4] break-words">
                            {msg.content || '(encrypted message)'}
                          </p>
                          <div className={`flex items-center gap-1 mt-1 text-[11px] ${
                            isOwn ? 'text-white/80 justify-end' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border px-5 py-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-dark-elevated rounded-3xl px-4 py-2">
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
                    className="flex-1 bg-transparent border-0 resize-none text-[15px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none max-h-32"
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                  />
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-hover rounded-lg transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {messageInput.trim() ? (
                  <button
                    className="p-3 bg-signal-500 hover:bg-signal-600 rounded-full transition-all flex-shrink-0"
                    onClick={handleSendMessage}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                ) : (
                  <button className="p-3 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-full transition-colors flex-shrink-0">
                    <MicrophoneIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center p-6 min-h-0">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-signal-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Send private messages
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                to friends and family
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Select a chat to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
