'use client'

import { useEffect, useRef, useState } from 'react'
import type { HanziCharEntry } from '@/data/hanzi-chars'
import { useCharData } from './hanzi-data'
import CharBoard, { type CharBoardHandle } from './board'
import CharGlyph from './glyph'
import { Btn, LoadingNote, NoDataNote } from './writing-ui'
import { checkInk, scoreColor, tipsFor, type CheckResult } from './scoring'

/* ============================================================
   Chế độ ② — Tự luyện viết (Free Practice)
   Ô vuông 米字格 lớn + chữ mẫu mờ bật/tắt, hoàn tác / làm lại /
   xoá, nút "Kiểm tra kết quả" chấm từng nét so với dữ liệu mẫu.
   Hỗ trợ: ngón tay (điện thoại), bút cảm ứng có áp lực (tablet),
   chuột / touchpad (laptop, desktop).
   ============================================================ */

export default function FreeMode({
  entry,
  onNextChar,
}: {
  entry: HanziCharEntry
  onNextChar: () => void
}) {
  const { data, loading } = useCharData(entry.char)
  const boardRef = useRef<CharBoardHandle | null>(null)

  const [showGhost, setShowGhost] = useState(true)
  const [showGuides, setShowGuides] = useState(true)
  const [inkCount, setInkCount] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [stats, setStats] = useState<{ checks: number; sum: number }>({ checks: 0, sum: 0 })

  const handleCount = (n: number) => {
    setInkCount(n)
    if (result) setResult(null)
  }

  const check = () => {
    if (!data) return
    const strokes = boardRef.current?.getStrokes() ?? []
    if (strokes.length === 0) {
      setResult(null)
      return
    }
    const r = checkInk(strokes, data.medians)
    setResult(r)
    setStats((s) => ({ checks: s.checks + 1, sum: s.sum + r.overall }))
  }

  const retry = () => {
    boardRef.current?.clear()
    setResult(null)
  }

  const strokeCount = data?.strokes.length ?? 0
  const avg = stats.checks > 0 ? Math.round(stats.sum / stats.checks) : 0

  /* tô màu từng nét mẫu theo kết quả */
  const resultColors = result && data
    ? data.strokes.map((_, j) => {
        const p = result.perStroke.find((s) => s.target === j)
        if (!p) return '#e5b8c2' /* thiếu nét */
        return scoreColor(p.score)
      })
    : undefined

  return (
    <div className="space-y-4">
      <div className="paper-scrap rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* ===== ô vuông viết ===== */}
          <div className="mx-auto w-full max-w-[420px] shrink-0">
            <CharBoard
              ref={boardRef}
              ch={entry.char}
              data={data}
              showGhost={showGhost}
              showGuides={showGuides}
              onCountChange={handleCount}
            />
            <p className="mt-2 text-center text-[10px] font-semibold text-[#b58fa0]">
              📱 Ngón tay · 🖊 Tablet hỗ trợ bút cảm ứng + áp lực · 💻 Chuột / touchpad
            </p>
          </div>

          {/* ===== điều khiển + thông tin ===== */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold leading-tight text-[#4f3d4a]">
                  {entry.vi.split('—')[0].trim()}
                </p>
                <p className="text-xs font-bold italic text-[#c2547e]">{entry.pinyin}</p>
              </div>
              <span className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
                {strokeCount} nét
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Btn onClick={() => boardRef.current?.undo()} disabled={inkCount === 0} title="Xoá nét vừa viết">
                ↶ Hoàn tác
              </Btn>
              <Btn onClick={() => boardRef.current?.redo()} title="Viết lại nét vừa xoá">
                ↷ Làm lại
              </Btn>
              <Btn onClick={retry} disabled={inkCount === 0}>
                🗑 Xoá hết
              </Btn>
              <Btn onClick={() => setShowGhost((g) => !g)} title="Hiện / ẩn chữ mẫu mờ">
                {showGhost ? '🙈 Ẩn chữ mẫu' : '👁 Hiện chữ mẫu'}
              </Btn>
              <Btn onClick={() => setShowGuides((g) => !g)} title="Hiện / ẩn đường dẫn hướng">
                {showGuides ? '▱ Ẩn dẫn hướng' : '▱ Hiện dẫn hướng'}
              </Btn>
            </div>

            <div className="mt-4 rounded-2xl bg-white/60 p-3.5 ring-1 ring-[#f2e4da]">
              <p className="text-xs font-semibold leading-relaxed text-[#8d7484]">
                ✍️ Tự viết chữ <span className="font-cn text-[#4f3d4a]">{entry.char}</span> vào ô vuông — viết chậm,
                đi sát nét mờ nếu cần. Xong bấm <b className="text-[#c2547e]">✅ Kiểm tra kết quả</b>, hệ thống chấm
                từng nét so với dữ liệu mẫu ({strokeCount} nét).
              </p>
              {stats.checks > 0 && (
                <p className="mt-2 text-[11px] font-extrabold text-[#4f3d4a]">
                  📊 Đã kiểm tra {stats.checks} lần · điểm trung bình{' '}
                  <span className={avg >= 70 ? 'text-[#3f6b50]' : 'text-[#d2495f]'}>{avg}/100</span>
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="primary" onClick={check} disabled={!data || inkCount === 0}>
                ✅ Kiểm tra kết quả
              </Btn>
              <Btn variant="mint" onClick={onNextChar}>
                🔀 Chữ khác
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* ===== kết quả ===== */}
      {loading && <LoadingNote text="Đang tải dữ liệu nét chữ…" />}
      {!loading && !data && <NoDataNote ch={entry.char} />}
      {result && data && (
        <div className="paper-scrap rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center">
              <div className="mx-auto w-32 sm:w-36">
                <CharGlyph data={data} ch={entry.char} colors={resultColors} className="h-auto w-full" />
              </div>
              <p className="mt-1 text-[10px] font-bold text-[#b58fa0]">Xanh: chuẩn · Vàng: lệch · Đỏ: sai/thiếu</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-display text-3xl font-bold text-[#4f3d4a]">{result.overall}</span>
                <span className="text-xs font-bold text-[#b58fa0]">/100</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${result.verdict.cls}`}>
                  {result.verdict.emoji} {result.verdict.label}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {result.perStroke.map((p) => (
                  <span
                    key={p.index}
                    className={`rounded-lg px-2 py-1 text-[10px] font-extrabold ring-1 ${
                      p.target === null
                        ? 'bg-[var(--pastel-peach)] text-[#a05a3a] ring-[#f3dcc6]'
                        : p.score >= 70
                          ? 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-[#cfe6d6]'
                          : p.score >= 45
                            ? 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]'
                            : 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]'
                    }`}
                  >
                    Nét {p.index + 1}: {p.target === null ? 'thừa' : p.score}
                  </span>
                ))}
              </div>

              {result.missing.length > 0 && (
                <p className="mt-2 text-[11px] font-extrabold text-[#d2495f]">
                  Thiếu nét số {result.missing.map((m) => m + 1).join(', ')}
                </p>
              )}

              {tipsFor(result).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {tipsFor(result).map((t) => (
                    <li key={t} className="text-[11px] font-semibold leading-relaxed text-[#5d4a57]">
                      💡 {t}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={retry}>
                  ✍️ Viết lại
                </Btn>
                <Btn variant="mint" onClick={onNextChar}>
                  → Chữ tiếp theo
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
