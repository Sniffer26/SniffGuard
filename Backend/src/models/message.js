const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    encryptedContent: {
      type: String,
      required: true // Encrypted message content for this specific recipient
    },
    encryptedKey: {
      type: String,
      required: true // Encrypted symmetric key for this recipient
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  }],
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'voice', 'video', 'location', 'system'],
    default: 'text'
  },
  metadata: {
    filename: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // For voice/video messages
    dimensions: {
      width: Number,
      height: Number
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  chatId: {
    type: String,
    required: true,
    index: true // For efficient chat queries
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null // For reply threading
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousContent: String // Store encrypted previous content for audit
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deleteType: {
    type: String,
    enum: ['sender', 'everyone'],
    default: null
  },
  expiresAt: {
    type: Date,
    default: null // For disappearing messages
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      start: Number,
      end: Number
    }
  }],
  forwardedFrom: {
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    forwardedAt: {
      type: Date,
      default: Date.now
    }
  },
  clientMessageId: {
    type: String,
    required: true // For message deduplication and client sync
  },
  encryption: {
    algorithm: {
      type: String,
      default: 'AES-256-GCM'
    },
    keyId: {
      type: String,
      required: true
    },
    nonce: {
      type: String,
      required: true
    },
    authTag: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Don't send encryption details to client
      delete ret.encryption;
      return ret;
    }
  }
});

// Indexes for performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'recipients.user': 1, createdAt: -1 });
messageSchema.index({ clientMessageId: 1 }, { unique: true });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for text search (if needed for search functionality)
messageSchema.index({ 
  'recipients.encryptedContent': 'text' 
}, { 
  sparse: true,
  background: true 
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Set expiration for disappearing messages
  if (this.expiresAt && this.expiresAt <= new Date()) {
    this.isDeleted = true;
  }
  next();
});

// Method to mark message as delivered for a specific user
messageSchema.methods.markAsDelivered = function(userId) {
  const recipient = this.recipients.find(r => 
    r.user.toString() === userId.toString()
  );
  
  if (recipient && !recipient.deliveredAt) {
    recipient.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark message as read for a specific user
messageSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => 
    r.user.toString() === userId.toString()
  );
  
  if (recipient && !recipient.readAt) {
    recipient.readAt = new Date();
    if (!recipient.deliveredAt) {
      recipient.deliveredAt = new Date();
    }
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newEncryptedContent, userId) {
  // Store previous content in edit history
  const recipient = this.recipients.find(r => 
    r.user.toString() === userId.toString()
  );
  
  if (recipient) {
    this.editHistory.push({
      editedAt: new Date(),
      previousContent: recipient.encryptedContent
    });
    
    recipient.encryptedContent = newEncryptedContent;
    this.isEdited = true;
    
    return this.save();
  }
  
  return Promise.reject(new Error('User not found in recipients'));
};

// Method to delete message
messageSchema.methods.deleteMessage = function(deleteType = 'sender') {
  this.isDeleted = true;
  this.deleteType = deleteType;
  
  if (deleteType === 'everyone') {
    // Clear content for all recipients
    this.recipients.forEach(recipient => {
      recipient.encryptedContent = '';
      recipient.isDeleted = true;
    });
  }
  
  return this.save();
};

// Static method to get chat messages with pagination
messageSchema.statics.getChatMessages = function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    chatId: chatId,
    isDeleted: false 
  })
  .populate('sender', 'username displayName avatar')
  .populate('recipients.user', 'username displayName avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

// Static method to get unread message count for user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'recipients.user': userId,
    'recipients.readAt': null,
    'recipients.isDeleted': false,
    isDeleted: false
  });
};

// Static method to mark all messages as read in a chat
messageSchema.statics.markChatAsRead = function(chatId, userId) {
  return this.updateMany(
    {
      chatId: chatId,
      'recipients.user': userId,
      'recipients.readAt': null
    },
    {
      $set: {
        'recipients.$.readAt': new Date(),
        'recipients.$.deliveredAt': new Date()
      }
    }
  );
};

module.exports = mongoose.model('Message', messageSchema);