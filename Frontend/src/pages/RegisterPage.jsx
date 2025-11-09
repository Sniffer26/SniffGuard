import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/UI/LoadingSpinner'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setRegisterError('')

    if (data.password !== data.confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }

    try {
      const result = await registerUser({
        username: data.username.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        displayName: data.displayName.trim() || data.username.trim()
      })

      if (result.success) {
        navigate('/chat')
      } else {
        setRegisterError(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegisterError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-dark-border"
        >
          {/* Logo and Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-20 w-20 bg-signal-500 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-lg"
            >
              🛡️
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Join SniffGuard for secure messaging
            </p>
          </div>

          {/* Registration Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {registerError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4"
              >
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{registerError}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    },
                    maxLength: {
                      value: 30,
                      message: 'Username cannot exceed 30 characters'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'Username can only contain letters, numbers, underscores, and hyphens'
                    }
                  })}
                  type="text"
                  autoComplete="username"
                  className="w-full px-4 py-3.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="mt-2 text-red-600 dark:text-red-400 text-xs">{errors.username.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-red-600 dark:text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 pr-12 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-[42px] flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-2 text-red-600 dark:text-red-400 text-xs">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 pr-12 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-[42px] flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-2 text-red-600 dark:text-red-400 text-xs">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center py-4 px-4 text-base font-semibold rounded-2xl text-white bg-signal-500 hover:bg-signal-600 focus:outline-none focus:ring-4 focus:ring-signal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {(isSubmitting || isLoading) ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                'Create Account'
              )}
            </motion.button>

            {/* Sign in link */}
            <div className="text-center pt-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-signal-500 hover:text-signal-600 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-elevated rounded-full">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                End-to-end encrypted
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage
