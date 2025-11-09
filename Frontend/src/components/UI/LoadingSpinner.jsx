import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  color = 'current',
  variant = 'spin'
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    current: 'text-current',
    white: 'text-white',
    primary: 'text-primary-500',
    gray: 'text-gray-500'
  }

  if (variant === 'dots') {
    return (
      <div className={clsx('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx(
              'rounded-full bg-current',
              size === 'xs' ? 'h-1 w-1' :
              size === 'sm' ? 'h-1.5 w-1.5' :
              size === 'md' ? 'h-2 w-2' :
              size === 'lg' ? 'h-3 w-3' : 'h-4 w-4',
              colorClasses[color]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={clsx(
          'rounded-full bg-current',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    )
  }

  // Default spin variant
  return (
    <motion.div
      className={clsx(
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  )
}

export default LoadingSpinner