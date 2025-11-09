const Joi = require('joi')

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required'
  })

// Username validation schema
const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9_-]+$'))
  .required()
  .messages({
    'string.alphanum': 'Username can only contain letters, numbers, underscores, and hyphens',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
    'any.required': 'Username is required'
  })

// Email validation schema
const emailSchema = Joi.string()
  .email()
  .max(320)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 320 characters',
    'any.required': 'Email is required'
  })

// Validation schemas for different endpoints
const validationSchemas = {
  // User registration
  register: Joi.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    displayName: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Display name must be at least 1 character long',
        'string.max': 'Display name cannot exceed 50 characters'
      }),
    publicKey: Joi.string()
      .required()
      .messages({
        'any.required': 'Public key is required for encryption'
      })
  }),

  // User login
  login: Joi.object({
    identifier: Joi.string()
      .required()
      .messages({
        'any.required': 'Username or email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Password reset request
  passwordResetRequest: Joi.object({
    email: emailSchema
  }),

  // Password reset
  passwordReset: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    newPassword: passwordSchema
  }),

  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: passwordSchema
  }),

  // Update profile
  updateProfile: Joi.object({
    displayName: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .optional()
      .allow(''),
    avatar: Joi.string()
      .uri()
      .optional()
      .allow(''),
    preferences: Joi.object({
      theme: Joi.string()
        .valid('light', 'dark', 'auto')
        .optional(),
      notifications: Joi.boolean().optional(),
      readReceipts: Joi.boolean().optional(),
      typingIndicators: Joi.boolean().optional()
    }).optional()
  })
}

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property]
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errorDetails
      })
    }

    req[property] = value
    next()
  }
}

// Specific validation middleware
const validateRegistration = validate(validationSchemas.register)
const validateLogin = validate(validationSchemas.login)
const validatePasswordResetRequest = validate(validationSchemas.passwordResetRequest)
const validatePasswordReset = validate(validationSchemas.passwordReset)
const validateChangePassword = validate(validationSchemas.changePassword)
const validateUpdateProfile = validate(validationSchemas.updateProfile)

// Custom validation for MongoDB ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName]
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format`,
        code: 'INVALID_OBJECT_ID'
      })
    }
    
    next()
  }
}

module.exports = {
  validationSchemas,
  validate,
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateUpdateProfile,
  validateObjectId
}