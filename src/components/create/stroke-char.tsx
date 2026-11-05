'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   StrokeChar — vẽ chữ Hán theo THỨ TỰ NÉT thật (dữ liệu
   hanzi-writer-data: 9.500+ ký tự, mỗi nét là 1 đường SVG).
   Các nét tô màu đỏ theo đúng trình tự + số thứ tự nét.
   Không có dữ liệu (mạng chậm / ký tự hiếm) → fallback chữ đỏ.
   ============================================================ */

type CharData = { strokes: string[]; medians: number[][][] }

const cache = new Map<string, Promise<CharData | null>>()

/* Dữ liệu tĩnh trong public/hanzi-data (đồng bộ từ package hanzi-writer-data,
   xem scripts/sync-hanzi-data.sh) — fetch theo từng ký tự + cache trọn đời. */
function loadChar(ch: string): Promise<CharData | null> {
  let p = cache.get(ch)
  if (!p) {
    p = fetch(`/hanzi-data/${encodeURIComponent(ch)}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        const c = d as CharData | null
        return c && Array.isArray(c.strokes) ? c : null
      })
      .catch(() => null)
    cache.set(ch, p)
  }
  return p
}

/* hệ toạ độ dữ liệu: 1024×1024, y hướng lên → đổi sang SVG bằng y' = 900 - y */
const flip = (y: number) => 900 - y

export default function StrokeChar({
  ch,
  numbered = true,
}: {
  ch: string
  /** (cũ) cỡ theo cqw — không còn dùng, StrokeChar luôn lấp đầy phần tử cha */
  size?: number
  numbered?: boolean
}) {
  const [entry, setEntry] = useState<{ ch: string; data: CharData | null } | null>(null)

  useEffect(() => {
    let alive = true
    loadChar(ch).then((d) => {
      if (alive) setEntry({ ch, data: d })
    })
    return () => {
      alive = false
    }
  }, [ch])

  /* dữ liệu đúng ký tự hiện tại (tránh sai lệch khi đổi ch trước khi tải xong) */
  const data = entry && entry.ch === ch ? entry.data : null

  /* luôn lấp đầy phần tử cha — cha quyết định kích thước (tránh đơn vị cqw
     vốn có thể bị resolve = 0 khi in trên một số trình duyệt) */
  const fill = { width: '100%', height: '100%' } as const

  /* chưa tải / không có dữ liệu → chữ đỏ trong SVG (an toàn khi in) */
  if (!data) {
    return (
      <svg viewBox="0 0 100 100" className="block" style={fill} role="img" aria-label={ch}>
        <text
          x="50"
          y="79"
          textAnchor="middle"
          fontSize="86"
          fontWeight="800"
          fill="#d2495f"
          style={{ fontFamily: 'var(--font-cn), serif' }}
        >
          {ch}
        </text>
      </svg>
    )
  }

  /* chữ nhiều nét → số nhỏ lại cho đỡ chồng chéo */
  const n = data.strokes.length
  const r = n > 12 ? 44 : n > 9 ? 52 : 58
  const fs = n > 12 ? 52 : n > 9 ? 62 : 74
  return (
    <svg viewBox="-90 -90 1204 1204" className="block" style={fill} role="img" aria-label={`Thứ tự nét của ${ch}`}>
      <g transform="scale(1, -1) translate(0, -900)">
        {data.strokes.map((d, i) => (
          <path key={i} d={d} fill="#d2495f" opacity={0.9} />
        ))}
      </g>
      {numbered &&
        data.medians.map((pts, i) => {
          if (!pts?.length) return null
          const [x, y] = pts[0]
          return (
            <g key={`n${i}`}>
              <circle cx={x} cy={flip(y)} r={r} fill="#fffdf6" stroke="#c2547e" strokeWidth={16} opacity={0.96} />
              <text
                x={x}
                y={flip(y) + r * 0.38}
                textAnchor="middle"
                fontSize={fs}
                fontWeight="800"
                fill="#8a3a4c"
                fontFamily="Quicksand, sans-serif"
              >
                {i + 1}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
