'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { useCart } from '@/components/CartContext'
import { useToast } from '@/hooks/useToast'

// ─── Share components ─────────────────────────────────────────────────────────

interface StoryPreviewModalProps {
  name: string
  description?: string
  imageUrl?: string
  price?: number
  platform: 'instagram' | 'whatsapp'
  onClose: () => void
}

const StoryPreviewModal = ({ name, description, imageUrl, price, platform, onClose }: StoryPreviewModalProps) => {
  const { showInfo } = useToast()
  const isInstagram = platform === 'instagram'
  const platformLabel = isInstagram ? 'Instagram Stories' : 'Status do WhatsApp'
  const gradientStyle = { background: 'linear-gradient(135deg, #88A9C3 0%, #6E95B0 100%)' }

  const buildCardBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
    grad.addColorStop(0, '#88A9C3')
    grad.addColorStop(1, '#6E95B0')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)

    const cardX = 90, cardY = 280, cardW = 900, cardH = 1100, cardR = 48
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(cardX + cardR, cardY)
    ctx.lineTo(cardX + cardW - cardR, cardY)
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR)
    ctx.lineTo(cardX + cardW, cardY + cardH - cardR)
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH)
    ctx.lineTo(cardX + cardR, cardY + cardH)
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR)
    ctx.lineTo(cardX, cardY + cardR)
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY)
    ctx.closePath()
    ctx.fill()

    const imgMaxW = 820
    const imgX = (1080 - imgMaxW) / 2
    const imgY = cardY + 40
    const imgR = 32
    let imgDrawH = imgMaxW

    if (imageUrl) {
      try {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = imageUrl
        })
        if (img.complete && img.naturalWidth > 0) {
          const scaleToWidth = imgMaxW / img.naturalWidth
          const naturalH = Math.round(img.naturalHeight * scaleToWidth)
          const imgW = imgMaxW
          const imgH = Math.min(imgMaxW, naturalH)
          imgDrawH = imgH

          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(imgX + imgR, imgY)
          ctx.lineTo(imgX + imgW - imgR, imgY)
          ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + imgR)
          ctx.lineTo(imgX + imgW, imgY + imgH - imgR)
          ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - imgR, imgY + imgH)
          ctx.lineTo(imgX + imgR, imgY + imgH)
          ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - imgR)
          ctx.lineTo(imgX, imgY + imgR)
          ctx.quadraticCurveTo(imgX, imgY, imgX + imgR, imgY)
          ctx.closePath()
          ctx.fill()

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(imgX + imgR, imgY)
          ctx.lineTo(imgX + imgW - imgR, imgY)
          ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + imgR)
          ctx.lineTo(imgX + imgW, imgY + imgH - imgR)
          ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - imgR, imgY + imgH)
          ctx.lineTo(imgX + imgR, imgY + imgH)
          ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - imgR)
          ctx.lineTo(imgX, imgY + imgR)
          ctx.quadraticCurveTo(imgX, imgY, imgX + imgR, imgY)
          ctx.closePath()
          ctx.clip()

          if (naturalH <= imgMaxW) {
            ctx.drawImage(img, imgX, imgY, imgW, naturalH)
          } else {
            const fullH = Math.round(img.naturalHeight * scaleToWidth)
            const cropOffsetY = Math.round((fullH - imgMaxW) / 2)
            ctx.drawImage(img, imgX, imgY - cropOffsetY, imgW, fullH)
          }
          ctx.restore()
        }
      } catch {
        // skip image on error
      }
    }

    const textStartY = imgY + imgDrawH + 72
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.font = 'bold 72px Arial, sans-serif'
    const maxWidth = 860
    const MAX_PRICE_Y = 1820
    const MAX_DESC_Y_WITH_PRICE = 1760
    const words = name.split(' ')
    let line = ''
    let ty = textStartY
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 540, ty)
        line = word
        ty += 88
      } else {
        line = test
      }
    }
    ctx.fillText(line, 540, ty)
    ty += 72

    if (description) {
      ctx.font = '48px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.80)'
      const descWords = description.split(' ')
      let dLine = ''
      const maxDescY = price !== undefined && price > 0 ? MAX_DESC_Y_WITH_PRICE : MAX_PRICE_Y
      for (const word of descWords) {
        const test = dLine + (dLine ? ' ' : '') + word
        if (ctx.measureText(test).width > maxWidth && dLine) {
          if (ty > maxDescY) break
          ctx.fillText(dLine, 540, ty)
          dLine = word
          ty += 60
          if (ty > maxDescY) break
        } else {
          dLine = test
        }
      }
      if (ty <= maxDescY) {
        ctx.fillText(dLine, 540, ty)
        ty += 60
      }
    }

    if (price !== undefined && price > 0) {
      ctx.font = 'bold 64px Arial, sans-serif'
      ctx.fillStyle = '#FFC107'
      ctx.textAlign = 'center'
      ctx.fillText(`R$ ${price.toFixed(2)}`, 540, Math.min(ty + 20, MAX_PRICE_Y))
    }

    try {
      const svgResponse = await fetch('/logotipo.svg')
      if (!svgResponse.ok) throw new Error()
      const svgText = await svgResponse.text()
      const whiteSvg = svgText.replace(/fill="(#000(000)?|black|rgb\(0,\s*0,\s*0\))"/gi, 'fill="#ffffff"')
      const svgBlob = new Blob([whiteSvg], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(svgBlob)
      const logoImg = new window.Image()
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve()
        logoImg.onerror = () => resolve()
        logoImg.src = svgUrl
      })
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 280
        const logoX = (1080 - logoSize) / 2
        const logoY = 1720
        ctx.globalAlpha = 0.55
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        ctx.globalAlpha = 1.0
      }
      URL.revokeObjectURL(svgUrl)
    } catch {
      ctx.font = 'bold 44px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.textAlign = 'center'
      ctx.fillText('AX Festas', 540, 1880)
    }

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  const handleShare = async () => {
    const blob = await buildCardBlob()
    if (!blob) return

    const fileName = `story-ax-${name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 60)}.png`
    const file = new File([blob], fileName, { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)

    if (isInstagram) {
      showInfo('Imagem baixada! Abrindo Instagram — vá para Stories e adicione a imagem.')
      setTimeout(() => {
        window.open('instagram://story', '_blank', 'noopener,noreferrer')
      }, 200)
    } else {
      showInfo('Imagem baixada! Abrindo WhatsApp — vá para Status e adicione a imagem.')
      setTimeout(() => {
        window.open('whatsapp://status', '_blank', 'noopener,noreferrer')
      }, 200)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Card para {platformLabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="relative w-full rounded-xl overflow-hidden flex flex-col items-center" style={{ ...gradientStyle, aspectRatio: '9/16' }}>
            <div className="absolute inset-x-3 rounded-xl overflow-hidden flex flex-col items-center" style={{ top: '7%', bottom: '12%', background: 'rgba(255,255,255,0.13)' }}>
              <div className="w-full flex-1 overflow-hidden">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={name} className="w-full h-full rounded-xl" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">🎉</span>
                  </div>
                )}
              </div>
              <div className="w-full px-3 pb-3 text-center">
                <p className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{name}</p>
                {description && <p className="text-white/80 text-xs line-clamp-2">{description}</p>}
                {price !== undefined && price > 0 && (
                  <p className="text-[#FFC107] font-bold text-sm mt-1">R$ {price.toFixed(2)}</p>
                )}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotipo.svg" alt="" className="absolute bottom-2 h-14 w-14 opacity-[0.55]" style={{ filter: 'brightness(0) invert(1)' }} aria-hidden="true" />
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-white bg-gray-700 hover:bg-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Compartilhar no {platformLabel}
          </button>
          <p className="text-xs text-center text-gray-500">Compartilhe o card diretamente no {platformLabel}</p>
        </div>
      </div>
    </div>
  )
}

interface ShareModalProps {
  url: string
  name: string
  text: string
  description?: string
  imageUrl?: string
  price?: number
  onClose: () => void
}

const ShareModal = ({ url, name, text, description, imageUrl, price, onClose }: ShareModalProps) => {
  const { showSuccess } = useToast()
  const [storyPlatform, setStoryPlatform] = useState<'instagram' | 'whatsapp' | null>(null)

  const encodedText = encodeURIComponent(`${text}\n${url}`)
  const encodedUrl = encodeURIComponent(url)
  const encodedName = encodeURIComponent(name)

  const whatsappUrl = `https://wa.me/?text=${encodedText}`
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`
  const emailUrl = `mailto:?subject=${encodedName}&body=${encodedText}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Link copiado para a área de transferência!')
    } catch {
      // fallback
    }
    onClose()
  }

  const handleInstagramChat = async () => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Link copiado! Cole no Direct do Instagram.')
    } catch {
      // fallback
    }
    window.open('https://www.instagram.com/direct/new/', '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleOtherApps = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url })
      } catch {
        // user cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showSuccess('Link copiado para a área de transferência!')
      } catch {
        // fallback
      }
    }
    onClose()
  }

  if (storyPlatform) {
    return (
      <StoryPreviewModal
        name={name}
        description={description}
        imageUrl={imageUrl}
        price={price}
        platform={storyPlatform}
        onClose={() => setStoryPlatform(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Compartilhar com...</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 pb-2">
          {/* WhatsApp */}
          <div className="rounded-xl bg-blue-50 overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-800 uppercase tracking-wide">WhatsApp</p>
            <div className="flex gap-2 px-3 pb-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white hover:bg-blue-100 transition-colors text-blue-700 font-medium text-sm shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </a>
              <button onClick={() => setStoryPlatform('whatsapp')}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white hover:bg-blue-100 transition-colors text-blue-700 font-medium text-sm shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                Status
              </button>
            </div>
          </div>

          {/* Instagram */}
          <div className="rounded-xl bg-blue-50 overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-800 uppercase tracking-wide">Instagram</p>
            <div className="flex gap-2 px-3 pb-3">
              <button onClick={handleInstagramChat}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white hover:bg-blue-100 transition-colors font-medium text-sm shadow-sm text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
                Chat
              </button>
              <button onClick={() => setStoryPlatform('instagram')}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white hover:bg-blue-100 transition-colors text-blue-700 font-medium text-sm shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                Stories
              </button>
            </div>
          </div>

          {/* Telegram */}
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors text-sky-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </a>

          {/* Facebook */}
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>

          {/* Twitter / X */}
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-800 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X (Twitter)
          </a>

          {/* Email */}
          <a href={emailUrl} onClick={onClose}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-orange-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            E-mail
          </a>

          {/* Copy link */}
          <button onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar link
          </button>

          {/* Other apps */}
          <button onClick={handleOtherApps}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Outros aplicativos
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface KitItem {
  id: number
  item_id: number
  item_name: string
  quantity: number
}

interface Product {
  id: number
  name: string
  description?: string
  price?: number
  original_price?: number
  image_url?: string
  category?: string
  is_featured?: number
  is_promotion?: number
  created_at?: string
  // kit-specific
  items?: KitItem[]
}

interface RelatedItem {
  id: number
  name: string
  price?: number
  image_url?: string
  type: string
}

interface ApiItem {
  id: number
  name: string
  price?: number
  image_url?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNewItem(createdAt?: string): boolean {
  if (!createdAt) return false
  const val = String(createdAt)
  const created = new Date(/^\d+$/.test(val) ? Number(val) * 1000 : val)
  if (isNaN(created.getTime())) return false
  return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const TYPE_LABELS: Record<string, string> = {
  kit: 'Kit',
  sweet: 'Doce',
  theme: 'Tema',
  item: 'Item',
  design: 'Design',
}

const TYPE_EMOJI: Record<string, string> = {
  kit: '🎁',
  sweet: '🍰',
  theme: '🎭',
  item: '📦',
  design: '🎨',
}

function buildApiUrl(type: string, id: string): string {
  switch (type) {
    case 'kit': return `/api/kits?id=${id}`
    case 'sweet': return `/api/sweets?id=${id}`
    case 'theme': return `/api/themes?id=${id}`
    case 'item': return `/api/items?id=${id}`
    case 'design': return `/api/designs?id=${id}`
    default: return ''
  }
}


// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function ProductDetail() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams?.get('type') ?? ''
  const id = searchParams?.get('id') ?? ''

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [shareModal, setShareModal] = useState<{ url: string; name: string; text: string; description?: string; imageUrl?: string; price?: number } | null>(null)
  const { addItem } = useCart()
  const { showSuccess } = useToast()

  const fetchProduct = useCallback(async () => {
    if (!type || !id) { setNotFound(true); setLoading(false); return }
    const url = buildApiUrl(type, id)
    if (!url) { setNotFound(true); setLoading(false); return }

    try {
      const res = await fetch(url)
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json() as Product
      if (!data || !data.id) { setNotFound(true); return }
      setProduct(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [type, id])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  // Load random related items across all types except theme
  useEffect(() => {
    if (!type || !id) return
    Promise.all([
      fetch('/api/kits?activeOnly=true').then(r => r.ok ? r.json() : []),
      fetch('/api/sweets?catalog=true').then(r => r.ok ? r.json() : []),
      fetch('/api/items?catalogOnly=true').then(r => r.ok ? r.json() : []),
      fetch('/api/designs?catalog=true').then(r => r.ok ? r.json() : []),
    ])
      .then(([kits, sweets, items, designs]) => {
        const tagged: RelatedItem[] = [
          ...(Array.isArray(kits) ? (kits as ApiItem[]).map(i => ({ ...i, type: 'kit' })) : []),
          ...(Array.isArray(sweets) ? (sweets as ApiItem[]).map(i => ({ ...i, type: 'sweet' })) : []),
          ...(Array.isArray(items) ? (items as ApiItem[]).map(i => ({ ...i, type: 'item' })) : []),
          ...(Array.isArray(designs) ? (designs as ApiItem[]).map(i => ({ ...i, type: 'design' })) : []),
        ].filter(i => !(i.type === type && String(i.id) === id))

        // Fisher-Yates shuffle then take first 6
        for (let currentIndex = tagged.length - 1; currentIndex > 0; currentIndex--) {
          const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
          [tagged[currentIndex], tagged[randomIndex]] = [tagged[randomIndex], tagged[currentIndex]]
        }
        setRelatedItems(tagged.slice(0, 6))
      })
      .catch(() => {})
  }, [type, id])

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: `${type}-${product.id}`,
      name: product.name,
      description: product.description || '',
      price: product.price ?? 0,
      image: product.image_url,
    })
    showSuccess(`${product.name} adicionado ao carrinho!`)
  }

  const handleShare = () => {
    if (!product) return
    const url = window.location.href
    const text = `${product.name}${product.description ? ' — ' + product.description : ''}`
    setShareModal({
      url,
      name: product.name,
      text,
      description: product.description,
      imageUrl: product.image_url,
      price: product.price,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Produto não encontrado</h1>
        <p className="text-gray-500 mb-6">O produto que você procura não existe ou foi removido.</p>
        <Link href="/#catalogo" className="bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold px-6 py-3 rounded-full transition">
          ← Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const showNew = isNewItem(product.created_at)
  const showFeatured = product.is_featured === 1
  const showPromo = product.is_promotion === 1 && product.original_price != null && product.original_price > (product.price ?? 0)
  const typeLabel = TYPE_LABELS[type] || 'Produto'
  const typeEmoji = TYPE_EMOJI[type] || '🎁'
  const hasPrice = product.price != null && product.price > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-yellow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* ── Image ────────────────────────────────────────────── */}
            <div className="relative min-h-72 md:min-h-[480px] bg-gradient-to-br from-yellow-50 to-amber-50">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl">{typeEmoji}</span>
                </div>
              )}

              {/* Tags */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {showFeatured && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-yellow text-brand-gray shadow">
                    🔥 Em destaque
                  </span>
                )}
                {showPromo && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-blue text-white shadow">
                    💸 Promoção
                  </span>
                )}
                {showNew && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow">
                    🆕 Novo
                  </span>
                )}
              </div>
            </div>

            {/* ── Details ──────────────────────────────────────────── */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Category label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow">
                  {typeLabel}
                </span>
                {product.category && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{product.category}</span>
                  </>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-brand-gray leading-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              {hasPrice && (
                <div className="mb-5">
                  {showPromo && product.original_price != null ? (
                    <div>
                      <span className="text-gray-400 text-sm line-through block">
                        {formatCurrency(product.original_price)}
                      </span>
                      <span className="text-3xl font-extrabold text-brand-yellow">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-brand-yellow">
                      {formatCurrency(product.price ?? 0)}
                    </span>
                  )}
                </div>
              )}
              {!hasPrice && (
                <p className="text-gray-400 text-lg mb-5">Sob consulta</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-brand-gray uppercase tracking-wide mb-2">
                    Descrição
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Kit items list */}
              {type === 'kit' && product.items && product.items.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h2 className="text-sm font-semibold text-brand-gray uppercase tracking-wide mb-3">
                    O que está incluído
                  </h2>
                  <ul className="space-y-1.5">
                    {product.items.map(kitItem => (
                      <li key={kitItem.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-5 h-5 bg-brand-yellow/20 text-brand-yellow rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          ✓
                        </span>
                        <span className="font-medium">{kitItem.quantity}×</span>
                        <span>{kitItem.item_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTAs */}
              <div className="mt-auto flex flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold py-3.5 px-6 rounded-full transition shadow-lg shadow-yellow-500/25 text-base"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Adicionar no carrinho
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 border-2 border-brand-gray text-brand-gray hover:bg-brand-gray/10 font-bold py-3.5 px-5 rounded-full transition text-base"
                  title="Compartilhar"
                  aria-label="Compartilhar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related items ──────────────────────────────────────────── */}
        {relatedItems.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-extrabold text-brand-gray mb-5">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedItems.map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/produto?type=${item.type}&id=${item.id}`}
                  className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="relative h-32 bg-gradient-to-br from-yellow-50 to-amber-50">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        {TYPE_EMOJI[item.type] || '🎁'}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                    {item.price != null && item.price > 0 && (
                      <p className="text-xs font-bold text-brand-yellow mt-1">{formatCurrency(item.price)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareModal && (
        <ShareModal
          url={shareModal.url}
          name={shareModal.name}
          text={shareModal.text}
          description={shareModal.description}
          imageUrl={shareModal.imageUrl}
          price={shareModal.price}
          onClose={() => setShareModal(null)}
        />
      )}
    </div>
  )
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────

export default function ProductoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow" />
      </div>
    }>
      <ProductDetail />
    </Suspense>
  )
}
