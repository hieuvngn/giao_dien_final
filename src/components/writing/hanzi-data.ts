'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Bộ nạp dữ liệu nét chữ (hanzi-writer-data) dùng chung cho
   toàn khu Luyện viết: #/writing
   Dữ liệu tĩnh nằm ở public/hanzi-data/*.json (9.575 ký tự) —
   fetch từng ký tự + cache trọn đời trong module.
   ============================================================ */

export type CharData = { strokes: string[]; medians: number[][][] }

const cache = new Map<string, Promise<CharData | null>>()

export function loadChar(ch: string): Promise<CharData | null> {
  let p = cache.get(ch)
  if (!p) {
    p = fetch(`/hanzi-data/${encodeURIComponent(ch)}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        const c = d as CharData | null
        return c && Array.isArray(c.strokes) && Array.isArray(c.medians) ? c : null
      })
      .catch(() => null)
    cache.set(ch, p)
  }
  return p
}

export type CharDataState = { data: CharData | null; loading: boolean }

/* Hook tải dữ liệu nét cho một ký tự — an toàn khi đổi ch nhanh
   (chỉ nhận kết quả của ký tự đang hiển thị). */
export function useCharData(ch: string): CharDataState {
  const [state, setState] = useState<{ ch: string; data: CharData | null } | null>(null)

  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(null)
    loadChar(ch).then((d) => {
      if (alive) setState({ ch, data: d })
    })
    return () => {
      alive = false
    }
  }, [ch])

  const ready = state !== null && state.ch === ch
  return { data: ready ? state.data : null, loading: !ready }
}
