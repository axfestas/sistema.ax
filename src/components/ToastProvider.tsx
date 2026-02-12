'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastType } from './Toast'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message: string) => addToast(message, 'success')
  const showError = (message: string) => addToast(message, 'error')
  const showWarning = (message: string) => addToast(message, 'warning')
  const showInfo = (message: string) => addToast(message, 'info')

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
