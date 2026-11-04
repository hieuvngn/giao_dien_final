'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import type { HanziCharEntry } from '@/data/hanzi-chars'
import { loadChar, useCharData } from './hanzi-data'
import CharGlyph from './glyph'
import { Btn } from './writing-ui'

/* ============================================================
   Chế độ ① — Học cách viết (Guided Practice)
   - HanziWriter phát hoạt ảnh thứ tự nét + người học viết lại
     theo từng nét (quiz: sai nét → viết lại chính nét đó,
     sai 2 lần → hiện gợi ý nét).
   - Chữ mẫu mờ bật/tắt · nút phát lại hoạt ảnh · bấm số nét
     để xem hoạt ảnh riêng từng nét.
   ============================================================ */

type Phase = 'watch' | 'quiz' | 'done'

export default function GuidedMode({
  entry,
  onNextChar,
}: {
  entry: HanziCharEntry
  onNextChar: () => void
}) {
  const { data, loading } = useCharData(entry.char)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  /* host riêng cho SVG của hanzi-writer — không để React quản lý con của
     nó, tránh el.innerHTML='' xoá mất CharGlyph do React render */
  const hostRef = useRef<HTMLDivElement | null>(null)
  const writerRef = useRef<HanziWriter | null>(null)

  const [size, setSize] = useState(0)
  const [phase, setPhase] = useState<Phase>('watch')
  const [ghost, setGhost] = useState(true)
  const [doneStrokes, setDoneStrokes] = useState(0)
  const [totalMisses, setTotalMisses] = useState(0)

  const strokeCount = data?.strokes.length ?? 0

  /* đo bề ngang vùng vẽ */
  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setSize(Math.max(220, Math.min(Math.round(w / 8) * 8, 400)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* tạo writer khi có dữ liệu + kích thước; tự chạy hoạt ảnh chào mừng */
  useEffect(() => {
    const host = hostRef.current
    if (!host || !data || size <= 0) return
    host.innerHTML = ''
    const writer = HanziWriter.create(host, entry.char, {
      width: size,
      height: size,
      padding: 8,
      strokeColor: '#4f3d4a',
      radicalColor: '#c2547e',
      outlineColor: '#e9d6c6',
      drawingColor: '#3f6b50',
      drawingWidth: 10,
      highlightColor: '#e8737f',
      strokeAnimationSpeed: 1.1,
      delayBetweenStrokes: 480,
      showOutline: true,
      showCharacter: true,
      showHintAfterMisses: 2,
      leniency: 1.05,
      highlightOnComplete: true,
      charDataLoader: (ch, onComplete, onError) => {
        loadChar(ch).then((d) => (d ? onComplete(d) : onError(new Error(`no data: ${ch}`))))
      },
    })
    writerRef.current = writer
    const t = window.setTimeout(() => void writer.animateCharacter(), 380)
    return () => {
      window.clearTimeout(t)
      try {
        writer.cancelQuiz()
      } catch {
        /* quiz chưa chạy — bỏ qua */
      }
      writerRef.current = null
      host.innerHTML = ''
    }
  }, [entry.char, data, size])

  /* bật/tắt chữ mẫu mờ */
  useEffect(() => {
    const w = writerRef.current
    if (!w) return
    if (ghost) w.showOutline()
    else w.hideOutline()
  }, [ghost, entry.char, data, size])

  const playAnimation = useCallback(() => {
    const w = writerRef.current
    if (!w) return
    w.cancelQuiz()
    setPhase('watch')
    setDoneStrokes(0)
    void w.animateCharacter()
  }, [])

  const peekStroke = useCallback((i: number) => {
    const w = writerRef.current
    if (!w) return
    w.cancelQuiz()
    setPhase('watch')
    void w.animateStroke(i)
  }, [])

  const startQuiz = useCallback(() => {
    const w = writerRef.current
    if (!w) return
    w.cancelQuiz()
    setDoneStrokes(0)
    setTotalMisses(0)
    setPhase('quiz')
    void w.quiz({
      onCorrectStroke: (sd) => setDoneStrokes(sd.strokeNum + 1),
      onMistake: () => setTotalMisses((m) => m + 1),
      onComplete: () => setPhase('done'),
    })
  }, [])

  const rating = useMemo(() => {
    if (totalMisses === 0)
      return { emoji: '🌟', label: 'Hoàn hảo!', note: 'Không sai nét nào — thứ tự nét chuẩn luôn!' }
    if (totalMisses <= 2)
      return { emoji: '👍', label: 'Tốt lắm!', note: `Chỉ sai ${totalMisses} lần — nhớ kỹ trình tự nhé.` }
    return { emoji: '💪', label: 'Hoàn thành!', note: `Sai ${totalMisses} lần — xem lại hoạt ảnh rồi thử lại nhé.` }
  }, [totalMisses])

  return (
    <div className="paper-scrap rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* ===== vùng vẽ ===== */}
        <div className="w-full shrink-0 sm:w-[380px]">
          <div ref={measureRef} className="mx-auto w-full">
            <div
              ref={boxRef}
              className="relative mx-auto overflow-hidden rounded-2xl bg-[#fffdf6] shadow-inner ring-2 ring-[#e7c9d4]"
              style={{ width: size || '100%', height: size || undefined, aspectRatio: size ? undefined : '1' }}
            >
              {/* host SVG hanzi-writer (nằm dưới CharGlyph) */}
              <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
              {/* chữ mẫu mờ phía dưới */}
              <CharGlyph
                data={data}
                ch={entry.char}
                className="pointer-events-none absolute inset-0 h-full w-full"
                opacity={ghost ? 0.12 : 0}
              />
              {/* đang tải / lỗi dữ liệu — phủ lên ô, không tháo layout để giữ ResizeObserver */}
              {(loading || !data) && (
                <div className="absolute inset-0 grid place-items-center bg-[#fffdf6]/90 p-4 text-center">
                  {loading ? (
                    <div>
                      <span className="font-cn animate-pulse text-3xl text-[#c2547e]" aria-hidden="true">
                        写
                      </span>
                      <p className="mt-1.5 text-[11px] font-bold text-[#8d7484]">Đang tải nét chữ…</p>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold leading-relaxed text-[#8d7484]">
                      Chưa tải được dữ liệu nét chữ của ký tự này — hãy chọn chữ khác nhé!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] font-semibold text-[#b58fa0]">
            Viết vào ô bằng chuột / ngón tay / bút cảm ứng
          </p>
        </div>

        {/* ===== thông tin + điều khiển ===== */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold leading-tight text-[#4f3d4a]">
                {entry.vi.split('—')[0].trim()}
              </p>
              <p className="text-xs font-bold italic text-[#c2547e]">{entry.pinyin}</p>
            </div>
            <span className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
              {entry.level}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn variant="primary" onClick={playAnimation}>
              ▶ Xem hoạt ảnh
            </Btn>
            <Btn variant="mint" onClick={startQuiz}>
              ✍ Viết theo nét
            </Btn>
            <Btn onClick={() => setGhost((g) => !g)} title="Hiện / ẩn chữ mẫu mờ">
              {ghost ? '🙈 Ẩn chữ mẫu' : '👁 Hiện chữ mẫu'}
            </Btn>
          </div>

          {/* tiến độ */}
          <div className="mt-4 rounded-2xl bg-white/60 p-3.5 ring-1 ring-[#f2e4da]">
            {phase === 'watch' && (
              <p className="text-xs font-semibold leading-relaxed text-[#8d7484]">
                👀 Xem hoạt ảnh để ghi nhớ thứ tự <b className="text-[#4f3d4a]">{strokeCount} nét</b>, rồi bấm{' '}
                <b className="text-[#3f6b50]">✍ Viết theo nét</b>. Viết sai nét sẽ được viết lại chính nét đó; sai 2
                lần hệ thống hiện gợi ý.
              </p>
            )}
            {phase === 'quiz' && (
              <>
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#4f3d4a]">
                  <span>
                    Đang viết nét <span className="text-[#c2547e]">{Math.min(doneStrokes + 1, strokeCount)}</span>
                    /{strokeCount}
                  </span>
                  <span className={totalMisses > 0 ? 'text-[#d2495f]' : 'text-[#3f6b50]'}>
                    {totalMisses > 0 ? `Sai ${totalMisses} lần` : 'Đang chuẩn ✨'}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--cream)]">
                  <div
                    className="h-full rounded-full bg-[#3f6b50] transition-all duration-300"
                    style={{ width: `${(doneStrokes / Math.max(1, strokeCount)) * 100}%` }}
                  />
                </div>
              </>
            )}
            {phase === 'done' && (
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {rating.emoji}
                </span>
                <div>
                  <p className="text-xs font-extrabold text-[#4f3d4a]">{rating.label}</p>
                  <p className="text-[11px] font-semibold text-[#8d7484]">{rating.note}</p>
                </div>
              </div>
            )}
          </div>

          {phase === 'done' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn variant="primary" onClick={startQuiz}>
                🔁 Viết lại
              </Btn>
              <Btn variant="mint" onClick={onNextChar}>
                → Chữ tiếp theo
              </Btn>
            </div>
          )}

          {/* thứ tự nét — bấm để xem hoạt ảnh từng nét */}
          <div className="mt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
              Thứ tự nét · bấm để xem riêng từng nét
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Array.from({ length: strokeCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => peekStroke(i)}
                  disabled={phase === 'quiz'}
                  title={`Xem hoạt ảnh nét ${i + 1}`}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-extrabold transition-all disabled:opacity-40 ${
                    phase === 'quiz' && i < doneStrokes
                      ? 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-1 ring-[#cfe6d6]'
                      : 'bg-white/70 text-[#6f5a68] ring-1 ring-[#ead9cd] hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
