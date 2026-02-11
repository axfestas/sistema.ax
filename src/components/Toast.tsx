'use client'

import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  onClose: (id: string) => void
  duration?: number
}

const Toast = ({ id, message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, onClose, duration])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600'
      case 'error':
        return 'bg-red-500 border-red-600'
      case 'warning':
        return 'bg-amber-500 border-amber-600'
      case 'info':
        return 'bg-blue-500 border-blue-600'
    }
  }

  return (
    <div
      className={`
        ${getStyles()}
        text-white px-4 py-3 rounded-lg shadow-lg border-l-4
        flex items-center justify-between gap-3 min-w-[300px] max-w-[400px]
        animate-slide-in-right
      `}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{getIcon()}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:text-gray-200 text-xl font-bold leading-none"
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  )
}

export default Toast
