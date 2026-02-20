'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

interface Crop {
  x: number
  y: number
  w: number
  h: number
}

type HandleId = 'nw' | 'ne' | 'se' | 'sw'

type DragState =
  | { type: 'idle' }
  | { type: 'move'; startX: number; startY: number; startCrop: Crop }
  | { type: 'resize'; handle: HandleId; startX: number; startY: number; startCrop: Crop }

interface ImageCropperModalProps {
  imageSrc: string
  aspectRatio?: number // width/height, e.g. 1 for square, 9/16 ≈ 0.5625
  onCrop: (blob: Blob) => void
  onCancel: () => void
}

const HANDLE_RADIUS = 8
const MIN_CROP = 40

export default function ImageCropperModal({
  imageSrc,
  aspectRatio,
  onCrop,
  onCancel,
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Loaded image element
  const imgRef = useRef<HTMLImageElement | null>(null)
  // Image layout within canvas: position and scale
  const layoutRef = useRef({ x: 0, y: 0, w: 0, h: 0, scale: 1 })
  // Current crop in canvas coordinates
  const cropRef = useRef<Crop>({ x: 0, y: 0, w: 0, h: 0 })
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  // Trigger re-draw
  const [tick, setTick] = useState(0)
  // Drag state
  const dragRef = useRef<DragState>({ type: 'idle' })

  // ── Load image and initialise layout/crop ──────────────────────────────────
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img

      const container = containerRef.current
      if (!container) return

      const maxW = Math.min(container.clientWidth - 32, 800)
      const maxH = Math.min(window.innerHeight - 220, 580)

      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const dispW = Math.round(img.naturalWidth * scale)
      const dispH = Math.round(img.naturalHeight * scale)

      layoutRef.current = { x: 0, y: 0, w: dispW, h: dispH, scale }
      setCanvasSize({ w: dispW, h: dispH })

      // Initialise crop to fill the image, respecting aspectRatio if given
      let cropW = dispW
      let cropH = dispH
      if (aspectRatio) {
        if (dispW / dispH > aspectRatio) {
          cropW = Math.round(dispH * aspectRatio)
        } else {
          cropH = Math.round(dispW / aspectRatio)
        }
      }
      const cx = Math.round((dispW - cropW) / 2)
      const cy = Math.round((dispH - cropH) / 2)
      cropRef.current = { x: cx, y: cy, w: cropW, h: cropH }
      setTick((t) => t + 1)
    }
    img.src = imageSrc
  }, [imageSrc, aspectRatio])

  // ── Draw canvas ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || canvasSize.w === 0) return

    canvas.width = canvasSize.w
    canvas.height = canvasSize.h

    const ctx = canvas.getContext('2d')!
    const { x: ix, y: iy, w: iw, h: ih } = layoutRef.current
    const { x, y, w, h } = cropRef.current

    // Full image
    ctx.drawImage(img, ix, iy, iw, ih)

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)

    // Reveal crop area through overlay
    const scale = layoutRef.current.scale
    ctx.drawImage(
      img,
      (x - ix) / scale,
      (y - iy) / scale,
      w / scale,
      h / scale,
      x,
      y,
      w,
      h,
    )

    // Crop border
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)

    // Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(x + (w * i) / 3, y)
      ctx.lineTo(x + (w * i) / 3, y + h)
      ctx.moveTo(x, y + (h * i) / 3)
      ctx.lineTo(x + w, y + (h * i) / 3)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Corner handles
    const corners: [number, number][] = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]
    ctx.fillStyle = 'white'
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    corners.forEach(([hx, hy]) => {
      ctx.beginPath()
      ctx.arc(hx, hy, HANDLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }, [canvasSize, tick])

  // ── Hit testing ────────────────────────────────────────────────────────────
  const getHitTarget = useCallback(
    (px: number, py: number): DragState['type'] | HandleId => {
      const { x, y, w, h } = cropRef.current
      const corners: [HandleId, number, number][] = [
        ['nw', x, y],
        ['ne', x + w, y],
        ['se', x + w, y + h],
        ['sw', x, y + h],
      ]
      for (const [id, hx, hy] of corners) {
        if (Math.hypot(px - hx, py - hy) <= HANDLE_RADIUS + 4) return id
      }
      if (px > x && px < x + w && py > y && py < y + h) return 'move'
      return 'idle'
    },
    [],
  )

  // ── Canvas coordinate helpers ──────────────────────────────────────────────
  const eventToCanvas = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ): { x: number; y: number } => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const scaleX = canvasSize.w / rect.width
      const scaleY = canvasSize.h / rect.height
      if ('touches' in e) {
        const t = e.touches[0] ?? e.changedTouches[0]
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    },
    [canvasSize],
  )

  // ── Pointer down ──────────────────────────────────────────────────────────
  const handlePointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const { x: px, y: py } = eventToCanvas(e)
    const hit = getHitTarget(px, py)
    if (hit === 'idle') return
    if (hit === 'move') {
      dragRef.current = { type: 'move', startX: px, startY: py, startCrop: { ...cropRef.current } }
    } else {
      dragRef.current = {
        type: 'resize',
        handle: hit as HandleId,
        startX: px,
        startY: py,
        startCrop: { ...cropRef.current },
      }
    }
  }

  // ── Pointer move ──────────────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const { x: px, y: py } = eventToCanvas(e)
      const drag = dragRef.current
      const layout = layoutRef.current

      // Update cursor style (mouse only)
      if ('clientX' in e) {
        const canvas = canvasRef.current!
        const hit = drag.type !== 'idle' ? drag.type : getHitTarget(px, py)
        const cursors: Record<string, string> = {
          move: 'move',
          nw: 'nw-resize',
          ne: 'ne-resize',
          se: 'se-resize',
          sw: 'sw-resize',
          idle: 'default',
        }
        canvas.style.cursor = cursors[hit] ?? 'default'
      }

      if (drag.type === 'idle') return

      const dx = px - drag.startX
      const dy = py - drag.startY
      const oc = drag.startCrop

      let newCrop: Crop

      if (drag.type === 'move') {
        newCrop = {
          x: Math.max(layout.x, Math.min(layout.x + layout.w - oc.w, oc.x + dx)),
          y: Math.max(layout.y, Math.min(layout.y + layout.h - oc.h, oc.y + dy)),
          w: oc.w,
          h: oc.h,
        }
      } else {
        // Resize
        let nx = oc.x, ny = oc.y, nw = oc.w, nh = oc.h

        switch (drag.handle) {
          case 'nw':
            nx = oc.x + dx; ny = oc.y + dy; nw = oc.w - dx; nh = oc.h - dy
            break
          case 'ne':
            ny = oc.y + dy; nw = oc.w + dx; nh = oc.h - dy
            break
          case 'se':
            nw = oc.w + dx; nh = oc.h + dy
            break
          case 'sw':
            nx = oc.x + dx; nw = oc.w - dx; nh = oc.h + dy
            break
        }

        // Aspect ratio lock
        if (aspectRatio && nw > 0 && nh > 0) {
          const dominant = Math.abs(dx) >= Math.abs(dy) ? 'w' : 'h'
          if (dominant === 'w') {
            const newH = nw / aspectRatio
            const diffH = newH - nh
            nh = newH
            if (drag.handle === 'nw' || drag.handle === 'ne') ny -= diffH
          } else {
            const newW = nh * aspectRatio
            const diffW = newW - nw
            nw = newW
            if (drag.handle === 'nw' || drag.handle === 'sw') nx -= diffW
          }
        }

        if (nw < MIN_CROP || nh < MIN_CROP) return

        // Clamp to image bounds
        if (nx < layout.x) { nw -= layout.x - nx; nx = layout.x }
        if (ny < layout.y) { nh -= layout.y - ny; ny = layout.y }
        if (nx + nw > layout.x + layout.w) nw = layout.x + layout.w - nx
        if (ny + nh > layout.y + layout.h) nh = layout.y + layout.h - ny

        if (nw < MIN_CROP || nh < MIN_CROP) return

        newCrop = { x: nx, y: ny, w: nw, h: nh }
      }

      cropRef.current = newCrop
      setTick((t) => t + 1)
    },
    [aspectRatio, getHitTarget, eventToCanvas],
  )

  // ── Pointer up ────────────────────────────────────────────────────────────
  const handlePointerUp = () => {
    dragRef.current = { type: 'idle' }
  }

  // ── Confirm: extract cropped blob ─────────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current
    if (!img) return

    const { x, y, w, h } = cropRef.current
    const { x: ix, y: iy, scale } = layoutRef.current

    const srcX = (x - ix) / scale
    const srcY = (y - iy) / scale
    const srcW = w / scale
    const srcH = h / scale

    const out = document.createElement('canvas')
    out.width = Math.round(srcW)
    out.height = Math.round(srcH)
    const ctx = out.getContext('2d')!
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height)
    out.toBlob((blob) => { if (blob) onCrop(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-gray-900">Ajustar imagem</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Arraste para mover a seleção. Arraste os cantos para redimensionar.
        </p>

        {/* Canvas */}
        <div ref={containerRef} className="flex justify-center bg-gray-100 rounded overflow-hidden">
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ maxWidth: '100%', touchAction: 'none', display: 'block' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => { e.preventDefault(); handlePointerDown(e) }}
            onTouchMove={(e) => { e.preventDefault(); handlePointerMove(e) }}
            onTouchEnd={handlePointerUp}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
