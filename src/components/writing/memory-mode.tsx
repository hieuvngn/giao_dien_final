'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { HANZI_WORDS, type HanziWordEntry } from '@/data/hanzi-chars'
import { useCharData } from './hanzi-data'
import CharBoard, { type CharBoardHandle } from './board'
import CharGlyph from './glyph'
import { Btn } from './writing-ui'
import { checkInk, scoreColor, type CheckResult, type InkStroke } from './scoring'
import { useToast } from '@/hooks/use-toast'

/* ============================================================
   Chế độ ③ — Kiểm tra trí nhớ (Memory Challenge)
   Hệ thống đưa nghĩa tiếng Việt + pinyin → người học tự viết
   chữ Hán từ trí nhớ (không có chữ mẫu) → chấm điểm từng nét.
   Gắn SRS ôn tập: chữ nào "chưa nhớ" sẽ quay lại sớm hơn
   (localStorage — dữ liệu nằm trên máy người học).
   ============================================================ */

const STORE_KEY = 'nkhn.write-memory'

type Store = { due: Record<string, string>; reviews: number }

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Store
      if (d && typeof d === 'object') return { due: d.due ?? {}, reviews: d.reviews ?? 0 }
    }
  } catch {
    /* dữ liệu hỏng → dùng mới */
  }
  return { due: {}, reviews: 0 }
}

function saveStore(s: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s))
  } catch {
    /* bỏ qua */
  }
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function dueInDays(days: number): string {
  const d = startOfToday()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/* Hàng đợi hôm nay: từ đến hạn (hoặc từ mới) — tối đa 8 từ, sắp theo hạn */
function buildQueue(store: Store): HanziWordEntry[] {
  const today = startOfToday()
  return HANZI_WORDS.filter((w) => {
    const d = store.due[w.id]
    return !d || new Date(d) <= today
  })
    .sort((a, b) => {
      const da = store.due[a.id] ? new Date(store.due[a.id]).getTime() : Number.MAX_SAFE_INTEGER
      const db = store.due[b.id] ? new Date(store.due[b.id]).getTime() : Number.MAX_SAFE_INTEGER
      return da - db
    })
    .slice(0, 8)
}

/* ---------- một ô viết cho 1 chữ của từ ---------- */

type SlotHandle = {
  getStrokes: () => InkStroke[]
  getMedians: () => number[][][] | null
  undo: () => void
  clear: () => void
}

const Slot = forwardRef<SlotHandle, { ch: string; showGhost: boolean; label: string; onCount?: (n: number) => void }>(
  function Slot({ ch, showGhost, label, onCount }, ref) {
    const { data } = useCharData(ch)
    const boardRef = useRef<CharBoardHandle | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        getStrokes: () => boardRef.current?.getStrokes() ?? [],
        getMedians: () => data?.medians ?? null,
        undo: () => boardRef.current?.undo(),
        clear: () => boardRef.current?.clear(),
      }),
      [data],
    )

    return (
      <div className="w-full">
        <CharBoard ref={boardRef} ch={ch} data={data} showGhost={showGhost} label={label} onCountChange={onCount} />
      </div>
    )
  },
)

/* ---------- thẻ một từ (keyed theo word.id → tự reset khi đổi từ) ---------- */

const GRADES = [
  { days: 1, emoji: '😖', label: 'Chưa nhớ', note: 'ôn lại ngày mai', cls: 'bg-[#d2495f] text-white shadow-[0_3px_0_0_#b23a4f]' },
  { days: 3, emoji: '🙂', label: 'Tạm được', note: '3 ngày nữa', cls: 'bg-[#d8a13a] text-white shadow-[0_3px_0_0_#b8862c]' },
  { days: 6, emoji: '😄', label: 'Nhớ tốt', note: '6 ngày nữa', cls: 'bg-[#3f6b50] text-white shadow-[0_3px_0_0_#33553f]' },
] as const

function MemoryCard({ word, onGrade }: { word: HanziWordEntry; onGrade: (days: number) => void }) {
  const { toast } = useToast()
  const chars = Array.from(word.cn)
  const [phase, setPhase] = useState<'write' | 'result'>('write')
  const [results, setResults] = useState<(CheckResult | null)[]>([])
  const [ghosts, setGhosts] = useState<boolean[]>(() => chars.map(() => false))
  const [counts, setCounts] = useState<number[]>(() => chars.map(() => 0))
  const slotRefs = useRef<(SlotHandle | null)[]>([])

  const setCountAt = (i: number, n: number) => {
    setCounts((prev) => {
      const cp = [...prev]
      cp[i] = n
      return cp
    })
  }

  const check = () => {
    if (counts.some((c) => c === 0)) {
      toast({ title: '✏️ Viết hết các chữ đã nhé!', description: 'Mỗi ô phải có ít nhất một nét mực.' })
      return
    }
    const rs = chars.map((_, i) => {
      const slot = slotRefs.current[i]
      const medians = slot?.getMedians()
      const strokes = slot?.getStrokes() ?? []
      return medians ? checkInk(strokes, medians) : null
    })
    if (rs.some((r) => r === null)) {
      toast({ title: 'Đang tải dữ liệu nét chữ…', description: 'Thử lại sau một nhịp nhé!' })
      return
    }
    setResults(rs)
    setPhase('result')
  }

  const overall =
    results.length > 0 ? Math.round(results.reduce((s, r) => s + (r?.overall ?? 0), 0) / results.length) : 0
  const verdictCls =
    overall >= 85
      ? 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-[#cfe6d6]'
      : overall >= 70
        ? 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]'
        : overall >= 55
          ? 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]'
          : 'bg-[var(--pastel-sky)] text-[#46688f] ring-[#cfe0ef]'

  return (
    <>
      {/* ===== thẻ từ đang ôn ===== */}
      <div className="paper-scrap rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-xl font-bold text-[#4f3d4a]">{word.vi}</p>
            <p className="text-xs font-bold italic text-[#c2547e]">{word.pinyin}</p>
          </div>
          <span className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
            {word.level}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#8d7484]">
          {phase === 'write'
            ? `🙈 Không có chữ mẫu! Viết chữ Hán của "${word.vi}" (${word.pinyin}) vào ${
                chars.length > 1 ? `${chars.length} ô` : 'ô'
              } dưới đây theo đúng thứ tự nét.`
            : 'So nét bạn đã viết với chữ đúng bên dưới:'}
        </p>

        {/* các ô viết */}
        <div className={`mt-4 grid gap-4 ${chars.length > 1 ? 'max-w-[620px] grid-cols-2' : 'max-w-[340px]'}`}>
          {chars.map((c, i) => (
            <div key={`${word.id}-${i}`}>
              <Slot
                ref={(h) => {
                  slotRefs.current[i] = h
                }}
                ch={c}
                showGhost={ghosts[i] ?? false}
                label={`Chữ ${i + 1}${chars.length > 1 ? `/${chars.length}` : ''}`}
                onCount={(n) => setCountAt(i, n)}
              />
              <div className="mt-1.5 flex justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => slotRefs.current[i]?.undo()}
                  disabled={phase === 'result' || (counts[i] ?? 0) === 0}
                  className="rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:bg-white disabled:opacity-40"
                  title="Xoá nét vừa viết"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={() => slotRefs.current[i]?.clear()}
                  disabled={phase === 'result' || (counts[i] ?? 0) === 0}
                  className="rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:bg-white disabled:opacity-40"
                  title="Xoá hết"
                >
                  🗑
                </button>
                <button
                  type="button"
                  onClick={() => setGhosts((g) => g.map((v, j) => (j === i ? !v : v)))}
                  className="rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:bg-white"
                  title="Hiện / ẩn chữ mẫu mờ"
                >
                  {ghosts[i] ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {phase === 'write' && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="primary" onClick={check}>
              ✅ Kiểm tra &amp; xem kết quả
            </Btn>
          </div>
        )}
      </div>

      {/* ===== kết quả ===== */}
      {phase === 'result' && (
        <div className="paper-scrap rounded-3xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-display text-3xl font-bold text-[#4f3d4a]">{overall}</span>
            <span className="text-xs font-bold text-[#b58fa0]">/100</span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${verdictCls}`}>
              {overall >= 85 ? '🌟' : overall >= 70 ? '👍' : '💪'}{' '}
              {overall >= 85 ? 'Tuyệt vời!' : overall >= 70 ? 'Khá tốt' : 'Cần luyện thêm'}
            </span>
            <p className="ml-auto font-cn text-3xl font-bold text-[#4f3d4a]" aria-label={`Chữ đúng: ${word.cn}`}>
              {word.cn}
            </p>
          </div>

          <div className={`mt-4 grid gap-4 ${chars.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-[340px]'}`}>
            {chars.map((c, i) => {
              const r = results[i]
              const colors = r
                ? r.perStroke.map((p) => (p.target === null ? '#e5b8c2' : scoreColor(p.score)))
                : undefined
              return (
                <div key={`${word.id}-r${i}`} className="rounded-2xl bg-white/60 p-3 ring-1 ring-[#f2e4da]">
                  <div className="mx-auto w-20 sm:w-24">
                    <GlyphResult ch={c} colors={colors} />
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-extrabold text-[#4f3d4a]">
                    Chữ {i + 1}: {r ? `${r.overall}/100` : '—'}
                  </p>
                  {r && r.missing.length > 0 && (
                    <p className="text-center text-[10px] font-bold text-[#d2495f]">
                      Thiếu nét {r.missing.map((m) => m + 1).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] font-semibold leading-relaxed text-[#8d7484]">
            Xem lại nét đã viết bên trên, so với chữ đúng{' '}
            <span className="font-cn text-[#4f3d4a]">{word.cn}</span> ({word.pinyin}) rồi chọn mức ghi nhớ — lịch SRS
            sẽ xếp lại từ này:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g.days}
                type="button"
                onClick={() => onGrade(g.days)}
                className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${g.cls}`}
              >
                {g.emoji} {g.label}
                <span className="ml-1 font-bold opacity-80">· {g.note}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/* Glyph kết quả cho từng chữ (tải dữ liệu riêng) */
function GlyphResult({ ch, colors }: { ch: string; colors: string[] | undefined }) {
  const { data } = useCharData(ch)
  return <CharGlyph data={data} ch={ch} colors={colors} className="h-auto w-full" color="#8d7484" />
}

/* ---------- trang chính chế độ ③ ---------- */

export default function MemoryMode() {
  const { toast } = useToast()
  const [boot, setBoot] = useState<{ store: Store; queue: HanziWordEntry[] } | null>(null)
  const [idx, setIdx] = useState(0)

  /* nạp dữ liệu SRS từ localStorage sau mount */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- nạp dữ liệu lưu trên máy sau khi mount */
    const s = loadStore()
    setBoot({ store: s, queue: buildQueue(s) })
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const store = boot?.store ?? { due: {}, reviews: 0 }
  const queue = boot?.queue ?? []
  const word = queue[idx] ?? null

  /* chấm mức ghi nhớ → xếp lịch SRS → sang từ tiếp theo */
  const grade = (days: number) => {
    if (!word) return
    const next: Store = {
      due: { ...store.due, [word.id]: dueInDays(days) },
      reviews: store.reviews + 1,
    }
    saveStore(next)
    toast({ title: `Đã lưu — "${word.vi}" ôn lại sau ${days} ngày 📅` })
    if (idx + 1 < queue.length) {
      setBoot({ store: next, queue })
      setIdx(idx + 1)
    } else {
      setBoot({ store: next, queue: buildQueue(next) })
      setIdx(0)
    }
  }

  const resetAll = () => {
    const fresh: Store = { due: {}, reviews: store.reviews }
    saveStore(fresh)
    setBoot({ store: fresh, queue: buildQueue(fresh) })
    setIdx(0)
    toast({ title: '🔁 Đã xếp lại toàn bộ từ vào hàng đợi hôm nay!' })
  }

  const remaining = Math.max(0, queue.length - idx)

  if (!boot) return null

  return (
    <div className="space-y-4">
      {/* ===== thanh thống kê SRS ===== */}
      <div className="paper-scrap flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl px-4 py-3.5 sm:px-5">
        <p className="font-display text-sm font-bold text-[#4f3d4a]">
          🔄 Hàng đợi ôn tập <span className="ml-1 font-cn text-xs text-[#b58fa0]">复习</span>
        </p>
        <span className="rounded-full bg-[var(--pastel-sky)] px-3 py-1 text-[11px] font-extrabold text-[#46688f]">
          Còn {remaining} từ hôm nay
        </span>
        <span className="rounded-full bg-[var(--cream)] px-3 py-1 text-[11px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
          Đã ôn {store.reviews} lượt
        </span>
        <p className="ml-auto hidden text-[10px] font-semibold text-[#b58fa0] lg:block">
          Lịch ôn SRS lưu trên máy bạn (localStorage)
        </p>
      </div>

      {!word ? (
        /* ===== đã ôn hết ===== */
        <div className="paper-scrap grid place-items-center rounded-3xl p-10 text-center">
          <span className="text-5xl" aria-hidden="true">
            🎉
          </span>
          <p className="mt-3 font-display text-base font-bold text-[#4f3d4a]">Tuyệt vời — hết từ cần ôn hôm nay!</p>
          <p className="mt-1 max-w-sm text-xs font-semibold leading-relaxed text-[#8d7484]">
            Quay lại vào những ngày tới, các từ đến hạn sẽ tự động xếp vào hàng đợi theo lịch SRS (từ &quot;chưa nhớ&quot;
            quay lại sớm hơn từ &quot;nhớ tốt&quot;).
          </p>
          <div className="mt-4">
            <Btn variant="primary" onClick={resetAll}>
              🔁 Ôn lại từ đầu
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <MemoryCard key={word.id} word={word} onGrade={grade} />

          {/* ===== các từ tiếp theo (chỉ hiện nghĩa — không lộ chữ) ===== */}
          <div className="paper-scrap rounded-3xl p-4 sm:px-5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Sắp tới trong hàng đợi</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {queue.slice(idx).map((w, i) => (
                <span
                  key={w.id}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-extrabold ring-1 ${
                    i === 0
                      ? 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]'
                      : 'bg-white/60 text-[#8d7484] ring-[#ead9cd]'
                  }`}
                >
                  {w.vi}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
