'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Footer from '../landing/footer'
import { PandaSticker, PushPin, Reveal, WashiTape } from '../landing/decor'
import { HANZI_CHARS, HANZI_WORDS, findHanziChar, type HanziCharEntry } from '@/data/hanzi-chars'
import GuidedMode from './guided-mode'
import FreeMode from './free-mode'
import MemoryMode from './memory-mode'

/* ============================================================
   Luyện viết chữ Hán — Route: #/writing
   3 chế độ:
   ① Học cách viết (Guided)  — hoạt ảnh thứ tự nét + viết theo nét
   ② Tự luyện viết (Free)    — ô 米字格 + chấm điểm từng nét
   ③ Kiểm tra trí nhớ (Memory) — nghĩa + pinyin → tự viết (SRS)
   ============================================================ */

const MODES = [
  {
    id: 'guided',
    n: '①',
    label: 'Học cách viết',
    cn: '描红',
    desc: 'Xem hoạt ảnh, viết theo từng nét',
    cls: 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]',
  },
  {
    id: 'free',
    n: '②',
    label: 'Tự luyện viết',
    cn: '自由练',
    desc: 'Ô vuông 米字格 · chấm điểm nét',
    cls: 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]',
  },
  {
    id: 'memory',
    n: '③',
    label: 'Kiểm tra trí nhớ',
    cn: '默写',
    desc: 'Viết từ trí nhớ · gắn SRS ôn tập',
    cls: 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-[#cfe6d6]',
  },
] as const

type ModeId = (typeof MODES)[number]['id']

export default function WritingHub() {
  const [mode, setMode] = useState<ModeId>('guided')
  const [char, setChar] = useState('永')
  const [wordId, setWordId] = useState(HANZI_WORDS[0]?.id ?? 'w-xuexi')

  const entry: HanziCharEntry = findHanziChar(char) ?? HANZI_CHARS[0]
  const word = HANZI_WORDS.find((w) => w.id === wordId) ?? HANZI_WORDS[0]

  /* nhóm chữ theo chủ đề cho bảng chọn */
  const charGroups = useMemo(() => {
    const m = new Map<string, HanziCharEntry[]>()
    for (const c of HANZI_CHARS) {
      const arr = m.get(c.topic)
      if (arr) arr.push(c)
      else m.set(c.topic, [c])
    }
    return Array.from(m.entries())
  }, [])

  const nextChar = () => {
    const i = HANZI_CHARS.findIndex((c) => c.char === entry.char)
    setChar(HANZI_CHARS[(i + 1) % HANZI_CHARS.length].char)
  }

  const nextWord = () => {
    const i = HANZI_WORDS.findIndex((w) => w.id === word.id)
    setWordId(HANZI_WORDS[(i + 1) % HANZI_WORDS.length].id)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6e9] text-[#5d4a57]">
      <main className="relative flex-1 pb-16 pt-20 sm:pt-24">
        <div aria-hidden="true" className="dot-grid absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* ===== header ===== */}
          <Reveal>
            <header className="paper-scrap relative rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
              <WashiTape color="var(--pastel-pink)" pattern="stripes" rotate={-4} className="-top-3 left-10 h-6 w-20" />
              <PushPin color="#e8737f" className="absolute right-8 top-3 scale-75" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="leading-tight">
                    <span className="relative inline-block px-3 py-0.5">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -rotate-1 rounded-md bg-[var(--pastel-pink)] opacity-80"
                      />
                      <span className="relative font-display text-2xl font-bold text-[#4f3d4a] sm:text-3xl">
                        Luyện viết chữ Hán
                      </span>
                      <span className="relative ml-2 hidden font-cn text-2xl text-[#8a4a63] sm:inline" aria-hidden="true">
                        写字练习
                      </span>
                    </span>
                  </h1>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-[#8d7484]">
                    Ba chế độ luyện viết: <b className="text-[#8a4a63]">học theo nét</b>, <b className="text-[#8a6a1f]">tự
                    luyện trên ô vuông</b> và <b className="text-[#3f6b50]">kiểm tra trí nhớ</b>. Viết bằng ngón tay, bút
                    cảm ứng (hỗ trợ áp lực) hay chuột đều được — hệ thống chấm từng nét so với dữ liệu mẫu.
                  </p>
                </div>
                <span aria-hidden="true" className="hidden shrink-0 text-5xl sm:block">
                  ✍️
                </span>
              </div>

              <div className="absolute -bottom-5 right-6 hidden sm:block">
                <PandaSticker className="h-16 w-16" />
              </div>
            </header>
          </Reveal>

          {/* ===== 3 tab chế độ ===== */}
          <Reveal delay={0.05}>
            <div
              className="mt-5 grid gap-2 sm:grid-cols-3"
              role="tablist"
              aria-label="Chọn chế độ luyện viết"
            >
              {MODES.map((m) => {
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setMode(m.id)}
                    className={`paper-scrap group flex items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-all ${
                      active ? `${m.cls} -translate-y-0.5 shadow-md` : 'ring-[#ead9cd] hover:-translate-y-0.5 hover:shadow'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold shadow-inner ${
                        active ? 'bg-white/70' : 'bg-[var(--cream)] text-[#8d7484]'
                      }`}
                      aria-hidden="true"
                    >
                      {m.n}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#4f3d4a]">
                        {m.label}
                        <span className="font-cn text-[11px] text-[#b58fa0]">{m.cn}</span>
                      </span>
                      <span className="block truncate text-[10px] font-bold text-[#b58fa0]">{m.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* ===== nội dung: bảng chọn + chế độ ===== */}
          <div className="mt-5 flex flex-col gap-5 lg:flex-row">
            {/* bảng chọn chữ / từ */}
            <Reveal delay={0.08} className="lg:w-60 lg:shrink-0">
              <aside className="paper-scrap rounded-3xl p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
                  {mode === 'memory' ? 'Chọn từ luyện nhớ' : 'Chọn chữ luyện viết'}
                </p>

                {mode === 'memory' ? (
                  <div className="custom-scroll mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1 lg:max-h-[540px]">
                    {HANZI_WORDS.map((w) => {
                      const active = w.id === word.id
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWordId(w.id)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                            active
                              ? 'bg-[var(--pastel-mint)] ring-1 ring-[#cfe6d6]'
                              : 'bg-white/50 ring-1 ring-[#f2e4da] hover:bg-white'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-extrabold text-[#4f3d4a]">{w.vi}</span>
                            <span className="block truncate text-[10px] font-bold italic text-[#c2547e]">
                              {w.pinyin}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                              w.level === 'Dễ'
                                ? 'bg-[var(--pastel-butter)]/60 text-[#8a6a1f]'
                                : 'bg-[var(--pastel-lilac)]/60 text-[#6d5a94]'
                            }`}
                          >
                            {w.level}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="custom-scroll mt-2 max-h-[300px] space-y-3 overflow-y-auto pr-1 lg:max-h-[540px]">
                    {charGroups.map(([topic, chars]) => (
                      <div key={topic}>
                        <p className="px-1 pb-1 text-[10px] font-bold text-[#c9a2b3]">{topic}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {chars.map((c) => {
                            const active = c.char === entry.char
                            return (
                              <button
                                key={c.char}
                                type="button"
                                onClick={() => setChar(c.char)}
                                title={`${c.vi} · ${c.pinyin}`}
                                aria-pressed={active}
                                className={`grid h-11 w-11 place-items-center rounded-xl transition-all ${
                                  active
                                    ? 'bg-[var(--pastel-pink)] shadow-sm ring-1 ring-[#f3c4d3]'
                                    : 'bg-white/60 ring-1 ring-[#ead9cd] hover:-translate-y-0.5 hover:bg-white'
                                }`}
                              >
                                <span className="font-cn text-lg leading-none text-[#4f3d4a]">{c.char}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mode !== 'memory' && (
                  <p className="mt-3 rounded-xl bg-[var(--pastel-butter)]/40 px-3 py-2 text-[10px] font-semibold leading-relaxed text-[#8a6a1f] ring-1 ring-[#f2e2b8]">
                    💡 {entry.char} · {entry.pinyin} — {entry.vi}
                  </p>
                )}
              </aside>
            </Reveal>

            {/* khu chế độ */}
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {mode === 'guided' && <GuidedMode key={entry.char} entry={entry} onNextChar={nextChar} />}
                  {mode === 'free' && <FreeMode key={entry.char} entry={entry} onNextChar={nextChar} />}
                  {mode === 'memory' && <MemoryMode />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ===== giải thích 3 chế độ ===== */}
          <Reveal delay={0.1}>
            <section aria-label="Ba chế độ luyện viết" className="paper-scrap mt-6 rounded-3xl p-4 sm:p-5">
              <h2 className="font-display text-sm font-bold text-[#4f3d4a]">
                Ba bước luyện viết hiệu quả <span className="ml-1 font-cn text-xs text-[#b58fa0]">练字三步</span>
              </h2>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {[
                  {
                    icon: '🎬',
                    label: '① Học cách viết',
                    desc: 'Xem hoạt ảnh thứ tự nét, viết lại theo từng nét — sai nét sẽ được viết lại, sai 2 lần hiện gợi ý.',
                    cls: 'ring-[#f3c4d3] bg-[var(--pastel-pink)]/25',
                  },
                  {
                    icon: '🀫',
                    label: '② Tự luyện viết',
                    desc: 'Ô vuông có đường ngang, dọc, chéo để căn chữ; chữ mẫu mờ bật/tắt; hoàn tác, xoá và chấm điểm từng nét.',
                    cls: 'ring-[#f2e2b8] bg-[var(--pastel-butter)]/25',
                  },
                  {
                    icon: '🧠',
                    label: '③ Kiểm tra trí nhớ',
                    desc: 'Chỉ có nghĩa tiếng Việt + pinyin — tự viết chữ Hán, gắn lịch SRS: "chưa nhớ" quay lại sớm hơn.',
                    cls: 'ring-[#cfe6d6] bg-[var(--pastel-mint)]/25',
                  },
                ].map((h) => (
                  <div key={h.label} className={`rounded-2xl p-3.5 ring-1 ${h.cls}`}>
                    <p className="text-xl" aria-hidden="true">
                      {h.icon}
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-[#4f3d4a]">{h.label}</p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-[#8d7484]">{h.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  )
}
