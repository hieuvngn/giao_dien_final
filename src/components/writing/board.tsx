'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import CharGlyph from './glyph'
import type { CharData } from './hanzi-data'
import { canvasPoint, pointToCanvas, type InkStroke, type Pt } from './scoring'

/* ============================================================
   CharBoard — ô vuông viết chữ Hán (dùng ở cả 3 chế độ).
   - Vẽ bằng chuột / cảm ứng / bút cảm ứng (Pointer Events,
     hỗ trợ áp lực pressure với Apple Pencil & bút cảm ứng).
   - Nét mực lưu ở hệ toạ độ SVG glyph (phóng to thu nhỏ không méo).
   - Lớp dưới: đường dẫn hướng 米字格 (ngang / dọc / chéo) + chữ mẫu mờ.
   - Điều khiển từ ngoài qua ref: hoàn tác / làm lại / xoá / lấy nét.
   ============================================================ */

export type CharBoardHandle = {
  undo: () => void
  redo: () => void
  clear: () => void
  getStrokes: () => InkStroke[]
}

type Props = {
  ch: string
  data: CharData | null
  showGhost?: boolean
  showGuides?: boolean
  disabled?: boolean
  label?: string
  /** báo số nét hiện có (để bật/tắt nút kiểm tra) */
  onCountChange?: (n: number) => void
}

const INK = '#43334a'
const MIN_DIST = 2.2 /* px giữa 2 điểm liên tiếp */
const MAX_POINTS = 400

const CharBoard = forwardRef<CharBoardHandle, Props>(function CharBoard(
  { ch, data, showGhost = true, showGuides = true, disabled = false, label, onCountChange },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokesRef = useRef<InkStroke[]>([])
  const redoRef = useRef<InkStroke[]>([])
  const drawingRef = useRef<{ pts: Pt[]; pressures: number[]; lastPx: Pt; lastPressure: number } | null>(null)
  const [cssSize, setCssSize] = useState(0)

  /* đo kích thước ô vuông theo phần tử cha */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setCssSize(Math.round(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const paintCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return ctx
  }, [])

  /* vẽ một đoạn thẳng (toạ độ SVG → pixel hiện tại) */
  const drawSegment = useCallback(
    (a: Pt, b: Pt, width: number) => {
      const ctx = paintCtx()
      if (!ctx || cssSize <= 0) return
      const pa = pointToCanvas(a, cssSize)
      const pb = pointToCanvas(b, cssSize)
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = width
      ctx.strokeStyle = INK
      ctx.stroke()
    },
    [paintCtx, cssSize],
  )

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = paintCtx()
    if (!canvas || !ctx || cssSize <= 0) return
    ctx.clearRect(0, 0, cssSize, cssSize)
    for (const s of strokesRef.current) {
      if (s.points.length === 1) {
        const w = 5 + (s.pressures[0] ?? 0.5) * 7
        drawSegment(s.points[0], { x: s.points[0].x + 0.01, y: s.points[0].y }, w)
        continue
      }
      for (let i = 1; i < s.points.length; i++) {
        const w = 5 + ((s.pressures[i] ?? 0.5) + (s.pressures[i - 1] ?? 0.5)) / 2 * 7
        drawSegment(s.points[i - 1], s.points[i], w)
      }
    }
  }, [paintCtx, cssSize, drawSegment])

  /* khớp kích thước canvas với tỉ lệ màn hình */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || cssSize <= 0) return
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(cssSize * dpr)
    if (canvas.width !== w) {
      canvas.width = w
      canvas.height = w
    }
    redrawAll()
  }, [cssSize, redrawAll])

  /* đổi chữ → xoá sạch nét cũ */
  useEffect(() => {
    strokesRef.current = []
    redoRef.current = []
    drawingRef.current = null
    redrawAll()
    onCountChange?.(0)
  }, [ch])

  useImperativeHandle(
    ref,
    () => ({
      undo() {
        const s = strokesRef.current.pop()
        if (s) redoRef.current.push(s)
        redrawAll()
        onCountChange?.(strokesRef.current.length)
      },
      redo() {
        const s = redoRef.current.pop()
        if (s) strokesRef.current.push(s)
        redrawAll()
        onCountChange?.(strokesRef.current.length)
      },
      clear() {
        if (strokesRef.current.length > 0) {
          redoRef.current = [...strokesRef.current].reverse()
          strokesRef.current = []
        }
        redrawAll()
        onCountChange?.(0)
      },
      getStrokes: () => strokesRef.current,
    }),
    [redrawAll, onCountChange],
  )

  const pressureOf = (e: React.PointerEvent) => {
    /* bút cảm ứng → áp lực thật; chuột / ngón tay → độ dày cố định */
    if (e.pointerType === 'pen' && e.pressure > 0) return e.pressure
    return 0.5
  }

  const relPos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const canvas = canvasRef.current
    const rect = canvas ? canvas.getBoundingClientRect() : new DOMRect(0, 0, cssSize, cssSize)
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || cssSize <= 0) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const px = relPos(e)
    const p = pressureOf(e)
    drawingRef.current = {
      pts: [canvasPoint(px.x, px.y, cssSize)],
      pressures: [p],
      lastPx: px,
      lastPressure: p,
    }
    redoRef.current = []
    try {
      canvasRef.current?.setPointerCapture(e.pointerId)
    } catch {
      /* trình duyệt không hỗ trợ capture → vẫn vẽ bình thường */
    }
    /* chấm đầu nét */
    const pt = canvasPoint(px.x, px.y, cssSize)
    drawSegment(pt, { x: pt.x + 0.01, y: pt.y }, 5 + p * 7)
    e.preventDefault()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawingRef.current
    if (!d || cssSize <= 0) return
    const px = relPos(e)
    const moved = Math.hypot(px.x - d.lastPx.x, px.y - d.lastPx.y)
    if (moved < MIN_DIST) return
    if (d.pts.length >= MAX_POINTS) return
    const p = pressureOf(e)
    const prevPt = d.pts[d.pts.length - 1]
    const curPt = canvasPoint(px.x, px.y, cssSize)
    drawSegment(prevPt, curPt, 5 + ((p + d.lastPressure) / 2) * 7)
    d.pts.push(curPt)
    d.pressures.push(p)
    d.lastPx = px
    d.lastPressure = p
    e.preventDefault()
  }

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    if (d.pts.length > 0) {
      strokesRef.current.push({ points: d.pts, pressures: d.pressures })
    }
    onCountChange?.(strokesRef.current.length)
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* bỏ qua */
    }
  }

  return (
    <div className={label ? 'w-full' : 'w-full'}>
      {label && (
        <p className="mb-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
          {label}
        </p>
      )}
      <div
        ref={wrapRef}
        className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-[#fffdf6] shadow-inner ring-2 ring-[#e7c9d4]"
      >
        {/* đường dẫn hướng 米字格 */}
        {showGuides && (
          <svg
            viewBox="-90 -90 1204 1204"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <rect x={-80} y={-80} width={1184} height={1184} fill="none" stroke="#efdccd" strokeWidth={5} />
            <line x1={512} y1={-80} x2={512} y2={1104} stroke="#f4e6d7" strokeWidth={3} />
            <line x1={-80} y1={512} x2={1104} y2={512} stroke="#f4e6d7" strokeWidth={3} />
            <line x1={-80} y1={-80} x2={1104} y2={1104} stroke="#f4e6d7" strokeWidth={3} />
            <line x1={-80} y1={1104} x2={1104} y2={-80} stroke="#f4e6d7" strokeWidth={3} />
          </svg>
        )}

        {/* chữ mẫu mờ */}
        <CharGlyph
          data={data}
          ch={ch}
          className="pointer-events-none absolute inset-0 h-full w-full"
          opacity={showGhost ? 0.15 : 0}
        />

        {/* lớp mực */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: 'none', cursor: disabled ? 'default' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
    </div>
  )
})

export default CharBoard
