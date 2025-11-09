import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.metadata = { requestStartedAt: new Date().getTime() }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const responseTime = new Date().getTime() - response.config.metadata.requestStartedAt
      console.log(`API Request to ${response.config.url} took ${responseTime}ms`)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Prevent infinite loops - strict guards
    if (!originalRequest || originalRequest._retry || originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error)
    }

    // Handle token expiration (401 only, not network errors)
    if (error.response?.status === 401) {
      originalRequest._retry = true

      try {
        // Get refresh token from localStorage
        const authData = localStorage.getItem('sniffguard-auth')
        if (!authData) {
          authService.handleAuthError()
          return Promise.reject(error)
        }

        const parsedData = JSON.parse(authData)
        const refreshToken = parsedData?.state?.refreshToken
        
        // No refresh token available
        if (!refreshToken) {
          authService.handleAuthError()
          return Promise.reject(error)
        }
        
        // Try to refresh
        const response = await api.post('/auth/refresh', { refreshToken })
        const { accessToken } = response.data.tokens
        
        // Update stored token
        parsedData.state.accessToken = accessToken
        localStorage.setItem('sniffguard-auth', JSON.stringify(parsedData))
        
        // Update auth header
        authService.setAuthHeader(accessToken)
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect
        console.error('Token refresh failed:', refreshError)
        authService.handleAuthError()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  // Set authorization header
  setAuthHeader: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  },

  // Clear authorization header
  clearAuthHeader: () => {
    delete api.defaults.headers.common['Authorization']
  },

  // Handle authentication errors
  handleAuthError: () => {
    // Clear stored auth data
    localStorage.removeItem('sniffguard-auth')
    authService.clearAuthHeader()
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      return response
    } catch (error) {
      throw error
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout')
      return response
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error('Logout error:', error)
      throw error
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken })
      return response
    } catch (error) {
      throw error
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify')
      return response
    } catch (error) {
      throw error
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      return response
    } catch (error) {
      throw error
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/password-reset-request', { email })
      return response
    } catch (error) {
      throw error
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/password-reset', {
        token,
        newPassword
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    try {
      const response = await api.get('/users/search', {
        params: { query, limit }
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Add contact
  addContact: async (userId, nickname = null) => {
    try {
      const response = await api.post('/users/contacts', {
        userId,
        nickname
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Remove contact
  removeContact: async (userId) => {
    try {
      const response = await api.delete(`/users/contacts/${userId}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Block user
  blockUser: async (userId) => {
    try {
      const response = await api.post('/users/block', { userId })
      return response
    } catch (error) {
      throw error
    }
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      const response = await api.delete(`/users/block/${userId}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/api/health')
      return response
    } catch (error) {
      throw error
    }
  },
}

// Export the configured axios instance for other services
export { api }
  