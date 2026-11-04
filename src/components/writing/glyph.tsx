'use client'

import type { CSSProperties } from 'react'
import type { CharData } from './hanzi-data'

/* ============================================================
   CharGlyph — vẽ tĩnh chữ Hán từ dữ liệu nét (hanzi-writer-data).
   Dùng làm: chữ mẫu mờ phía dưới ô vuông, chữ mẫu trong kết quả
   chấm điểm (tô màu từng nét theo điểm), preview thứ tự nét.
   ------------------------------------------------------------
   Hệ toạ độ: viewBox "-90 -90 1204 1204", path dữ liệu cần
   biến đổi scale(1, -1) translate(0, -900) (y dữ liệu hướng lên).
   ============================================================ */

export default function CharGlyph({
  data,
  ch,
  className,
  style,
  visibleUpTo,
  colors,
  opacity = 1,
  color = '#4f3d4a',
}: {
  data: CharData | null
  ch: string
  className?: string
  style?: CSSProperties
  /** chỉ vẽ k nét đầu tiên (minh hoạ tiến độ) */
  visibleUpTo?: number
  /** tô màu từng nét theo chỉ số nét (nét ngoài phạm vi giữ màu mặc định) */
  colors?: (string | null)[]
  opacity?: number
  color?: string
}) {
  if (!data) {
    /* chưa tải / không có dữ liệu → chữ thường mờ */
    return (
      <span
        className={`font-cn grid place-items-center leading-none ${className ?? ''}`}
        style={{ ...style, opacity: opacity * 0.35, color }}
        aria-hidden="true"
      >
        {ch}
      </span>
    )
  }

  return (
    <svg
      viewBox="-90 -90 1204 1204"
      className={className}
      style={style}
      opacity={opacity}
      aria-hidden="true"
    >
      <g transform="scale(1, -1) translate(0, -900)">
        {data.strokes.map((d, i) => {
          if (visibleUpTo !== undefined && i >= visibleUpTo) return null
          return <path key={i} d={d} fill={colors?.[i] ?? color} />
        })}
      </g>
    </svg>
  )
}
