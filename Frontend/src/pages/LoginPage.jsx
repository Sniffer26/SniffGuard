import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { encryptionService } from '@/services/encryptionService'
import LoadingSpinner from '@/components/UI/LoadingSpinner'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const onSubmit = async (data) => {
    setLoginError('')

    try {
      // Attempt to login
      const result = await login({
        identifier: data.identifier.trim(),
        password: data.password
      })

      if (result.success) {
        // Load user's private key for encryption
        try {
          await encryptionService.loadPrivateKey(data.password)
          encryptionService.setPublicKey(result.user.publicKey)
          console.log('🔐 Encryption keys loaded successfully')
        } catch (keyError) {
          console.error('Failed to load encryption keys:', keyError)
          // Continue anyway - user can re-enter password later
        }

        navigate('/chat')
      } else {
        setLoginError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 backdrop-blur-md"
        >
          {/* Logo and Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-6"
            >
              🛡️
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-white/80 text-sm">
              Sign in to your secure SniffGuard account
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-red-200 text-sm text-center">{loginError}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Username/Email Field */}
              <div>
                <label htmlFor="identifier" className="sr-only">
                  Username or Email
                </label>
                <input
                  {...register('identifier', {
                    required: 'Username or email is required',
                    minLength: {
                      value: 3,
                      message: 'Must be at least 3 characters'
                    }
                  })}
                  type="text"
                  autoComplete="username"
                  className="relative block w-full px-4 py-3 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Username or Email"
                />
                {errors.identifier && (
                  <p className="mt-1 text-red-300 text-xs">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="relative block w-full px-4 py-3 pr-12 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/60 hover:text-white/80" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/60 hover:text-white/80" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-red-300 text-xs">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-white focus:ring-white/30"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/80">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-white/80 hover:text-white transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {(isSubmitting || isLoading) ? (
                <LoadingSpinner size="sm" className="text-gray-900" />
              ) : (
                'Sign In'
              )}
            </motion.button>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-white/80 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-white hover:text-white/80 transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              🔒 Your messages are end-to-end encrypted
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center space-y-2"
        >
          <div className="flex justify-center space-x-6 text-white/80 text-sm">
            <div className="flex items-center">
              <span className="mr-1">🔐</span>
              E2E Encrypted
            </div>
            <div className="flex items-center">
              <span className="mr-1">🚫</span>
              No Tracking
            </div>
            <div className="flex items-center">
              <span className="mr-1">🌍</span>
              Open Source
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage