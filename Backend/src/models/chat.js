const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    required: true,
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxLength: [100, 'Chat name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Chat description cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    default: null // URL to chat avatar/icon
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    permissions: {
      canSendMessages: {
        type: Boolean,
        default: true
      },
      canSendMedia: {
        type: Boolean,
        default: true
      },
      canAddMembers: {
        type: Boolean,
        default: false
      },
      canRemoveMembers: {
        type: Boolean,
        default: false
      },
      canEditChatInfo: {
        type: Boolean,
        default: false
      }
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true
      },
      muteUntil: {
        type: Date,
        default: null
      },
      nickname: {
        type: String,
        maxLength: 50
      }
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 1000
    },
    messageRetention: {
      type: Number,
      default: 0 // 0 = forever, value in days
    },
    allowForwarding: {
      type: Boolean,
      default: true
    },
    allowScreenshots: {
      type: Boolean,
      default: true
    }
  },
  encryption: {
    isEncrypted: {
      type: Boolean,
      default: true
    },
    keyRotationInterval: {
      type: Number,
      default: 7 // days
    },
    lastKeyRotation: {
      type: Date,
      default: Date.now
    },
    groupKey: {
      type: String,
      select: false // Never send this to client
    }
  },
  lastMessage: {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    preview: {
      type: String,
      maxLength: 100
    }
  },
  metrics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    activeParticipants: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.encryption.groupKey;
      return ret;
    }
  }
});

// Indexes for performance (chatId already indexed via unique: true)
chatSchema.index({ type: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ creator: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ isActive: 1, isArchived: 1 });

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Update participant counts
  this.metrics.totalParticipants = this.participants.length;
  this.metrics.activeParticipants = this.participants.filter(p => p.isActive).length;
  
  // Generate chatId if not provided
  if (!this.chatId) {
    if (this.type === 'direct' && this.participants.length === 2) {
      // For direct chats, create deterministic chatId from user IDs
      const userIds = this.participants
        .map(p => p.user.toString())
        .sort();
      this.chatId = `direct_${userIds[0]}_${userIds[1]}`;
    } else {
      // For group chats, use MongoDB ObjectId
      this.chatId = `group_${this._id}`;
    }
  }
  
  next();
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member', addedBy = null) {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    if (!existingParticipant.isActive) {
      // Reactivate participant
      existingParticipant.isActive = true;
      existingParticipant.leftAt = null;
      existingParticipant.joinedAt = new Date();
    }
    return this.save();
  }
  
  // Check max members limit
  if (this.metrics.activeParticipants >= this.settings.maxMembers) {
    throw new Error('Chat has reached maximum number of participants');
  }
  
  this.participants.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId, removedBy = null) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Method to update participant role
chatSchema.methods.updateParticipantRole = function(userId, newRole, updatedBy = null) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.role = newRole;
    return this.save();
  }
  
  throw new Error('Participant not found');
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
};

// Method to check if user has permission
chatSchema.methods.hasPermission = function(userId, permission) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (!participant) return false;
  
  // Owners and admins have all permissions
  if (participant.role === 'owner' || participant.role === 'admin') {
    return true;
  }
  
  return participant.permissions[permission] || false;
};

// Method to update last message
chatSchema.methods.updateLastMessage = function(messageId, preview) {
  this.lastMessage = {
    message: messageId,
    timestamp: new Date(),
    preview: preview
  };
  this.metrics.totalMessages += 1;
  
  return this.save();
};

// Method to mute chat for user
chatSchema.methods.muteForUser = function(userId, muteUntil = null) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.preferences.muteUntil = muteUntil;
    return this.save();
  }
  
  throw new Error('Participant not found');
};

// Method to set nickname for user in chat
chatSchema.methods.setNicknameForUser = function(userId, nickname) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.preferences.nickname = nickname;
    return this.save();
  }
  
  throw new Error('Participant not found');
};

// Static method to find user's chats
chatSchema.statics.findUserChats = function(userId, type = null) {
  const query = {
    'participants.user': userId,
    'participants.isActive': true,
    isActive: true
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('participants.user', 'username displayName avatar isOnline lastSeen')
    .populate('lastMessage.message', 'messageType createdAt')
    .populate('creator', 'username displayName avatar')
    .sort({ 'lastMessage.timestamp': -1 });
};

// Static method to create direct chat
chatSchema.statics.createDirectChat = function(user1Id, user2Id) {
  const userIds = [user1Id.toString(), user2Id.toString()].sort();
  const chatId = `direct_${userIds[0]}_${userIds[1]}`;
  
  return this.findOneAndUpdate(
    { chatId: chatId },
    {
      chatId: chatId,
      type: 'direct',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ],
      creator: user1Id,
      isActive: true
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

module.exports = mongoose.model('Chat', chatSchema);