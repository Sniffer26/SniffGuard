import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline'
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
    <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Main Container */}
      <div className="w-full max-w-sm">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-signal-500 rounded-lg mb-4">
            <LockClosedIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Sign in
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            with your account
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Error Message */}
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          {/* Username/Email Input */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email or Username
            </label>
            <input
              {...register('identifier', {
                required: 'Email or username is required',
                minLength: {
                  value: 3,
                  message: 'Must be at least 3 characters'
                }
              })}
              type="text"
              autoComplete="username"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent transition-all"
              placeholder="name@example.com"
            />
            {errors.identifier && (
              <p className="mt-1.5 text-red-600 dark:text-red-400 text-xs">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link
                to="#"
                className="text-xs text-signal-500 hover:text-signal-600 transition-colors"
              >
                Forgot?
              </Link>
            </div>
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
                autoComplete="current-password"
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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-signal-500 hover:bg-signal-600 focus:outline-none focus:ring-2 focus:ring-signal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {(isSubmitting || isLoading) ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-signal-500 hover:text-signal-600 transition-colors"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage