const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Account lock constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minLength: [3, 'Username must be at least 3 characters long'],
    maxLength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  displayName: {
    type: String,
    trim: true,
    maxLength: [50, 'Display name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null // URL to profile picture
  },
  publicKey: {
    type: String,
    required: true // For E2E encryption
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    },
    typingIndicators: {
      type: Boolean,
      default: true
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  contacts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nickname: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.twoFactorSecret;
      delete ret.security.passwordResetToken;
      delete ret.security.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after MAX_LOGIN_ATTEMPTS failed attempts for LOCK_TIME
  if (this.security.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
  });
};

// Method to update online status
userSchema.methods.setOnlineStatus = function(isOnline) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  return this.save();
};

// Method to add contact
userSchema.methods.addContact = function(userId, nickname = null) {
  const existingContact = this.contacts.find(contact => 
    contact.user.toString() === userId.toString()
  );
  
  if (!existingContact) {
    this.contacts.push({
      user: userId,
      nickname: nickname
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to block user
userSchema.methods.blockUser = function(userId) {
  const isAlreadyBlocked = this.blockedUsers.find(blocked => 
    blocked.user.toString() === userId.toString()
  );
  
  if (!isAlreadyBlocked) {
    this.blockedUsers.push({ user: userId });
    // Remove from contacts if exists
    this.contacts = this.contacts.filter(contact => 
      contact.user.toString() !== userId.toString()
    );
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unblock user
userSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(blocked => 
    blocked.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to check if user is blocked
userSchema.methods.isUserBlocked = function(userId) {
  return this.blockedUsers.some(blocked => 
    blocked.user.toString() === userId.toString()
  );
};

// Static method to find users for search
userSchema.statics.findByUsernameOrEmail = function(query) {
  return this.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  }).select('username email displayName avatar isOnline lastSeen');
};

module.exports = mongoose.model('User', userSchema);