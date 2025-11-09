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
              Create Account
            </h2>
            <p className="text-white/80 text-sm">
              Join SniffGuard for secure, private messaging
            </p>
          </div>

          {/* Registration Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {registerError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-red-200 text-sm text-center">{registerError}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="sr-only">
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
                  className="relative block w-full px-4 py-3 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Username"
                />
                {errors.username && (
                  <p className="mt-1 text-red-300 text-xs">{errors.username.message}</p>
                )}
              </div>

              {/* Display Name Field */}
              <div>
                <label htmlFor="displayName" className="sr-only">
                  Display Name
                </label>
                <input
                  {...register('displayName', {
                    maxLength: {
                      value: 50,
                      message: 'Display name cannot exceed 50 characters'
                    }
                  })}
                  type="text"
                  className="relative block w-full px-4 py-3 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Display Name (optional)"
                />
                {errors.displayName && (
                  <p className="mt-1 text-red-300 text-xs">{errors.displayName.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="sr-only">
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
                  className="relative block w-full px-4 py-3 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="mt-1 text-red-300 text-xs">{errors.email.message}</p>
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
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number, and special character'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

              {/* Confirm Password Field */}
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="relative block w-full px-4 py-3 pr-12 border-0 bg-white/10 backdrop-blur-md rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/60 hover:text-white/80" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/60 hover:text-white/80" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-1 text-red-300 text-xs">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Register Button */}
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
                'Create Account'
              )}
            </motion.button>

            {/* Sign in link */}
            <div className="text-center">
              <p className="text-white/80 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-white hover:text-white/80 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              🔒 Your account will be protected with end-to-end encryption
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage
