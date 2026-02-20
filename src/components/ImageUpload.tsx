'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'

interface ImageUploadProps {
  currentImage?: string
  onUpload: (url: string) => void
  folder?: string // Optional folder in R2 (e.g., 'portfolio', 'kits', 'items')
  maxSize?: number // MB, default 5
  accept?: string // default 'image/*'
  label?: string
}

export default function ImageUpload({
  currentImage,
  onUpload,
  folder = 'general',
  maxSize = 5,
  accept = 'image/*',
  label = 'Imagem'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showSuccess, showError } = useToast()

  const validateFile = (file: File): boolean => {
    // Validate type
    if (!file.type.startsWith('image/')) {
      showError('Apenas arquivos de imagem são permitidos')
      return false
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WEBP')
      return false
    }

    // Validate size (convert MB to bytes)
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      showError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json() as { url: string; key: string; filename: string }
        onUpload(data.url)
        showSuccess('Imagem enviada com sucesso!')
      } else {
        const error = await response.json() as { error: string }
        const msg = error.error || 'Erro ao enviar imagem'
        // Give actionable guidance when R2/storage is not configured
        if (response.status === 503 || msg.toLowerCase().includes('storage')) {
          showError('Upload indisponível: o armazenamento R2 não está configurado no Cloudflare Pages. Contate o administrador do sistema.')
        } else if (response.status === 401) {
          showError('Sessão expirada. Faça login novamente para enviar imagens.')
        } else {
          showError(msg)
        }
        setPreview(currentImage || null)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      showError('Erro ao enviar imagem')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={uploading ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain rounded"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                <div className="text-white text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <p className="text-sm">Enviando...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {uploading ? (
              <div className="text-gray-600">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-sm">Enviando...</p>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Clique para selecionar</span>
                  {' ou arraste e solte'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF, WEBP até {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {preview && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setPreview(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remover imagem
        </button>
      )}
    </div>
  )
}
