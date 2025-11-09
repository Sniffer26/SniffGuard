import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon, UserPlusIcon } from '@heroicons/react/24/outline'
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
        displayName: (data.displayName || '').trim() || data.username.trim()
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
    <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Main Container */}
      <div className="w-full max-w-sm">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-signal-500 rounded-lg mb-4">
            <UserPlusIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Create account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Secure, end-to-end encrypted
          </p>
        </div>

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Error Message */}
          {registerError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{registerError}</p>
            </div>
          )}

          {/* Username Input */}
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="mt-1.5 text-red-600 dark:text-red-400 text-xs">{errors.username.message}</p>
            )}
          </div>

          {/* Email Input */}
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-red-600 dark:text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Display Name Input */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              {...register('displayName')}
              type="text"
              autoComplete="name"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
              placeholder="Your display name (optional)"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
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
                className="w-full px-4 py-2.5 pr-11 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-red-600 dark:text-red-400 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 pr-11 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-red-600 dark:text-red-400 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Checkbox - I agree to processing */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-dark-border text-signal-500 focus:ring-signal-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              I agree to the processing of personal data
            </span>
          </label>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-signal-500 hover:bg-signal-600 focus:outline-none focus:ring-2 focus:ring-signal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {(isSubmitting || isLoading) ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-signal-500 hover:text-signal-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
