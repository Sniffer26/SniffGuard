import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.eventListeners = new Map()
  }

  // Connect to socket server
  connect(token) {
    if (this.socket?.connected) {
      return
    }

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://sniffguard-backend.onrender.com'

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket'], // Match backend configuration
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.setupEventListeners()
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.reconnectAttempts = 0
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔗 Connected to SniffGuard server')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      if (this.reconnectAttempts > 0) {
        toast.success('Reconnected to server')
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason)
      this.isConnected = false
      
      if (reason === 'io server disconnect') {
        // Server disconnected the client, manual reconnection needed
        toast.error('Disconnected from server')
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnect, no need to show error
        console.log('Client initiated disconnect')
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      this.isConnected = false
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to server. Please refresh the page.')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
      toast.success('Reconnected to server')
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄❌ Reconnection failed:', error)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('🔄❌ Failed to reconnect after maximum attempts')
      toast.error('Connection failed. Please refresh the page.')
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error)
      toast.error(error.message || 'Connection error')
    })
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.socket?.connected || false
  }

  // Emit event to server
  emit(event, data, callback) {
    if (this.socket?.connected) {
      if (callback) {
        this.socket.emit(event, data, callback)
      } else {
        this.socket.emit(event, data)
      }
    } else {
      console.warn('Socket not connected, cannot emit:', event)
      toast.error('Not connected to server')
    }
  }

  // Listen to events from server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
      
      // Store listener for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, [])
      }
      this.eventListeners.get(event).push(callback)
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
      
      // Remove from stored listeners
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event)
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event)
      this.eventListeners.delete(event)
    }
  }

  // Chat-specific methods
  joinChat(chatId) {
    this.emit('join_chat', { chatId })
  }

  leaveChat(chatId) {
    this.emit('leave_chat', { chatId })
  }

  sendMessage(messageData) {
    this.emit('send_message', messageData)
  }

  markAsRead(chatId, messageIds = null) {
    this.emit('mark_as_read', { chatId, messageIds })
  }

  startTyping(chatId) {
    this.emit('typing_start', { chatId })
  }

  stopTyping(chatId) {
    this.emit('typing_stop', { chatId })
  }

  addReaction(messageId, emoji, chatId) {
    this.emit('add_reaction', { messageId, emoji, chatId })
  }

  removeReaction(messageId, chatId) {
    this.emit('remove_reaction', { messageId, chatId })
  }

  createDirectChat(recipientId) {
    this.emit('create_direct_chat', { recipientId })
  }

  getUserChats() {
    this.emit('get_user_chats')
  }

  getOnlineUsers() {
    this.emit('get_online_users')
  }

  // Event listeners for chat functionality
  onNewMessage(callback) {
    this.on('new_message', callback)
  }

  onMessageSent(callback) {
    this.on('message_sent', callback)
  }

  onMessagesRead(callback) {
    this.on('messages_read', callback)
  }

  onUserTyping(callback) {
    this.on('user_typing', callback)
  }

  onReactionAdded(callback) {
    this.on('reaction_added', callback)
  }

  onReactionRemoved(callback) {
    this.on('reaction_removed', callback)
  }

  onChatCreated(callback) {
    this.on('chat_created', callback)
  }

  onNewChatCreated(callback) {
    this.on('new_chat_created', callback)
  }

  onUserChats(callback) {
    this.on('user_chats', callback)
  }

  onChatMessages(callback) {
    this.on('chat_messages', callback)
  }

  onUserOnline(callback) {
    this.on('user_online', callback)
  }

  onUserOffline(callback) {
    this.on('user_offline', callback)
  }

  onOnlineUsers(callback) {
    this.on('online_users', callback)
  }

  onUserJoinedChat(callback) {
    this.on('user_joined_chat', callback)
  }

  onUserLeftChat(callback) {
    this.on('user_left_chat', callback)
  }

  // Cleanup
  cleanup() {
    // Remove all custom event listeners
    this.eventListeners.forEach((listeners, event) => {
      if (this.socket) {
        this.socket.removeAllListeners(event)
      }
    })
    this.eventListeners.clear()
  }
}

// Create singleton instance
export const socketService = new SocketService()

// Export class for testing
export { SocketService }