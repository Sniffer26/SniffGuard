import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/authService'
import { socketService } from '@/services/socketService'
import { encryptionService } from '@/services/encryptionService'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true })
        
        try {
          const response = await authService.login(credentials)
          const { user, tokens } = response.data

          // Store tokens
          set({
            user,
            isAuthenticated: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isLoading: false
          })

          // Set auth header for future requests
          authService.setAuthHeader(tokens.accessToken)

          // Connect to socket
          socketService.connect(tokens.accessToken)

          toast.success(`Welcome back, ${user.displayName || user.username}!`)
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed'
          
          set({ isLoading: false })
          toast.error(message)
          
          return { 
            success: false, 
            error: message,
            code: error.response?.data?.code 
          }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        
        try {
          console.log('[AuthStore] Starting registration...')
          
          // Generate encryption keys
          console.log('[AuthStore] Generating key pair...')
          const keyPair = await encryptionService.generateKeyPair()
          console.log('[AuthStore] Key pair generated successfully')
          
          const registrationData = {
            ...userData,
            publicKey: keyPair.publicKey
          }
          
          console.log('[AuthStore] Calling register API...')
          const response = await authService.register(registrationData)
          const { user, tokens } = response.data
          console.log('[AuthStore] Registration API successful', { user })

          // Store private key securely
          console.log('[AuthStore] Storing private key...')
          const keyStored = await encryptionService.storePrivateKey(keyPair.privateKey, userData.password)
          if (!keyStored) {
            console.warn('[AuthStore] Failed to store private key, but continuing...')
          } else {
            console.log('[AuthStore] Private key stored successfully')
          }

          // Store tokens and user
          set({
            user,
            isAuthenticated: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isLoading: false
          })

          // Set auth header
          authService.setAuthHeader(tokens.accessToken)

          // Connect to socket
          console.log('[AuthStore] Connecting to socket...')
          socketService.connect(tokens.accessToken)

          toast.success(`Welcome to SniffGuard, ${user.displayName || user.username}!`)
          
          return { success: true, user }
        } catch (error) {
          console.error('[AuthStore] Registration error:', error)
          console.error('[AuthStore] Error details:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
          })
          
          const message = error.response?.data?.error || error.message || 'Registration failed'
          
          set({ isLoading: false })
          toast.error(message)
          
          return { 
            success: false, 
            error: message,
            code: error.response?.data?.code 
          }
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Disconnect socket
          socketService.disconnect()

          // Clear auth header
          authService.clearAuthHeader()

          // Clear encryption keys
          encryptionService.clearKeys()

          // Clear state
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false
          })

          toast.success('Logged out successfully')
        }
      },

      refreshToken: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          return false
        }

        try {
          const response = await authService.refreshToken(refreshToken)
          const { tokens } = response.data

          set({
            accessToken: tokens.accessToken,
            // Keep existing refreshToken if not provided
            refreshToken: tokens.refreshToken || refreshToken
          })

          authService.setAuthHeader(tokens.accessToken)
          
          return true
        } catch (error) {
          console.error('Token refresh failed:', error)
          
          // If refresh fails, logout user
          get().logout()
          return false
        }
      },

      checkAuth: async () => {
        const { accessToken, refreshToken } = get()
        
        console.log('[AuthStore] checkAuth called', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })
        
        // If no tokens at all, clear state
        if (!accessToken && !refreshToken) {
          console.log('[AuthStore] No tokens found, clearing auth state')
          set({ isLoading: false, isAuthenticated: false, user: null })
          return
        }
        
        // If we have refreshToken but no accessToken, try to refresh first
        if (!accessToken && refreshToken) {
          console.log('[AuthStore] No access token but have refresh token, attempting refresh...')
          set({ isLoading: true })
          const refreshed = await get().refreshToken()
          if (!refreshed) {
            console.log('[AuthStore] Token refresh failed, clearing state')
            set({ isLoading: false, isAuthenticated: false, user: null })
            return
          }
          console.log('[AuthStore] Token refreshed successfully')
          // Continue with verification using new accessToken
        }

        set({ isLoading: true })
        console.log('[AuthStore] Starting auth verification...')

        try {
          // Set auth header with current token
          const currentToken = get().accessToken
          authService.setAuthHeader(currentToken)

          // Verify current token
          console.log('[AuthStore] Calling verifyToken API...')
          const response = await authService.verifyToken()
          const { user } = response.data
          
          console.log('[AuthStore] Token verified successfully', { user })

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })

          // Connect to socket if not already connected
          if (!socketService.isSocketConnected()) {
            socketService.connect(currentToken)
          }

        } catch (error) {
          console.error('[AuthStore] Auth check failed:', error)
          set({ isLoading: false, isAuthenticated: false })
          get().logout()
        }
      },

      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true })
        
        try {
          const response = await authService.updateProfile(profileData)
          const { user } = response.data

          set({
            user,
            isLoading: false
          })

          toast.success('Profile updated successfully')
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to update profile'
          
          set({ isLoading: false })
          toast.error(message)
          
          return { success: false, error: message }
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true })
        
        try {
          await authService.changePassword(passwordData)
          
          set({ isLoading: false })
          toast.success('Password changed successfully')
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to change password'
          
          set({ isLoading: false })
          toast.error(message)
          
          return { success: false, error: message }
        }
      },

      // Getters
      getAccessToken: () => get().accessToken,
      getUser: () => get().user,
      isUserAuthenticated: () => get().isAuthenticated,
    }),
    {
      name: 'sniffguard-auth',
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        // Handle migration if storage schema changes
        if (version === 0) {
          // Migrate from version 0 to version 1
          return {
            ...persistedState,
            // Add any new fields or transform existing ones
          }
        }
        return persistedState
      },
    }
  )
)