const Message = require('../models/message');
const Chat = require('../models/chat');
const User = require('../models/user');

// Store active users and their socket connections
const activeUsers = new Map();
const userSockets = new Map();

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const socketHandler = (io, socket) => {
  const userId = socket.userId;
  const username = socket.username;

  // Store user connection
  activeUsers.set(userId, {
    socketId: socket.id,
    username: username,
    connectedAt: new Date(),
    isOnline: true
  });

  // Store socket reference
  userSockets.set(socket.id, userId);

  console.log(`👤 User ${username} (${userId}) connected`);

  // Notify user is online
  socket.broadcast.emit('user_online', {
    userId: userId,
    username: username,
    timestamp: new Date()
  });

  // Send user their active chats
  socket.on('get_user_chats', async () => {
    try {
      const chats = await Chat.findUserChats(userId);
      socket.emit('user_chats', { chats });
    } catch (error) {
      console.error('Error fetching user chats:', error);
      socket.emit('error', { 
        message: 'Failed to fetch chats',
        code: 'FETCH_CHATS_ERROR'
      });
    }
  });

  // Join chat room
  socket.on('join_chat', async (data) => {
    try {
      const { chatId } = data;
      
      if (!chatId || typeof chatId !== 'string') {
        socket.emit('error', {
          message: 'Invalid chat ID format',
          code: 'INVALID_CHAT_ID'
        });
        return;
      }
      
      // Verify user is participant in this chat
      const chat = await Chat.findOne({ chatId: chatId });
      
      if (!chat || !chat.isParticipant(userId)) {
        socket.emit('error', {
          message: 'You are not a participant in this chat',
          code: 'CHAT_ACCESS_DENIED'
        });
        return;
      }

      // Join the chat room
      socket.join(chatId);
      console.log(`📨 User ${username} joined chat: ${chatId}`);

      // Send recent messages
      const messages = await Message.getChatMessages(chatId, 1, 50);
      socket.emit('chat_messages', {
        chatId: chatId,
        messages: messages
      });

      // Mark messages as delivered for this user
      await Message.updateMany(
        {
          chatId: chatId,
          'recipients.user': userId,
          'recipients.deliveredAt': null
        },
        {
          $set: { 'recipients.$.deliveredAt': new Date() }
        }
      );

      // Notify other participants that user joined
      socket.to(chatId).emit('user_joined_chat', {
        chatId: chatId,
        userId: userId,
        username: username,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', {
        message: 'Failed to join chat',
        code: 'JOIN_CHAT_ERROR'
      });
    }
  });

  // Leave chat room
  socket.on('leave_chat', (data) => {
    const { chatId } = data;
    socket.leave(chatId);
    console.log(`📤 User ${username} left chat: ${chatId}`);

    // Notify other participants
    socket.to(chatId).emit('user_left_chat', {
      chatId: chatId,
      userId: userId,
      username: username,
      timestamp: new Date()
    });
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const {
        recipients,
        messageType,
        chatId,
        clientMessageId,
        threadId,
        metadata,
        encryption
      } = data;

      // Validate required fields
      if (!chatId || !clientMessageId || !recipients || !Array.isArray(recipients)) {
        socket.emit('error', {
          message: 'Missing required message fields',
          code: 'INVALID_MESSAGE_DATA'
        });
        return;
      }

      // Verify user is participant in this chat
      const chat = await Chat.findOne({ chatId: chatId });
      
      if (!chat || !chat.isParticipant(userId)) {
        socket.emit('error', {
          message: 'You are not a participant in this chat',
          code: 'CHAT_ACCESS_DENIED'
        });
        return;
      }

      // Check if user has permission to send messages
      if (!chat.hasPermission(userId, 'canSendMessages')) {
        socket.emit('error', {
          message: 'You do not have permission to send messages in this chat',
          code: 'SEND_MESSAGE_DENIED'
        });
        return;
      }

      // Create message
      const message = new Message({
        sender: userId,
        recipients: recipients,
        messageType: messageType,
        chatId: chatId,
        clientMessageId: clientMessageId,
        threadId: threadId,
        metadata: metadata,
        encryption: encryption
      });

      await message.save();

      // Update chat's last message
      const preview = messageType === 'text' ? 'New message' : `${messageType} message`;
      await chat.updateLastMessage(message._id, preview);

      // Populate sender info
      await message.populate('sender', 'username displayName avatar');

      // Send to all participants in the chat
      io.to(chatId).emit('new_message', {
        message: message,
        chatId: chatId
      });

      // Send delivery confirmations to sender
      socket.emit('message_sent', {
        clientMessageId: clientMessageId,
        messageId: message._id,
        timestamp: message.createdAt
      });

      console.log(`💬 Message sent in chat ${chatId} by ${username}`);

    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.code === 11000) {
        // Duplicate clientMessageId
        socket.emit('error', {
          message: 'Message already exists',
          code: 'DUPLICATE_MESSAGE'
        });
      } else {
        socket.emit('error', {
          message: 'Failed to send message',
          code: 'SEND_MESSAGE_ERROR'
        });
      }
    }
  });

  // Mark messages as read
  socket.on('mark_as_read', async (data) => {
    try {
      const { chatId, messageIds } = data;

      // Update read status
      if (messageIds && messageIds.length > 0) {
        // Mark specific messages as read
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            'recipients.user': userId
          },
          {
            $set: {
              'recipients.$.readAt': new Date(),
              'recipients.$.deliveredAt': new Date()
            }
          }
        );
      } else {
        // Mark all messages in chat as read
        await Message.markChatAsRead(chatId, userId);
      }

      // Notify other participants about read receipts
      socket.to(chatId).emit('messages_read', {
        chatId: chatId,
        userId: userId,
        messageIds: messageIds,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', {
        message: 'Failed to mark messages as read',
        code: 'MARK_READ_ERROR'
      });
    }
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    const { chatId } = data;
    socket.to(chatId).emit('user_typing', {
      chatId: chatId,
      userId: userId,
      username: username,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { chatId } = data;
    socket.to(chatId).emit('user_typing', {
      chatId: chatId,
      userId: userId,
      username: username,
      isTyping: false
    });
  });

  // Add reaction to message
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji, chatId } = data;

      if (!isValidObjectId(messageId)) {
        socket.emit('error', {
          message: 'Invalid message ID',
          code: 'INVALID_MESSAGE_ID'
        });
        return;
      }

      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('error', {
          message: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        });
        return;
      }

      // Check if user is recipient of this message
      const isRecipient = message.recipients.some(r => 
        r.user.toString() === userId.toString()
      );

      if (!isRecipient && message.sender.toString() !== userId.toString()) {
        socket.emit('error', {
          message: 'You cannot react to this message',
          code: 'REACTION_DENIED'
        });
        return;
      }

      await message.addReaction(userId, emoji);

      // Notify all participants in the chat
      io.to(chatId).emit('reaction_added', {
        messageId: messageId,
        userId: userId,
        username: username,
        emoji: emoji,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', {
        message: 'Failed to add reaction',
        code: 'ADD_REACTION_ERROR'
      });
    }
  });

  // Remove reaction from message
  socket.on('remove_reaction', async (data) => {
    try {
      const { messageId, chatId } = data;

      if (!isValidObjectId(messageId)) {
        socket.emit('error', {
          message: 'Invalid message ID',
          code: 'INVALID_MESSAGE_ID'
        });
        return;
      }

      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('error', {
          message: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        });
        return;
      }

      await message.removeReaction(userId);

      // Notify all participants in the chat
      io.to(chatId).emit('reaction_removed', {
        messageId: messageId,
        userId: userId,
        username: username,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error removing reaction:', error);
      socket.emit('error', {
        message: 'Failed to remove reaction',
        code: 'REMOVE_REACTION_ERROR'
      });
    }
  });

  // Create direct chat
  socket.on('create_direct_chat', async (data) => {
    try {
      const { recipientId } = data;

      if (!isValidObjectId(recipientId)) {
        socket.emit('error', {
          message: 'Invalid recipient ID',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      // Check if recipient exists and is not blocked
      const recipient = await User.findById(recipientId);
      
      if (!recipient) {
        socket.emit('error', {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check if users have blocked each other
      const currentUser = await User.findById(userId);
      
      if (currentUser.isUserBlocked(recipientId) || recipient.isUserBlocked(userId)) {
        socket.emit('error', {
          message: 'Cannot create chat with this user',
          code: 'USER_BLOCKED'
        });
        return;
      }

      // Create or find existing direct chat
      const chat = await Chat.createDirectChat(userId, recipientId);

      socket.emit('chat_created', {
        chat: chat,
        type: 'direct'
      });

      // If recipient is online, notify them
      const recipientSocketData = Array.from(activeUsers.entries())
        .find(([id, data]) => id === recipientId.toString());

      if (recipientSocketData) {
        const recipientSocketId = recipientSocketData[1].socketId;
        io.to(recipientSocketId).emit('new_chat_created', {
          chat: chat,
          createdBy: {
            id: userId,
            username: username
          }
        });
      }

    } catch (error) {
      console.error('Error creating direct chat:', error);
      socket.emit('error', {
        message: 'Failed to create chat',
        code: 'CREATE_CHAT_ERROR'
      });
    }
  });

  // Get online users
  socket.on('get_online_users', () => {
    const onlineUsersList = Array.from(activeUsers.entries()).map(([id, data]) => ({
      userId: id,
      username: data.username,
      connectedAt: data.connectedAt
    }));

    socket.emit('online_users', {
      users: onlineUsersList,
      count: onlineUsersList.length
    });
  });

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`👋 User ${username} disconnected: ${reason}`);

      // Update user offline status
      const user = await User.findById(userId);
      if (user) {
        await user.setOnlineStatus(false);
      }

      // Remove from active users
      activeUsers.delete(userId);
      userSockets.delete(socket.id);

      // Notify other users that user went offline
      socket.broadcast.emit('user_offline', {
        userId: userId,
        username: username,
        timestamp: new Date(),
        reason: reason
      });

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for user ${username}:`, error);
  });
};

// Helper functions for external use
const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([id, data]) => ({
    userId: id,
    username: data.username,
    socketId: data.socketId,
    connectedAt: data.connectedAt
  }));
};

const getUserSocket = (userId) => {
  const userData = activeUsers.get(userId.toString());
  return userData ? userData.socketId : null;
};

const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

const sendToUser = (io, userId, event, data) => {
  const socketId = getUserSocket(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const sendToChat = (io, chatId, event, data, excludeUserId = null) => {
  if (excludeUserId) {
    const socketId = getUserSocket(excludeUserId);
    if (socketId) {
      io.to(chatId).except(socketId).emit(event, data);
    } else {
      io.to(chatId).emit(event, data);
    }
  } else {
    io.to(chatId).emit(event, data);
  }
};

module.exports = {
  socketHandler,
  getActiveUsers,
  getUserSocket,
  isUserOnline,
  sendToUser,
  sendToChat
};